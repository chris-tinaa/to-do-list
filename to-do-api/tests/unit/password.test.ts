import { hashPassword, comparePassword, validatePasswordStrength } from '../../src/utils/password.util';

describe('Password Utility', () => {
  it('should hash a password correctly', async () => {
    const password = 'mySecurePassword123!';
    const hashedPassword = await hashPassword(password);
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword.length).toBeGreaterThan(0);
  });

  it('should compare a correct password with its hash successfully', async () => {
    const password = 'mySecurePassword123!';
    const hashedPassword = await hashPassword(password);
    const isMatch = await comparePassword(password, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it('should fail to compare an incorrect password with its hash', async () => {
    const password = 'mySecurePassword123!';
    const wrongPassword = 'wrongPassword123!';
    const hashedPassword = await hashPassword(password);
    const isMatch = await comparePassword(wrongPassword, hashedPassword);
    expect(isMatch).toBe(false);
  });

  describe('validatePasswordStrength', () => {
    it('should return true for a strong password', () => {
      const result = validatePasswordStrength('StrongP@ssw0rd');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors for a password that is too short', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long.');
    });

    it('should return errors for a password missing an uppercase letter', () => {
      const result = validatePasswordStrength('strongp@ssw0rd');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter.');
    });

    it('should return errors for a password missing a lowercase letter', () => {
      const result = validatePasswordStrength('STRONGP@SSW0RD');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter.');
    });

    it('should return errors for a password missing a number', () => {
      const result = validatePasswordStrength('StrongP@ssword');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number.');
    });

    it('should return errors for a password missing a special character', () => {
      const result = validatePasswordStrength('StrongP4ssw0rd');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character.');
    });

    it('should return multiple errors for a weak password', () => {
      const result = validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long.');
      expect(result.errors).toContain('Password must contain at least one uppercase letter.');
      expect(result.errors).toContain('Password must contain at least one number.');
      expect(result.errors).toContain('Password must contain at least one special character.');
    });
  });
}); 