import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// ─── GENERATE ACCESS TOKEN ───────────────────────────
// Valid for 15 minutes — sent with every authenticated request
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

// ─── GENERATE REFRESH TOKEN ──────────────────────────
// Valid for 7 days — used exclusively to obtain a new access token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      sub: userId,
      jti: uuidv4(), // Unique identifier for each token
    },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// ─── GENERATE TOKEN PAIR ─────────────────────────────
export const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user.id),
  };
};

// ─── TOKEN VERIFICATION ──────────────────────────────
export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};