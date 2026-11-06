const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../db.cjs');

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CACHE_SCHEMA_VERSION = 2;

// Load precomputed cache
let precomputedCache = {};
const cacheFile = path.join(__dirname, '..', 'cache_medicamentos.json');
try {
  if (fs.existsSync(cacheFile)) {
    precomputedCache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    console.log('⚡ [Medicamentos Cache] Loaded precomputed medicamentos cache.');
  }
} catch (e) {
  console.warn('⚠️ No se pudo cargar cache_medicamentos.json:', e.message);
}

// In-memory LRU-like cache for dynamic queries
const dynamicCache = new Map();
const MAX_DYNAMIC_ENTRIES = 100;

function parseMedicineName(desSuministro) {
  if (!desSuministro) return { nombre: 'Desconocido', forma: '—', concentracion: '—' };
  const parts = desSuministro.split(',').map((p) => p.trim());
  return {
    nombre: parts[0] || desSuministro,
    forma: parts[1] || '—',
    concentracion: parts.slice(2).join(', ') || '—',
  };
}

async function getFilteredMedicineRankings(pool, { year, mes, tipo, idEst, medSearch }) {
  const db = `BDDatos_${year}`;
  const request = pool.request();
  const movementConditions = ['ms.Id_Suministro > 0'];
  const productConditions = [];

  if (mes !== 'all') {
    request.input('Mes', sql.Int, parseInt(mes, 10));
    movementConditions.push('ms.Id_Mes = @Mes');
  }
  if (idEst !== 'all') {
    request.input('IdEst', sql.Int, idEst);
    movementConditions.push('ms.Id_Establecimiento = @IdEst');
  }

  if (tipo !== 'all' && tipo !== 'Todas') {
    request.input('TipoSuministro', sql.NVarChar, tipo);
    productConditions.push('ts_filter.Des_TipoSuministro = @TipoSuministro');
  }

  if (medSearch) {
    request.input('MedSearch', sql.NVarChar, `%${medSearch}%`);
    productConditions.push('s_filter.Des_Suministro LIKE @MedSearch');
  }

  const rankingRes = await request.query(`
    WITH MovementAgg AS (
      SELECT
        ms.Id_Suministro,
        ms.Id_Establecimiento,
        ms.Id_Ano,
        ms.Id_Mes,
        SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
        SUM(ms.Costo_Total) AS CostoTotal,
        COUNT(DISTINCT ms.Id_Salida) AS Recetas
      FROM ${db}.dbo.t_MovSum ms
      WHERE ${movementConditions.join(' AND ')}
      GROUP BY ms.Id_Suministro, ms.Id_Establecimiento, ms.Id_Ano, ms.Id_Mes
    ),
    Agg AS (
      SELECT
        MIN(a.Id_Suministro) AS Id_Suministro,
        ISNULL(s_filter.Des_Suministro, 'Suministro ' + CAST(a.Id_Suministro AS VARCHAR)) AS Des_Suministro,
        ISNULL(ts_filter.Des_TipoSuministro, 'General') AS TipoSuministro,
        SUM(a.Cantidad) AS Cantidad,
        SUM(a.CostoTotal) AS CostoTotal,
        SUM(a.Recetas) AS Recetas
      FROM MovementAgg a
      LEFT JOIN ${db}.dbo.t_Suministro s_filter
        ON s_filter.Id_Suministro = a.Id_Suministro
        AND s_filter.Id_Establecimiento = a.Id_Establecimiento
        AND s_filter.Id_Ano = a.Id_Ano
        AND s_filter.Id_Mes = a.Id_Mes
      LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts_filter
        ON s_filter.Id_TipoSuministro = ts_filter.Id_TipoSuministro
      ${productConditions.length ? `WHERE ${productConditions.join(' AND ')}` : ''}
      GROUP BY
        ISNULL(s_filter.Des_Suministro, 'Suministro ' + CAST(a.Id_Suministro AS VARCHAR)),
        ISNULL(ts_filter.Des_TipoSuministro, 'General')
    ),
    Ranked AS (
      SELECT
        *,
        ROW_NUMBER() OVER (ORDER BY CostoTotal DESC, Id_Suministro) AS RankingCosto,
        ROW_NUMBER() OVER (ORDER BY Cantidad DESC, Id_Suministro) AS RankingCantidad,
        ROW_NUMBER() OVER (ORDER BY Recetas DESC, Id_Suministro) AS RankingRecetas,
        SUM(CostoTotal) OVER () AS TotalCostoGeneral
      FROM Agg
    )
    SELECT
      r.Id_Suministro,
      r.Des_Suministro,
      r.TipoSuministro,
      r.Cantidad,
      r.CostoTotal,
      r.Recetas,
      r.RankingCosto,
      r.RankingCantidad,
      r.RankingRecetas,
      r.TotalCostoGeneral
    FROM Ranked r
    WHERE r.RankingCosto <= 60 OR r.RankingCantidad <= 60 OR r.RankingRecetas = 1
    ORDER BY r.RankingCantidad ASC
  `);

  const rows = rankingRes.recordset;
  const totalCosto = Number(rows[0]?.TotalCostoGeneral || 0);
  const toMedicine = (row) => {
    const parsed = parseMedicineName(row.Des_Suministro);
    const costo = Number(row.CostoTotal || 0);
    return {
      idSuministro: row.Id_Suministro,
      nombreCompleto: row.Des_Suministro,
      nombre: parsed.nombre,
      forma: parsed.forma,
      concentracion: parsed.concentracion,
      tipoSuministro: row.TipoSuministro,
      cantidad: Number(row.Cantidad || 0),
      costoTotal: costo,
      recetas: Number(row.Recetas || 0),
      porcentajeGasto: totalCosto > 0 ? Number(((costo / totalCosto) * 100).toFixed(2)) : 0,
    };
  };
  const topDispensado = rows.find((row) => Number(row.RankingCantidad) === 1);
  const topGasto = rows.find((row) => Number(row.RankingCosto) === 1);
  const topRecetado = rows.find((row) => Number(row.RankingRecetas) === 1);

  return {
    rankingCosto: rows.filter((row) => row.RankingCosto <= 60)
      .sort((a, b) => Number(a.RankingCosto) - Number(b.RankingCosto))
      .map(toMedicine),
    rankingCantidad: rows.filter((row) => row.RankingCantidad <= 60)
      .sort((a, b) => Number(a.RankingCantidad) - Number(b.RankingCantidad))
      .map(toMedicine),
    topDispensado: topDispensado ? toMedicine(topDispensado) : null,
    topGasto: topGasto ? toMedicine(topGasto) : null,
    topRecetado: topRecetado ? toMedicine(topRecetado) : null,
  };
}

