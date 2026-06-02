import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../index';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.NODE_ENV === 'production'
    ? `${process.env.CLIENT_URL}/auth/google/callback`
    : '/auth/google/callback',
  passReqToCallback: true,
}, async (req, _accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email from Google'));

    const loginType: string = ((req.session as unknown) as Record<string, unknown>).loginType as string || 'counselor';

    if (loginType === 'counselor') {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ googleId: profile.id }, { email }] },
      });

      if (existing) {
        const updated = existing.googleId ? existing : await prisma.user.update({
          where: { id: existing.id },
          data: { googleId: profile.id },
        });
        return done(null, updated);
      }

      const created = await prisma.user.create({
        data: {
          googleId: profile.id,
          name: profile.displayName || email,
          email,
          role: 'counselor',
        },
      });
      return done(null, created);
    }

    // disciple login
    const disciple = await prisma.user.findFirst({
      where: { email, counselorId: { not: null } },
    });

    if (!disciple) {
      return done(null, false, { message: 'account_not_found' });
    }

    const updated = disciple.googleId ? disciple : await prisma.user.update({
      where: { id: disciple.id },
      data: { googleId: profile.id },
    });
    return done(null, updated);
  } catch (err) {
    return done(err as Error);
  }
}));

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { disciples: true } },
      },
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
});
