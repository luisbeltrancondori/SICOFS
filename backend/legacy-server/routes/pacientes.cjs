const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../db.cjs');

// Establishment Catalog for Montero
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

// Load precomputed cache if available
let precomputedCache = {};
const cacheFilePath = path.join(__dirname, '..', 'cache_dashboard.json');

function reloadPrecomputedCache() {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const raw = fs.readFileSync(cacheFilePath, 'utf-8');
      precomputedCache = JSON.parse(raw);
      console.log('⚡ [Cache] Loaded precomputed dashboard data successfully.');
    }
  } catch (err) {
    console.warn('⚠️ [Cache] Could not load precomputed cache:', err.message);
  }
}
reloadPrecomputedCache();

// Runtime in-memory cache for dynamic combinations
const dynamicCache = new Map();

function getCacheKey(prefix, params) {
  return `${prefix}:${JSON.stringify(params)}`;
}

// Helper to query live SQL Server when not in cache
async function queryLiveDashboard(year, mes, sexo, idEst) {
  const pool = await getPool();
  const db = `BDDatos_${year}`;
  const req = pool.request();
  const whereConditions = [];

  if (mes && mes !== 'all') {
    req.input('Mes', sql.Int, parseInt(mes));
    whereConditions.push('h.Id_Mes = @Mes');
  }
  if (idEst && idEst !== 'all') {
    req.input('IdEst', sql.Int, parseInt(idEst));
    whereConditions.push('h.Id_Establecimiento = @IdEst');
  }

  const joinSex = (sexo && sexo !== 'all');
  if (joinSex) {
    req.input('Sexo', sql.Int, sexo === 'M' ? 1 : 2);
    whereConditions.push('p.Id_Sexo = @Sexo');
  }

  const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const baseTable = `
    (
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total FROM ${db}.dbo.t_MovSer
      UNION ALL
      SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total FROM ${db}.dbo.t_MovSum
    ) h
    ${joinSex ? `
      INNER JOIN ${db}.dbo.t_Paciente p
        ON h.Id_Ano = p.Id_Ano 
        AND h.Id_Mes = p.Id_Mes 
        AND h.Id_Establecimiento = p.Id_Establecimiento 
        AND h.Id_Paciente = p.Id_Paciente
    ` : ''}
  `;

  const kpisQ = `
    SELECT
      COUNT(DISTINCT CAST(h.Id_Establecimiento AS VARCHAR(10)) + '-' + CAST(h.Id_Paciente AS VARCHAR(10))) AS TotalPacientes,
      COUNT(*) AS TotalAtenciones,
      COUNT(DISTINCT h.Id_Mes) AS MesesConDatos
    FROM ${baseTable}
    ${whereSql}
  `;

  const evoQ = `
    SELECT h.Id_Mes AS Mes,
           COUNT(DISTINCT CAST(h.Id_Establecimiento AS VARCHAR(10)) + '-' + CAST(h.Id_Paciente AS VARCHAR(10))) AS Pacientes,
           COUNT(*) AS Atenciones
    FROM ${baseTable}
    ${whereSql}
    GROUP BY h.Id_Mes
    ORDER BY h.Id_Mes
  `;

  const topQ = `
    SELECT TOP 10
           h.Id_Establecimiento,
           COUNT(DISTINCT h.Id_Paciente) AS pacientes,
           COUNT(*) AS atenciones
    FROM ${baseTable}
    ${whereSql}
    GROUP BY h.Id_Establecimiento
    ORDER BY pacientes DESC
  `;

  const sexoQ = `
    SELECT
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
    ${whereSql}
    GROUP BY CASE WHEN p.Id_Sexo = 1 THEN 'M' ELSE 'F' END
  `;

  const [kpisRes, evoRes, topRes, sexoRes] = [
    await req.query(kpisQ),
    await req.query(evoQ),
    await req.query(topQ),
    await req.query(sexoQ),
  ];

  const kpiRow = kpisRes.recordset[0] || {};
  const meses = kpiRow.MesesConDatos || 1;

  const monthly = evoRes.recordset.map(r => ({
    mes: r.Mes,
    mesNombre: MONTH_NAMES[r.Mes - 1] || `M${r.Mes}`,
    pacientes: r.Pacientes,
    atenciones: r.Atenciones,
  }));

  const top = topRes.recordset.map(r => ({
    Id_Establecimiento: r.Id_Establecimiento,
    nombre: CATALOG[r.Id_Establecimiento]?.nombre || `Establecimiento ${r.Id_Establecimiento}`,
    nivel: CATALOG[r.Id_Establecimiento]?.nivel || '1ER. NIVEL',
    pacientes: r.pacientes,
    atenciones: r.atenciones,
  }));

  const gender = sexoRes.recordset.map(r => ({
    Sexo: r.Sexo,
    pacientes: r.pacientes,
  }));

  return {
    kpis: {
      totalPacientes: kpiRow.TotalPacientes || 0,
      totalAtenciones: kpiRow.TotalAtenciones || 0,
      promedioPacientesMes: Math.round((kpiRow.TotalPacientes || 0) / meses),
      mesesConDatos: meses,
    },
    monthlyData: monthly,
    topEstablecimientos: top,
    genderData: gender,
  };
}

