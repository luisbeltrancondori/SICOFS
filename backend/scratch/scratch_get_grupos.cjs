const { getPool } = require('../legacy-server/db.cjs');

async function getDistinctGrupos() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT DISTINCT 
      ISNULL(gp.Des_GrupoProcedimiento, 'No definido') AS grupo
    FROM BDDatos_2025.dbo.t_MovSer m
    LEFT JOIN BDCatalogos.dbo.t_Servicio s ON m.Id_Servicio = s.Id_Servicio
    LEFT JOIN BDCatalogos.dbo.t_GrupoProcedimiento gp ON s.Id_GrupoProcedimiento = gp.Id_GrupoProcedimiento
    ORDER BY grupo
  `);
  console.log('Distinct Grupos in MovSer 2025:', res.recordset.map(r => r.grupo));
  await pool.close();
}

getDistinctGrupos().catch(console.error);
