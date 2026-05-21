describe('Validation Tests', () => {
  describe('Aadhaar Validation', () => {
    const aadhaarRegex = /^[0-9]{12}$/;

    it('should validate correct 12-digit Aadhaar number', () => {
      const validAadhaar = '123456789012';
      expect(aadhaarRegex.test(validAadhaar)).toBe(true);
    });

    it('should reject Aadhaar with less than 12 digits', () => {
      const invalidAadhaar = '12345678901';
      expect(aadhaarRegex.test(invalidAadhaar)).toBe(false);
    });

    it('should reject Aadhaar with more than 12 digits', () => {
      const invalidAadhaar = '1234567890123';
      expect(aadhaarRegex.test(invalidAadhaar)).toBe(false);
    });

    it('should reject Aadhaar with non-numeric characters', () => {
      const invalidAadhaar = '12345678901A';
      expect(aadhaarRegex.test(invalidAadhaar)).toBe(false);
    });

    it('should reject Aadhaar with spaces', () => {
      const invalidAadhaar = '1234 5678 9012';
      expect(aadhaarRegex.test(invalidAadhaar)).toBe(false);
    });

    it('should reject empty Aadhaar', () => {
      const invalidAadhaar = '';
      expect(aadhaarRegex.test(invalidAadhaar)).toBe(false);
    });
  });

  describe('PAN Validation', () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    it('should validate correct PAN format', () => {
      const validPan = 'ABCDE1234F';
      expect(panRegex.test(validPan)).toBe(true);
    });

    it('should validate another correct PAN format', () => {
      const validPan = 'XYZZZ9999Z';
      expect(panRegex.test(validPan)).toBe(true);
    });

    it('should reject PAN with lowercase letters', () => {
      const invalidPan = 'abcde1234f';
      expect(panRegex.test(invalidPan)).toBe(false);
    });

    it('should reject PAN with less than 10 characters', () => {
      const invalidPan = 'ABCDE123F';
      expect(panRegex.test(invalidPan)).toBe(false);
    });

    it('should reject PAN with more than 10 characters', () => {
      const invalidPan = 'ABCDE12345F';
      expect(panRegex.test(invalidPan)).toBe(false);
    });

    it('should reject PAN with numbers in first 5 positions', () => {
      const invalidPan = 'ABC1E1234F';
      expect(panRegex.test(invalidPan)).toBe(false);
    });

    it('should reject PAN with letters in middle 4 positions', () => {
      const invalidPan = 'ABCDEA234F';
      expect(panRegex.test(invalidPan)).toBe(false);
    });

    it('should reject PAN with number in last position', () => {
      const invalidPan = 'ABCDE12341';
      expect(panRegex.test(invalidPan)).toBe(false);
    });

    it('should reject empty PAN', () => {
      const invalidPan = '';
      expect(panRegex.test(invalidPan)).toBe(false);
    });

    it('should reject PAN with special characters', () => {
      const invalidPan = 'ABCDE1234@';
      expect(panRegex.test(invalidPan)).toBe(false);
    });
  });

  describe('Email Validation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('should validate correct email format', () => {
      const validEmail = 'user@example.com';
      expect(emailRegex.test(validEmail)).toBe(true);
    });

    it('should reject email without @', () => {
      const invalidEmail = 'userexample.com';
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should reject email without domain', () => {
      const invalidEmail = 'user@';
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should reject email with spaces', () => {
      const invalidEmail = 'user @example.com';
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });
  });

  describe('Phone Validation', () => {
    const phoneRegex = /^[0-9]{10}$/;

    it('should validate correct 10-digit phone number', () => {
      const validPhone = '9876543210';
      expect(phoneRegex.test(validPhone)).toBe(true);
    });

    it('should reject phone with less than 10 digits', () => {
      const invalidPhone = '987654321';
      expect(phoneRegex.test(invalidPhone)).toBe(false);
    });

    it('should reject phone with more than 10 digits', () => {
      const invalidPhone = '98765432101';
      expect(phoneRegex.test(invalidPhone)).toBe(false);
    });

    it('should reject phone with non-numeric characters', () => {
      const invalidPhone = '987654321A';
      expect(phoneRegex.test(invalidPhone)).toBe(false);
    });

    it('should reject phone with spaces', () => {
      const invalidPhone = '9876 543210';
      expect(phoneRegex.test(invalidPhone)).toBe(false);
    });
  });
});