// GET /api/filters/years
router.get('/filters/years', (req, res) => {
  res.json({ years: [2023, 2024, 2025, 2026] });
});

// GET /api/filters/establecimientos?year=2025
router.get('/filters/establecimientos', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
    if (precomputedCache[year]?.establecimientosFiltro) {
      return res.json(precomputedCache[year].establecimientosFiltro);
    }

    const defaultList = Object.entries(CATALOG).map(([id, info]) => ({
      Id_Establecimiento: parseInt(id),
      Des_Establecimiento: info.nombre,
      Pacientes: 0,
    }));
    res.json(defaultList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard-all?year=2025&mes=all&sexo=all&id_establecimiento=all
router.get('/dashboard-all', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
    const mes = req.query.mes || 'all';
    const sexo = req.query.sexo || 'all';
    const idEst = req.query.id_establecimiento || 'all';

    // 1. Check precomputed cache for default view (mes=all, sexo=all, idEst=all)
    if (mes === 'all' && sexo === 'all' && idEst === 'all' && precomputedCache[year]) {
      return res.json({
        kpis: precomputedCache[year].kpis,
        monthlyData: precomputedCache[year].monthlyData,
        topEstablecimientos: precomputedCache[year].topEstablecimientos,
        genderData: precomputedCache[year].genderData,
      });
    }

    // 2. Check precomputed cache when only month is selected (sexo=all, idEst=all)
    if (mes !== 'all' && sexo === 'all' && idEst === 'all' && precomputedCache[year]?.byMonth?.[mes]) {
      const mData = precomputedCache[year].byMonth[mes];
      return res.json({
        kpis: mData.kpis,
        monthlyData: precomputedCache[year].monthlyData,
        topEstablecimientos: mData.topEstablecimientos,
        genderData: mData.genderData,
      });
    }

    // 3. Check dynamic in-memory cache
    const cacheKey = getCacheKey('all', { year, mes, sexo, idEst });
    if (dynamicCache.has(cacheKey)) {
      return res.json(dynamicCache.get(cacheKey));
    }

    // 4. Live query
    const data = await queryLiveDashboard(year, mes, sexo, idEst);
    dynamicCache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('Error /dashboard-all:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kpis?year=2025&mes=&sexo=&id_establecimiento=
router.get('/kpis', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
    const mes = req.query.mes || 'all';
    const sexo = req.query.sexo || 'all';
    const idEst = req.query.id_establecimiento || 'all';

    if (mes === 'all' && sexo === 'all' && idEst === 'all' && precomputedCache[year]) {
      return res.json(precomputedCache[year].kpis);
    }
    if (mes !== 'all' && sexo === 'all' && idEst === 'all' && precomputedCache[year]?.byMonth?.[mes]) {
      return res.json(precomputedCache[year].byMonth[mes].kpis);
    }

    const cacheKey = getCacheKey('kpis', { year, mes, sexo, idEst });
    if (dynamicCache.has(cacheKey)) return res.json(dynamicCache.get(cacheKey));

    const data = await queryLiveDashboard(year, mes, sexo, idEst);
    dynamicCache.set(cacheKey, data.kpis);
    res.json(data.kpis);
  } catch (err) {
    console.error('Error /kpis:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/evolucion-mensual?year=2025&sexo=&id_establecimiento=
router.get('/evolucion-mensual', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
    const sexo = req.query.sexo || 'all';
    const idEst = req.query.id_establecimiento || 'all';

    if (sexo === 'all' && idEst === 'all' && precomputedCache[year]) {
      return res.json(precomputedCache[year].monthlyData);
    }

    const cacheKey = getCacheKey('evo', { year, sexo, idEst });
    if (dynamicCache.has(cacheKey)) return res.json(dynamicCache.get(cacheKey));

    const data = await queryLiveDashboard(year, 'all', sexo, idEst);
    dynamicCache.set(cacheKey, data.monthlyData);
    res.json(data.monthlyData);
  } catch (err) {
    console.error('Error /evolucion-mensual:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/top-establecimientos?year=2025&mes=&sexo=&limit=10
router.get('/top-establecimientos', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
    const mes = req.query.mes || 'all';
    const sexo = req.query.sexo || 'all';
    const idEst = req.query.id_establecimiento || 'all';

    if (mes === 'all' && sexo === 'all' && idEst === 'all' && precomputedCache[year]) {
      return res.json(precomputedCache[year].topEstablecimientos);
    }
    if (mes !== 'all' && sexo === 'all' && idEst === 'all' && precomputedCache[year]?.byMonth?.[mes]) {
      return res.json(precomputedCache[year].byMonth[mes].topEstablecimientos);
    }

    const cacheKey = getCacheKey('top', { year, mes, sexo, idEst });
    if (dynamicCache.has(cacheKey)) return res.json(dynamicCache.get(cacheKey));

    const data = await queryLiveDashboard(year, mes, sexo, idEst);
    dynamicCache.set(cacheKey, data.topEstablecimientos);
    res.json(data.topEstablecimientos);
  } catch (err) {
    console.error('Error /top-establecimientos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/distribucion-sexo?year=2025&mes=&id_establecimiento=
router.get('/distribucion-sexo', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
    const mes = req.query.mes || 'all';
    const idEst = req.query.id_establecimiento || 'all';

    if (mes === 'all' && idEst === 'all' && precomputedCache[year]) {
      return res.json(precomputedCache[year].genderData);
    }
    if (mes !== 'all' && idEst === 'all' && precomputedCache[year]?.byMonth?.[mes]) {
      return res.json(precomputedCache[year].byMonth[mes].genderData);
    }

    const cacheKey = getCacheKey('sexo', { year, mes, idEst });
    if (dynamicCache.has(cacheKey)) return res.json(dynamicCache.get(cacheKey));

    const data = await queryLiveDashboard(year, mes, 'all', idEst);
    dynamicCache.set(cacheKey, data.genderData);
    res.json(data.genderData);
  } catch (err) {
    console.error('Error /distribucion-sexo:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/detalle-establecimiento?year=2025&id_establecimiento=700359
router.get('/detalle-establecimiento', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
    const idEst = parseInt(req.query.id_establecimiento);
    if (!idEst) return res.status(400).json({ error: 'id_establecimiento requerido' });

    if (precomputedCache[year]?.byFacility?.[idEst]?.monthlyDetail) {
      return res.json(precomputedCache[year].byFacility[idEst].monthlyDetail);
    }

    const pool = await getPool();
    const db = `BDDatos_${year}`;
    const result = await pool.request()
      .input('IdEst', sql.Int, idEst)
      .query(`
        SELECT h.Id_Mes AS Mes,
               COUNT(DISTINCT h.Id_Paciente) AS pacientes,
               COUNT(*) AS atenciones,
               SUM(h.Costo_Total) AS costoTotal
        FROM (
          SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total FROM ${db}.dbo.t_MovSer
          UNION ALL
          SELECT Id_Ano, Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total FROM ${db}.dbo.t_MovSum
        ) h
        WHERE h.Id_Establecimiento = @IdEst
        GROUP BY h.Id_Mes
        ORDER BY h.Id_Mes
      `);

    const data = result.recordset.map(r => ({
      mes: r.Mes,
      mesNombre: MONTH_NAMES[r.Mes - 1] || `M${r.Mes}`,
      pacientes: r.pacientes,
      atenciones: r.atenciones,
      costoTotal: r.costoTotal || 0,
    }));

    res.json(data);
  } catch (err) {
    console.error('Error /detalle-establecimiento:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.reloadPrecomputedCache = reloadPrecomputedCache;
