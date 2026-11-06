const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../db.cjs');

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

let precomputedCache = {};
const cacheFilePath = path.join(__dirname, '..', 'cache_servicios.json');

function reloadServiciosCache() {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const raw = fs.readFileSync(cacheFilePath, 'utf-8');
      precomputedCache = JSON.parse(raw);
      console.log('⚡ [Servicios Cache] Loaded precomputed servicios cache.');
    }
  } catch (err) {
    console.warn('⚠️ [Servicios Cache] Could not load cache:', err.message);
  }
}
reloadServiciosCache();

const dynamicCache = new Map();

async function getVolumenPorEstablecimiento(year, mes = 'all') {
  const reqDb = (await getPool()).request();
  const whereMonth = mes === 'all' ? '' : 'WHERE m.Id_Mes = @Mes';

  if (mes !== 'all') {
    reqDb.input('Mes', sql.Int, parseInt(mes, 10));
  }

  const result = await reqDb.query(`
    SELECT
      m.Id_Mes AS mes,
      m.Id_Establecimiento,
      ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(m.Id_Establecimiento AS VARCHAR)) AS establecimiento,
      ISNULL(e.Des_Nivel, 'No definido') AS nivel,
      SUM(m.Cantidad) AS cantidad,
      COUNT(*) AS atenciones,
      COUNT(DISTINCT NULLIF(m.Id_Paciente, 0)) AS pacientesUnicos
    FROM BDDatos_${year}.dbo.t_MovSer m
    LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON m.Id_Establecimiento = e.Id_Establecimiento
    ${whereMonth}
    GROUP BY m.Id_Mes, m.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
    ORDER BY m.Id_Mes, establecimiento
  `);

  return result.recordset;
}

async function getCachedVolume(cached, year, mes = 'all') {
  if (Array.isArray(cached.volumenPorEstablecimiento)) {
    return { data: cached.volumenPorEstablecimiento, error: null };
  }

  try {
    return { data: await getVolumenPorEstablecimiento(year, mes), error: null };
  } catch (err) {
    console.error('Error loading monthly service volume:', err.message);
    return {
      data: [],
      error: 'No fue posible cargar el volumen por establecimiento; verifique la conexión a datos o regenere la caché de servicios.',
    };
  }
}

// Complete list of GrupoProcedimiento from BDCatalogos
const ALL_GRUPOS = [
  'Todas',
  'Anatomía Patológica',
  'Atención de Emergencias y Urgencias',
  'Atención de la Medicina Tradicional Ancestral Boliviana',
  'Atención especializada a través de Telesalud',
  'Imagenología',
  'Laboratorio Clínico',
  'No definido',
  'Prevención de la enfermedad',
  'Procedimientos anestesiológicos y manejo del dolor',
  'Procedimientos cardiológicos',
  'Procedimientos de cirugía de cabeza y cuello',
  'Procedimientos de cirugia plástica y reparadora',
  'Procedimientos de Medicina crítica',
  'Procedimientos de Medicina Nuclear',
  'Procedimientos de Medicina Transfusional',
  'Procedimientos de Rehabilitación',
  'Procedimientos dermatológicos',
  'Procedimientos en Consulta externa o ambulatoria',
  'Procedimientos gastroenterológicos',
  'Procedimientos generales en pacientes internados',
  'Procedimientos ginecológicos',
  'Procedimientos nefrológicos',
  'Procedimientos neumológicos',
  'Procedimientos neurológicos y neuroquirúrgicos',
  'Procedimientos obstétricos',
  'Procedimientos Odontológicos',
  'Procedimientos oftalmológicos',
  'Procedimientos oncológicos y de radioterapia',
  'Procedimientos otorrinolaringológicos/fonoaudiológicos',
  'Procedimientos quirúrgicos cardiovasculares',
  'Procedimientos quirúrgicos de tórax',
  'Procedimientos traumatológicos',
  'Procedimientos urológicos',
  'Promoción de la salud'
];

// Complete list of TipoServicio from BDCatalogos
const ALL_TIPOS = [
  'Todas',
  'Procedimientos Terapéuticos',
  'Diagnóstico',
  'Laboratorio',
  'Procedimientos Preventivos',
  'Gabinete',
  'Banco de Sangre',
  'Procedimientos de Diagnóstico',
  'Procedimientos de Promoción',
];

