const { getPool } = require('../legacy-server/db.cjs');

async function main() {
  const pool = await getPool();
  const YEAR = 2025;

  // 1. Group distribution
  console.log('\n=== GROUP DISTRIBUTION 2025 ===');
  const grupos = await pool.request().query(`
    SELECT Grupo, COUNT(*) AS Total, SUM(Costo_Total) AS TotalCosto
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
    WHERE Gestion = ${YEAR}
    GROUP BY Grupo ORDER BY Total DESC
  `);
  grupos.recordset.forEach(r => console.log(` Grupo="${r.Grupo}" | Registros=${r.Total} | Costo=${r.TotalCosto?.toFixed(2)}`));

  // 2. Sample row
  console.log('\n=== SAMPLE ROW 2025 (Grupo T) ===');
  const sample = await pool.request().query(`
    SELECT TOP 1 * FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico WHERE Gestion=${YEAR} AND Grupo='T'
  `);
  if (sample.recordset[0]) console.log(JSON.stringify(sample.recordset[0], null, 2));

  // 3. Sample row S
  console.log('\n=== SAMPLE ROW 2025 (Grupo S) ===');
  const sampleS = await pool.request().query(`
    SELECT TOP 1 * FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico WHERE Gestion=${YEAR} AND Grupo='S'
  `);
  if (sampleS.recordset[0]) console.log(JSON.stringify(sampleS.recordset[0], null, 2));

  // 4. Yearly totals all years
  console.log('\n=== YEARLY TOTALS ===');
  const yearly = await pool.request().query(`
    SELECT Gestion, Grupo, COUNT(*) AS Registros, SUM(Costo_Total) AS TotalCosto
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
    GROUP BY Gestion, Grupo ORDER BY Gestion, Grupo
  `);
  yearly.recordset.forEach(r => console.log(` ${r.Gestion} Grupo=${r.Grupo} | Registros=${r.Registros} | Costo=${r.TotalCosto?.toFixed(2)}`));

  // 5. By Establecimiento 2025 all groups
  console.log('\n=== TOP ESTABLECIMIENTOS 2025 (all groups) ===');
  const est = await pool.request().query(`
    SELECT TOP 15
      h.Id_Establecimiento,
      e.Des_Establecimiento,
      e.Des_Nivel,
      COUNT(*) AS Registros,
      SUM(h.Costo_Total) AS TotalCosto
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico h
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON h.Id_Establecimiento = e.Id_Establecimiento
    WHERE h.Gestion = ${YEAR}
    GROUP BY h.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
    ORDER BY TotalCosto DESC
  `);
  est.recordset.forEach(r => console.log(` [${r.Id_Establecimiento}] ${r.Des_Establecimiento} (${r.Des_Nivel}) | Registros=${r.Registros} | Costo=${r.TotalCosto?.toFixed(2)}`));

  // 6. Monthly totals 2025
  console.log('\n=== MONTHLY TOTALS 2025 ===');
  const monthly = await pool.request().query(`
    SELECT Mes, Grupo, COUNT(*) AS Registros, SUM(Costo_Total) AS TotalCosto
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
    WHERE Gestion = ${YEAR}
    GROUP BY Mes, Grupo ORDER BY Mes, Grupo
  `);
  monthly.recordset.forEach(r => console.log(` Mes=${r.Mes} Grupo=${r.Grupo} | Registros=${r.Registros} | Costo=${r.TotalCosto?.toFixed(2)}`));

  // 7. Yearly comparison
  console.log('\n=== YEARLY TOTAL COSTO ===');
  const yoy = await pool.request().query(`
    SELECT Gestion, SUM(Costo_Total) AS TotalCosto
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
    GROUP BY Gestion ORDER BY Gestion
  `);
  yoy.recordset.forEach(r => console.log(` ${r.Gestion} | TotalCosto=${r.TotalCosto?.toFixed(2)}`));

  // 8. Check distinct values of Grupo
  console.log('\n=== DISTINCT GRUPO VALUES ===');
  const grpDistinct = await pool.request().query(`
    SELECT DISTINCT Grupo FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico ORDER BY Grupo
  `);
  grpDistinct.recordset.forEach(r => console.log(` "${r.Grupo}"`));

  // 9. Servicios route uses v_Servicio - check columns
  console.log('\n=== v_Servicio columns (if exists) ===');
  try {
    const vServ = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM BDCatalogos.INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'v_Servicio'
      ORDER BY ORDINAL_POSITION
    `);
    vServ.recordset.forEach(c => console.log(` - ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
  } catch(e) { console.log(' Error:', e.message); }

  // 10. check Tipo Servicio / Des_TipoServicio in consolidated
  console.log('\n=== TipoServicio in 2025 T group (top 10) ===');
  const tipos = await pool.request().query(`
    SELECT TOP 10 [Nombre Servicio/Suministro], Grupo, Costo_Total
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
    WHERE Gestion = ${YEAR} AND Grupo = 'T'
    ORDER BY Costo_Total DESC
  `);
  tipos.recordset.forEach(r => console.log(` "${r['Nombre Servicio/Suministro']}" | Costo=${r.Costo_Total}`));

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
