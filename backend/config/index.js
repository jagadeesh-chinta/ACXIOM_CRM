const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'acxiomcrm_default_secure_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  nodeEnv: process.env.NODE_ENV || 'development',
  maxFailedLogins: 5,
  lockoutTimeMinutes: 15
};
