const { getPool } = require('../legacy-server/db.cjs');

async function testPerformance() {
  const pool = await getPool();
  const year = 2025;
  const db = `BDDatos_${year}`;

  console.log(`Testing query speed for ${db}...`);
  console.time('KPIs & Monthly');
  const kpiRes = await pool.request().query(`
    SELECT 
      SUM(CAST(ms.Dispensado AS BIGINT)) AS TotalCantidad,
      SUM(ms.Costo_Total) AS TotalCosto,
      COUNT(DISTINCT ms.Id_Suministro) AS MedicamentosDiferentes,
      COUNT(DISTINCT ms.Id_Salida) AS RecetasDistintas,
      COUNT(DISTINCT ms.Id_Establecimiento) AS Establecimientos,
      COUNT(DISTINCT ms.Id_Mes) AS MesesConDatos
    FROM ${db}.dbo.t_MovSum ms
    WHERE ms.Id_Suministro > 0
  `);
  console.timeEnd('KPIs & Monthly');
  console.table(kpiRes.recordset);

  console.time('Top 20 By Cost');
  const topCostRes = await pool.request().query(`
    SELECT TOP 20
      ms.Id_Suministro,
      ISNULL(s.Des_Suministro, 'Suministro ' + CAST(ms.Id_Suministro AS VARCHAR)) AS Nombre,
      s.Des_FormaFar AS Forma,
      s.Des_Concentra AS Concentracion,
      ISNULL(ts.Des_TipoSuministro, 'General') AS TipoSuministro,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
      SUM(ms.Costo_Total) AS CostoTotal,
      COUNT(DISTINCT ms.Id_Salida) AS Recetas
    FROM ${db}.dbo.t_MovSum ms
    LEFT JOIN ${db}.dbo.t_Suministro s ON 
      ms.Id_Suministro = s.Id_Suministro AND 
      ms.Id_Establecimiento = s.Id_Establecimiento AND
      ms.Id_Ano = s.Id_Ano AND
      ms.Id_Mes = s.Id_Mes
    LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts ON s.Id_TipoSuministro = ts.Id_TipoSuministro
    WHERE ms.Id_Suministro > 0
    GROUP BY ms.Id_Suministro, s.Des_Suministro, s.Des_FormaFar, s.Des_Concentra, ts.Des_TipoSuministro
    ORDER BY SUM(ms.Costo_Total) DESC
  `);
  console.timeEnd('Top 20 By Cost');
  console.log(`Top 20 By Cost returned ${topCostRes.recordset.length} rows`);

  console.time('Monthly Matrix for Top 80');
  const matrixRes = await pool.request().query(`
    WITH TopMed AS (
      SELECT TOP 80 ms.Id_Suministro, SUM(ms.Costo_Total) AS TotalCostoGlobal
      FROM ${db}.dbo.t_MovSum ms
      WHERE ms.Id_Suministro > 0
      GROUP BY ms.Id_Suministro
      ORDER BY SUM(ms.Costo_Total) DESC
    )
    SELECT 
      ms.Id_Suministro,
      ISNULL(s.Des_Suministro, 'Suministro ' + CAST(ms.Id_Suministro AS VARCHAR)) AS Nombre,
      ISNULL(ts.Des_TipoSuministro, 'General') AS TipoSuministro,
      ms.Id_Mes AS Mes,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
      SUM(ms.Costo_Total) AS CostoTotal
    FROM ${db}.dbo.t_MovSum ms
    INNER JOIN TopMed tm ON ms.Id_Suministro = tm.Id_Suministro
    LEFT JOIN ${db}.dbo.t_Suministro s ON 
      ms.Id_Suministro = s.Id_Suministro AND 
      ms.Id_Establecimiento = s.Id_Establecimiento AND
      ms.Id_Ano = s.Id_Ano AND
      ms.Id_Mes = s.Id_Mes
    LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts ON s.Id_TipoSuministro = ts.Id_TipoSuministro
    WHERE ms.Id_Suministro > 0
    GROUP BY ms.Id_Suministro, s.Des_Suministro, ts.Des_TipoSuministro, ms.Id_Mes, tm.TotalCostoGlobal
    ORDER BY tm.TotalCostoGlobal DESC, ms.Id_Mes
  `);
  console.timeEnd('Monthly Matrix for Top 80');
  console.log(`Matrix returned ${matrixRes.recordset.length} rows`);

  process.exit(0);
}

testPerformance().catch(e => {
  console.error(e);
  process.exit(1);
});