// GET /api/medicamentos/filters
router.get('/filters', async (req, res) => {
  try {
    const pool = await getPool();

    // 1. Establishments — only those with actual medicine movement data in SICOFS (guarantees Montero only)
    const estRes = await pool.request().query(`
      SELECT DISTINCT 
        ms.Id_Establecimiento,
        RTRIM(LTRIM(ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(ms.Id_Establecimiento AS VARCHAR)))) AS Des_Establecimiento,
        ISNULL(e.Des_Nivel, '1ER. NIVEL') AS Des_Nivel
      FROM BDDatos_2025.dbo.t_MovSum ms
      LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON ms.Id_Establecimiento = e.Id_Establecimiento
      WHERE ms.Id_Suministro > 0
      ORDER BY Des_Establecimiento
    `);

    // 2. Supply Types (Grupos)
    const tipos = [
      'Todas',
      'Medicamento Esencial',
      'Insumo Esencial',
      'Medicamento No Esencial',
      'Insumo No Esencial',
      'Reactivo Esencial',
      'Reactivo No Esencial',
    ];

    // 3. Medicines quick list for dropdown
    const medsList = precomputedCache._schemaVersion === CACHE_SCHEMA_VERSION
      ? precomputedCache['2025']?.topMedicamentosDetalle?.map((m) => ({
          idSuministro: m.idSuministro,
          nombre: m.nombre,
          nombreCompleto: m.nombreCompleto,
        })) || []
      : [];

    res.json({
      years: [2023, 2024, 2025, 2026],
      tipos,
      establecimientos: estRes.recordset,
      medicamentosList: medsList,
    });
  } catch (err) {
    console.error('Error /api/medicamentos/filters:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicamentos/dashboard-all
router.get('/dashboard-all', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || 2025;
    const mes = req.query.mes || 'all';
    const tipo = req.query.tipo || 'all';
    const selectedEstablishment = String(
      req.query.id_establecimiento ?? req.query.establecimiento ?? ''
    ).trim();
    const allEstablishments = !selectedEstablishment
      || ['all', 'todas'].includes(selectedEstablishment.toLowerCase());
    const idEst = allEstablishments ? 'all' : Number(selectedEstablishment);
    if (!allEstablishments && (!Number.isInteger(idEst) || idEst <= 0)) {
      return res.status(400).json({ error: 'El establecimiento seleccionado no es válido.' });
    }
    const medSearch = (req.query.medicamento || '').trim();

    const isAllFiltersDefault =
      mes === 'all' &&
      (tipo === 'all' || tipo === 'Todas') &&
      idEst === 'all' &&
      !medSearch;

    // 1. Return precomputed full year cache if no filter applied
    if (
      isAllFiltersDefault &&
      precomputedCache._schemaVersion === CACHE_SCHEMA_VERSION &&
      precomputedCache[year]
    ) {
      const rankings = await getFilteredMedicineRankings(await getPool(), {
        year, mes, tipo, idEst, medSearch,
      });
      const cachedData = precomputedCache[year];
      return res.json({
        ...cachedData,
        ...rankings,
        kpis: {
          ...cachedData.kpis,
          topDispensado: rankings.topDispensado && {
            nombre: rankings.topDispensado.nombre,
            forma: rankings.topDispensado.forma,
            concentracion: rankings.topDispensado.concentracion,
            cantidad: rankings.topDispensado.cantidad,
            costo: rankings.topDispensado.costoTotal,
          },
          topGasto: rankings.topGasto && {
            nombre: rankings.topGasto.nombre,
            forma: rankings.topGasto.forma,
            concentracion: rankings.topGasto.concentracion,
            cantidad: rankings.topGasto.cantidad,
            costo: rankings.topGasto.costoTotal,
          },
          topRecetado: rankings.topRecetado && {
            nombre: rankings.topRecetado.nombre,
            forma: rankings.topRecetado.forma,
            concentracion: rankings.topRecetado.concentracion,
            recetas: rankings.topRecetado.recetas,
            cantidad: rankings.topRecetado.cantidad,
            costo: rankings.topRecetado.costoTotal,
          },
        },
      });
    }

    // 2. Dynamic cache lookup
    const cacheKey = `${year}_${mes}_${tipo}_${idEst}_${medSearch}`;
    if (dynamicCache.has(cacheKey)) {
      return res.json(dynamicCache.get(cacheKey));
    }

    // 3. Dynamic SQL Query for custom filters
    const pool = await getPool();
    const db = `BDDatos_${year}`;
    const reqDb = pool.request();
    const whereConditions = ['ms.Id_Suministro > 0'];

    if (mes !== 'all') {
      reqDb.input('Mes', sql.Int, parseInt(mes, 10));
      whereConditions.push('ms.Id_Mes = @Mes');
    }
    if (idEst !== 'all') {
      reqDb.input('IdEst', sql.Int, idEst);
      whereConditions.push('ms.Id_Establecimiento = @IdEst');
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Optional JOIN on supply type if filtered
    let tipoJoin = '';
    if (tipo !== 'all' && tipo !== 'Todas') {
      reqDb.input('TipoSuministro', sql.NVarChar, tipo);
      tipoJoin = `
        LEFT JOIN ${db}.dbo.t_Suministro s_tipo
          ON s_tipo.Id_Suministro = ms.Id_Suministro
          AND s_tipo.Id_Establecimiento = ms.Id_Establecimiento
          AND s_tipo.Id_Ano = ms.Id_Ano
          AND s_tipo.Id_Mes = ms.Id_Mes
        LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts_filter ON s_tipo.Id_TipoSuministro = ts_filter.Id_TipoSuministro
      `;
      whereConditions.push('ts_filter.Des_TipoSuministro = @TipoSuministro');
    }

    let medJoin = '';
    if (medSearch) {
      reqDb.input('MedSearch', sql.NVarChar, `%${medSearch}%`);
      medJoin = `
        LEFT JOIN ${db}.dbo.t_Suministro s_med
          ON s_med.Id_Suministro = ms.Id_Suministro
          AND s_med.Id_Establecimiento = ms.Id_Establecimiento
          AND s_med.Id_Ano = ms.Id_Ano
          AND s_med.Id_Mes = ms.Id_Mes
      `;
      whereConditions.push('s_med.Des_Suministro LIKE @MedSearch');
    }

    const fullWhere = `WHERE ${whereConditions.join(' AND ')}`;
    const joinsClause = `${tipoJoin} ${medJoin}`;

    // 1. KPIs
    const kpiRes = await reqDb.query(`
      SELECT 
        SUM(CAST(ms.Dispensado AS BIGINT)) AS TotalCantidad,
        SUM(ms.Costo_Total) AS TotalCosto,
        COUNT(DISTINCT ms.Id_Suministro) AS MedicamentosDiferentes,
        COUNT(DISTINCT ms.Id_Salida) AS RecetasDistintas,
        COUNT(DISTINCT ms.Id_Establecimiento) AS EstablecimientosConMedicamentos,
        COUNT(DISTINCT ms.Id_Mes) AS MesesConDatos
      FROM ${db}.dbo.t_MovSum ms
      ${joinsClause}
      ${fullWhere}
    `);

    const kpiRow = kpiRes.recordset[0] || {};
    const totalCantidad = Number(kpiRow.TotalCantidad || 0);
    const totalCosto = Number(kpiRow.TotalCosto || 0);
    const medicamentosDiferentes = Number(kpiRow.MedicamentosDiferentes || 0);
    const recetasDistintas = Number(kpiRow.RecetasDistintas || 0);
    const establecimientosConMedicamentos = Number(kpiRow.EstablecimientosConMedicamentos || 0);
    const mesesConDatos = Number(kpiRow.MesesConDatos || 1);
    const promedioMensualGasto = Math.round((totalCosto / mesesConDatos) * 100) / 100;
    const promedioMensualCantidad = Math.round(totalCantidad / mesesConDatos);

    // 2. Evolución mensual filtrada
    const evoRes = await reqDb.query(`
      SELECT 
        ms.Id_Mes AS Mes,
        SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
        SUM(ms.Costo_Total) AS CostoTotal,
        COUNT(DISTINCT ms.Id_Salida) AS Recetas
      FROM ${db}.dbo.t_MovSum ms
      ${joinsClause}
      ${fullWhere}
      GROUP BY ms.Id_Mes
      ORDER BY ms.Id_Mes
    `);

    const monthlyData = evoRes.recordset.map((r) => ({
      mes: r.Mes,
      mesNombre: MONTH_NAMES[r.Mes - 1] || `M${r.Mes}`,
      cantidad: Number(r.Cantidad || 0),
      costoTotal: Number(r.CostoTotal || 0),
      recetas: Number(r.Recetas || 0),
    }));

    // 3. Distribución por grupo usando el mismo conjunto filtrado de movimientos
    const groupRes = await reqDb.query(`
      WITH Agg AS (
        SELECT
          ms.Id_Suministro,
          SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
          SUM(ms.Costo_Total) AS CostoTotal
        FROM ${db}.dbo.t_MovSum ms
        ${joinsClause}
        ${fullWhere}
        GROUP BY ms.Id_Suministro
      )
      SELECT
        ISNULL(ts.Des_TipoSuministro, 'Sin Clasificar') AS TipoSuministro,
        COUNT(DISTINCT a.Id_Suministro) AS TotalMedicamentos,
        SUM(a.Cantidad) AS Cantidad,
        SUM(a.CostoTotal) AS CostoTotal
      FROM Agg a
      OUTER APPLY (
        SELECT TOP 1 Id_TipoSuministro
        FROM ${db}.dbo.t_Suministro
        WHERE Id_Suministro = a.Id_Suministro
      ) s
      LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts
        ON s.Id_TipoSuministro = ts.Id_TipoSuministro
      GROUP BY ts.Des_TipoSuministro
      ORDER BY CostoTotal DESC
    `);
    const distribucionGrupo = groupRes.recordset.map((r) => ({
      tipo: r.TipoSuministro,
      cantidad: Number(r.Cantidad || 0),
      costoTotal: Number(r.CostoTotal || 0),
      porcentajeGasto: totalCosto > 0
        ? Number(((r.CostoTotal / totalCosto) * 100).toFixed(2))
        : 0,
      totalMedicamentos: Number(r.TotalMedicamentos || 0),
    }));

    // 4. Top Establecimientos
    const topEstRes = await reqDb.query(`
      SELECT TOP 10
        ms.Id_Establecimiento,
        ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(ms.Id_Establecimiento AS VARCHAR)) AS nombre,
        ISNULL(e.Des_Nivel, '1ER. NIVEL') AS nivel,
        SUM(CAST(ms.Dispensado AS BIGINT)) AS cantidad,
        SUM(ms.Costo_Total) AS costoTotal,
        COUNT(DISTINCT ms.Id_Salida) AS recetas
      FROM ${db}.dbo.t_MovSum ms
      ${joinsClause}
      LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON ms.Id_Establecimiento = e.Id_Establecimiento
      ${fullWhere}
      GROUP BY ms.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
      ORDER BY costoTotal DESC
    `);

    const distribucionEstablecimiento = topEstRes.recordset.map((r) => ({
      idEstablecimiento: r.Id_Establecimiento,
      nombre: (r.nombre || '').trim(),
      nivel: (r.nivel || '1ER. NIVEL').trim(),
      cantidad: Number(r.cantidad || 0),
      costoTotal: Number(r.costoTotal || 0),
      recetas: Number(r.recetas || 0),
      porcentajeGasto: totalCosto > 0 ? Number(((r.costoTotal / totalCosto) * 100).toFixed(2)) : 0,
    }));

    // 5. Matriz dinámica de medicamentos
    // NOTE: medJoin & medSearch WHERE already set in joinsClause/fullWhere above — do NOT re-register @MedSearch.
    // The CTE uses joinsClause (tipoJoin + medJoin) to apply all active filters consistently.
    const matrixRes = await reqDb.query(`
      WITH Agg AS (
        SELECT 
          MIN(ms.Id_Suministro) AS Id_Suministro,
          ISNULL(NULLIF(LTRIM(RTRIM(s_matrix.Des_Suministro)), ''), 'Suministro ' + CAST(ms.Id_Suministro AS VARCHAR)) AS Des_Suministro,
          ISNULL(ts_matrix.Des_TipoSuministro, 'General') AS TipoSuministro,
          ms.Id_Mes,
          SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
          SUM(ms.Costo_Total) AS CostoTotal
        FROM ${db}.dbo.t_MovSum ms
        ${joinsClause}
        LEFT JOIN ${db}.dbo.t_Suministro s_matrix
          ON s_matrix.Id_Suministro = ms.Id_Suministro
          AND s_matrix.Id_Establecimiento = ms.Id_Establecimiento
          AND s_matrix.Id_Ano = ms.Id_Ano
          AND s_matrix.Id_Mes = ms.Id_Mes
        LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts_matrix
          ON s_matrix.Id_TipoSuministro = ts_matrix.Id_TipoSuministro
        ${fullWhere}
        GROUP BY
          ISNULL(NULLIF(LTRIM(RTRIM(s_matrix.Des_Suministro)), ''), 'Suministro ' + CAST(ms.Id_Suministro AS VARCHAR)),
          ISNULL(ts_matrix.Des_TipoSuministro, 'General'),
          ms.Id_Mes
      ),
      TopMed AS (
        SELECT TOP 60
          a.Des_Suministro,
          a.TipoSuministro,
          SUM(a.CostoTotal) AS TotalCostoGlobal
        FROM Agg a
        GROUP BY a.Des_Suministro, a.TipoSuministro
        ORDER BY SUM(a.CostoTotal) DESC
      )
      SELECT 
        a.Id_Suministro,
        a.Des_Suministro,
        a.TipoSuministro,
        a.Id_Mes AS Mes,
        a.Cantidad,
        a.CostoTotal
      FROM Agg a
      INNER JOIN TopMed tm
        ON a.Des_Suministro = tm.Des_Suministro
        AND a.TipoSuministro = tm.TipoSuministro
      ORDER BY tm.TotalCostoGlobal DESC, a.Id_Mes
    `);

    const matrixMap = {};
    for (const r of matrixRes.recordset) {
      const productKey = JSON.stringify([r.Des_Suministro, r.TipoSuministro]);
      if (!matrixMap[productKey]) {
        const parsed = parseMedicineName(r.Des_Suministro);
        matrixMap[productKey] = {
          idSuministro: r.Id_Suministro,
          nombre: parsed.nombre,
          nombreCompleto: r.Des_Suministro,
          forma: parsed.forma,
          concentracion: parsed.concentracion,
          tipoSuministro: r.TipoSuministro,
          totalCantidad: 0,
          totalCosto: 0,
          meses: {},
        };
      }
      const c = Number(r.Cantidad || 0);
      const ct = Number(r.CostoTotal || 0);
      matrixMap[productKey].meses[r.Mes] = { cantidad: c, costo: ct };
      matrixMap[productKey].totalCantidad += c;
      matrixMap[productKey].totalCosto += ct;
    }

    const matrizMedicamentos = Object.values(matrixMap).sort((a, b) => b.totalCosto - a.totalCosto);

    const rankings = await getFilteredMedicineRankings(pool, {
      year, mes, tipo, idEst, medSearch,
    });

    const result = {
      ...rankings,
      year,
      kpis: {
        totalCantidad,
        totalCosto,
        medicamentosDiferentes,
        recetasDistintas,
        establecimientosConMedicamentos,
        mesesConDatos,
        promedioMensualGasto,
        promedioMensualCantidad,
        topDispensado: rankings.topDispensado
          ? {
              nombre: rankings.topDispensado.nombre,
              forma: rankings.topDispensado.forma,
              concentracion: rankings.topDispensado.concentracion,
              cantidad: rankings.topDispensado.cantidad,
              costo: rankings.topDispensado.costoTotal,
            }
          : null,
        topGasto: rankings.topGasto
          ? {
              nombre: rankings.topGasto.nombre,
              forma: rankings.topGasto.forma,
              concentracion: rankings.topGasto.concentracion,
              cantidad: rankings.topGasto.cantidad,
              costo: rankings.topGasto.costoTotal,
            }
          : null,
        topRecetado: rankings.topRecetado
          ? {
              nombre: rankings.topRecetado.nombre,
              forma: rankings.topRecetado.forma,
              concentracion: rankings.topRecetado.concentracion,
              recetas: rankings.topRecetado.recetas,
              cantidad: rankings.topRecetado.cantidad,
              costo: rankings.topRecetado.costoTotal,
            }
          : null,
      },
      monthlyData,
      distribucionGrupo,
      distribucionEstablecimiento,
      topMedicamentosDetalle: rankings.rankingCosto.map((m) => ({
        ...m,
      })),
      matrizMedicamentos,
    };

    if (dynamicCache.size >= MAX_DYNAMIC_ENTRIES) {
      const firstKey = dynamicCache.keys().next().value;
      dynamicCache.delete(firstKey);
    }
    dynamicCache.set(cacheKey, result);

    res.json(result);
  } catch (err) {
    console.error('Error /api/medicamentos/dashboard-all:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
