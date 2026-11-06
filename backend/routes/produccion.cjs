const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getPool } = require('../db.cjs');

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const AVAILABLE_YEARS = [2023, 2024, 2025, 2026];

// ── Precomputed cache ────────────────────────────────────────────────────────
let precomputedCache = {};
const cacheFile = path.join(__dirname, '..', 'cache_produccion.json');
function loadCache() {
  try {
    if (fs.existsSync(cacheFile)) {
      precomputedCache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      console.log('⚡ [Produccion Cache] Loaded precomputed produccion cache.');
    }
  } catch (e) {
    console.warn('⚠️ [Produccion Cache] Could not load cache:', e.message);
  }
}
loadCache();

// Helper to compute YoY
function buildYoY(baseData, prevData, availableMonths) {
  if (!prevData || !baseData) return null;
  const costoPrev = prevData.kpis?.totalCosto || 0;
  const costoAct  = baseData.kpis?.totalCosto || 0;
  if (costoPrev === 0) return null;
  const diff = costoAct - costoPrev;
  const pct  = (diff / costoPrev) * 100;
  return {
    year: baseData.year,
    prevYear: baseData.year - 1,
    costoActual: costoAct,
    costoPrevio: costoPrev,
    diferencia: diff,
    porcentaje: Number(pct.toFixed(1)),
    mesesComparados: availableMonths,
  };
}

