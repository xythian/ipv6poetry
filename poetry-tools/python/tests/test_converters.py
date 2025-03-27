import unittest
import os
import tempfile
from unittest.mock import patch, mock_open, MagicMock
from ipv6poetry.converters import IPv6PoetryConverter

class TestIPv6PoetryConverter(unittest.TestCase):
    def setUp(self):
        # Create a temporary dir for testing
        self.temp_dir = tempfile.mkdtemp()
        
        # Create mock wordlist with 65536 entries
        self.mock_words = [f"word{i}" for i in range(65536)]
        self.mock_wordlist_content = "\n".join(self.mock_words)
        
        # Path to mock wordlist file
        self.wordlist_path = os.path.join(self.temp_dir, "wordlist.txt")
        
        # Mock os.path.exists to return True for our wordlist path
        self.mock_exists = patch('os.path.exists', return_value=True)
        self.mock_exists.start()
        
        # Mock the open function to return our mock wordlist
        self.mock_open_patcher = patch('builtins.open', mock_open(read_data=self.mock_wordlist_content))
        self.mock_open = self.mock_open_patcher.start()
        
        # Create converter instance with mock directory
        self.converter = IPv6PoetryConverter(self.temp_dir)
    
    def tearDown(self):
        self.mock_open_patcher.stop()
        self.mock_exists.stop()
    
    def test_normalize_ipv6(self):
        # Test valid IPv6 address normalization
        normalized = self.converter.normalize_ipv6("2001:db8::1")
        self.assertEqual(normalized, "2001:db8::1")
        
        # Test invalid address
        with self.assertRaises(ValueError):
            self.converter.normalize_ipv6("invalid")
    
    def test_calculate_checksum(self):
        # Test checksum calculation
        segments = [8193, 3512, 34211, 0, 0, 35374, 880, 29492]
        checksum1 = self.converter.calculate_checksum(segments)
        
        # Same input should produce same checksum
        checksum2 = self.converter.calculate_checksum(segments)
        self.assertEqual(checksum1, checksum2)
        
        # Different input should produce different checksum
        modified_segments = segments.copy()
        modified_segments[0] = 8194  # Change one segment
        different_checksum = self.converter.calculate_checksum(modified_segments)
        self.assertNotEqual(checksum1, different_checksum)
    
    @patch('ipv6poetry.converters.os.path.exists')
    def test_address_to_poetry(self, mock_exists):
        # Mock that wordlist file exists
        mock_exists.return_value = True
        
        # Test conversion from IPv6 to poetic phrase
        ipv6_address = "2001:db8::1"
        poetic_phrase = self.converter.address_to_poetry(ipv6_address)
        
        # Should have 9 words (8 segments + checksum)
        words = poetic_phrase.split()
        self.assertEqual(len(words), 9)
        
        # First 8 words should correspond to segments
        normalized = self.converter.normalize_ipv6(ipv6_address)
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
        
        # Verify the words match our expected mock words
        for i, value in enumerate(decimal_values):
            expected_word = self.mock_words[value]
            self.assertEqual(words[i], expected_word)
    
    @patch('ipv6poetry.converters.os.path.exists')
    def test_poetry_to_address(self, mock_exists):
        # Mock that wordlist file exists
        mock_exists.return_value = True
        
        # Create a poetic phrase using known indices
        indices = [8193, 3512, 34211, 0, 0, 35374, 880, 29492]
        phrase_words = [self.mock_words[idx] for idx in indices]
        
        # Add checksum word
        checksum_idx = self.converter.calculate_checksum(indices)
        phrase_words.append(self.mock_words[checksum_idx])
        
        poetic_phrase = " ".join(phrase_words)
        
        # Convert back to IPv6
        ipv6_address = self.converter.poetry_to_address(poetic_phrase)
        
        # When testing IPv6 addresses, we need to handle compressed notation 
        # Convert it back to indices and verify
        decimal_values = []
        
        # Handle :: compression in the address
        if '::' in ipv6_address:
            parts = ipv6_address.split('::')
            left_parts = parts[0].split(':') if parts[0] else []
            right_parts = parts[1].split(':') if parts[1] else []
            missing = 8 - len(left_parts) - len(right_parts)
            expanded_segments = left_parts + ['0'] * missing + right_parts
            
            # Convert to decimal values
            for segment in expanded_segments:
                decimal_values.append(int(segment, 16))
        else:
            segments = ipv6_address.split(':')
            for segment in segments:
                decimal_values.append(int(segment, 16))
        
        # Verify the number of segments after expansion
        self.assertEqual(len(decimal_values), 8)
        
        # Verify each decimal value matches the expected indices
        for i, value in enumerate(decimal_values):
            self.assertEqual(value, indices[i])
    
    @patch('ipv6poetry.converters.os.path.exists')
    @patch('ipv6poetry.converters.print')
    def test_checksum_verification(self, mock_print, mock_exists):
        # Mock that wordlist file exists
        mock_exists.return_value = True
        
        # Create a poetic phrase
        indices = [8193, 3512, 34211, 0, 0, 35374, 880, 29492]
        phrase_words = [self.mock_words[idx] for idx in indices]
        
        # Add INCORRECT checksum word
        incorrect_checksum_idx = 12345  # Some random index different from the real checksum
        phrase_words.append(self.mock_words[incorrect_checksum_idx])
        
        poetic_phrase = " ".join(phrase_words)
        
        # Convert to IPv6, should warn about checksum mismatch
        ipv6_address = self.converter.poetry_to_address(poetic_phrase)
        
        # Just verify that print was called at least once with a warning message
        # The exact format may vary, so we'll check that it contains key phrases
        mock_print.assert_any_call("Warning: Checksum mismatch! Expected '{}', got '{}'".format(
            self.mock_words[self.converter.calculate_checksum(indices)],
            self.mock_words[incorrect_checksum_idx]
        ))


if __name__ == '__main__':
    unittest.main()