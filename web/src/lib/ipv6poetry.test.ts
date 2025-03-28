import { describe, test, expect, beforeEach } from 'bun:test';
import { IPv6PoetryConverter } from './ipv6poetry';
import fs from 'fs';
import path from 'path';

describe('IPv6PoetryConverter', () => {
  let converter: IPv6PoetryConverter;
  
  beforeEach(() => {
    try {
      // Create synthetic wordlist based on observed values
      const wordlist = Array.from({ length: 65536 }, (_, i) => `word${i}`);
      
      // Set specific words we know from running the Python converter
      wordlist[8193] = 'schema';
      wordlist[3512] = 'deaf';
      wordlist[34211] = 'samarium';
      wordlist[0] = 'zero';
      wordlist[35374] = 'engulf';
      wordlist[880] = 'morgan';
      wordlist[29492] = 'osmanli';
      wordlist[64402] = 'arrives5';
      wordlist[1] = 'one';
      wordlist[7] = 'seven';
      
      converter = new IPv6PoetryConverter(wordlist);
    } catch (error) {
      console.error("Test setup error:", error);
      throw error;
    }
  });
  
  describe('normalizeIPv6', () => {
    test('should normalize a simple IPv6 address', () => {
      const address = '2001:db8::1';
      const normalized = converter['normalizeIPv6'](address);
      expect(normalized).toBe('2001:db8::1');
    });
    
    test('should normalize our example address correctly', () => {
      const address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const normalized = converter['normalizeIPv6'](address);
      expect(normalized).toBe('2001:db8:85a3::8a2e:370:7334');
    });
    
    test('should throw for invalid addresses', () => {
      expect(() => converter['normalizeIPv6']('not-an-address')).toThrow();
    });
  });
  
  describe('expandIPv6', () => {
    test('should expand our example address correctly', () => {
      const address = '2001:db8:85a3::8a2e:370:7334';
      const expanded = converter['expandIPv6'](address);
      
      // The expected decimal values for each segment
      const expected = [8193, 3512, 34211, 0, 0, 35374, 880, 29492];
      expect(expanded).toEqual(expected);
    });
  });
  
  describe('calculateChecksum', () => {
    test('should return correct checksum for our example address', () => {
      const segments = [8193, 3512, 34211, 0, 0, 35374, 880, 29492];
      const checksum = converter['calculateChecksum'](segments);
      
      // Verify the checksum is calculated consistently
      expect(checksum).toBe(64402);
      expect(converter['wordlist'][checksum]).toBe('arrives5');
    });
    
    test('should calculate consistent checksums for other addresses', () => {
      const segments = [1, 2, 3, 4, 5, 6, 7, 8];
      const checksum1 = converter['calculateChecksum'](segments);
      const checksum2 = converter['calculateChecksum'](segments);
      
      expect(checksum1).toBe(checksum2);
    });
  });
  
  describe('addressToPoetry and poetryToAddress', () => {
    test('should convert our example address to the expected phrase', () => {
      const address = '2001:db8:85a3::8a2e:370:7334';
      const phrase = converter.addressToPoetry(address);
      
      expect(phrase).toBe('schema deaf samarium zero zero engulf morgan osmanli arrives5');
    });
    
    test('should convert the phrase back to our example address', () => {
      const phrase = 'schema deaf samarium zero zero engulf morgan osmanli arrives5';
      const result = converter.poetryToAddress(phrase);
      
      expect(result.address).toBe('2001:db8:85a3::8a2e:370:7334');
      expect(result.validChecksum).toBe(true);
    });
  });
});