/**
 * Browser-compatible IPv6 Poetry converter
 * Uses a single wordlist with an optional checksum word for error detection
 */

// Empty default wordlist - we'll load the full list from the server
const DEFAULT_WORDLIST: string[] = [];

/**
 * Class to convert between IPv6 addresses and poetic phrases
 * Matches the Python implementation in voice_friendly.py
 */
export class IPv6PoetryConverter {
  private wordlist: string[];
  private reverseMap: Map<string, number>;
  private includeChecksum: boolean;
  
  /**
   * Create a converter with a wordlist
   * @param wordlist Optional wordlist to use (uses default if not provided)
   * @param includeChecksum Whether to include a checksum word in the output
   */
  constructor(wordlist?: string[], includeChecksum = true) {
    this.wordlist = wordlist || DEFAULT_WORDLIST;
    this.includeChecksum = includeChecksum;
    
    // Build reverse lookup
    this.reverseMap = new Map<string, number>();
    for (let idx = 0; idx < this.wordlist.length; idx++) {
      this.reverseMap.set(this.wordlist[idx], idx);
    }
    
    // Log a warning if wordlist isn't the expected size
    if (this.wordlist.length !== 65536) {
      console.warn(`Warning: Wordlist contains ${this.wordlist.length} words, expected 65536. Using modulo for mapping.`);
    }
  }
  
