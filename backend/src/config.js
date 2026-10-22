require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET?.trim();

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set in .env and contain at least 32 characters');
}

module.exports = { JWT_SECRET };
