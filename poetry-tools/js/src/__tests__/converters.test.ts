import { IPv6PoetryConverter } from '../converters';
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
  readFile: jest.fn(),
}));

describe('IPv6PoetryConverter', () => {
  let converter: IPv6PoetryConverter;
  const mockWords = Array.from({ length: 65536 }, (_, i) => `word${i}`);
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a mock wordlist with 65536 entries
    const mockWordlistContent = mockWords.join('\n');
    
    // Set up the fs.readFile mock
    (fs.readFile as jest.Mock).mockImplementation((path, encoding, callback) => {
      callback(null, mockWordlistContent);
    });
    
    // Create a new converter instance
    converter = new IPv6PoetryConverter('./mocked-dir');
  });
  
  describe('normalizeIPv6', () => {
    test('should normalize a valid IPv6 address', () => {
      const result = converter.normalizeIPv6('2001:db8::1');
      expect(result).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
    });
    
    test('should handle :: notation in the middle', () => {
      const result = converter.normalizeIPv6('2001:db8::1:2');
      expect(result).toBe('2001:0db8:0000:0000:0000:0000:0001:0002');
    });
    
    test('should throw error for invalid IPv6 addresses', () => {
      expect(() => converter.normalizeIPv6('invalid')).toThrow();
      expect(() => converter.normalizeIPv6('192.168.1.1')).toThrow();
    });
  });
  
  describe('calculateChecksum', () => {
    test('should calculate a consistent checksum', () => {
      const segments = [8193, 3512, 34211, 0, 0, 35374, 880, 29492];
      const checksum = converter.calculateChecksum(segments);
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('number');
      expect(checksum).toBeGreaterThanOrEqual(0);
      expect(checksum).toBeLessThan(65536);
      
      // Checksum should be consistent for the same input
      const checksum2 = converter.calculateChecksum(segments);
      expect(checksum).toEqual(checksum2);
      
      // Checksum should be different for different inputs
      const modifiedSegments = [...segments];
      modifiedSegments[0] = 8194; // Modify one segment
      const differentChecksum = converter.calculateChecksum(modifiedSegments);
      expect(differentChecksum).not.toEqual(checksum);
    });
  });
  
  describe('addressToPoetry and poetryToAddress', () => {
    beforeEach(async () => {
      // Initialize the converter
      await converter.initialize();
    });
    
    test('should convert an IPv6 address to a poetic phrase and back', async () => {
      const ipv6Address = '2001:db8::1';
      
      // Convert to poetry
      const poeticPhrase = await converter.addressToPoetry(ipv6Address);
      expect(poeticPhrase).toBeDefined();
      expect(typeof poeticPhrase).toBe('string');
      
      // The phrase should have 9 words (8 for segments + 1 checksum)
      const words = poeticPhrase.split(' ');
      expect(words).toHaveLength(9);
      
      // Convert back to address
      const roundTripAddress = await converter.poetryToAddress(poeticPhrase);
      
      // The normalized addresses should match
      expect(converter.normalizeIPv6(roundTripAddress)).toBe(converter.normalizeIPv6(ipv6Address));
    });
    
    test('should handle addresses with multiple zero segments', async () => {
      const ipv6Address = '2001:0:0:0:0:0:0:1';
      
      // Convert to poetry
      const poeticPhrase = await converter.addressToPoetry(ipv6Address);
      
      // Convert back to address
      const roundTripAddress = await converter.poetryToAddress(poeticPhrase);
      
      // The normalized addresses should match
      expect(converter.normalizeIPv6(roundTripAddress)).toBe(converter.normalizeIPv6(ipv6Address));
    });
    
    test('should detect checksum errors', async () => {
      const ipv6Address = '2001:db8::1';
      
      // Convert to poetry
      const poeticPhrase = await converter.addressToPoetry(ipv6Address);
      const words = poeticPhrase.split(' ');
      
      // Tamper with the checksum word
      const tamperedPhrase = [...words.slice(0, 8), 'invalidword'].join(' ');
      
      // Spy on console.warn
      const warnSpy = jest.spyOn(console, 'warn');
      
      // Convert back to address with invalid checksum
      await converter.poetryToAddress(tamperedPhrase);
      
      // Should have warned about checksum mismatch
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Checksum mismatch'));
    });
  });
});