import os
import re
import ipaddress
import zlib

class IPv6PoetryConverter:
    """Convert between IPv6 addresses and memorable poetic phrases with checksum"""
    
    def __init__(self, wordlist_dir):
        """
        Initialize converter with a single wordlist
        
        Parameters:
        wordlist_dir (str): Directory containing the wordlist file
        """
        self.wordlist_dir = wordlist_dir
        
        # Load the wordlist
        self.words = []
        self.word_to_index = {}
        
        filepath = os.path.join(wordlist_dir, "wordlist.txt")
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Wordlist file not found: {filepath}")
        
        with open(filepath, 'r') as f:
            self.words = [line.strip().lower() for line in f]
            
            # Build reverse lookup
            for idx, word in enumerate(self.words):
                self.word_to_index[word] = idx
        
        if len(self.words) != 65536:
            print(f"Warning: Wordlist contains {len(self.words)} words, expected 65536")
    
    def normalize_ipv6(self, address):
        """Normalize an IPv6 address according to RFC 5952"""
        try:
            # ipaddress module handles normalization
            ip = ipaddress.IPv6Address(address)
            return str(ip)
        except ValueError as e:
            raise ValueError(f"Invalid IPv6 address: {address}") from e
    
    def calculate_checksum(self, address_segments):
        """
        Calculate a checksum word for the address segments
        
        Parameters:
        address_segments (list): List of decimal values for each segment
        
        Returns:
        int: Index for the checksum word
        """
        # Convert segments to bytes
        bytes_data = b''
        for segment in address_segments:
            bytes_data += segment.to_bytes(2, byteorder='big')
        
        # Use zlib CRC32 for a simple checksum
        checksum = zlib.crc32(bytes_data) & 0xFFFF  # Keep only 16 bits
        return checksum
    
    def address_to_poetry(self, ipv6_address):
        """
        Convert an IPv6 address to a memorable poetic phrase
        
        Parameters:
        ipv6_address (str): IPv6 address to convert
        
        Returns:
        str: Memorable poetic phrase representing the address
        """
        # Normalize the address for processing
        normalized = self.normalize_ipv6(ipv6_address)
        
        # Split into segments and expand :: notation
        segments = []
        if '::' in normalized:
            parts = normalized.split('::')
            left_parts = parts[0].split(':') if parts[0] else []
            right_parts = parts[1].split(':') if parts[1] else []
            missing = 8 - len(left_parts) - len(right_parts)
            segments = left_parts + ['0'] * missing + right_parts
        else:
            segments = normalized.split(':')
        
        # Convert segments to decimal
        decimal_values = [int(segment, 16) for segment in segments]
        
        # Map each segment to a word
        words = []
        for value in decimal_values:
            # Get the corresponding word from our wordlist
            word_idx = value % len(self.words)
            words.append(self.words[word_idx])
        
        # Calculate and add checksum word
        checksum_idx = self.calculate_checksum(decimal_values)
        checksum_word = self.words[checksum_idx]
        words.append(checksum_word)
        
        # Create the final phrase
        return ' '.join(words)
    
    def poetry_to_address(self, poetic_phrase):
        """
        Convert a memorable poetic phrase back to an IPv6 address
        
        Parameters:
        poetic_phrase (str): Poetic phrase to convert
        
        Returns:
        str: IPv6 address (canonicalized)
        """
        # Normalize the input phrase
        phrase = poetic_phrase.lower().strip()
        words = phrase.split()
        
        # We expect 9 words: 8 for the address + 1 checksum
        if len(words) < 8:
            raise ValueError(f"Not enough words for IPv6 address. Need at least 8 words, got {len(words)}")
        
        # Extract address words (excluding checksum)
        address_words = words[:8]
        
        # Convert each word to a hexadecimal segment
        segments = []
        decimal_values = []
        
        for word in address_words:
            if word in self.word_to_index:
                idx = self.word_to_index[word]
                hex_value = format(idx, '04x')
                segments.append(hex_value)
                decimal_values.append(idx)
            else:
                # Word not found, try to handle gracefully
                print(f"Warning: Word '{word}' not found in wordlist")
                segments.append('0000')
                decimal_values.append(0)
        
        # Verify checksum if provided
        if len(words) >= 9:
            checksum_word = words[8]
            expected_checksum = self.calculate_checksum(decimal_values)
            expected_word = self.words[expected_checksum]
            
            if checksum_word != expected_word:
                print(f"Warning: Checksum mismatch! Expected '{expected_word}', got '{checksum_word}'")
                print("The phrase may contain transcription errors")
        
        # Construct the IPv6 address
        ipv6_address = ':'.join(segments)
        
        # Ensure address is canonical
        return self.normalize_ipv6(ipv6_address)