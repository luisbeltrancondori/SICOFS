const { getPool } = require('../legacy-server/db.cjs');

async function testRawTables() {
  const pool = await getPool();
  console.log('Testing direct t_MovSer and t_MovSum on BDDatos_2025...');
  const t0 = Date.now();
  const ser = await pool.request().query(`
    SELECT COUNT(*) AS Reg, SUM(Costo_Total) AS Costo, SUM(Cantidad) AS Cant
    FROM BDDatos_2025.dbo.t_MovSer
  `);
  console.log(`t_MovSer in ${Date.now() - t0}ms:`, ser.recordset[0]);

  const t1 = Date.now();
  const sum = await pool.request().query(`
    SELECT COUNT(*) AS Reg, SUM(Costo_Total) AS Costo, SUM(Dispensado) AS Cant
    FROM BDDatos_2025.dbo.t_MovSum
  `);
  console.log(`t_MovSum in ${Date.now() - t1}ms:`, sum.recordset[0]);

  process.exit(0);
}

testRawTables().catch(e => { console.error(e); process.exit(1); });
