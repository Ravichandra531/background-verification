import { z } from 'zod';

describe('Candidate Validation', () => {
  const createSchema = z.object({
    body: z.object({
      fullName: z.string()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must not exceed 100 characters')
        .trim(),
      email: z.string()
        .email('Invalid email format')
        .trim()
        .toLowerCase(),
      phone: z.string()
        .regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number')
        .trim(),
      aadhaarNumber: z.string()
        .regex(/^[0-9]{12}$/, 'Aadhaar must be a valid 12-digit number')
        .trim(),
      panNumber: z.string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be in valid format (e.g., ABCDE1234F)')
        .trim(),
      dob: z.string()
        .datetime({ message: 'Date of birth must be a valid date' })
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')),
      address: z.string()
        .min(10, 'Address must be at least 10 characters')
        .max(500, 'Address must not exceed 500 characters')
        .trim(),
    }),
  });

  describe('POST /api/candidates validation', () => {
    it('should reject candidate creation with missing fields', () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
      };

      expect(() => {
        createSchema.parse({
          body: candidateData,
          query: {},
          params: {},
        });
      }).toThrow();
    });

    it('should reject candidate creation with invalid email', () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'invalid-email',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      expect(() => {
        createSchema.parse({
          body: candidateData,
          query: {},
          params: {},
        });
      }).toThrow();
    });

    it('should reject candidate creation with invalid phone', () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '987654321', // 9 digits instead of 10
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      expect(() => {
        createSchema.parse({
          body: candidateData,
          query: {},
          params: {},
        });
      }).toThrow();
    });

    it('should reject candidate creation with invalid Aadhaar', () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '12345678901', // 11 digits instead of 12
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      expect(() => {
        createSchema.parse({
          body: candidateData,
          query: {},
          params: {},
        });
      }).toThrow();
    });

    it('should reject candidate creation with invalid PAN', () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234', // Missing last letter
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      expect(() => {
        createSchema.parse({
          body: candidateData,
          query: {},
          params: {},
        });
      }).toThrow();
    });

    it('should reject candidate creation with short address', () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: 'Short', // Less than 10 characters
      };

      expect(() => {
        createSchema.parse({
          body: candidateData,
          query: {},
          params: {},
        });
      }).toThrow();
    });

    it('should accept candidate creation with valid data', () => {
      const candidateData = {
        fullName: 'Ravichandra Shinde',
        email: 'ravichandra@test.com',
        phone: '9876543210',
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        dob: '1990-01-15',
        address: '123 Main Street, City, State 12345',
      };

      expect(() => {
        createSchema.parse({
          body: candidateData,
          query: {},
          params: {},
        });
      }).not.toThrow();
    });
  });
});
