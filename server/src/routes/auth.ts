import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.get('/google', (req, res, next) => {
  const type = (req.query.type as string) || 'counselor';
  ((req.session as unknown) as Record<string, unknown>).loginType = type;
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=account_not_found`,
  }),
  (req, res) => {
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  }
);

router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json(req.user);
});

export default router;
