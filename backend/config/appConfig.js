// config/appConfig.js
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5500;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];
const configuredOrigin = FRONTEND_ORIGIN ? [FRONTEND_ORIGIN] : [];
const allowlist = new Set([...configuredOrigin, ...defaultOrigins]);

module.exports = {
  NODE_ENV,
  PORT,
  FRONTEND_ORIGIN,
  allowlist,
};
