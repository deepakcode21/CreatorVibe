import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// ─── ACCESS TOKEN BANAO ──────────────────────────────
// 15 minute wala — har request ke saath bhejte hain
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

// ─── REFRESH TOKEN BANAO ─────────────────────────────
// 7 din wala — sirf naya access token lene ke liye
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      sub: userId,
      jti: uuidv4(), // Har token ka unique ID
    },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// ─── DONO EK SAATH BANAO ─────────────────────────────
export const generateTokens = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user.id),
  };
};

// ─── TOKEN VERIFY KARO ───────────────────────────────
export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};