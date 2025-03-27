import { describe, test, expect, beforeEach } from 'bun:test';

// Basic tests for IPv6 normalization without mocking the file system
describe('IPv6 normalization', () => {
  test('should normalize a simple IPv6 address', () => {
    const address = '2001:db8::1';
    const expanded = expandIPv6(address);
    expect(expanded).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
  });
  
  test('should handle :: notation in the middle', () => {
    const address = '2001:db8::1:2';
    const expanded = expandIPv6(address);
    expect(expanded).toBe('2001:0db8:0000:0000:0000:0000:0001:0002');
  });
  
  test('should expand leading ::', () => {
    const address = '::1';
    const expanded = expandIPv6(address);
    expect(expanded).toBe('0000:0000:0000:0000:0000:0000:0000:0001');
  });
  
  test('should throw for invalid addresses', () => {
    expect(() => expandIPv6('not-an-address')).toThrow();
  });
});

// Test CRC32 checksum calculation
describe('checksum calculation', () => {
  test('should calculate consistent checksums', () => {
    const segments = [8193, 3512, 34211, 0, 0, 35374, 880, 29492];
    const checksum1 = calculateChecksum(segments);
    const checksum2 = calculateChecksum(segments);
    
    expect(checksum1).toBe(checksum2);
    
    // Changing a segment should change the checksum
    const modifiedSegments = [...segments];
    modifiedSegments[0] = 8194; // Change the first segment
    const differentChecksum = calculateChecksum(modifiedSegments);
    
    expect(differentChecksum).not.toBe(checksum1);
  });
});

// Helper functions for testing without mocking (same as what we'd use in the actual converter)
function expandIPv6(address: string): string {
  if (!address.includes(':')) {
    throw new Error(`Invalid IPv6 address: ${address}`);
  }
  
  try {
    let segments = address.split(':');
    let expandedSegments: string[] = [];
    
    // Handle :: notation (compressed zeroes)
    const doubleColonIndex = segments.indexOf('');
    if (doubleColonIndex !== -1 && segments[doubleColonIndex + 1] === '') {
      // This is a :: and not just a : (we'll have two empty strings in a row)
      segments.splice(doubleColonIndex, 1); // Remove one of the empty strings
    }
    
    if (segments.indexOf('') !== -1) {
      const emptyIndex = segments.indexOf('');
      // Find how many segments are missing
      const providedSegments = segments.filter(s => s !== '').length;
      const missingSegments = 8 - providedSegments;
      
      // Create an array with the correct number of zeroes
      const zeroes = Array(missingSegments).fill('0000');
      
      // Replace :: with the zeroes
      segments = [
        ...segments.slice(0, emptyIndex).filter(s => s !== ''),
        ...zeroes,
        ...segments.slice(emptyIndex + 1).filter(s => s !== '')
      ];
    }
    
    // Ensure we have 8 segments
    if (segments.length !== 8) {
      throw new Error(`Invalid IPv6 address: wrong number of segments in ${address}`);
    }
    
    // Expand each segment to 4 digits
    expandedSegments = segments.map(segment => {
      // Convert to number, then back to hex string with padded zeroes
      const num = parseInt(segment || '0', 16);
      return num.toString(16).padStart(4, '0');
    });
    
    return expandedSegments.join(':');
  } catch (error) {
    throw new Error(`Invalid IPv6 address: ${address} - ${error}`);
  }
}

function calculateChecksum(segments: number[]): number {
  // Convert segments to bytes
  const buffer = new Uint8Array(16); // 8 segments * 2 bytes each
  
  for (let i = 0; i < 8; i++) {
    // Store each segment as a 16-bit big-endian value
    buffer[i * 2] = (segments[i] >> 8) & 0xFF;     // High byte
    buffer[i * 2 + 1] = segments[i] & 0xFF;        // Low byte
  }
  
  // Calculate CRC32 checksum
  const crc32 = getCRC32(buffer);
  
  // Return only the lower 16 bits
  return crc32 & 0xFFFF;
}

// Simple CRC32 implementation
function getCRC32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xFF];
  }
  
  return ~crc >>> 0;
}

// CRC32 lookup table
const CRC32_TABLE = new Uint32Array(256);

// Initialize CRC32 table
for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  CRC32_TABLE[i] = crc;
}