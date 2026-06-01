import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../index';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/auth/google/callback',
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email from Google'));

    const user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.id }, { email }] },
    });

    if (!user) {
      return done(null, false, { message: 'Account not found. Contact your counselor to be added.' });
    }

    if (!user.googleId) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id },
      });
      return done(null, updated);
    }

    return done(null, user);
  } catch (err) {
    return done(err as Error);
  }
}));

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});
