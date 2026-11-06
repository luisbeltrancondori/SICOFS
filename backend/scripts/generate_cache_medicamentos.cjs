const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../db.cjs');

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function parseMedicineName(desSuministro) {
  if (!desSuministro) return { nombre: 'Desconocido', forma: '—', concentracion: '—' };
  const parts = desSuministro.split(',').map((p) => p.trim());
  return {
    nombre: parts[0] || desSuministro,
    forma: parts[1] || '—',
    concentracion: parts.slice(2).join(', ') || '—',
  };
}

async function buildMedicamentosCacheForYear(pool, year) {
  console.log(`\n========================================`);
  console.log(`[Medicamentos] Generando caché para gestión ${year}...`);
  console.log(`========================================`);
  const db = `BDDatos_${year}`;

  // 1. KPIs Generales
  console.time(`Year ${year} KPIs`);
  const kpiRes = await pool.request().query(`
    SELECT 
      SUM(CAST(ms.Dispensado AS BIGINT)) AS TotalCantidad,
      SUM(ms.Costo_Total) AS TotalCosto,
      COUNT(DISTINCT ms.Id_Suministro) AS MedicamentosDiferentes,
      COUNT(DISTINCT ms.Id_Salida) AS RecetasDistintas,
      COUNT(DISTINCT ms.Id_Establecimiento) AS EstablecimientosConMedicamentos,
      COUNT(DISTINCT ms.Id_Mes) AS MesesConDatos
    FROM ${db}.dbo.t_MovSum ms
    WHERE ms.Id_Suministro > 0
  `);
  console.timeEnd(`Year ${year} KPIs`);

  const kpiRow = kpiRes.recordset[0] || {};
  const totalCantidad = Number(kpiRow.TotalCantidad || 0);
  const totalCosto = Number(kpiRow.TotalCosto || 0);
  const medicamentosDiferentes = Number(kpiRow.MedicamentosDiferentes || 0);
  const recetasDistintas = Number(kpiRow.RecetasDistintas || 0);
  const establecimientosConMedicamentos = Number(kpiRow.EstablecimientosConMedicamentos || 0);
  const mesesConDatos = Number(kpiRow.MesesConDatos || 1);
  const promedioMensualGasto = Math.round((totalCosto / mesesConDatos) * 100) / 100;
  const promedioMensualCantidad = Math.round(totalCantidad / mesesConDatos);

  // 2. Evolución Mensual
  console.time(`Year ${year} Evolución mensual`);
  const evoRes = await pool.request().query(`
    SELECT 
      ms.Id_Mes AS Mes,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
      SUM(ms.Costo_Total) AS CostoTotal,
      COUNT(DISTINCT ms.Id_Salida) AS Recetas
    FROM ${db}.dbo.t_MovSum ms
    WHERE ms.Id_Suministro > 0
    GROUP BY ms.Id_Mes
    ORDER BY ms.Id_Mes
  `);
  console.timeEnd(`Year ${year} Evolución mensual`);

  const monthlyData = evoRes.recordset.map((r) => ({
    mes: r.Mes,
    mesNombre: MONTH_NAMES[r.Mes - 1] || `M${r.Mes}`,
    cantidad: Number(r.Cantidad || 0),
    costoTotal: Number(r.CostoTotal || 0),
    recetas: Number(r.Recetas || 0),
  }));

  // 3. Distribución por Tipo de Suministro / Grupo Farmacéutico
  console.time(`Year ${year} Tipo Suministro`);
  const tipoRes = await pool.request().query(`
    WITH Agg AS (
      SELECT 
        ms.Id_Suministro,
        SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
        SUM(ms.Costo_Total) AS CostoTotal
      FROM ${db}.dbo.t_MovSum ms
      WHERE ms.Id_Suministro > 0
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
    LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts ON s.Id_TipoSuministro = ts.Id_TipoSuministro
    GROUP BY ts.Des_TipoSuministro
    ORDER BY CostoTotal DESC
  `);
  console.timeEnd(`Year ${year} Tipo Suministro`);

  const distribucionGrupo = tipoRes.recordset.map((r) => ({
    tipo: r.TipoSuministro,
    cantidad: Number(r.Cantidad || 0),
    costoTotal: Number(r.CostoTotal || 0),
    porcentajeGasto: totalCosto > 0 ? Number(((r.CostoTotal / totalCosto) * 100).toFixed(2)) : 0,
    totalMedicamentos: Number(r.TotalMedicamentos || 0),
  }));

  // 4. Distribución por Establecimiento
  console.time(`Year ${year} Establecimientos`);
  const estRes = await pool.request().query(`
    SELECT 
      ms.Id_Establecimiento,
      ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(ms.Id_Establecimiento AS VARCHAR)) AS nombre,
      ISNULL(e.Des_Nivel, '1ER. NIVEL') AS nivel,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS cantidad,
      SUM(ms.Costo_Total) AS costoTotal,
      COUNT(DISTINCT ms.Id_Salida) AS recetas
    FROM ${db}.dbo.t_MovSum ms
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON ms.Id_Establecimiento = e.Id_Establecimiento
    WHERE ms.Id_Suministro > 0
    GROUP BY ms.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
    ORDER BY costoTotal DESC
  `);
  console.timeEnd(`Year ${year} Establecimientos`);

  const distribucionEstablecimiento = estRes.recordset.map((r) => ({
    idEstablecimiento: r.Id_Establecimiento,
    nombre: (r.nombre || '').trim(),
    nivel: (r.nivel || '1ER. NIVEL').trim(),
    cantidad: Number(r.cantidad || 0),
    costoTotal: Number(r.costoTotal || 0),
    recetas: Number(r.recetas || 0),
    porcentajeGasto: totalCosto > 0 ? Number(((r.costoTotal / totalCosto) * 100).toFixed(2)) : 0,
  }));

  // 5. Ranking Completo de Medicamentos (Top 120 por Costo)
  console.time(`Year ${year} Top Medicamentos Agg`);
  const topMedRes = await pool.request().query(`
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
      WHERE ms.Id_Suministro > 0
      GROUP BY ms.Id_Suministro, ms.Id_Establecimiento, ms.Id_Ano, ms.Id_Mes
    ),
    Agg AS (
      SELECT
        MIN(a.Id_Suministro) AS Id_Suministro,
        ISNULL(NULLIF(LTRIM(RTRIM(s.Des_Suministro)), ''), 'Suministro ' + CAST(a.Id_Suministro AS VARCHAR)) AS Des_Suministro,
        ISNULL(ts.Des_TipoSuministro, 'General') AS TipoSuministro,
        SUM(a.Cantidad) AS Cantidad,
        SUM(a.CostoTotal) AS CostoTotal,
        SUM(a.Recetas) AS Recetas
      FROM MovementAgg a
      LEFT JOIN ${db}.dbo.t_Suministro s
        ON s.Id_Suministro = a.Id_Suministro
        AND s.Id_Establecimiento = a.Id_Establecimiento
        AND s.Id_Ano = a.Id_Ano
        AND s.Id_Mes = a.Id_Mes
      LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts
        ON s.Id_TipoSuministro = ts.Id_TipoSuministro
      GROUP BY
        ISNULL(NULLIF(LTRIM(RTRIM(s.Des_Suministro)), ''), 'Suministro ' + CAST(a.Id_Suministro AS VARCHAR)),
        ISNULL(ts.Des_TipoSuministro, 'General')
    )
    SELECT TOP 120
      a.Id_Suministro,
      a.Des_Suministro,
      a.TipoSuministro,
      a.Cantidad,
      a.CostoTotal,
      a.Recetas
    FROM Agg a
    ORDER BY a.CostoTotal DESC
  `);
  console.timeEnd(`Year ${year} Top Medicamentos Agg`);

  const topMedicamentosDetalle = topMedRes.recordset.map((r) => {
    const parsed = parseMedicineName(r.Des_Suministro);
    const cant = Number(r.Cantidad || 0);
    const costo = Number(r.CostoTotal || 0);
    const costoUnitarioPromedio = cant > 0 ? Number((costo / cant).toFixed(2)) : 0;
    return {
      idSuministro: r.Id_Suministro,
      nombreCompleto: r.Des_Suministro,
      nombre: parsed.nombre,
      forma: parsed.forma,
      concentracion: parsed.concentracion,
      tipoSuministro: r.TipoSuministro,
      cantidad: cant,
      costoTotal: costo,
      costoUnitarioPromedio,
      recetas: Number(r.Recetas || 0),
      porcentajeGasto: totalCosto > 0 ? Number(((costo / totalCosto) * 100).toFixed(2)) : 0,
    };
  });

  // KPI Highlights
  const topDispensado = [...topMedicamentosDetalle].sort((a, b) => b.cantidad - a.cantidad)[0] || null;
  const topGasto = [...topMedicamentosDetalle].sort((a, b) => b.costoTotal - a.costoTotal)[0] || null;
  const topRecetado = [...topMedicamentosDetalle].sort((a, b) => b.recetas - a.recetas)[0] || null;

  // 6. Matriz Mensual para Top 80 Medicamentos (Cantidad y Costo por Mes)
  console.time(`Year ${year} Matriz Mensual`);
  const matrixRes = await pool.request().query(`
    WITH Agg AS (
      SELECT
        MIN(ms.Id_Suministro) AS Id_Suministro,
        ISNULL(NULLIF(LTRIM(RTRIM(s.Des_Suministro)), ''), 'Suministro ' + CAST(ms.Id_Suministro AS VARCHAR)) AS Des_Suministro,
        ISNULL(ts.Des_TipoSuministro, 'General') AS TipoSuministro,
        ms.Id_Mes AS Mes,
        SUM(CAST(ms.Dispensado AS BIGINT)) AS Cantidad,
        SUM(ms.Costo_Total) AS CostoTotal
      FROM ${db}.dbo.t_MovSum ms
      LEFT JOIN ${db}.dbo.t_Suministro s
        ON s.Id_Suministro = ms.Id_Suministro
        AND s.Id_Establecimiento = ms.Id_Establecimiento
        AND s.Id_Ano = ms.Id_Ano
        AND s.Id_Mes = ms.Id_Mes
      LEFT JOIN BDCatalogos.dbo.t_TipoSuministro ts
        ON s.Id_TipoSuministro = ts.Id_TipoSuministro
      WHERE ms.Id_Suministro > 0
      GROUP BY
        ISNULL(NULLIF(LTRIM(RTRIM(s.Des_Suministro)), ''), 'Suministro ' + CAST(ms.Id_Suministro AS VARCHAR)),
        ISNULL(ts.Des_TipoSuministro, 'General'),
        ms.Id_Mes
    ),
    TopMed AS (
      SELECT TOP 80
        Des_Suministro,
        TipoSuministro,
        SUM(CostoTotal) AS TotalCostoGlobal
      FROM Agg
      GROUP BY Des_Suministro, TipoSuministro
      ORDER BY SUM(CostoTotal) DESC
    )
    SELECT 
      a.Id_Suministro,
      a.Des_Suministro,
      a.TipoSuministro,
      a.Mes,
      a.Cantidad,
      a.CostoTotal
    FROM Agg a
    INNER JOIN TopMed tm
      ON a.Des_Suministro = tm.Des_Suministro
      AND a.TipoSuministro = tm.TipoSuministro
    ORDER BY tm.TotalCostoGlobal DESC, a.Mes
  `);
  console.timeEnd(`Year ${year} Matriz Mensual`);

  const matrixMap = {};
  for (const r of matrixRes.recordset) {
    const productKey = JSON.stringify([r.Des_Suministro, r.TipoSuministro]);
    if (!matrixMap[productKey]) {
      matrixMap[productKey] = {
        idSuministro: r.Id_Suministro,
        nombreCompleto: r.Des_Suministro,
        tipoSuministro: r.TipoSuministro,
        meses: {},
        totalCantidad: 0,
        totalCosto: 0,
      };
    }
    const c = Number(r.Cantidad || 0);
    const ct = Number(r.CostoTotal || 0);
    matrixMap[productKey].meses[r.Mes] = {
      cantidad: c,
      costo: ct,
    };
    matrixMap[productKey].totalCantidad += c;
    matrixMap[productKey].totalCosto += ct;
  }

  const matrizMedicamentos = Object.values(matrixMap).map((item) => {
    const parsed = parseMedicineName(item.nombreCompleto);
    return {
      ...item,
      nombre: parsed.nombre,
      forma: parsed.forma,
      concentracion: parsed.concentracion,
    };
  }).sort((a, b) => b.totalCosto - a.totalCosto);

  // 7. Desglose mes a mes para vistas mensuales rápidas
  console.time(`Year ${year} byMonth`);
  const monthlyEstRes = await pool.request().query(`
    SELECT 
      ms.Id_Mes AS mes,
      ms.Id_Establecimiento,
      ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(ms.Id_Establecimiento AS VARCHAR)) AS nombre,
      ISNULL(e.Des_Nivel, '1ER. NIVEL') AS nivel,
      SUM(CAST(ms.Dispensado AS BIGINT)) AS cantidad,
      SUM(ms.Costo_Total) AS costoTotal,
      COUNT(DISTINCT ms.Id_Salida) AS recetas
    FROM ${db}.dbo.t_MovSum ms
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON ms.Id_Establecimiento = e.Id_Establecimiento
    WHERE ms.Id_Suministro > 0
    GROUP BY ms.Id_Mes, ms.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
  `);

  const byMonth = {};
  for (let m = 1; m <= 12; m++) {
    const mRow = monthlyData.find((d) => d.mes === m);
    if (!mRow) continue;

    const mEsts = monthlyEstRes.recordset
      .filter((r) => r.mes === m)
      .map((r) => ({
        idEstablecimiento: r.Id_Establecimiento,
        nombre: (r.nombre || '').trim(),
        nivel: (r.nivel || '1ER. NIVEL').trim(),
        cantidad: Number(r.cantidad || 0),
        costoTotal: Number(r.costoTotal || 0),
        recetas: Number(r.recetas || 0),
      }))
      .sort((a, b) => b.costoTotal - a.costoTotal);

    // Matriz filtrada para este mes específico
    const mMatriz = matrizMedicamentos
      .filter((item) => item.meses?.[m]?.cantidad > 0 || item.meses?.[m]?.costo > 0)
      .map((item) => ({
        ...item,
        totalCantidad: item.meses[m]?.cantidad || 0,
        totalCosto: item.meses[m]?.costo || 0,
      }))
      .sort((a, b) => b.totalCosto - a.totalCosto);

    byMonth[m] = {
      kpis: {
        totalCantidad: mRow.cantidad,
        totalCosto: mRow.costoTotal,
        medicamentosDiferentes: mMatriz.length,
        recetasDistintas: mRow.recetas,
        establecimientosConMedicamentos: mEsts.length,
        mesesConDatos: 1,
        promedioMensualGasto: mRow.costoTotal,
        promedioMensualCantidad: mRow.cantidad,
        topDispensado: [...mMatriz].sort((a, b) => b.totalCantidad - a.totalCantidad)[0] || null,
        topGasto: [...mMatriz].sort((a, b) => b.totalCosto - a.totalCosto)[0] || null,
        topRecetado: null,
      },
      topEstablecimientos: mEsts.slice(0, 10),
      matrizMedicamentos: mMatriz,
    };
  }
  console.timeEnd(`Year ${year} byMonth`);

  return {
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
      topDispensado: topDispensado
        ? {
            nombre: topDispensado.nombre,
            forma: topDispensado.forma,
            concentracion: topDispensado.concentracion,
            cantidad: topDispensado.cantidad,
            costo: topDispensado.costoTotal,
          }
        : null,
      topGasto: topGasto
        ? {
            nombre: topGasto.nombre,
            forma: topGasto.forma,
            concentracion: topGasto.concentracion,
            cantidad: topGasto.cantidad,
            costo: topGasto.costoTotal,
          }
        : null,
      topRecetado: topRecetado
        ? {
            nombre: topRecetado.nombre,
            forma: topRecetado.forma,
            concentracion: topRecetado.concentracion,
            recetas: topRecetado.recetas,
            cantidad: topRecetado.cantidad,
            costo: topRecetado.costoTotal,
          }
        : null,
    },
    monthlyData,
    distribucionGrupo,
    distribucionEstablecimiento,
    topMedicamentosDetalle: topMedicamentosDetalle.slice(0, 60),
    matrizMedicamentos,
    byMonth,
  };
}

