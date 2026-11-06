const { getPool } = require('../legacy-server/db.cjs');

async function main() {
  const pool = await getPool();
  
  console.log('--- 1. Tables in current DB (BDTemporal / BDDatos) with "Med" or "Consolidado" ---');
  const tRes = await pool.request().query(`
    SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME LIKE '%Med%' OR TABLE_NAME LIKE '%Consolidado%'
    ORDER BY TABLE_NAME
  `);
  console.table(tRes.recordset);

  console.log('\n--- 2. Inspecting v_Consolidado_SICOFS_Historico for Grupo values ---');
  try {
    const gRes = await pool.request().query(`
      SELECT DISTINCT TOP 10 Grupo, COUNT(*) AS Cantidad
      FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
      GROUP BY Grupo
    `);
    console.table(gRes.recordset);
  } catch (e) {
    console.error('v_Consolidado error:', e.message);
  }

  console.log('\n--- 3. Check BDDatos_2025 tables ---');
  try {
    const bdRes = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM BDDatos_2025.INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%Med%'
    `);
    console.table(bdRes.recordset);
  } catch (e) {
    console.error('BDDatos_2025 tables error:', e.message);
  }

  console.log('\n--- 4. Check BDCatalogos tables for Medicamento / Farmacia ---');
  try {
    const catRes = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM BDCatalogos.INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%Med%' OR TABLE_NAME LIKE '%Farm%'
    `);
    console.table(catRes.recordset);
  } catch (e) {
    console.error('BDCatalogos error:', e.message);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
