import dotenv from "dotenv";
dotenv.config({quiet: true});

// All environment variables in one place — 
// The app will notify at startup if any are missing

export const env = {
  // App
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

  // Discord OAuth
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  DISCORD_CALLBACK_URL: process.env.DISCORD_CALLBACK_URL,

  // Resend Email
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

  // Cashfree
  CASHFREE_APP_ID: process.env.CASHFREE_APP_ID,
  CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
  CASHFREE_WEBHOOK_SECRET: process.env.CASHFREE_WEBHOOK_SECRET,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // PayU
  PAYU_KEY: process.env.PAYU_KEY,
  PAYU_SALT: process.env.PAYU_SALT,
  PAYU_WEBHOOK_SECRET: process.env.PAYU_WEBHOOK_SECRET,

  // Platform Config
  PLATFORM_FEE_PERCENTAGE: process.env.PLATFORM_FEE_PERCENTAGE || "2.9",
  MIN_SUPERCHAT_AMOUNT: process.env.MIN_SUPERCHAT_AMOUNT || "20",
};

// Validate — check if any required variables are missing
const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",   
  "EMAIL_FROM",       
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "CASHFREE_APP_ID", 
  "CASHFREE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "PAYU_KEY",
  "PAYU_SALT",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("The following environment variables are missing:", missing.join(", "));
  process.exit(1); // Terminate the process
}

console.log("All environment variables loaded successfully!");