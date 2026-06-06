import crypto from "node:crypto";

/**
 * Hashes a plaintext password using PBKDF2 algorithm with 600,000 iterations.
 * Returns a string formatted as "pbkdf2:600000:salt:hash".
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 600000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored hash string.
 * Supports both new "pbkdf2:iterations:salt:hash" and legacy "salt:hash" formats.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  
  if (parts.length === 4 && parts[0] === "pbkdf2") {
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const hash = parts[3];
    if (isNaN(iterations) || !salt || !hash) return false;
    
    const testHash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return hash === testHash;
  }
  
  // Legacy format fallback (1000 iterations)
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === testHash;
}