// ── GET /api/produccion/filters ───────────────────────────────────────────────
router.get('/filters', async (req, res) => {
  try {
    let establecimientos = [];
    const cached2025 = precomputedCache[2025] || precomputedCache[2026];
    if (cached2025?.topEstablecimientos) {
      establecimientos = cached2025.topEstablecimientos.map(e => ({
        Id_Establecimiento: e.idEstablecimiento,
        Des_Establecimiento: e.nombre,
        Des_Nivel: e.nivel,
      })).sort((a, b) => a.Des_Establecimiento.localeCompare(b.Des_Establecimiento));
    }

    res.json({
      years: AVAILABLE_YEARS,
      grupos: [
        { value: 'all', label: 'Todos (S + T)' },
        { value: 'T',   label: 'T — Servicios Médicos' },
        { value: 'S',   label: 'S — Medicamentos y Suministros' },
      ],
      establecimientos,
    });
  } catch (err) {
    console.error('[Produccion /filters]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/produccion/dashboard-all ────────────────────────────────────────
router.get('/dashboard-all', async (req, res) => {
  try {
    const year  = parseInt(req.query.year, 10) || 2025;
    const mes   = req.query.mes   || 'all';
    const grupo = req.query.grupo || 'all';
    const idEst = req.query.establecimiento || 'all';

    const base = precomputedCache[year];
    if (!base) {
      return res.status(404).json({ error: `Sin datos para gestión ${year}` });
    }

    // 1. Default view: No filters
    if (mes === 'all' && grupo === 'all' && idEst === 'all') {
      const prev = precomputedCache[year - 1];
      const yoyData = buildYoY(base, prev, base.monthlyData?.length || 0);
      return res.json({
        year,
        kpis: base.kpis,
        monthlyData: base.monthlyData,
        distribucionGrupo: base.distribucionGrupo,
        distribucionNivel: base.distribucionNivel,
        topEstablecimientos: base.topEstablecimientos,
        matrizEstablecimientos: base.matrizEstablecimientos,
        yoyData,
      });
    }

    // 2. Filtered by Month only
    if (mes !== 'all' && grupo === 'all' && idEst === 'all' && base.byMonth?.[mes]) {
      const mData = base.byMonth[mes];
      return res.json({
        year,
        kpis: mData.kpis,
        monthlyData: base.monthlyData,
        distribucionGrupo: mData.distribucionGrupo,
        distribucionNivel: mData.distribucionNivel,
        topEstablecimientos: mData.topEstablecimientos,
        matrizEstablecimientos: base.matrizEstablecimientos,
        yoyData: null,
      });
    }

    // 3. Filtered by Grupo only
    if (mes === 'all' && (grupo === 'T' || grupo === 'S') && idEst === 'all' && base.byGrupo?.[grupo]) {
      const gData = base.byGrupo[grupo];
      return res.json({
        year,
        kpis: gData.kpis,
        monthlyData: gData.monthlyData,
        distribucionGrupo: gData.distribucionGrupo,
        distribucionNivel: base.distribucionNivel,
        topEstablecimientos: gData.topEstablecimientos,
        matrizEstablecimientos: gData.matrizEstablecimientos,
        yoyData: null,
      });
    }

    // 4. Custom filter combination (handled lightning-fast in JS from matrix data)
    let filteredMatrix = base.matrizEstablecimientos;
    if (idEst !== 'all') {
      const targetId = parseFloat(idEst);
      filteredMatrix = filteredMatrix.filter(e => e.idEstablecimiento === targetId);
    }

    // Compute monthly data for filtered set
    const mAgg = {};
    for (let m = 1; m <= 12; m++) {
      mAgg[m] = { mes: m, mesNombre: MONTH_NAMES[m - 1], costoTotal: 0, costoT: 0, costoS: 0, registros: 0 };
    }

    let fTotalCosto = 0;
    for (const est of filteredMatrix) {
      for (const [mStr, c] of Object.entries(est.meses || {})) {
        const m = parseInt(mStr, 10);
        if (mes === 'all' || mes === String(m)) {
          fTotalCosto += c;
          mAgg[m].costoTotal += c;
        }
      }
    }

    const filteredMonthly = Object.values(mAgg).filter(m => m.costoTotal > 0 || mes === 'all');
    const mesesConDatos = filteredMonthly.filter(m => m.costoTotal > 0).length || 1;
    const promMensual = fTotalCosto / mesesConDatos;

    let mesMayor = null;
    const monthsWithCost = filteredMonthly.filter(m => m.costoTotal > 0);
    if (monthsWithCost.length > 0) {
      const max = monthsWithCost.reduce((a, b) => b.costoTotal > a.costoTotal ? b : a);
      mesMayor = {
        mes: max.mes,
        mesNombre: max.mesNombre,
        costoTotal: max.costoTotal,
        porcentaje: fTotalCosto > 0 ? Number(((max.costoTotal / fTotalCosto) * 100).toFixed(1)) : 0,
      };
    }

    const filteredTopEst = filteredMatrix.map(e => {
      let estCost = 0;
      if (mes === 'all') {
        estCost = e.total;
      } else {
        estCost = e.meses[mes] || 0;
      }
      return {
        idEstablecimiento: e.idEstablecimiento,
        nombre: e.nombre,
        nivel: e.nivel,
        costoTotal: estCost,
        registros: 0,
        porcentaje: fTotalCosto > 0 ? Number(((estCost / fTotalCosto) * 100).toFixed(2)) : 0,
      };
    }).filter(e => e.costoTotal > 0).sort((a, b) => b.costoTotal - a.costoTotal);

    // Nivel distribution for filtered
    const nMap = {};
    for (const est of filteredTopEst) {
      const niv = est.nivel || '1ER. NIVEL';
      if (!nMap[niv]) nMap[niv] = { nivel: niv, establecimientos: 0, costoTotal: 0, registros: 0 };
      nMap[niv].establecimientos += 1;
      nMap[niv].costoTotal += est.costoTotal;
    }
    const filteredNivel = Object.values(nMap).map(n => ({
      ...n,
      porcentaje: fTotalCosto > 0 ? Number(((n.costoTotal / fTotalCosto) * 100).toFixed(2)) : 0,
    })).sort((a, b) => b.costoTotal - a.costoTotal);

    res.json({
      year,
      kpis: {
        totalCosto: fTotalCosto,
        totalRegistros: 0,
        totalCantidad: 0,
        estActivos: filteredTopEst.length,
        mesesConDatos,
        promMensual,
        mesMayor,
      },
      monthlyData: filteredMonthly,
      distribucionGrupo: base.distribucionGrupo,
      distribucionNivel: filteredNivel,
      topEstablecimientos: filteredTopEst.slice(0, 12),
      matrizEstablecimientos: filteredMatrix,
      yoyData: null,
    });
  } catch (err) {
    console.error('[Produccion /dashboard-all]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
