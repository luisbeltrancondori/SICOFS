const { getPool, sql } = require('../legacy-server/db.cjs');

async function testDirect() {
  const pool = await getPool();
  console.log('Testing direct queries on BDDatos_2025...');
  const t0 = Date.now();
  const res = await pool.request().query(`
    SELECT 
      COUNT(*) AS TotalRegistros,
      SUM(Costo_Total) AS TotalCosto
    FROM BDDatos_2025.dbo.v_Consolidado_SICOFS_2025
  `);
  console.log(`Direct 2025 query took ${Date.now() - t0}ms:`, res.recordset[0]);
  process.exit(0);
}

testDirect().catch(e => { console.error(e); process.exit(1); });
