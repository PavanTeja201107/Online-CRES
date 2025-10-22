const crypto = require('crypto');

/**
 * Token Utilities
 * 
 * This module provides utility functions for generating and hashing tokens used in the voting
 * system. It ensures secure token generation and deterministic hashing for validation.
 * 
 * Exports:
 * - genToken: Generates a cryptographically secure random token.
 * - hashToken: Hashes a token with a salt for secure storage and comparison.
 * - genBallotId: Generates a unique identifier for anonymous ballots.
 * 
 * Notes:
 * - TOKEN_SALT should be set in the environment for production environments.
 * - Ensure the crypto library is available in the runtime environment.
 */
function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  const salt = process.env.TOKEN_SALT || 'default_salt';
  return crypto.createHash('sha256').update(token + salt).digest('hex');
}

function genBallotId() {
  return crypto.randomBytes(16).toString('hex'); // 32 hex chars
}

module.exports = { genToken, hashToken, genBallotId };
