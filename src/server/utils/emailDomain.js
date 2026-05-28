const BIT_DOMAIN = 'bitmesra.ac.in';

const normalize = (email) => String(email || '').trim().toLowerCase();

const isBitEmail = (email) => normalize(email).endsWith(`@${BIT_DOMAIN}`);

// Super-admin overrides — these emails skip the @bitmesra.ac.in lock entirely
// and can carry any role. Keep this list tiny; every entry is a permanent
// backdoor past institute-email enforcement.
const WHITELISTED_EMAILS = new Set([
  'amananshu2004@gmail.com',
]);

const isWhitelisted = (email) => WHITELISTED_EMAILS.has(normalize(email));

// Roles that must use an institute email. Parents are external to the institute
// and are seeded by admin, so they're allowed any verified address.
const ROLES_REQUIRING_BIT_EMAIL = new Set([
  'student',
  'doctor',
  'hod',
  'admin',
  'dispensary_staff',
  'faculty',
]);

const requiresBitEmail = (role) => ROLES_REQUIRING_BIT_EMAIL.has(role);

const assertEmailMatchesRole = (email, role) => {
  if (isWhitelisted(email)) return;
  if (requiresBitEmail(role) && !isBitEmail(email)) {
    const err = new Error(
      `Role "${role}" must use an @${BIT_DOMAIN} email. Got: ${normalize(email)}`,
    );
    err.code = 'EMAIL_DOMAIN_MISMATCH';
    throw err;
  }
};

module.exports = {
  BIT_DOMAIN,
  isBitEmail,
  isWhitelisted,
  requiresBitEmail,
  assertEmailMatchesRole,
};
