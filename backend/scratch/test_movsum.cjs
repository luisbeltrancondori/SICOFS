const { getPool } = require('../legacy-server/db.cjs');

async function testMovSumRelations() {
  const pool = await getPool();

  console.log('--- Checking 2025 t_MovSum row count & totals ---');
  const totals = await pool.request().query(`
    SELECT 
      COUNT(*) AS TotalFilas,
      COUNT(DISTINCT ms.Id_Suministro) AS SuministrosDistintos,
      COUNT(DISTINCT ms.Id_Salida) AS RecetasDistintas,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS TotalDispensado,
      SUM(CAST(ms.Recetado AS BIGINT)) AS TotalRecetado,
      SUM(ms.Costo_Total) AS TotalCosto
    FROM BDDatos_2025.dbo.t_MovSum ms
    WHERE ms.Id_Suministro > 0
  `);
  console.table(totals.recordset);

  console.log('\n--- Checking breakdown by Id_TipoSuministro ---');
  const tipoSum = await pool.request().query(`
    SELECT 
      ISNULL(ts.Des_TipoSuministro, 'Sin Clasificar') AS TipoSuministro,
      COUNT(DISTINCT s.Id_Suministro) AS TotalItems,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS TotalDispensado,
      SUM(ms.Costo_Total) AS TotalCosto
    FROM BDDatos_2025.dbo.t_MovSum ms
    LEFT JOIN BDDatos_2025.dbo.t_Suministro s ON 
      ms.Id_Suministro = s.Id_Suministro AND 
      ms.Id_Establecimiento = s.Id_Establecimiento AND
      ms.Id_Ano = s.Id_Ano AND
      ms.Id_Mes = s.Id_Mes
    LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts ON s.Id_TipoSuministro = ts.Id_TipoSuministro
    WHERE ms.Id_Suministro > 0
    GROUP BY ts.Des_TipoSuministro
    ORDER BY TotalCosto DESC
  `);
  console.table(tipoSum.recordset);

  console.log('\n--- Checking establishments with medicines in 2025 ---');
  const estSum = await pool.request().query(`
    SELECT TOP 5
      ms.Id_Establecimiento,
      ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(ms.Id_Establecimiento AS VARCHAR)) AS Establecimiento,
      e.Des_Nivel AS Nivel,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
      SUM(ms.Costo_Total) AS CostoTotal
    FROM BDDatos_2025.dbo.t_MovSum ms
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON ms.Id_Establecimiento = e.Id_Establecimiento
    WHERE ms.Id_Suministro > 0
    GROUP BY ms.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
    ORDER BY CostoTotal DESC
  `);
  console.table(estSum.recordset);

  process.exit(0);
}

testMovSumRelations().catch(e => {
  console.error(e);
  process.exit(1);
});
