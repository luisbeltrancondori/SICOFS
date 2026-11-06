const { getPool } = require('../legacy-server/db.cjs');

async function checkGestiones() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT 
      Gestion,
      COUNT(*) AS TotalRegistros,
      SUM(CAST(Cantidad AS BIGINT)) AS TotalCantidad,
      SUM(Costo_Total) AS TotalCosto,
      COUNT(DISTINCT Codigo) AS TotalMedicamentos,
      COUNT(DISTINCT Id_Establecimiento) AS Establecimientos
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
    WHERE Grupo = 'S'
    GROUP BY Gestion
    ORDER BY Gestion
  `);
  console.table(res.recordset);
  process.exit(0);
}

checkGestiones().catch(e => {
  console.error(e);
  process.exit(1);
});
