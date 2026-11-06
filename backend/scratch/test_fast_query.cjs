const { getPool } = require('../legacy-server/db.cjs');

async function testFastQuery() {
  const pool = await getPool();
  const year = 2025;
  const db = `BDDatos_${year}`;

  console.time('Fast Top 20');
  const res = await pool.request().query(`
    WITH Agg AS (
      SELECT 
        ms.Id_Suministro,
        SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
        SUM(ms.Costo_Total) AS CostoTotal,
        COUNT(DISTINCT ms.Id_Salida) AS Recetas
      FROM ${db}.dbo.t_MovSum ms
      WHERE ms.Id_Suministro > 0
      GROUP BY ms.Id_Suministro
    )
    SELECT TOP 20
      a.Id_Suministro,
      ISNULL(s.Des_Suministro, 'Suministro ' + CAST(a.Id_Suministro AS VARCHAR)) AS Nombre,
      s.Des_FormaFar AS Forma,
      s.Des_Concentra AS Concentracion,
      ISNULL(ts.Des_TipoSuministro, 'General') AS TipoSuministro,
      a.Cantidad,
      a.CostoTotal,
      a.Recetas
    FROM Agg a
    OUTER APPLY (
      SELECT TOP 1 Des_Suministro, Des_FormaFar, Des_Concentra, Id_TipoSuministro
      FROM ${db}.dbo.t_Suministro
      WHERE Id_Suministro = a.Id_Suministro
    ) s
    LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts ON s.Id_TipoSuministro = ts.Id_TipoSuministro
    ORDER BY a.CostoTotal DESC
  `);
  console.timeEnd('Fast Top 20');
  console.log(`Returned ${res.recordset.length} rows`);
  console.table(res.recordset.slice(0, 5));

  process.exit(0);
}

testFastQuery().catch(e => {
  console.error(e);
  process.exit(1);
});