  /**
   * Normalize an IPv6 address
   * @param address IPv6 address
   * @returns Normalized IPv6 address
   */
  normalizeIPv6(address: string): string {
    // Basic validation
    if (!address.includes(':')) {
      throw new Error(`Invalid IPv6 address: ${address}`);
    }
    
    try {
      // Convert IPv6 address to normalized form
      let segments: string[] = [];
      
      // Handle :: notation (compressed zeroes)
      if (address.includes('::')) {
        const parts = address.split('::');
        const leftParts = parts[0] ? parts[0].split(':') : [];
        const rightParts = parts[1] ? parts[1].split(':') : [];
        
        // Calculate how many zeroes in the middle
        const missing = 8 - leftParts.length - rightParts.length;
        segments = [...leftParts, ...Array(missing).fill('0'), ...rightParts];
      } else {
        segments = address.split(':');
      }
      
      // Ensure we have 8 segments
      if (segments.length !== 8) {
        throw new Error(`Invalid IPv6 address: wrong number of segments in ${address}`);
      }
      
      // Expand each segment to 4 digits
      const expandedSegments = segments.map(segment => {
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
   * @param decimalValues Decimal values of the address segments
   * @returns Index for the checksum word
   */
  calculateChecksum(decimalValues: number[]): number {
    // Implementation of zlib.crc32 in JavaScript
    // Adapted from pako.js CRC32 implementation to match Python's zlib.crc32
    
    // CRC32 table
    const crcTable: number[] = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      crcTable[i] = c;
    }
    
    // Calculate CRC32
    let crc = 0 ^ (-1);
    
    // Convert segments to bytes
    for (let i = 0; i < decimalValues.length; i++) {
      const value = decimalValues[i];
      // Process each byte in the 16-bit value (2 bytes)
      const highByte = (value >>> 8) & 0xFF;
      const lowByte = value & 0xFF;
      
      crc = (crc >>> 8) ^ crcTable[(crc ^ highByte) & 0xFF];
      crc = (crc >>> 8) ^ crcTable[(crc ^ lowByte) & 0xFF];
    }
    
    // Finalize the CRC
    crc = (crc ^ (-1)) >>> 0;
    
    // Take only the lower 16 bits to match Python's behavior
    return crc & 0xFFFF;
  }
  
  /**
   * Convert an IPv6 address to a poetic phrase
   * @param ipv6Address IPv6 address to convert
   * @returns Poetic phrase
   */
  addressToPoetry(ipv6Address: string): string {
    // Normalize the address
    const normalized = this.normalizeIPv6(ipv6Address);
    
    // Split into segments
    const segments = normalized.split(':');
    
    // Convert each segment to decimal
    const decimalValues = segments.map(segment => parseInt(segment, 16));
    
    // Map each decimal value to a word
    const words = decimalValues.map(value => {
      const wordIdx = value % this.wordlist.length;
      return this.wordlist[wordIdx];
    });
    
    // Add checksum word if enabled
    if (this.includeChecksum) {
      const checksumIdx = this.calculateChecksum(decimalValues);
      const checksumWord = this.wordlist[checksumIdx % this.wordlist.length];
      words.push(checksumWord);
    }
    
    return words.join(' ');
  }
  
  /**
   * Convert a poetic phrase back to an IPv6 address
   * @param poeticPhrase Poetic phrase to convert
   * @returns An object containing the converted address and validation info
   */
  poetryToAddress(poeticPhrase: string): { 
    address: string; 
    validChecksum: boolean; 
    invalidWords: Array<{index: number; word: string}>;
    expectedChecksum?: string;
    actualChecksum?: string;
  } {
    // Split the phrase into words
    const words = poeticPhrase.toLowerCase().trim().split(/\s+/);
    
    // We need at least 8 words for the address
    if (words.length < 8) {
      throw new Error(`Not enough words for IPv6 address. Need at least 8 words, got ${words.length}`);
    }
    
    // Extract address words (excluding checksum)
    const addressWords = words.slice(0, 8);
    
    // Convert each word to a hexadecimal segment
    const segments: string[] = [];
    const decimalValues: number[] = [];
    const invalidWords: Array<{index: number; word: string}> = [];
    
    for (let i = 0; i < addressWords.length; i++) {
      const word = addressWords[i];
      if (this.reverseMap.has(word)) {
        const idx = this.reverseMap.get(word)!;
        const hexValue = idx.toString(16).padStart(4, '0');
        segments.push(hexValue);
        decimalValues.push(idx);
      } else {
        // Word not found, handle gracefully
        console.warn(`Warning: Word '${word}' not found in wordlist`);
        segments.push('0000');
        decimalValues.push(0);
        invalidWords.push({ index: i, word });
      }
    }
    
    // Initialize checksum validation result
    let validChecksum = true;
    let expectedChecksum: string | undefined;
    let actualChecksum: string | undefined;
    
    // Verify checksum if provided and enabled
    if (this.includeChecksum && words.length >= 9) {
      const checksumWord = words[8];
      const expectedChecksumIdx = this.calculateChecksum(decimalValues);
      const expectedWord = this.wordlist[expectedChecksumIdx % this.wordlist.length];
      
      expectedChecksum = expectedWord;
      actualChecksum = checksumWord;
      
      if (checksumWord !== expectedWord) {
        validChecksum = false;
        console.warn(`Warning: Checksum mismatch! Expected '${expectedWord}', got '${checksumWord}'`);
        console.warn("The phrase may contain transcription errors");
        
        // Check if the checksum word is even in the wordlist
        if (!this.reverseMap.has(checksumWord)) {
          invalidWords.push({ index: 8, word: checksumWord });
        }
      }
    }
    
    // Construct the IPv6 address
    const ipv6Address = segments.join(':');
    
    // Normalize it
    return {
      address: this.normalizeIPv6(ipv6Address),
      validChecksum,
      invalidWords,
      expectedChecksum,
      actualChecksum
    };
  }
  
  /**
   * Fetch a wordlist from a URL
   * @param url URL to fetch wordlist from
   * @param includeChecksum Whether to include checksum in the output
   * @param onProgress Optional callback for loading progress
   * @returns Promise resolving to a new IPv6PoetryConverter with the fetched wordlist
   */
  static async fromUrl(
    url: string, 
    includeChecksum = true, 
    onProgress?: (progress: string) => void
  ): Promise<IPv6PoetryConverter> {
    try {
      // Fetch the wordlist with progress reporting
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get total size for progress calculation
      const totalSize = Number(response.headers.get('Content-Length')) || 0;
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error("Failed to get response reader");
      }
      
      // Read the stream
      let receivedLength = 0;
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Report progress
        if (onProgress && totalSize) {
          const percentComplete = Math.round((receivedLength / totalSize) * 100);
          onProgress(`${percentComplete}%`);
        }
      }
      
      // Combine chunks into a single Uint8Array
      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }
      
      // Convert to text
      const text = new TextDecoder('utf-8').decode(allChunks);
      const wordlist = text.trim().split('\n').map(word => word.trim());
      
      if (onProgress) {
        onProgress('100%');
      }
      
      return new IPv6PoetryConverter(wordlist, includeChecksum);
    } catch (error) {
      console.error("Error loading wordlist:", error);
      throw error; // Re-throw to handle in the component
    }
  }
}