const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../db.cjs');

const CATALOG = {
  700352: { nombre: 'NARANJAL DON BOSCO', nivel: '1ER. NIVEL' },
  700353: { nombre: 'CENTRO DE SALUD DR. VICTOR HUGO CASSAL BARBA', nivel: '1ER. NIVEL' },
  700357: { nombre: 'DIVINO NIÑO', nivel: '1ER. NIVEL' },
  700358: { nombre: 'HOSPITAL RENE BALDERAS', nivel: '2DO. NIVEL' },
  700359: { nombre: 'HOSPITAL ALFONSO GUMUCIO', nivel: '2DO. NIVEL' },
  700361: { nombre: 'JUANA AZURDUY DE PADILLA', nivel: '1ER. NIVEL' },
  700559: { nombre: 'NAICO', nivel: '1ER. NIVEL' },
  700560: { nombre: 'VILLA COPACABANA', nivel: '1ER. NIVEL' },
  700590: { nombre: 'ERNESTO CHE GUEVARA', nivel: '1ER. NIVEL' },
  700591: { nombre: 'LA SAGRADA FAMILIA', nivel: '1ER. NIVEL' },
  700838: { nombre: 'SAN MARTIN DE PORREZ', nivel: '1ER. NIVEL' },
  700849: { nombre: 'CENTRO DE REHABILITACIÓN Y HABILITACIÓN BIOPSICOSOCIAL', nivel: '1ER. NIVEL' },
};

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

