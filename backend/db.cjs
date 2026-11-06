const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'SICOFS-SERVER\\SUS',
  database: process.env.DB_DATABASE || 'BDTemporal',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Sus12345',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 60000,
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1',
      ciphers: 'DEFAULT@SECLEVEL=0',
    },
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

module.exports = { getPool, sql };
