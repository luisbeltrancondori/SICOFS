const { getPool } = require('../legacy-server/db.cjs');

async function testKPIs() {
  const pool = await getPool();

  console.log('--- 1. Most Prescribed (Distinct Id_Salida) ---');
  const mostPrescribed = await pool.request().query(`
    SELECT TOP 5
      ms.Id_Suministro,
      ISNULL(s.Des_Suministro, 'Desconocido') AS Nombre,
      s.Des_FormaFar AS Forma,
      s.Des_Concentra AS Concentracion,
      COUNT(DISTINCT ms.Id_Salida) AS RecetasDistintas,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS TotalDispensado,
      SUM(ms.Costo_Total) AS TotalCosto
    FROM BDDatos_2025.dbo.t_MovSum ms
    LEFT JOIN BDDatos_2025.dbo.t_Suministro s ON 
      ms.Id_Suministro = s.Id_Suministro AND 
      ms.Id_Establecimiento = s.Id_Establecimiento AND
      ms.Id_Ano = s.Id_Ano AND
      ms.Id_Mes = s.Id_Mes
    WHERE ms.Id_Suministro > 0
    GROUP BY ms.Id_Suministro, s.Des_Suministro, s.Des_FormaFar, s.Des_Concentra
    ORDER BY RecetasDistintas DESC
  `);
  console.table(mostPrescribed.recordset);

  console.log('\n--- 2. Highest Expenditure (Cost Total) ---');
  const highestExp = await pool.request().query(`
    SELECT TOP 5
      ms.Id_Suministro,
      ISNULL(s.Des_Suministro, 'Desconocido') AS Nombre,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS TotalDispensado,
      SUM(ms.Costo_Total) AS TotalCosto,
      COUNT(DISTINCT ms.Id_Salida) AS RecetasDistintas
    FROM BDDatos_2025.dbo.t_MovSum ms
    LEFT JOIN BDDatos_2025.dbo.t_Suministro s ON 
      ms.Id_Suministro = s.Id_Suministro AND 
      ms.Id_Establecimiento = s.Id_Establecimiento AND
      ms.Id_Ano = s.Id_Ano AND
      ms.Id_Mes = s.Id_Mes
    WHERE ms.Id_Suministro > 0
    GROUP BY ms.Id_Suministro, s.Des_Suministro
    ORDER BY TotalCosto DESC
  `);
  console.table(highestExp.recordset);

  console.log('\n--- 3. Monthly Evolution 2025 (Quantity & Cost) ---');
  const monthly = await pool.request().query(`
    SELECT 
      ms.Id_Mes AS Mes,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
      SUM(ms.Costo_Total) AS CostoTotal,
      COUNT(DISTINCT ms.Id_Salida) AS Recetas
    FROM BDDatos_2025.dbo.t_MovSum ms
    WHERE ms.Id_Suministro > 0
    GROUP BY ms.Id_Mes
    ORDER BY ms.Id_Mes
  `);
  console.table(monthly.recordset);

  process.exit(0);
}

testKPIs().catch(e => {
  console.error(e);
  process.exit(1);
});
