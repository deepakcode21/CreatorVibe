import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as DiscordStrategy } from "passport-discord";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { env } from "./env.js";
import { supabaseAdmin } from "./supabase.js";
import { logger } from "../utils/logger.util.js";

export const configurePassport = () => {

  // ─── JWT STRATEGY ──────────────────────────────────
  // Protected routes ke liye — token check karta hai
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: env.JWT_ACCESS_SECRET,
      },
      async (payload, done) => {
        try {
          const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("id, email, username, display_name, avatar, status")
            .eq("id", payload.sub)
            .single();

          if (error || !user) return done(null, false);
          if (user.status === "banned") return done(null, false);

          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  // ─── GOOGLE STRATEGY ───────────────────────────────
  // Sirf login ke liye — YouTube se alag!
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(null, false, { message: "Email nahi mila Google se" });
          }

          // Pehle check karo — ye Google account linked hai?
          const { data: existingOAuth } = await supabaseAdmin
            .from("oauth_accounts")
            .select("*, users(*)")
            .eq("provider", "google")
            .eq("provider_id", profile.id)
            .single();

          if (existingOAuth) {
            // Pehle se linked hai — seedha login
            return done(null, existingOAuth.users);
          }

          // Same email se koi user hai?
          const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

          if (existingUser) {
            // User hai — Google account link karo
            await supabaseAdmin.from("oauth_accounts").insert({
              user_id: existingUser.id,
              provider: "google",
              provider_id: profile.id,
            });
            return done(null, existingUser);
          }

          // Bilkul naya user — banao
          const username = await generateUsername(
            profile.displayName || email.split("@")[0]
          );

          const { data: newUser, error } = await supabaseAdmin
            .from("users")
            .insert({
              email,
              username,
              display_name: profile.displayName,
              avatar,
              email_verified: true,
              status: "active",
            })
            .select()
            .single();

          if (error) throw error;

          await supabaseAdmin.from("oauth_accounts").insert({
            user_id: newUser.id,
            provider: "google",
            provider_id: profile.id,
          });

          logger.info(`Naya Google user: ${newUser.username}`);
          return done(null, newUser);

        } catch (err) {
          logger.error("Google OAuth error:", err.message);
          return done(err, false);
        }
      }
    )
  );

  // ─── DISCORD STRATEGY ──────────────────────────────
  passport.use(
    new DiscordStrategy(
      {
        clientID: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        callbackURL: env.DISCORD_CALLBACK_URL,
        scope: ["identify", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.email;
          const avatar = profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null;

          if (!email) {
            return done(null, false, { message: "Email nahi mila Discord se" });
          }

          // Pehle check karo — linked hai?
          const { data: existingOAuth } = await supabaseAdmin
            .from("oauth_accounts")
            .select("*, users(*)")
            .eq("provider", "discord")
            .eq("provider_id", profile.id)
            .single();

          if (existingOAuth) {
            return done(null, existingOAuth.users);
          }

          // Same email se user hai?
          const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

          if (existingUser) {
            await supabaseAdmin.from("oauth_accounts").insert({
              user_id: existingUser.id,
              provider: "discord",
              provider_id: profile.id,
            });
            return done(null, existingUser);
          }

          // Naya user banao
          const username = await generateUsername(
            profile.username || email.split("@")[0]
          );

          const { data: newUser, error } = await supabaseAdmin
            .from("users")
            .insert({
              email,
              username,
              display_name: profile.username,
              avatar,
              email_verified: true,
              status: "active",
            })
            .select()
            .single();

          if (error) throw error;

          await supabaseAdmin.from("oauth_accounts").insert({
            user_id: newUser.id,
            provider: "discord",
            provider_id: profile.id,
          });

          logger.info(`Naya Discord user: ${newUser.username}`);
          return done(null, newUser);

        } catch (err) {
          logger.error("Discord OAuth error:", err.message);
          return done(err, false);
        }
      }
    )
  );

  logger.info("✅ Passport configure ho gaya!");
};

// ─── HELPER — UNIQUE USERNAME ───────────────────────
const generateUsername = async (base) => {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .substring(0, 20);

  let username = clean;
  let counter = 1;

  while (true) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!data) return username; // Available hai!
    username = `${clean}_${counter++}`;
  }
};