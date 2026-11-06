const sql = require('mssql');

const config = {
  server: 'SICOFS-SERVER\\SUS',
  database: 'BDTemporal',
  user: 'sa',
  password: 'Sus12345',
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
