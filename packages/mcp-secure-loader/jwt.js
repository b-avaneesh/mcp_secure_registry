const jwt =  require('jsonwebtoken');
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("[Warning] JWT_SECRET is missing from your environment variables!");
}

/**
 * 1. SIGN THE TOKEN
 * Signs a token containing the userEmail and ID with a 30-day expiration window.
 */
function signUserToken(userEmail, userId) {
  const payload = {
    userEmail: userEmail,
    id: userId,
    authTimestamp: Date.now() // To add some diversity to the token (since email and Id always static)
  };

  // sign() automatically handles converting '30d' into the proper Unix timestamp checks
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  return token;
}

/**
 * 2. DECODE & VERIFY THE TOKEN
 * Throws an error if the token has expired, been tampered with, or signed with a bad secret.
 */
function verifyUserToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, data: decoded };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return {
        success: false,
        data: "JWT expired. Please log in again."
      };
    }

    return {
      success: false,
      data: "Invalid JWT."
    };
  }
}

module.exports = {
  signUserToken,
  verifyUserToken
};