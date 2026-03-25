const crypto = require('crypto');

const secret = process.env.SUPABASE_JWT_SECRET;
if (!secret) {
  console.error('Missing SUPABASE_JWT_SECRET');
  process.exit(1);
}

const header = {
  alg: 'HS256',
  typ: 'JWT'
};

const payload = {
  sub: '11111111-1111-1111-1111-111111111111',
  role: 'authenticated',
  iss: 'supabase',
  aud: 'authenticated',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};

const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const encodedHeader = base64url(header);
const encodedPayload = base64url(payload);

const signature = crypto.createHmac('sha256', secret)
  .update(`${encodedHeader}.${encodedPayload}`)
  .digest('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

console.log(`${encodedHeader}.${encodedPayload}.${signature}`);