// GET /api/servicios/filters
router.get('/filters', async (req, res) => {
  try {
    const years = [2023, 2024, 2025, 2026];
    const niveles = ['Todos', '1ER. NIVEL', '2DO. NIVEL'];

    const pool = await getPool();
    const estRes = await pool.request().query(`
      SELECT DISTINCT e.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
      FROM BDCatalogos.dbo.v_Establecimiento e
      WHERE e.Des_Municipio = 'MONTERO'
      ORDER BY e.Des_Establecimiento
    `);

    res.json({
      years,
      tipos: ALL_TIPOS,
      grupos: ALL_GRUPOS,
      niveles,
      establecimientos: estRes.recordset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/servicios/dashboard-all
router.get('/dashboard-all', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || 2025;
    const mes = req.query.mes || 'all';
    const tipo = req.query.tipo || 'all';
    const idEst = req.query.establecimiento || 'all';
    const grupo = req.query.grupo || 'all';
    const nivel = req.query.nivel || 'all';

    // 1. Default year view from precomputed cache
    if (mes === 'all' && (tipo === 'all' || tipo === 'Todas') && idEst === 'all' && (grupo === 'all' || grupo === 'Todas') && (nivel === 'all' || nivel === 'Todos') && precomputedCache[year]) {
      const cached = precomputedCache[year];
      const volume = await getCachedVolume(cached, year);
      return res.json({
        ...cached,
        volumenPorEstablecimiento: volume.data,
        volumenPorEstablecimientoError: volume.error,
      });
    }

    // 2. Month-only view from precomputed cache
    if (mes !== 'all' && (tipo === 'all' || tipo === 'Todas') && idEst === 'all' && (grupo === 'all' || grupo === 'Todas') && (nivel === 'all' || nivel === 'Todos') && precomputedCache[year]?.byMonth?.[mes]) {
      const mData = precomputedCache[year].byMonth[mes];
      const volume = await getCachedVolume(mData, year, mes);
      return res.json({
        kpis: mData.kpis,
        monthlyData: precomputedCache[year].monthlyData,
        topEstablecimientos: mData.topEstablecimientos,
        distribucionNivel: mData.distribucionNivel,
        serviciosPorTipo: precomputedCache[year].serviciosPorTipo,
        serviciosPorGrupo: precomputedCache[year].serviciosPorGrupo,
        tablaDetallada: (precomputedCache[year].tablaDetallada || []).map((item) => {
          const monthData = item.meses?.[mes];
          return {
            ...item,
            totalCantidad: monthData?.cantidad || 0,
            totalCosto: monthData?.costo || 0,
            meses: monthData ? { [mes]: monthData } : {},
          };
        }),
        volumenPorEstablecimiento: volume.data,
        volumenPorEstablecimientoError: volume.error,
      });
    }

    // 3. Dynamic cache lookup
    const cacheKey = `${year}_${mes}_${tipo}_${idEst}_${grupo}_${nivel}`;
    if (dynamicCache.has(cacheKey)) {
      return res.json(dynamicCache.get(cacheKey));
    }

    // 4. Live query for dynamic filter
    const pool = await getPool();
    const db = `BDDatos_${year}`;
    const reqDb = pool.request();
    const whereConditions = [];

    if (mes !== 'all') {
      reqDb.input('Mes', sql.Int, parseInt(mes));
      whereConditions.push('m.Id_Mes = @Mes');
    }
    if (idEst !== 'all') {
      reqDb.input('IdEst', sql.Int, parseInt(idEst));
      whereConditions.push('m.Id_Establecimiento = @IdEst');
    }
    if (tipo !== 'all' && tipo !== 'Todas') {
      reqDb.input('Tipo', sql.NVarChar, tipo);
      whereConditions.push('ts.Des_TipoServicio = @Tipo');
    }
    if (grupo !== 'all' && grupo !== 'Todas') {
      reqDb.input('Grupo', sql.NVarChar, grupo);
      whereConditions.push('gp.Des_GrupoProcedimiento = @Grupo');
    }
    if (nivel !== 'all' && nivel !== 'Todos') {
      reqDb.input('Nivel', sql.NVarChar, nivel);
      whereConditions.push('e.Des_Nivel = @Nivel');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const baseFrom = `
      FROM ${db}.dbo.t_MovSer m
      LEFT JOIN BDCatalogos.dbo.v_Establecimiento e ON m.Id_Establecimiento = e.Id_Establecimiento
      LEFT JOIN BDCatalogos.dbo.t_Servicio s ON m.Id_Servicio = s.Id_Servicio
      LEFT JOIN BDCatalogos.dbo.t_TipoServicio ts ON s.Id_TipoServicio = ts.Id_TipoServicio
      LEFT JOIN BDCatalogos.dbo.t_GrupoProcedimiento gp ON s.Id_GrupoProcedimiento = gp.Id_GrupoProcedimiento
    `;

    // 1. KPIs
    const kpisRes = await reqDb.query(`
      SELECT 
        SUM(m.Cantidad) AS TotalServicios,
        SUM(m.Costo_Total) AS CostoTotal,
        COUNT(DISTINCT m.Id_Establecimiento) AS EstablecimientosConServicios,
        COUNT(DISTINCT m.Id_Mes) AS MesesConDatos
      ${baseFrom}
      ${whereClause}
    `);

    // 2. Evolución mensual
    const evoRes = await reqDb.query(`
      SELECT 
        m.Id_Mes AS Mes,
        SUM(m.Cantidad) AS Cantidad,
        SUM(m.Costo_Total) AS CostoTotal
      ${baseFrom}
      ${whereClause}
      GROUP BY m.Id_Mes
      ORDER BY m.Id_Mes
    `);

    // 3. Top establecimientos
    const topRes = await reqDb.query(`
      SELECT TOP 10
        m.Id_Establecimiento,
        ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(m.Id_Establecimiento AS VARCHAR)) AS nombre,
        ISNULL(e.Des_Nivel, '1ER. NIVEL') AS nivel,
        SUM(m.Cantidad) AS cantidad,
        SUM(m.Costo_Total) AS costoTotal
      ${baseFrom}
      ${whereClause}
      GROUP BY m.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
      ORDER BY cantidad DESC
    `);

    // 4. Nivel
    const nivelRes = await reqDb.query(`
      SELECT 
        ISNULL(e.Des_Nivel, '1ER. NIVEL') AS nivel,
        SUM(m.Cantidad) AS cantidad,
        SUM(m.Costo_Total) AS costoTotal
      ${baseFrom}
      ${whereClause}
      GROUP BY e.Des_Nivel
      ORDER BY cantidad DESC
    `);

    // 5. Tipo servicio
    const tipoRes = await reqDb.query(`
      SELECT 
        ISNULL(ts.Des_TipoServicio, 'No definido') AS tipoServicio,
        SUM(m.Cantidad) AS cantidad,
        SUM(m.Costo_Total) AS costoTotal
      ${baseFrom}
      ${whereClause}
      GROUP BY ts.Des_TipoServicio
      ORDER BY cantidad DESC
    `);

    // 6. Grupo procedimiento
    const grupoRes = await reqDb.query(`
      SELECT TOP 15
        ISNULL(gp.Des_GrupoProcedimiento, 'No definido') AS grupoProcedimiento,
        SUM(m.Cantidad) AS cantidad,
        SUM(m.Costo_Total) AS costoTotal
      ${baseFrom}
      ${whereClause}
      GROUP BY gp.Des_GrupoProcedimiento
      ORDER BY cantidad DESC
    `);

    // 7. Dynamic Matrix Detailed Table - filtered by exact user criteria using CTE
    const matrixRes = await reqDb.query(`
      WITH TopServices AS (
        SELECT TOP 60
          ISNULL(s.Des_Servicio, m.Des_Obs) AS nombre,
          SUM(m.Cantidad) AS totalCant
        ${baseFrom}
        ${whereClause}
        GROUP BY ISNULL(s.Des_Servicio, m.Des_Obs)
        ORDER BY SUM(m.Cantidad) DESC
      )
      SELECT 
        ts_top.nombre,
        ISNULL(ts.Des_TipoServicio, 'No definido') AS tipoServicio,
        ISNULL(gp.Des_GrupoProcedimiento, 'No definido') AS grupoProcedimiento,
        m.Id_Mes AS mes,
        SUM(m.Cantidad) AS cantidad,
        SUM(m.Costo_Total) AS costoTotal
      ${baseFrom}
      INNER JOIN TopServices ts_top ON ts_top.nombre = ISNULL(s.Des_Servicio, m.Des_Obs)
      ${whereClause}
      GROUP BY ts_top.nombre, ts.Des_TipoServicio, gp.Des_GrupoProcedimiento, m.Id_Mes, ts_top.totalCant
      ORDER BY ts_top.totalCant DESC, m.Id_Mes
    `);

    const volumenRes = await reqDb.query(`
      SELECT
        m.Id_Mes AS mes,
        m.Id_Establecimiento,
        ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(m.Id_Establecimiento AS VARCHAR)) AS establecimiento,
        ISNULL(e.Des_Nivel, 'No definido') AS nivel,
        SUM(m.Cantidad) AS cantidad,
        COUNT(*) AS atenciones,
        COUNT(DISTINCT NULLIF(m.Id_Paciente, 0)) AS pacientesUnicos
      ${baseFrom}
      ${whereClause}
      GROUP BY m.Id_Mes, m.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
      ORDER BY m.Id_Mes, establecimiento
    `);

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
    const tablaDetallada = Object.values(serviceMap).sort((a, b) => b.totalCantidad - a.totalCantidad);

    const kpiRow = kpisRes.recordset[0] || {};
    const totalServicios = kpiRow.TotalServicios || 0;
    const costoTotal = kpiRow.CostoTotal || 0;
    const mesesConDatos = kpiRow.MesesConDatos || 1;
    const promedioMensual = Math.round(totalServicios / mesesConDatos);

    const monthlyData = evoRes.recordset.map(r => ({
      mes: r.Mes,
      mesNombre: MONTH_NAMES[r.Mes - 1] || `M${r.Mes}`,
      cantidad: r.Cantidad,
      costoTotal: r.CostoTotal,
    }));

    const result = {
      kpis: {
        totalServicios,
        costoTotal,
        promedioMensual,
        establecimientosConServicios: kpiRow.EstablecimientosConServicios || 0,
        mesesConDatos,
        variacionGestionAnterior: precomputedCache[year]?.kpis?.variacionGestionAnterior || 0,
      },
      monthlyData,
      topEstablecimientos: topRes.recordset,
      distribucionNivel: nivelRes.recordset,
      serviciosPorTipo: tipoRes.recordset,
      serviciosPorGrupo: grupoRes.recordset,
      tablaDetallada,
      volumenPorEstablecimiento: volumenRes.recordset,
    };

    dynamicCache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('Error /api/servicios/dashboard-all:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.reloadServiciosCache = reloadServiciosCache;
