const { getPool } = require('../db.cjs');

async function main() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT DISTINCT h.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
    FROM BDDatos_2025.dbo.v_Consolidado_SICOFS_2025 h
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON h.Id_Establecimiento = e.Id_Establecimiento
  `);
  console.log(JSON.stringify(res.recordset, null, 2));
  await pool.close();
}

main().catch(console.error);
