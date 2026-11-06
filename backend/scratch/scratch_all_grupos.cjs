const { getPool } = require('../legacy-server/db.cjs');

async function getAllGrupos() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT DISTINCT Des_GrupoProcedimiento
    FROM BDCatalogos.dbo.t_GrupoProcedimiento
    WHERE Des_GrupoProcedimiento IS NOT NULL AND Des_GrupoProcedimiento <> ''
    ORDER BY Des_GrupoProcedimiento
  `);
  console.log('All GrupoProcedimiento:', res.recordset.map(r => r.Des_GrupoProcedimiento));
  await pool.close();
}

getAllGrupos().catch(console.error);
