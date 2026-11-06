const { getPool } = require('../legacy-server/db.cjs');

async function testFullYear(year) {
  const pool = await getPool();
  console.log(`\nTesting year ${year} with t_MovSer + t_MovSum union...`);
  const t0 = Date.now();

  const query = `
    WITH Combined AS (
      SELECT Id_Mes, Id_Establecimiento, 'T' AS Grupo, Cantidad, Costo_Total
      FROM BDDatos_${year}.dbo.t_MovSer
      UNION ALL
      SELECT Id_Mes, Id_Establecimiento, 'S' AS Grupo, Dispensado AS Cantidad, Costo_Total
      FROM BDDatos_${year}.dbo.t_MovSum
    ),
    AggEstMes AS (
      SELECT 
        Id_Establecimiento, 
        Id_Mes,
        Grupo,
        COUNT(*) AS Registros,
        SUM(Cantidad) AS Cantidad,
        SUM(Costo_Total) AS CostoTotal
      FROM Combined
      GROUP BY Id_Establecimiento, Id_Mes, Grupo
    )
    SELECT 
      a.Id_Establecimiento,
      RTRIM(LTRIM(ISNULL(e.Des_Establecimiento, 'Est. ' + CAST(a.Id_Establecimiento AS VARCHAR)))) AS nombre,
      ISNULL(e.Des_Nivel, '1ER. NIVEL') AS nivel,
      a.Id_Mes AS Mes,
      a.Grupo,
      a.Registros,
      a.Cantidad,
      a.CostoTotal
    FROM AggEstMes a
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON a.Id_Establecimiento = e.Id_Establecimiento
    ORDER BY a.Id_Establecimiento, a.Id_Mes, a.Grupo;
  `;

  const res = await pool.request().query(query);
  console.log(`Aggregated in ${Date.now() - t0}ms: ${res.recordset.length} rows`);
  
  let totalCosto = 0;
  let totalReg = 0;
  for (const r of res.recordset) {
    totalCosto += r.CostoTotal;
    totalReg += r.Registros;
  }
  console.log(`Total Costo: Bs. ${totalCosto.toFixed(2)} | Reg: ${totalReg}`);
}

async function main() {
  for (const y of [2023, 2024, 2025, 2026]) {
    await testFullYear(y);
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
