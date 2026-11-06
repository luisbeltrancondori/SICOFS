const { getPool } = require('../legacy-server/db.cjs');

async function testAll() {
  const pool = await getPool();
  for (const year of [2023, 2024, 2025, 2026]) {
    const t0 = Date.now();
    const res = await pool.request().query(`
      SELECT 
        COUNT(*) AS TotalRegistros,
        SUM(Costo_Total) AS TotalCosto
      FROM BDDatos_${year}.dbo.v_Consolidado_SICOFS_${year}
    `);
    console.log(`Year ${year} took ${Date.now() - t0}ms:`, res.recordset[0]);
  }
  process.exit(0);
}

testAll().catch(e => { console.error(e); process.exit(1); });
