const { getPool, sql } = require('../legacy-server/db.cjs');

async function testMatrixQuery() {
  const pool = await getPool();

  console.time('Matrix query with filters');
  const res = await pool.request().query(`
    SELECT TOP 50
      ISNULL(s.Des_Servicio, m.Des_Obs) AS nombre,
      ISNULL(ts.Des_TipoServicio, 'No definido') AS tipoServicio,
      ISNULL(gp.Des_GrupoProcedimiento, 'No definido') AS grupoProcedimiento,
      m.Id_Mes AS mes,
      SUM(m.Cantidad) AS cantidad,
      SUM(m.Costo_Total) AS costoTotal
    FROM BDDatos_2025.dbo.t_MovSer m
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON m.Id_Establecimiento = e.Id_Establecimiento
    LEFT JOIN BDCatalogos.dbo.t_Servicio s ON m.Id_Servicio = s.Id_Servicio
    LEFT JOIN BDCatalogos.dbo.t_TipoServicio ts ON s.Id_TipoServicio = ts.Id_TipoServicio
    LEFT JOIN BDCatalogos.dbo.t_GrupoProcedimiento gp ON s.Id_GrupoProcedimiento = gp.Id_GrupoProcedimiento
    WHERE ISNULL(s.Des_Servicio, m.Des_Obs) IS NOT NULL
      AND m.Id_Establecimiento = 700359
    GROUP BY ISNULL(s.Des_Servicio, m.Des_Obs), ts.Des_TipoServicio, gp.Des_GrupoProcedimiento, m.Id_Mes
    ORDER BY SUM(m.Cantidad) DESC
  `);
  console.timeEnd('Matrix query with filters');
  console.log('Matrix rows:', res.recordset.length);
  console.log('Sample:', res.recordset[0]);

  await pool.close();
}

testMatrixQuery().catch(console.error);
