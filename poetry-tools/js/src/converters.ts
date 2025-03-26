import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as zlib from 'zlib';

const readFile = promisify(fs.readFile);

/**
 * Class to convert between IPv6 addresses and poetic phrases with checksum
 */
export class IPv6PoetryConverter {
  private wordlistDir: string;
  private words: string[] = [];
  private wordToIndex: Map<string, number> = new Map();
  private initialized = false;
  
  /**
   * Create a converter
   * @param wordlistDir Directory containing the wordlist file
   */
  constructor(wordlistDir = '../../wordlists') {
    this.wordlistDir = wordlistDir;
  }
  
  /**
   * Initialize the converter by loading the wordlist
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load the wordlist
    const filepath = path.join(this.wordlistDir, 'wordlist.txt');
    
    try {
      const content = await readFile(filepath, 'utf8');
      this.words = content.trim().split('\n').map(word => word.trim().toLowerCase());
      
      // Verify wordlist has correct number of entries
      if (this.words.length !== 65536) {
        console.warn(`Warning: Wordlist has ${this.words.length} entries, expected 65536`);
      }
      
      // Build reverse lookup
      for (let idx = 0; idx < this.words.length; idx++) {
        this.wordToIndex.set(this.words[idx], idx);
      }
      
      this.initialized = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Wordlist file not found: ${filepath}`);
      }
      throw error;
    }
  }
  
  /**
   * Normalize an IPv6 address according to RFC 5952
   * @param address IPv6 address
   * @returns Normalized IPv6 address
   */
  normalizeIPv6(address: string): string {
    // Basic validation
    if (!address.includes(':')) {
      throw new Error(`Invalid IPv6 address: ${address}`);
    }
    
    try {
      // Convert IPv6 address to binary representation (128 bits)
      let segments = address.split(':');
      let expandedSegments: string[] = [];
      
      // Handle :: notation (compressed zeroes)
      const doubleColonIndex = segments.indexOf('');
      if (doubleColonIndex !== -1) {
        // Find how many segments are missing
        const providedSegments = segments.filter(s => s !== '').length;
        const missingSegments = 8 - providedSegments;
        
        // Create an array with the correct number of zeroes
        const zeroes = Array(missingSegments).fill('0000');
        
        // Replace :: with the zeroes
        segments = [
          ...segments.slice(0, doubleColonIndex).filter(s => s !== ''),
          ...zeroes,
          ...segments.slice(doubleColonIndex + 1).filter(s => s !== '')
        ];
      }
      
      // Ensure we have 8 segments
      if (segments.length !== 8) {
        throw new Error(`Invalid IPv6 address: wrong number of segments in ${address}`);
      }
      
      // Expand each segment to 4 digits
      expandedSegments = segments.map(segment => {
        // Convert to number, then back to hex string with padded zeroes
        const num = parseInt(segment, 16);
        return num.toString(16).padStart(4, '0');
      });
      
      return expandedSegments.join(':');
    } catch (error) {
      throw new Error(`Invalid IPv6 address: ${address} - ${error}`);
    }
  }
  
  /**
   * Calculate a checksum for the address segments
   * @param decimalValues Array of decimal values for each segment
   * @returns Index for the checksum word
   */
  calculateChecksum(decimalValues: number[]): number {
    // Convert segments to bytes
    const buffer = Buffer.alloc(16); // 8 segments * 2 bytes each
    
    for (let i = 0; i < 8; i++) {
      buffer.writeUInt16BE(decimalValues[i], i * 2);
    }
    
    // Use zlib CRC32 for a simple checksum
    const checksum = zlib.crc32(buffer) & 0xFFFF; // Keep only 16 bits
    return checksum;
  }
  
  /**
   * Convert an IPv6 address to a poetic phrase with checksum
   * @param ipv6Address IPv6 address to convert
   * @returns Poetic phrase with checksum
   */
  async addressToPoetry(ipv6Address: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Normalize the address
    const normalized = this.normalizeIPv6(ipv6Address);
    
    // Split into segments
    const segments = normalized.split(':');
    
    // Convert each segment to decimal
    const decimalValues = segments.map(segment => parseInt(segment, 16));
    
    // Map each segment to a word
    const words = decimalValues.map(value => {
      const wordIdx = value % this.words.length;
      return this.words[wordIdx];
    });
    
    // Calculate and add checksum word
    const checksumIdx = this.calculateChecksum(decimalValues);
    const checksumWord = this.words[checksumIdx];
    words.push(checksumWord);
    
    return words.join(' ');
  }
  
  /**
   * Convert a poetic phrase back to an IPv6 address
   * @param poeticPhrase Poetic phrase to convert
   * @returns IPv6 address
   */
  async poetryToAddress(poeticPhrase: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Split the phrase into words
    const words = poeticPhrase.toLowerCase().trim().split(/\s+/);
    
    // We expect 9 words: 8 for the address + 1 checksum
    if (words.length < 8) {
      throw new Error(`Not enough words for IPv6 address. Need at least 8 words, got ${words.length}`);
    }
    
    // Extract address words (excluding checksum)
    const addressWords = words.slice(0, 8);
    
    // Convert each word to a hexadecimal segment
    const segments: string[] = [];
    const decimalValues: number[] = [];
    
    for (let i = 0; i < addressWords.length; i++) {
      const word = addressWords[i];
      const idx = this.wordToIndex.get(word);
      
      if (idx === undefined) {
        console.warn(`Warning: Word '${word}' not found in wordlist`);
        segments.push('0000');
        decimalValues.push(0);
      } else {
        const hexValue = idx.toString(16).padStart(4, '0');
        segments.push(hexValue);
        decimalValues.push(idx);
      }
    }
    
    // Verify checksum if provided
    if (words.length >= 9) {
      const checksumWord = words[8];
      const expectedChecksum = this.calculateChecksum(decimalValues);
      const expectedWord = this.words[expectedChecksum];
      
      if (checksumWord !== expectedWord) {
        console.warn(`Warning: Checksum mismatch! Expected '${expectedWord}', got '${checksumWord}'`);
        console.warn("The phrase may contain transcription errors");
      }
    }
    
    // Construct the IPv6 address
    const ipv6Address = segments.join(':');
    
    // Normalize it according to RFC 5952
    return this.normalizeIPv6(ipv6Address);
  }
}