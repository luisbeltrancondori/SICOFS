const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../db.cjs');

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

async function buildServiciosCacheForYear(pool, year) {
  console.log(`[Servicios] Starting cache build for year ${year}...`);
  const db = `BDDatos_${year}`;

  // 1. Monthly evolution
  console.time(`Year ${year} monthly`);
  const monthlyRes = await pool.request().query(`
    SELECT 
      m.Id_Mes AS Mes,
      SUM(m.Cantidad) AS Cantidad,
      SUM(m.Costo_Total) AS CostoTotal,
      COUNT(*) AS Atenciones
    FROM ${db}.dbo.t_MovSer m
    GROUP BY m.Id_Mes
    ORDER BY m.Id_Mes
  `);
  console.timeEnd(`Year ${year} monthly`);

  // 2. KPIs
  console.time(`Year ${year} kpis`);
  const kpiRes = await pool.request().query(`
    SELECT 
      SUM(m.Cantidad) AS TotalServicios,
      SUM(m.Costo_Total) AS CostoTotal,
      COUNT(DISTINCT m.Id_Establecimiento) AS EstablecimientosConServicios,
      COUNT(DISTINCT m.Id_Mes) AS MesesConDatos
    FROM ${db}.dbo.t_MovSer m
  `);
  console.timeEnd(`Year ${year} kpis`);

  // 3. Top establishments
  console.time(`Year ${year} top establishments`);
  const topEstRes = await pool.request().query(`
    SELECT TOP 10
      m.Id_Establecimiento,
      ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(m.Id_Establecimiento AS VARCHAR)) AS nombre,
      ISNULL(e.Des_Nivel, '1ER. NIVEL') AS nivel,
      SUM(m.Cantidad) AS cantidad,
      SUM(m.Costo_Total) AS costoTotal,
      COUNT(*) AS atenciones
    FROM ${db}.dbo.t_MovSer m
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON m.Id_Establecimiento = e.Id_Establecimiento
    GROUP BY m.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
    ORDER BY cantidad DESC
  `);
  console.timeEnd(`Year ${year} top establishments`);

  // 4. Level breakdown (1ER. NIVEL vs 2DO. NIVEL)
  console.time(`Year ${year} nivel`);
  const nivelRes = await pool.request().query(`
    SELECT 
      ISNULL(e.Des_Nivel, '1ER. NIVEL') AS nivel,
      SUM(m.Cantidad) AS cantidad,
      SUM(m.Costo_Total) AS costoTotal
    FROM ${db}.dbo.t_MovSer m
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON m.Id_Establecimiento = e.Id_Establecimiento
    GROUP BY e.Des_Nivel
    ORDER BY cantidad DESC
  `);
  console.timeEnd(`Year ${year} nivel`);

  // 5. Tipo de Servicio breakdown
  console.time(`Year ${year} tipo servicio`);
  const tipoServRes = await pool.request().query(`
    SELECT 
      ISNULL(ts.Des_TipoServicio, 'No definido') AS tipoServicio,
      SUM(m.Cantidad) AS cantidad,
      SUM(m.Costo_Total) AS costoTotal
    FROM ${db}.dbo.t_MovSer m
    LEFT JOIN BDCatalogos.dbo.t_Servicio s ON m.Id_Servicio = s.Id_Servicio
    LEFT JOIN BDCatalogos.dbo.t_TipoServicio ts ON s.Id_TipoServicio = ts.Id_TipoServicio
    GROUP BY ts.Des_TipoServicio
    ORDER BY cantidad DESC
  `);
  console.timeEnd(`Year ${year} tipo servicio`);

  // 6. Grupo Procedimiento breakdown
  console.time(`Year ${year} grupo procedimiento`);
  const grupoProcRes = await pool.request().query(`
    SELECT TOP 15
      ISNULL(gp.Des_GrupoProcedimiento, 'No definido') AS grupoProcedimiento,
      SUM(m.Cantidad) AS cantidad,
      SUM(m.Costo_Total) AS costoTotal
    FROM ${db}.dbo.t_MovSer m
    LEFT JOIN BDCatalogos.dbo.t_Servicio s ON m.Id_Servicio = s.Id_Servicio
    LEFT JOIN BDCatalogos.dbo.t_GrupoProcedimiento gp ON s.Id_GrupoProcedimiento = gp.Id_GrupoProcedimiento
    GROUP BY gp.Des_GrupoProcedimiento
    ORDER BY cantidad DESC
  `);
  console.timeEnd(`Year ${year} grupo procedimiento`);

  // 7. Matrix of services detailed using CTE for top 60 services across months
  console.time(`Year ${year} matrix`);
  const matrixRes = await pool.request().query(`
    WITH TopServices AS (
      SELECT TOP 60 m.Id_Servicio, SUM(m.Cantidad) AS TotalCant
      FROM ${db}.dbo.t_MovSer m
      GROUP BY m.Id_Servicio
      ORDER BY SUM(m.Cantidad) DESC
    )
    SELECT 
      ISNULL(s.Des_Servicio, m.Des_Obs) AS nombre,
      ISNULL(ts.Des_TipoServicio, 'No definido') AS tipoServicio,
      ISNULL(gp.Des_GrupoProcedimiento, 'No definido') AS grupoProcedimiento,
      m.Id_Mes AS mes,
      SUM(m.Cantidad) AS cantidad,
      SUM(m.Costo_Total) AS costoTotal
    FROM ${db}.dbo.t_MovSer m
    INNER JOIN TopServices ts_top ON m.Id_Servicio = ts_top.Id_Servicio
    LEFT JOIN BDCatalogos.dbo.t_Servicio s ON m.Id_Servicio = s.Id_Servicio
    LEFT JOIN BDCatalogos.dbo.t_TipoServicio ts ON s.Id_TipoServicio = ts.Id_TipoServicio
    LEFT JOIN BDCatalogos.dbo.t_GrupoProcedimiento gp ON s.Id_GrupoProcedimiento = gp.Id_GrupoProcedimiento
    WHERE ISNULL(s.Des_Servicio, m.Des_Obs) IS NOT NULL
    GROUP BY ISNULL(s.Des_Servicio, m.Des_Obs), ts.Des_TipoServicio, gp.Des_GrupoProcedimiento, m.Id_Mes, ts_top.TotalCant
    ORDER BY ts_top.TotalCant DESC, m.Id_Mes
  `);

  // Monthly breakdown per establishment and level
  const monthlyEstRes = await pool.request().query(`
    SELECT 
      m.Id_Mes AS mes,
      m.Id_Establecimiento,
      ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(m.Id_Establecimiento AS VARCHAR)) AS establecimiento,
      ISNULL(e.Des_Nivel, '1ER. NIVEL') AS nivel,
      SUM(m.Cantidad) AS cantidad,
      SUM(m.Costo_Total) AS costoTotal,
      COUNT(*) AS atenciones,
      COUNT(DISTINCT NULLIF(m.Id_Paciente, 0)) AS pacientesUnicos
    FROM ${db}.dbo.t_MovSer m
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON m.Id_Establecimiento = e.Id_Establecimiento
    GROUP BY m.Id_Mes, m.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
  `);
  console.timeEnd(`Year ${year} matrix`);

  // Build matrix grouped by service name
  const serviceMap = {};
  for (const r of matrixRes.recordset) {
    if (!serviceMap[r.nombre]) {
      serviceMap[r.nombre] = {
        nombre: r.nombre,
        tipoServicio: r.tipoServicio,
        grupoProcedimiento: r.grupoProcedimiento,
        totalCantidad: 0,
        totalCosto: 0,
        meses: {},
      };
    }
    serviceMap[r.nombre].meses[r.mes] = {
      cantidad: r.cantidad,
      costo: r.costoTotal,
    };
    serviceMap[r.nombre].totalCantidad += r.cantidad;
    serviceMap[r.nombre].totalCosto += r.costoTotal;
  }

  const tableDetailed = Object.values(serviceMap).sort((a, b) => b.totalCantidad - a.totalCantidad);

  const monthlyData = monthlyRes.recordset.map(r => ({
    mes: r.Mes,
    mesNombre: MONTH_NAMES[r.Mes - 1] || `M${r.Mes}`,
    cantidad: r.Cantidad,
    costoTotal: r.CostoTotal,
    atenciones: r.Atenciones,
  }));

  const kpiRow = kpiRes.recordset[0] || {};
  const totalServicios = kpiRow.TotalServicios || 0;
  const costoTotal = kpiRow.CostoTotal || 0;
  const mesesConDatos = kpiRow.MesesConDatos || (monthlyData.length || 1);
  const promedioMensual = Math.round(totalServicios / mesesConDatos);

  // Month-by-month cache
  const byMonth = {};
  for (let m = 1; m <= 12; m++) {
    const mData = monthlyData.find(d => d.mes === m);
    if (!mData) continue;

    const mEst = monthlyEstRes.recordset.filter(r => r.mes === m);
    const mTopEst = Object.entries(
      mEst.reduce((acc, curr) => {
        if (!acc[curr.Id_Establecimiento]) {
          const estObj = topEstRes.recordset.find(e => e.Id_Establecimiento === curr.Id_Establecimiento);
          acc[curr.Id_Establecimiento] = {
            Id_Establecimiento: curr.Id_Establecimiento,
            nombre: estObj?.nombre || `Establecimiento ${curr.Id_Establecimiento}`,
            nivel: curr.nivel,
            cantidad: 0,
            costoTotal: 0,
          };
        }
        acc[curr.Id_Establecimiento].cantidad += curr.cantidad;
        acc[curr.Id_Establecimiento].costoTotal += curr.costoTotal;
        return acc;
      }, {})
    ).map(([_, v]) => v).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);

    const mNivelMap = mEst.reduce((acc, curr) => {
      const level = acc[curr.nivel] || { cantidad: 0, costoTotal: 0 };
      level.cantidad += curr.cantidad;
      level.costoTotal += curr.costoTotal;
      acc[curr.nivel] = level;
      return acc;
    }, {});
    const mNivel = Object.entries(mNivelMap).map(([nivel, values]) => ({
      nivel,
      ...values,
    }));

    // Filter tableDetailed for month m
    const mTable = tableDetailed
      .filter(item => item.meses?.[m]?.cantidad > 0)
      .map(item => ({
        ...item,
        totalCantidad: item.meses[m].cantidad,
        totalCosto: item.meses[m].costo,
      }))
      .sort((a, b) => b.totalCantidad - a.totalCantidad);

    byMonth[m] = {
      kpis: {
        totalServicios: mData.cantidad,
        costoTotal: mData.costoTotal,
        promedioMensual: mData.cantidad,
        establecimientosConServicios: kpiRow.EstablecimientosConServicios,
        mesesConDatos: 1,
      },
      topEstablecimientos: mTopEst,
      distribucionNivel: mNivel,
      tablaDetallada: mTable,
      volumenPorEstablecimiento: mEst,
    };
  }

  return {
    kpis: {
      totalServicios,
      costoTotal,
      promedioMensual,
      establecimientosConServicios: kpiRow.EstablecimientosConServicios || 12,
      mesesConDatos,
    },
    monthlyData,
    topEstablecimientos: topEstRes.recordset,
    distribucionNivel: nivelRes.recordset,
    serviciosPorTipo: tipoServRes.recordset,
    serviciosPorGrupo: grupoProcRes.recordset,
    tablaDetallada: tableDetailed,
    volumenPorEstablecimiento: monthlyEstRes.recordset,
    byMonth,
  };
}

async function main() {
  const pool = await getPool();
  const allCache = {};

  for (const year of [2026, 2025, 2024, 2023]) {
    try {
      allCache[year] = await buildServiciosCacheForYear(pool, year);
      console.log(`✅ [Servicios] Year ${year} completed. Total servicios: ${allCache[year].kpis.totalServicios}`);
    } catch (e) {
      console.error(`❌ [Servicios] Year ${year} error:`, e.message);
    }
  }

  for (const year of [2026, 2025, 2024]) {
    const prevYear = year - 1;
    if (allCache[year] && allCache[prevYear]) {
      const cur = allCache[year].kpis.totalServicios;
      const prev = allCache[prevYear].kpis.totalServicios;
      if (prev > 0) {
        const pct = ((cur - prev) / prev) * 100;
        allCache[year].kpis.variacionGestionAnterior = parseFloat(pct.toFixed(1));
        allCache[year].kpis.serviciosGestionAnterior = prev;
      }
    }
  }

  const outPath = path.join(__dirname, '..', 'cache_servicios.json');
  fs.writeFileSync(outPath, JSON.stringify(allCache, null, 2), 'utf-8');
  console.log(`💾 [Servicios] Cache saved to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);

  await pool.close();
}

main().catch(console.error);
