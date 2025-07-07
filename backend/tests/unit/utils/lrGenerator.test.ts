import { generateLRNumber } from '../../../src/utils/lrGenerator';

describe('LR Number Generator', () => {
  describe('generateLRNumber', () => {
    it('should generate LR number with correct format', () => {
      const fromBranch = 'MUM001';
      const toBranch = 'DEL001';
      
      const lrNumber = generateLRNumber(fromBranch, toBranch);
      
      // Should match format: MUM-DEL-YYYYMMDD-HHMMSS-XXX
      const pattern = /^MUM-DEL-\d{8}-\d{6}-\d{3}$/;
      expect(lrNumber).toMatch(pattern);
    });

    it('should include correct branch codes', () => {
      const fromBranch = 'BLR001';
      const toBranch = 'CHN001';
      
      const lrNumber = generateLRNumber(fromBranch, toBranch);
      
      expect(lrNumber).toStartWith('BLR-CHN-');
    });

    it('should include current date in YYYYMMDD format', () => {
      const fromBranch = 'MUM001';
      const toBranch = 'DEL001';
      
      const lrNumber = generateLRNumber(fromBranch, toBranch);
      const parts = lrNumber.split('-');
      const datePart = parts[2];
      
      // Should be 8 digits for YYYYMMDD
      expect(datePart).toHaveLength(8);
      expect(/^\d{8}$/.test(datePart)).toBe(true);
      
      // Should be today's date
      const today = new Date();
      const expectedDate = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
      
      expect(datePart).toBe(expectedDate);
    });

    it('should include current time in HHMMSS format', () => {
      const fromBranch = 'MUM001';
      const toBranch = 'DEL001';
      
      const lrNumber = generateLRNumber(fromBranch, toBranch);
      const parts = lrNumber.split('-');
      const timePart = parts[3];
      
      // Should be 6 digits for HHMMSS
      expect(timePart).toHaveLength(6);
      expect(/^\d{6}$/.test(timePart)).toBe(true);
      
      // Should be valid time format (HH: 00-23, MM: 00-59, SS: 00-59)
      const hours = parseInt(timePart.substring(0, 2));
      const minutes = parseInt(timePart.substring(2, 4));
      const seconds = parseInt(timePart.substring(4, 6));
      
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(23);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThanOrEqual(59);
      expect(seconds).toBeGreaterThanOrEqual(0);
      expect(seconds).toBeLessThanOrEqual(59);
    });

    it('should include 3-digit random suffix', () => {
      const fromBranch = 'MUM001';
      const toBranch = 'DEL001';
      
      const lrNumber = generateLRNumber(fromBranch, toBranch);
      const parts = lrNumber.split('-');
      const randomPart = parts[4];
      
      // Should be 3 digits
      expect(randomPart).toHaveLength(3);
      expect(/^\d{3}$/.test(randomPart)).toBe(true);
      
      // Should be between 000 and 999
      const randomNum = parseInt(randomPart);
      expect(randomNum).toBeGreaterThanOrEqual(0);
      expect(randomNum).toBeLessThanOrEqual(999);
    });

    it('should generate unique LR numbers', () => {
      const fromBranch = 'MUM001';
      const toBranch = 'DEL001';
      
      const lrNumbers = new Set();
      const iterations = 100;
      
      // Generate multiple LR numbers and check uniqueness
      for (let i = 0; i < iterations; i++) {
        const lrNumber = generateLRNumber(fromBranch, toBranch);
        lrNumbers.add(lrNumber);
      }
      
      // Most should be unique (allowing for very rare duplicates due to timing)
      expect(lrNumbers.size).toBeGreaterThan(iterations * 0.95);
    });

    it('should handle different branch code formats', () => {
      const testCases = [
        { from: 'MUM', to: 'DEL' },
        { from: 'MUMBAI', to: 'DELHI' },
        { from: 'BLR01', to: 'CHN02' },
        { from: 'A', to: 'B' }
      ];
      
      testCases.forEach(({ from, to }) => {
        const lrNumber = generateLRNumber(from, to);
        expect(lrNumber).toStartWith(`${from}-${to}-`);
        
        // Should still maintain the overall format
        const parts = lrNumber.split('-');
        expect(parts).toHaveLength(5);
        expect(parts[2]).toHaveLength(8); // Date
        expect(parts[3]).toHaveLength(6); // Time
        expect(parts[4]).toHaveLength(3); // Random
      });
    });

    it('should handle empty branch codes gracefully', () => {
      const lrNumber = generateLRNumber('', '');
      
      // Should start with double dash
      expect(lrNumber).toStartWith('--');
      
      // Should still have correct format for remaining parts
      const parts = lrNumber.split('-');
      expect(parts).toHaveLength(5);
      expect(parts[0]).toBe('');
      expect(parts[1]).toBe('');
      expect(parts[2]).toHaveLength(8);
      expect(parts[3]).toHaveLength(6);
      expect(parts[4]).toHaveLength(3);
    });

    it('should handle special characters in branch codes', () => {
      const fromBranch = 'MUM@001';
      const toBranch = 'DEL#001';
      
      const lrNumber = generateLRNumber(fromBranch, toBranch);
      
      expect(lrNumber).toStartWith('MUM@001-DEL#001-');
      
      // Should still maintain correct overall structure
      const pattern = /^MUM@001-DEL#001-\d{8}-\d{6}-\d{3}$/;
      expect(lrNumber).toMatch(pattern);
    });

    it('should generate LR numbers within reasonable time', () => {
      const startTime = Date.now();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        generateLRNumber('MUM001', 'DEL001');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should generate 1000 LR numbers in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should maintain consistent format across multiple calls', () => {
      const fromBranch = 'TEST001';
      const toBranch = 'TEST002';
      const lrNumbers = [];
      
      // Generate multiple LR numbers
      for (let i = 0; i < 10; i++) {
        lrNumbers.push(generateLRNumber(fromBranch, toBranch));
      }
      
      // All should have same format
      lrNumbers.forEach(lrNumber => {
        const pattern = /^TEST001-TEST002-\d{8}-\d{6}-\d{3}$/;
        expect(lrNumber).toMatch(pattern);
        
        const parts = lrNumber.split('-');
        expect(parts).toHaveLength(5);
      });
    });

    it('should handle concurrent generation', async () => {
      const fromBranch = 'CONCURRENT001';
      const toBranch = 'CONCURRENT002';
      const promises = [];
      
      // Generate LR numbers concurrently
      for (let i = 0; i < 50; i++) {
        promises.push(Promise.resolve(generateLRNumber(fromBranch, toBranch)));
      }
      
      const results = await Promise.all(promises);
      
      // All should be valid format
      results.forEach(lrNumber => {
        const pattern = /^CONCURRENT001-CONCURRENT002-\d{8}-\d{6}-\d{3}$/;
        expect(lrNumber).toMatch(pattern);
      });
      
      // Most should be unique
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(results.length * 0.9);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle very long branch codes', () => {
      const longFromBranch = 'A'.repeat(100);
      const longToBranch = 'B'.repeat(100);
      
      const lrNumber = generateLRNumber(longFromBranch, longToBranch);
      
      expect(lrNumber).toStartWith(`${longFromBranch}-${longToBranch}-`);
      
      const parts = lrNumber.split('-');
      expect(parts[0]).toBe(longFromBranch);
      expect(parts[1]).toBe(longToBranch);
      expect(parts[2]).toHaveLength(8);
      expect(parts[3]).toHaveLength(6);
      expect(parts[4]).toHaveLength(3);
    });

    it('should handle numeric branch codes', () => {
      const fromBranch = '12345';
      const toBranch = '67890';
      
      const lrNumber = generateLRNumber(fromBranch, toBranch);
      
      expect(lrNumber).toStartWith('12345-67890-');
      
      const pattern = /^12345-67890-\d{8}-\d{6}-\d{3}$/;
      expect(lrNumber).toMatch(pattern);
    });

    it('should handle branch codes with dashes', () => {
      const fromBranch = 'MUM-WEST';
      const toBranch = 'DEL-NORTH';
      
      const lrNumber = generateLRNumber(fromBranch, toBranch);
      
      expect(lrNumber).toStartWith('MUM-WEST-DEL-NORTH-');
      
      // Should have correct number of parts when split by dash
      const parts = lrNumber.split('-');
      expect(parts).toHaveLength(7); // MUM, WEST, DEL, NORTH, date, time, random
      expect(parts[4]).toHaveLength(8); // Date
      expect(parts[5]).toHaveLength(6); // Time
      expect(parts[6]).toHaveLength(3); // Random
    });
  });
});