const { getPool } = require('../legacy-server/db.cjs');

async function testTopServicesMatrix() {
  const pool = await getPool();

  console.time('Top 50 services matrix');
  const res = await pool.request().query(`
    WITH TopServices AS (
      SELECT TOP 50 m.Id_Servicio, SUM(m.Cantidad) AS TotalCant
      FROM BDDatos_2025.dbo.t_MovSer m
      GROUP BY m.Id_Servicio
      ORDER BY SUM(m.Cantidad) DESC
    )
    SELECT 
      ISNULL(s.Des_Servicio, m.Des_Obs) AS nombre,
      ISNULL(ts.Des_TipoServicio, 'No definido') AS tipoServicio,
      ISNULL(gp.Des_GrupoProcedimiento, 'No definido') AS grupoProcedimiento,
      m.Id_Mes AS mes,
      SUM(m.Cantidad) AS cantidad,
      SUM(m.Costo_Total) AS costoTotal
    FROM BDDatos_2025.dbo.t_MovSer m
    INNER JOIN TopServices ts_top ON m.Id_Servicio = ts_top.Id_Servicio
    LEFT JOIN BDCatalogos.dbo.t_Servicio s ON m.Id_Servicio = s.Id_Servicio
    LEFT JOIN BDCatalogos.dbo.t_TipoServicio ts ON s.Id_TipoServicio = ts.Id_TipoServicio
    LEFT JOIN BDCatalogos.dbo.t_GrupoProcedimiento gp ON s.Id_GrupoProcedimiento = gp.Id_GrupoProcedimiento
    GROUP BY ISNULL(s.Des_Servicio, m.Des_Obs), ts.Des_TipoServicio, gp.Des_GrupoProcedimiento, m.Id_Mes, ts_top.TotalCant
    ORDER BY ts_top.TotalCant DESC, m.Id_Mes
  `);
  console.timeEnd('Top 50 services matrix');
  console.log('Total matrix rows:', res.recordset.length);

  const distinctNames = new Set(res.recordset.map(r => r.nombre));
  console.log('Distinct services in matrix:', distinctNames.size);
  console.log('First 5 services:', [...distinctNames].slice(0, 5));

  await pool.close();
}

testTopServicesMatrix().catch(console.error);
