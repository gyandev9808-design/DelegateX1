/**
 * Real Email Validator
 * Enforces standard RFC 5322 compliance, valid top-level domains,
 * and blocks disposable/placeholder/fake domains and dummy usernames.
 */

const BLOCKED_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.org',
  'test.net',
  'testing.com',
  'fake.com',
  'fakemail.com',
  'dummy.com',
  'dummymail.com',
  'sample.com',
  'invalid.com',
  'none.com',
  'foo.com',
  'bar.com',
  'asdf.com',
  'tempmail.com',
  'mailinator.com',
  '10minutemail.com',
  'dispostable.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'domain.com',
]);

const BLOCKED_USERNAMES = new Set([
  'test',
  'testing',
  'asdf',
  'qwerty',
  'fake',
  'dummy',
  '123456',
  'noreply',
  'no-reply',
  'placeholder',
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  cleanEmail: string;
}

export function validateRealEmail(rawEmail: unknown): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      isValid: false,
      error: 'Please enter an email address.',
      cleanEmail: '',
    };
  }

  const cleanEmail = rawEmail.trim().toLowerCase();

  // Basic length constraints
  if (cleanEmail.length < 6 || cleanEmail.length > 254) {
    return {
      isValid: false,
      error: 'Email address must be between 6 and 254 characters.',
      cleanEmail,
    };
  }

  // Check single '@' symbol
  const atIndex = cleanEmail.indexOf('@');
  if (atIndex === -1 || atIndex !== cleanEmail.lastIndexOf('@')) {
    return {
      isValid: false,
      error: 'Email must contain exactly one "@" symbol.',
      cleanEmail,
    };
  }

  const [localPart, domainPart] = cleanEmail.split('@');

  // Validate local part (username)
  if (!localPart || localPart.length < 2) {
    return {
      isValid: false,
      error: 'Email username before "@" must be at least 2 characters long.',
      cleanEmail,
    };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return {
      isValid: false,
      error: 'Email username cannot start, end with, or contain consecutive dots.',
      cleanEmail,
    };
  }

  if (BLOCKED_USERNAMES.has(localPart)) {
    return {
      isValid: false,
      error: `"${localPart}@${domainPart}" is a generic test handle. Please enter your real email address.`,
      cleanEmail,
    };
  }

  // Validate domain part
  if (!domainPart || domainPart.length < 4) {
    return {
      isValid: false,
      error: 'Please provide a valid domain name (e.g., gmail.com, outlook.com).',
      cleanEmail,
    };
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.includes('..')) {
    return {
      isValid: false,
      error: 'Domain name cannot start, end with, or contain consecutive dots.',
      cleanEmail,
    };
  }

  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) {
    return {
      isValid: false,
      error: 'Email domain must include a valid extension (e.g., .com, .org, .edu, .in).',
      cleanEmail,
    };
  }

  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return {
      isValid: false,
      error: 'Email top-level domain (extension) must be at least 2 letters (e.g., .com, .edu, .org).',
      cleanEmail,
    };
  }

  // Blocked dummy/disposable domains
  if (BLOCKED_DOMAINS.has(domainPart)) {
    return {
      isValid: false,
      error: `"${domainPart}" is a placeholder or temporary domain. Please enter a real, active email address.`,
      cleanEmail,
    };
  }

  // RFC 5322 standard regex validation
  const rfc5322Regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfc5322Regex.test(cleanEmail)) {
    return {
      isValid: false,
      error: 'Invalid email format. Please enter a genuine email address (e.g., yourname@gmail.com).',
      cleanEmail,
    };
  }

  return {
    isValid: true,
    cleanEmail,
  };
}
