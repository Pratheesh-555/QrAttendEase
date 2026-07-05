import crypto from 'crypto';

const DEFAULT_QR_TTL_MS = 30000;
const ATTENDANCE_QR_TOKEN_REGEX = /^[A-Za-z0-9_-]{32,64}$/;

export const getAttendanceQrTtlMs = () => {
  const configured = Number(process.env.ATTENDANCE_QR_TTL_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_QR_TTL_MS;
};

export const generateAttendanceQrToken = () => crypto.randomBytes(32).toString('base64url');

export const hashAttendanceQrToken = (token) => {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const createAttendanceQrSession = () => {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + getAttendanceQrTtlMs());
  const token = generateAttendanceQrToken();
  return {
    token,
    tokenHash: hashAttendanceQrToken(token),
    issuedAt,
    expiresAt
  };
};

export const isValidAttendanceQrToken = (token) => ATTENDANCE_QR_TOKEN_REGEX.test(String(token || ''));
