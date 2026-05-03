import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateFullName,
} from '../utils/validation';

describe('validateEmail', () => {
  it('returns error for empty input', () => {
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('   ')).toBe('Email is required');
  });

  it('returns error for malformed addresses', () => {
    expect(validateEmail('not-an-email')).toBe('Please enter a valid email');
    expect(validateEmail('missing@tld')).toBe('Please enter a valid email');
    expect(validateEmail('@no-local.com')).toBe('Please enter a valid email');
    expect(validateEmail('spaces in@addr.com')).toBe('Please enter a valid email');
  });

  it('accepts valid addresses', () => {
    expect(validateEmail('user@example.com')).toBeUndefined();
    expect(validateEmail('first.last+tag@sub.example.co.uk')).toBeUndefined();
  });
});

describe('validatePassword', () => {
  it('rejects empty', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('rejects short passwords', () => {
    expect(validatePassword('abc')).toBe('Password must be at least 6 characters');
    expect(validatePassword('12345')).toBe('Password must be at least 6 characters');
  });

  it('accepts passwords of 6+ characters', () => {
    expect(validatePassword('123456')).toBeUndefined();
    expect(validatePassword('a-long-passphrase')).toBeUndefined();
  });
});

describe('validatePasswordMatch', () => {
  it('rejects empty confirmation', () => {
    expect(validatePasswordMatch('abc123', '')).toBe('Please confirm your password');
  });

  it('rejects mismatch', () => {
    expect(validatePasswordMatch('abc123', 'abc124')).toBe('Passwords do not match');
  });

  it('accepts matching passwords', () => {
    expect(validatePasswordMatch('abc123', 'abc123')).toBeUndefined();
  });
});

describe('validateFullName', () => {
  it('rejects empty / whitespace-only', () => {
    expect(validateFullName('')).toBe('Full name is required');
    expect(validateFullName('   ')).toBe('Full name is required');
  });

  it('rejects single-character names', () => {
    expect(validateFullName('A')).toBe('Name must be at least 2 characters');
    expect(validateFullName(' B ')).toBe('Name must be at least 2 characters');
  });

  it('accepts valid names', () => {
    expect(validateFullName('Jo')).toBeUndefined();
    expect(validateFullName('Ada Lovelace')).toBeUndefined();
  });
});