async function main() {
  const pool = await getPool();
  const cache = {};
  const years = [2023, 2024, 2025, 2026];

  for (const y of years) {
    try {
      cache[y] = await buildMedicamentosCacheForYear(pool, y);
    } catch (err) {
      console.error(`Error procesando gestión ${y}:`, err.message);
    }
  }

  // Calcular variaciones interanuales
  for (let i = 1; i < years.length; i++) {
    const currY = years[i];
    const prevY = years[i - 1];
    if (cache[currY] && cache[prevY]) {
      const currCosto = cache[currY].kpis.totalCosto;
      const prevCosto = cache[prevY].kpis.totalCosto;
      const currCant = cache[currY].kpis.totalCantidad;
      const prevCant = cache[prevY].kpis.totalCantidad;

      const diffCosto = currCosto - prevCosto;
      const pctCosto = prevCosto > 0 ? Number(((diffCosto / prevCosto) * 100).toFixed(1)) : 0;
      const diffCant = currCant - prevCant;
      const pctCant = prevCant > 0 ? Number(((diffCant / prevCant) * 100).toFixed(1)) : 0;

      cache[currY].kpis.comparacionGestionAnterior = {
        prevYear: prevY,
        diffCosto,
        pctCosto,
        diffCant,
        pctCant,
      };
    }
  }

  cache._schemaVersion = 2;
  const outPath = path.join(__dirname, '..', 'cache_medicamentos.json');
  fs.writeFileSync(outPath, JSON.stringify(cache, null, 2), 'utf8');
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`\n🎉 [Medicamentos Cache] Guardado con éxito en ${outPath} (${sizeKb} KB)`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error en generador de caché de medicamentos:', err);
  process.exit(1);
});
