import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many attendance submissions. Please wait a moment.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => false
});

export const qrLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many QR code requests. Please slow down.',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const exportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: 'Too many export requests. Please wait.',
});