async function buildCacheForYear(pool, year) {
  console.log(`Starting cache build for year ${year}...`);
  const db = `BDDatos_${year}`;

  // 1. Monthly evolution: unique patients in each month
  console.time(`Year ${year} monthly`);
  const monthlyRes = await pool.request().query(`
    SELECT h.Id_Mes AS Mes,
           COUNT(DISTINCT CAST(h.Id_Establecimiento AS VARCHAR(10)) + '-' + CAST(h.Id_Paciente AS VARCHAR(10))) AS Pacientes,
           COUNT(*) AS Atenciones
    FROM (
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSer
      UNION ALL
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSum
    ) h
    GROUP BY h.Id_Mes
    ORDER BY h.Id_Mes
  `);
  console.timeEnd(`Year ${year} monthly`);

  // 2. Year total unique patients and atenciones across establishments
  console.time(`Year ${year} kpis`);
  const kpiRes = await pool.request().query(`
    SELECT COUNT(DISTINCT CAST(h.Id_Establecimiento AS VARCHAR(10)) + '-' + CAST(h.Id_Paciente AS VARCHAR(10))) AS TotalPacientes,
           COUNT(*) AS TotalAtenciones,
           COUNT(DISTINCT h.Id_Mes) AS MesesConDatos
    FROM (
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSer
      UNION ALL
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSum
    ) h
  `);
  console.timeEnd(`Year ${year} kpis`);

  // 3. Top establishments for the year
  console.time(`Year ${year} top establishments`);
  const topRes = await pool.request().query(`
    SELECT h.Id_Establecimiento,
           COUNT(DISTINCT h.Id_Paciente) AS pacientes,
           COUNT(*) AS atenciones
    FROM (
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSer
      UNION ALL
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSum
    ) h
    GROUP BY h.Id_Establecimiento
    ORDER BY pacientes DESC
  `);
  console.timeEnd(`Year ${year} top establishments`);

  // 4. Gender distribution for the year (scoped by establishment + patient)
  console.time(`Year ${year} gender`);
  const genderRes = await pool.request().query(`
    SELECT CASE WHEN p.Id_Sexo = 1 THEN 'M' ELSE 'F' END AS Sexo,
           COUNT(DISTINCT CAST(h.Id_Establecimiento AS VARCHAR(10)) + '-' + CAST(h.Id_Paciente AS VARCHAR(10))) AS pacientes
    FROM (
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSer
      UNION ALL
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSum
    ) h
    LEFT JOIN ${db}.dbo.t_Paciente p
      ON h.Id_Ano = p.Id_Ano 
      AND h.Id_Mes = p.Id_Mes 
      AND h.Id_Establecimiento = p.Id_Establecimiento 
      AND h.Id_Paciente = p.Id_Paciente
    GROUP BY CASE WHEN p.Id_Sexo = 1 THEN 'M' ELSE 'F' END
  `);
  console.timeEnd(`Year ${year} gender`);

  // 5. Per-month details (top establishments and gender by month)
  console.time(`Year ${year} monthly details`);
  const monthlyTopRes = await pool.request().query(`
    SELECT h.Id_Mes, h.Id_Establecimiento,
           COUNT(DISTINCT h.Id_Paciente) AS pacientes,
           COUNT(*) AS atenciones
    FROM (
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSer
      UNION ALL
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSum
    ) h
    GROUP BY h.Id_Mes, h.Id_Establecimiento
  `);

  const monthlyGenderRes = await pool.request().query(`
    SELECT h.Id_Mes,
           CASE WHEN p.Id_Sexo = 1 THEN 'M' ELSE 'F' END AS Sexo,
           COUNT(DISTINCT CAST(h.Id_Establecimiento AS VARCHAR(10)) + '-' + CAST(h.Id_Paciente AS VARCHAR(10))) AS pacientes
    FROM (
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSer
      UNION ALL
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente FROM ${db}.dbo.t_MovSum
    ) h
    LEFT JOIN ${db}.dbo.t_Paciente p
      ON h.Id_Ano = p.Id_Ano 
      AND h.Id_Mes = p.Id_Mes 
      AND h.Id_Establecimiento = p.Id_Establecimiento 
      AND h.Id_Paciente = p.Id_Paciente
    GROUP BY h.Id_Mes, CASE WHEN p.Id_Sexo = 1 THEN 'M' ELSE 'F' END
  `);
  console.timeEnd(`Year ${year} monthly details`);

  // 6. Establishment monthly details & costs
  console.time(`Year ${year} facility details`);
  const facDetailRes = await pool.request().query(`
    SELECT h.Id_Establecimiento, h.Id_Mes AS Mes,
           COUNT(DISTINCT h.Id_Paciente) AS pacientes,
           COUNT(*) AS atenciones,
           SUM(h.Costo_Total) AS costoTotal
    FROM (
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total FROM ${db}.dbo.t_MovSer
      UNION ALL
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total FROM ${db}.dbo.t_MovSum
    ) h
    GROUP BY h.Id_Establecimiento, h.Id_Mes
    ORDER BY h.Id_Establecimiento, h.Id_Mes
  `);
  console.timeEnd(`Year ${year} facility details`);

  // Build the structured cache object
  const monthlyData = monthlyRes.recordset.map(r => ({
    mes: r.Mes,
    mesNombre: MONTH_NAMES[r.Mes - 1] || `M${r.Mes}`,
    pacientes: r.Pacientes,
    atenciones: r.Atenciones,
  }));

  const kpiRow = kpiRes.recordset[0] || {};
  const totalPacientesVal = kpiRow.TotalPacientes || 0;
  const meses = kpiRow.MesesConDatos || (monthlyData.length || 1);

  const topEstablecimientos = topRes.recordset.map(r => ({
    Id_Establecimiento: r.Id_Establecimiento,
    nombre: CATALOG[r.Id_Establecimiento]?.nombre || `Establecimiento ${r.Id_Establecimiento}`,
    nivel: CATALOG[r.Id_Establecimiento]?.nivel || '1ER. NIVEL',
    pacientes: r.pacientes,
    atenciones: r.atenciones,
  }));

  // Ensure gender breakdown aligns nicely with total
  let genderData = genderRes.recordset.map(r => ({
    Sexo: r.Sexo,
    pacientes: r.pacientes,
  }));

  // Structure per month
  const byMonth = {};
  for (let m = 1; m <= 12; m++) {
    const monthKpiItem = monthlyData.find(d => d.mes === m);
    if (!monthKpiItem) continue;

    const monthTop = monthlyTopRes.recordset
      .filter(r => r.Id_Mes === m)
      .sort((a, b) => b.pacientes - a.pacientes)
      .slice(0, 10)
      .map(r => ({
        Id_Establecimiento: r.Id_Establecimiento,
        nombre: CATALOG[r.Id_Establecimiento]?.nombre || `Establecimiento ${r.Id_Establecimiento}`,
        nivel: CATALOG[r.Id_Establecimiento]?.nivel || '1ER. NIVEL',
        pacientes: r.pacientes,
        atenciones: r.atenciones,
      }));

    const monthGender = monthlyGenderRes.recordset
      .filter(r => r.Id_Mes === m)
      .map(r => ({
        Sexo: r.Sexo,
        pacientes: r.pacientes,
      }));

    byMonth[m] = {
      kpis: {
        totalPacientes: monthKpiItem.pacientes,
        totalAtenciones: monthKpiItem.atenciones,
        promedioPacientesMes: monthKpiItem.pacientes,
        mesesConDatos: 1,
      },
      topEstablecimientos: monthTop,
      genderData: monthGender,
    };
  }

  // Structure per establishment
  const byFacility = {};
  for (const estId of Object.keys(CATALOG)) {
    const id = parseInt(estId);
    const details = facDetailRes.recordset
      .filter(r => r.Id_Establecimiento === id)
      .map(r => ({
        mes: r.Mes,
        mesNombre: MONTH_NAMES[r.Mes - 1] || `M${r.Mes}`,
        pacientes: r.pacientes,
        atenciones: r.atenciones,
        costoTotal: r.costoTotal || 0,
      }));

    byFacility[id] = {
      monthlyDetail: details,
    };
  }

  return {
    kpis: {
      totalPacientes: totalPacientesVal,
      totalAtenciones: kpiRow.TotalAtenciones || 0,
      promedioPacientesMes: Math.round(totalPacientesVal / meses),
      mesesConDatos: meses,
    },
    monthlyData,
    topEstablecimientos,
    genderData,
    byMonth,
    byFacility,
    establecimientosFiltro: topEstablecimientos.map(e => ({
      Id_Establecimiento: e.Id_Establecimiento,
      Des_Establecimiento: e.nombre,
      Pacientes: e.pacientes,
    })),
  };
}

async function main() {
  const pool = await getPool();
  const allCache = {};

  for (const year of [2026, 2025, 2024, 2023]) {
    try {
      allCache[year] = await buildCacheForYear(pool, year);
      console.log(`✅ Year ${year} completed successfully. Total: ${allCache[year].kpis.totalPacientes}`);
    } catch (e) {
      console.error(`❌ Year ${year} error:`, e.message);
    }
  }

  const outPath = path.join(__dirname, '..', 'cache_dashboard.json');
  fs.writeFileSync(outPath, JSON.stringify(allCache, null, 2), 'utf-8');
  console.log(`💾 Cache saved to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);

  await pool.close();
}

main().catch(console.error);
