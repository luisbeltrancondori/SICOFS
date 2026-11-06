/**
 * generate_cache_produccion.cjs
 * Pre-computes Produccion dashboard data for all years using fast aggregation on raw movement tables
 */
const { getPool } = require('../db.cjs');
const fs = require('fs');
const path = require('path');

const YEARS = [2023, 2024, 2025, 2026];
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const OUT_FILE = path.join(__dirname, '..', 'cache_produccion.json');

async function buildYearCache(pool, year) {
  console.log(`\n📊 Processing year ${year}...`);
  const t0 = Date.now();

  const query = `
    WITH Combined AS (
      SELECT Id_Mes, Id_Establecimiento, 'T' AS Grupo, Cantidad, Costo_Total
      FROM BDDatos_${year}.dbo.t_MovSer
      WHERE Id_Paciente <> 0 AND Id_Paciente IS NOT NULL
      UNION ALL
      SELECT Id_Mes, Id_Establecimiento, 'S' AS Grupo, Dispensado AS Cantidad, Costo_Total
      FROM BDDatos_${year}.dbo.t_MovSum
      WHERE Id_Paciente <> 0 AND Id_Paciente IS NOT NULL
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
  const rows = res.recordset;
  console.log(`  Query completed in ${Date.now() - t0}ms: ${rows.length} rows`);

  // Global totals
  let totalCosto = 0;
  let totalRegistros = 0;
  let totalCantidad = 0;
  const activeEsts = new Set();
  const activeMonths = new Set();

  // Monthly aggregations
  const monthMap = {};
  const grpMap = {
    T: { grupo: 'T', label: 'Servicios Médicos', costoTotal: 0, registros: 0 },
    S: { grupo: 'S', label: 'Medicamentos/Suministros', costoTotal: 0, registros: 0 },
  };
  const matMap = {};

  for (const r of rows) {
    const c = Number(r.CostoTotal || 0);
    const reg = Number(r.Registros || 0);
    const cant = Number(r.Cantidad || 0);
    const id = r.Id_Establecimiento;
    const m = r.Mes;
    const g = r.Grupo;

    totalCosto += c;
    totalRegistros += reg;
    totalCantidad += cant;
    activeEsts.add(id);
    activeMonths.add(m);

    // Monthly
    if (!monthMap[m]) {
      monthMap[m] = {
        mes: m,
        mesNombre: MONTH_NAMES[m - 1],
        costoTotal: 0,
        costoT: 0,
        costoS: 0,
        registros: 0,
      };
    }
    monthMap[m].costoTotal += c;
    monthMap[m].registros += reg;
    if (g === 'T') monthMap[m].costoT += c;
    if (g === 'S') monthMap[m].costoS += c;

    // Grupo
    if (grpMap[g]) {
      grpMap[g].costoTotal += c;
      grpMap[g].registros += reg;
    }

    // Matrix & Establishment
    if (!matMap[id]) {
      matMap[id] = {
        idEstablecimiento: id,
        nombre: (r.nombre || '').trim(),
        nivel: (r.nivel || '').trim(),
        costoTotal: 0,
        registros: 0,
        cantidad: 0,
        costoT: 0,
        costoS: 0,
        meses: {},
        mesesT: {},
        mesesS: {},
        mesesReg: {},
      };
    }
    matMap[id].costoTotal += c;
    matMap[id].registros += reg;
    matMap[id].cantidad += cant;
    if (g === 'T') matMap[id].costoT += c;
    if (g === 'S') matMap[id].costoS += c;

    matMap[id].meses[m] = (matMap[id].meses[m] || 0) + c;
    matMap[id].mesesReg[m] = (matMap[id].mesesReg[m] || 0) + reg;
    if (g === 'T') matMap[id].mesesT[m] = (matMap[id].mesesT[m] || 0) + c;
    if (g === 'S') matMap[id].mesesS[m] = (matMap[id].mesesS[m] || 0) + c;
  }

  const monthlyData = Object.values(monthMap).sort((a, b) => a.mes - b.mes);
  const mesesConDatos = activeMonths.size || 1;
  const promMensual = totalCosto / mesesConDatos;

  let mesMayor = null;
  if (monthlyData.length > 0) {
    const max = monthlyData.reduce((a, b) => (b.costoTotal > a.costoTotal ? b : a));
    mesMayor = {
      mes: max.mes,
      mesNombre: max.mesNombre,
      costoTotal: max.costoTotal,
      porcentaje: totalCosto > 0 ? Number(((max.costoTotal / totalCosto) * 100).toFixed(1)) : 0,
    };
  }

  const distribucionGrupo = Object.values(grpMap).map(g => ({
    ...g,
    porcentaje: totalCosto > 0 ? Number(((g.costoTotal / totalCosto) * 100).toFixed(2)) : 0,
  }));

  const allEstablecimientos = Object.values(matMap).map(e => ({
    idEstablecimiento: e.idEstablecimiento,
    nombre: e.nombre,
    nivel: e.nivel,
    costoTotal: e.costoTotal,
    costoT: e.costoT,
    costoS: e.costoS,
    registros: e.registros,
    cantidad: e.cantidad,
    porcentaje: totalCosto > 0 ? Number(((e.costoTotal / totalCosto) * 100).toFixed(2)) : 0,
  })).sort((a, b) => b.costoTotal - a.costoTotal);

  const topEstablecimientos = allEstablecimientos.slice(0, 12);

  const matrizEstablecimientos = Object.values(matMap).map(e => ({
    idEstablecimiento: e.idEstablecimiento,
    nombre: e.nombre,
    nivel: e.nivel,
    meses: e.meses,
    total: e.costoTotal,
  })).sort((a, b) => b.total - a.total);

  // Nivel distribution
  const nivelMap = {};
  for (const est of allEstablecimientos) {
    const niv = est.nivel || '1ER. NIVEL';
    if (!nivelMap[niv]) {
      nivelMap[niv] = { nivel: niv, establecimientos: 0, costoTotal: 0, registros: 0 };
    }
    nivelMap[niv].establecimientos += 1;
    nivelMap[niv].costoTotal += est.costoTotal;
    nivelMap[niv].registros += est.registros;
  }
  const distribucionNivel = Object.values(nivelMap).map(n => ({
    ...n,
    porcentaje: totalCosto > 0 ? Number(((n.costoTotal / totalCosto) * 100).toFixed(2)) : 0,
  })).sort((a, b) => b.costoTotal - a.costoTotal);

  // Precomputed byMonth
  const byMonth = {};
  for (const mObj of monthlyData) {
    const m = mObj.mes;
    const mTotalCosto = mObj.costoTotal;
    const mTotalReg = mObj.registros;

    const mEsts = Object.values(matMap).map(e => {
      const c = e.meses[m] || 0;
      const r = e.mesesReg[m] || 0;
      return {
        idEstablecimiento: e.idEstablecimiento,
        nombre: e.nombre,
        nivel: e.nivel,
        costoTotal: c,
        registros: r,
        porcentaje: mTotalCosto > 0 ? Number(((c / mTotalCosto) * 100).toFixed(2)) : 0,
      };
    }).filter(e => e.costoTotal > 0).sort((a, b) => b.costoTotal - a.costoTotal);

    const mNivelMap = {};
    for (const est of mEsts) {
      const niv = est.nivel || '1ER. NIVEL';
      if (!mNivelMap[niv]) mNivelMap[niv] = { nivel: niv, establecimientos: 0, costoTotal: 0, registros: 0 };
      mNivelMap[niv].establecimientos += 1;
      mNivelMap[niv].costoTotal += est.costoTotal;
      mNivelMap[niv].registros += est.registros;
    }
    const mDistribucionNivel = Object.values(mNivelMap).map(n => ({
      ...n,
      porcentaje: mTotalCosto > 0 ? Number(((n.costoTotal / mTotalCosto) * 100).toFixed(2)) : 0,
    })).sort((a, b) => b.costoTotal - a.costoTotal);

    const mGrupos = [];
    if (mObj.costoT > 0) {
      mGrupos.push({
        grupo: 'T',
        label: 'Servicios Médicos',
        costoTotal: mObj.costoT,
        porcentaje: mTotalCosto > 0 ? Number(((mObj.costoT / mTotalCosto) * 100).toFixed(2)) : 0,
      });
    }
    if (mObj.costoS > 0) {
      mGrupos.push({
        grupo: 'S',
        label: 'Medicamentos/Suministros',
        costoTotal: mObj.costoS,
        porcentaje: mTotalCosto > 0 ? Number(((mObj.costoS / mTotalCosto) * 100).toFixed(2)) : 0,
      });
    }

    byMonth[m] = {
      kpis: {
        totalCosto: mTotalCosto,
        totalRegistros: mTotalReg,
        totalCantidad: 0,
        estActivos: mEsts.length,
        mesesConDatos: 1,
        promMensual: mTotalCosto,
        mesMayor: { mes: m, mesNombre: mObj.mesNombre, costoTotal: mTotalCosto, porcentaje: 100 },
      },
      topEstablecimientos: mEsts.slice(0, 12),
      distribucionNivel: mDistribucionNivel,
      distribucionGrupo: mGrupos,
    };
  }

  // Precomputed byGrupo
  const byGrupo = {
    T: {
      kpis: {
        totalCosto: grpMap.T.costoTotal,
        totalRegistros: grpMap.T.registros,
        totalCantidad: 0,
        estActivos: allEstablecimientos.filter(e => e.costoT > 0).length,
        mesesConDatos,
        promMensual: grpMap.T.costoTotal / mesesConDatos,
        mesMayor: null,
      },
      monthlyData: monthlyData.map(m => ({
        mes: m.mes,
        mesNombre: m.mesNombre,
        costoTotal: m.costoT,
        costoT: m.costoT,
        costoS: 0,
        registros: 0,
      })),
      topEstablecimientos: allEstablecimientos.map(e => ({
        idEstablecimiento: e.idEstablecimiento,
        nombre: e.nombre,
        nivel: e.nivel,
        costoTotal: e.costoT,
        registros: 0,
        porcentaje: grpMap.T.costoTotal > 0 ? Number(((e.costoT / grpMap.T.costoTotal) * 100).toFixed(2)) : 0,
      })).filter(e => e.costoTotal > 0).sort((a, b) => b.costoTotal - a.costoTotal).slice(0, 12),
      distribucionGrupo: [{ grupo: 'T', label: 'Servicios Médicos', costoTotal: grpMap.T.costoTotal, porcentaje: 100 }],
      matrizEstablecimientos: Object.values(matMap).map(e => ({
        idEstablecimiento: e.idEstablecimiento,
        nombre: e.nombre,
        nivel: e.nivel,
        meses: e.mesesT,
        total: e.costoT,
      })).filter(e => e.total > 0).sort((a, b) => b.total - a.total),
    },
    S: {
      kpis: {
        totalCosto: grpMap.S.costoTotal,
        totalRegistros: grpMap.S.registros,
        totalCantidad: 0,
        estActivos: allEstablecimientos.filter(e => e.costoS > 0).length,
        mesesConDatos,
        promMensual: grpMap.S.costoTotal / mesesConDatos,
        mesMayor: null,
      },
      monthlyData: monthlyData.map(m => ({
        mes: m.mes,
        mesNombre: m.mesNombre,
        costoTotal: m.costoS,
        costoT: 0,
        costoS: m.costoS,
        registros: 0,
      })),
      topEstablecimientos: allEstablecimientos.map(e => ({
        idEstablecimiento: e.idEstablecimiento,
        nombre: e.nombre,
        nivel: e.nivel,
        costoTotal: e.costoS,
        registros: 0,
        porcentaje: grpMap.S.costoTotal > 0 ? Number(((e.costoS / grpMap.S.costoTotal) * 100).toFixed(2)) : 0,
      })).filter(e => e.costoTotal > 0).sort((a, b) => b.costoTotal - a.costoTotal).slice(0, 12),
      distribucionGrupo: [{ grupo: 'S', label: 'Medicamentos/Suministros', costoTotal: grpMap.S.costoTotal, porcentaje: 100 }],
      matrizEstablecimientos: Object.values(matMap).map(e => ({
        idEstablecimiento: e.idEstablecimiento,
        nombre: e.nombre,
        nivel: e.nivel,
        meses: e.mesesS,
        total: e.costoS,
      })).filter(e => e.total > 0).sort((a, b) => b.total - a.total),
    },
  };

  const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  🎉 Year ${year} cached in ${totalSec}s: Bs. ${totalCosto.toFixed(2)} | Reg: ${totalRegistros}`);

  return {
    year,
    rawEstablecimientos: allEstablecimientos.map(e => ({ id: e.idEstablecimiento, nombre: e.nombre, nivel: e.nivel, meses: matMap[e.idEstablecimiento].meses })),
    kpis: {
      totalCosto,
      totalRegistros,
      totalCantidad,
      estActivos: activeEsts.size,
      mesesConDatos,
      promMensual,
      mesMayor,
    },
    monthlyData,
    distribucionGrupo,
    distribucionNivel,
    topEstablecimientos,
    matrizEstablecimientos,
    byMonth,
    byGrupo,
  };
}

async function main() {
  console.log('🚀 Generating Produccion cache from movement tables...');
  const pool = await getPool();
  const cache = {};

  for (const year of YEARS) {
    try {
      cache[year] = await buildYearCache(pool, year);
    } catch (e) {
      console.error(`❌ Error for year ${year}:`, e.message);
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(cache, null, 2), 'utf8');
  const sizeKB = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`\n✅ Finished! Cache written to ${OUT_FILE} (${sizeKB} KB)`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
