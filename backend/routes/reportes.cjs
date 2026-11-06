const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getPool, sql } = require('../db.cjs');

const AVAILABLE_YEARS = [2023, 2024, 2025, 2026];
const INTERMUNICIPAL_DATABASES = Object.freeze({
  2023: 'BDDatos_2023',
  2024: 'BDDatos_2024',
  2025: 'BDDatos_2025',
  2026: 'BDDatos_2026',
});
const INTERMUNICIPAL_QUARTERS = Object.freeze({
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
});
const MAX_EXPORT_ROWS = 50000;
const productionCachePath = path.join(__dirname, '..', 'cache_produccion.json');
let networkCenterIds = [];

try {
  const productionCache = JSON.parse(fs.readFileSync(productionCachePath, 'utf8'));
  networkCenterIds = (productionCache['2025']?.topEstablecimientos || [])
    .map((facility) => Number(facility.idEstablecimiento))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
} catch (err) {
  console.error('[Reportes] No fue posible cargar la lista de centros de la red:', err.message);
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function readFilters(query, { includeMonth = true } = {}) {
  const year = Number(query.year || 2025);
  const month = includeMonth && query.month && query.month !== 'all' ? Number(query.month) : null;
  const facility = query.facility && query.facility !== 'all' ? Number(query.facility) : null;
  const group = query.group && query.group !== 'all' ? String(query.group) : null;
  const service = String(query.service || '').trim().slice(0, 120);
  const fromDate = query.fromDate ? String(query.fromDate) : null;
  const toDate = query.toDate ? String(query.toDate) : null;

  if (!AVAILABLE_YEARS.includes(year)) {
    throw new Error('Gestión no válida.');
  }
  if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) {
    throw new Error('Mes no válido.');
  }
  if (facility !== null && (!Number.isSafeInteger(facility) || facility <= 0)) {
    throw new Error('Establecimiento no válido.');
  }
  if (facility !== null && !networkCenterIds.includes(facility)) {
    throw new Error('El establecimiento no pertenece a la red municipal habilitada para reportes.');
  }
  if (group !== null && !['T', 'S'].includes(group)) {
    throw new Error('Grupo no válido.');
  }
  if (fromDate && !isValidDate(fromDate)) {
    throw new Error('Fecha inicial no válida.');
  }
  if (toDate && !isValidDate(toDate)) {
    throw new Error('Fecha final no válida.');
  }
  if (fromDate && toDate && fromDate > toDate) {
    throw new Error('La fecha inicial debe ser anterior o igual a la fecha final.');
  }

  return { year, month, facility, group, service, fromDate, toDate };
}

function readIntermunicipalFilters(query, { includeDebtor = true, includeFacility = true } = {}) {
  const gestion = String(query.gestion || '');
  const trimestre = String(query.trimestre || 'todos');
  const debtorValue = includeDebtor ? query.idMunOri : null;
  const parsedDebtorId = debtorValue && debtorValue !== 'all' ? Number(debtorValue) : null;
  const facilityValue = includeFacility ? query.idEstablecimiento : null;
  const idEstablecimiento = facilityValue && facilityValue !== 'all'
    ? Number(facilityValue)
    : null;

  if (!Object.hasOwn(INTERMUNICIPAL_DATABASES, gestion)) {
    throw new Error('Gestión no válida. Debe ser 2023, 2024, 2025 o 2026.');
  }
  if (trimestre !== 'todos' && !Object.hasOwn(INTERMUNICIPAL_QUARTERS, trimestre)) {
    throw new Error('Trimestre no válido. Debe ser 1, 2, 3, 4 o todos.');
  }
  if (parsedDebtorId !== null && (
    !Number.isSafeInteger(parsedDebtorId) || parsedDebtorId <= 0 || parsedDebtorId === 71001
  )) {
    throw new Error('Municipio deudor no válido.');
  }
  if (idEstablecimiento !== null && (!Number.isSafeInteger(idEstablecimiento) || idEstablecimiento <= 0)) {
    throw new Error('Establecimiento de atención no válido.');
  }

  return {
    gestion: Number(gestion),
    trimestre,
    meses: INTERMUNICIPAL_QUARTERS[trimestre] || null,
    idMunOri: parsedDebtorId === null ? null : String(parsedDebtorId),
    idEstablecimiento,
  };
}

function addFilters(request, filters, { defaultGroup = null, dateRange = false } = {}) {
  const conditions = ['h.Gestion = @Year'];
  request.input('Year', sql.Int, filters.year);
  const networkParameters = networkCenterIds.map((id, index) => {
    const parameter = `NetworkCenter${index}`;
    request.input(parameter, sql.Int, id);
    return `@${parameter}`;
  });

  if (!networkParameters.length) {
    throw new Error('No está disponible el catálogo de centros de la red municipal.');
  }
  conditions.push(`h.Id_Establecimiento IN (${networkParameters.join(', ')})`);

  if (filters.month !== null) {
    conditions.push('h.Mes = @Month');
    request.input('Month', sql.Int, filters.month);
  }
  if (filters.facility !== null) {
    conditions.push('h.Id_Establecimiento = @Facility');
    request.input('Facility', sql.Int, filters.facility);
  }
  if (filters.group || defaultGroup) {
    conditions.push('h.Grupo = @Group');
    request.input('Group', sql.VarChar(1), filters.group || defaultGroup);
  }
  if (filters.service) {
    conditions.push('CHARINDEX(@Service, h.[Nombre Servicio/Suministro]) > 0');
    request.input('Service', sql.NVarChar(120), filters.service);
  }
  if (dateRange && filters.fromDate) {
    conditions.push('h.[Fecha Atencion] >= @FromDate');
    request.input('FromDate', sql.DateTime, new Date(`${filters.fromDate}T00:00:00`));
  }
  if (dateRange && filters.toDate) {
    conditions.push('h.[Fecha Atencion] < DATEADD(day, 1, @ToDate)');
    request.input('ToDate', sql.DateTime, new Date(`${filters.toDate}T00:00:00`));
  }

  return conditions.join(' AND ');
}

router.get('/filters', async (_req, res) => {
  try {
    if (!networkCenterIds.length) {
      return res.status(503).json({ error: 'No está disponible el catálogo de centros de la red municipal.' });
    }
    const pool = await getPool();
    const request = pool.request();
    const parameters = networkCenterIds.map((id, index) => {
      const parameter = `NetworkCenter${index}`;
      request.input(parameter, sql.Int, id);
      return `@${parameter}`;
    });
    const result = await request.query(`
      SELECT DISTINCT
        e.Id_Establecimiento,
        RTRIM(LTRIM(e.Des_Establecimiento)) AS Des_Establecimiento,
        e.Des_Nivel
      FROM BDCatalogos.dbo.v_Establecimiento e
      WHERE e.Des_Municipio = 'MONTERO'
        AND e.Id_Establecimiento IN (${parameters.join(', ')})
      ORDER BY Des_Establecimiento
    `);

    res.json({
      years: AVAILABLE_YEARS,
      groups: [
        { value: 'all', label: 'Todos los grupos' },
        { value: 'T', label: 'T — Servicios médicos' },
        { value: 'S', label: 'S — Medicamentos y suministros' },
      ],
      establishments: result.recordset,
    });
  } catch (err) {
    console.error('[Reportes /filters]', err.message);
    res.status(500).json({ error: 'No fue posible cargar los filtros de reportes.' });
  }
});

router.get('/executive', async (req, res) => {
  try {
    const filters = readFilters(req.query);
    const pool = await getPool();
    const requests = () => {
      const request = pool.request();
      return { request, where: addFilters(request, filters, { defaultGroup: 'T' }) };
    };

    const kpiQuery = requests();
    const kpiResult = await kpiQuery.request.query(`
      SELECT
        COUNT_BIG(*) AS atenciones,
        COUNT(DISTINCT CASE WHEN h.Id_Paciente IS NOT NULL AND h.Id_Paciente <> 0
          THEN CAST(h.Id_Establecimiento AS VARCHAR(20)) + '-' + CAST(h.Id_Paciente AS VARCHAR(20)) END) AS pacientesUnicos,
        SUM(h.Cantidad) AS servicios,
        SUM(h.Costo_Total) AS costoEjecutado
      FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico h
      WHERE ${kpiQuery.where}
    `);

    const levelQuery = requests();
    const levelResult = await levelQuery.request.query(`
      SELECT
        ISNULL(e.Des_Nivel, 'No definido') AS nivel,
        COUNT_BIG(*) AS atenciones,
        SUM(h.Cantidad) AS servicios,
        SUM(h.Costo_Total) AS costoEjecutado
      FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico h
      LEFT JOIN BDCatalogos.dbo.v_Establecimiento e
        ON h.Id_Establecimiento = e.Id_Establecimiento
      WHERE ${levelQuery.where}
      GROUP BY e.Des_Nivel
      ORDER BY costoEjecutado DESC
    `);

    const topQuery = requests();
    const topResult = await topQuery.request.query(`
      SELECT TOP 10
        h.[Nombre Servicio/Suministro] AS servicio,
        SUM(h.Cantidad) AS cantidad,
        SUM(h.Costo_Total) AS costoEjecutado,
        COUNT_BIG(*) AS atenciones
      FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico h
      WHERE ${topQuery.where}
      GROUP BY h.[Nombre Servicio/Suministro]
      ORDER BY SUM(h.Cantidad) DESC
    `);

    const monthlyQuery = requests();
    const monthlyResult = await monthlyQuery.request.query(`
      SELECT
        h.Mes AS mes,
        COUNT_BIG(*) AS atenciones,
        SUM(h.Cantidad) AS servicios,
        SUM(h.Costo_Total) AS costoEjecutado
      FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico h
      WHERE ${monthlyQuery.where}
      GROUP BY h.Mes
      ORDER BY h.Mes
    `);

    const totals = kpiResult.recordset[0] || {};
    res.json({
      filters,
      generatedAt: new Date().toISOString(),
      scope: filters.facility === null ? 'Red municipal de Montero' : 'Establecimiento seleccionado',
      kpis: {
        atenciones: Number(totals.atenciones) || 0,
        pacientesUnicos: Number(totals.pacientesUnicos) || 0,
        servicios: Number(totals.servicios) || 0,
        costoEjecutado: Number(totals.costoEjecutado) || 0,
      },
      byLevel: levelResult.recordset,
      topServices: topResult.recordset,
      monthly: monthlyResult.recordset,
      limitations: {
        budget: 'La fuente consolidada no contiene presupuesto aprobado ni código de partida presupuestaria; solo permite informar ejecución real.',
        capacity: 'No hay capacidad instalada (cupos, turnos, equipos o personal) en la fuente consultada, por lo que no se calcula porcentaje de saturación.',
      },
    });
  } catch (err) {
    const invalidRequest = /no válida|debe ser anterior|no pertenece a la red municipal/i.test(err.message);
    if (!invalidRequest) console.error('[Reportes /executive]', err.message);
    res.status(invalidRequest ? 400 : 500).json({
      error: invalidRequest ? err.message : 'No fue posible generar el informe ejecutivo.',
    });
  }
});

router.get('/dataset', async (req, res) => {
  try {
    const filters = readFilters(req.query);
    const requestedLimit = Number(req.query.limit || MAX_EXPORT_ROWS);
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return res.status(400).json({ error: 'El límite de filas debe ser un entero positivo.' });
    }

    const limit = Math.min(requestedLimit, MAX_EXPORT_ROWS);
    const pool = await getPool();
    const request = pool.request();
    const where = addFilters(request, filters, { dateRange: true });
    request.input('RowLimit', sql.Int, limit);

    const result = await request.query(`
      SELECT TOP (@RowLimit)
        h.Gestion AS gestion,
        h.Mes AS mes,
        h.Id_Establecimiento AS idEstablecimiento,
        RTRIM(LTRIM(ISNULL(e.Des_Establecimiento, 'No definido'))) AS establecimiento,
        ISNULL(e.Des_Nivel, 'No definido') AS nivel,
        h.Grupo AS grupo,
        h.Codigo AS codigo,
        h.[Nombre Servicio/Suministro] AS servicio,
        COUNT_BIG(*) AS registros,
        SUM(h.Cantidad) AS cantidad,
        AVG(h.Costo_Unitario) AS costoUnitarioPromedio,
        SUM(h.Costo_Total) AS costoEjecutado,
        COUNT(*) OVER() AS totalFilas
      FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico h
      LEFT JOIN BDCatalogos.dbo.v_Establecimiento e
        ON h.Id_Establecimiento = e.Id_Establecimiento
      WHERE ${where}
      GROUP BY
        h.Gestion, h.Mes, h.Id_Establecimiento, e.Des_Establecimiento,
        e.Des_Nivel, h.Grupo, h.Codigo, h.[Nombre Servicio/Suministro]
      ORDER BY h.Gestion, h.Mes, h.Id_Establecimiento, h.Grupo, h.Codigo
    `);

    const totalRows = Number(result.recordset[0]?.totalFilas) || 0;
    const rows = result.recordset.map(({ totalFilas: _totalFilas, ...row }) => row);
    res.json({
      generatedAt: new Date().toISOString(),
      filters,
      rowLimit: limit,
      totalRows,
      truncated: totalRows > rows.length,
      privacy: 'Dataset agregado por gestión, mes, establecimiento, grupo y servicio; no incluye identificadores ni datos personales de pacientes.',
      rows,
    });
  } catch (err) {
    const invalidRequest = /no válida|debe ser anterior|no pertenece a la red municipal/i.test(err.message);
    if (!invalidRequest) console.error('[Reportes /dataset]', err.message);
    res.status(invalidRequest ? 400 : 500).json({
      error: invalidRequest ? err.message : 'No fue posible consultar el dataset solicitado.',
    });
  }
});

router.get('/cobros-intermunicipales/filtros', async (req, res) => {
  try {
    const filters = readIntermunicipalFilters(req.query, {
      includeDebtor: false,
      includeFacility: false,
    });
    const { gestion } = filters;
    const pool = await getPool();
    const database = INTERMUNICIPAL_DATABASES[gestion];
    const request = pool.request()
      .input('Trimestre', sql.Int, filters.trimestre === 'todos' ? null : Number(filters.trimestre))
      .input('Mes1', sql.Int, filters.meses?.[0] ?? null)
      .input('Mes2', sql.Int, filters.meses?.[1] ?? null)
      .input('Mes3', sql.Int, filters.meses?.[2] ?? null);
    const result = await request.query(`
      SELECT
        movimientos.Id_MunOri,
        movimientos.Des_MunOri,
        movimientos.Id_Establecimiento,
        movimientos.Des_Establecimiento
      FROM (
        SELECT Id_Mes, Id_MunOri, Des_MunOri, Id_Establecimiento, Des_Establecimiento
        FROM [${database}].dbo.v_movserim
        UNION
        SELECT Id_Mes, Id_MunOri, Des_MunOri, Id_Establecimiento, Des_Establecimiento
        FROM [${database}].dbo.v_movsumim
      ) movimientos
      WHERE (@Trimestre IS NULL OR movimientos.Id_Mes IN (@Mes1, @Mes2, @Mes3))
        AND movimientos.Id_MunOri IS NOT NULL
        AND movimientos.Id_MunOri <> '71001'
      GROUP BY
        movimientos.Id_MunOri, movimientos.Des_MunOri,
        movimientos.Id_Establecimiento, movimientos.Des_Establecimiento
      ORDER BY movimientos.Des_MunOri, movimientos.Des_Establecimiento
    `);

    const debtors = new Map();
    const facilities = new Map();
    for (const row of result.recordset) {
      if (String(row.Id_MunOri) !== '71001') {
        debtors.set(String(row.Id_MunOri), {
          Id_MunOri: row.Id_MunOri,
          Des_Municipio: row.Des_MunOri,
        });
      }
      facilities.set(Number(row.Id_Establecimiento), {
        Id_Establecimiento: row.Id_Establecimiento,
        Des_Establecimiento: String(row.Des_Establecimiento || '').trim(),
      });
    }

    res.json({
      gestion,
      trimestre: filters.trimestre,
      movimientos: result.recordset,
      municipios: [...debtors.values()],
      establecimientos: [...facilities.values()].sort((a, b) =>
        a.Des_Establecimiento.localeCompare(b.Des_Establecimiento, 'es'),
      ),
    });
  } catch (err) {
    const invalidRequest = /no válida|no válido/i.test(err.message);
    if (!invalidRequest) console.error('[Reportes /cobros-intermunicipales/filtros]', err.message);
    res.status(invalidRequest ? 400 : 500).json({
      error: invalidRequest ? err.message : 'No fue posible cargar los municipios deudores.',
    });
  }
});

router.get('/cobros-intermunicipales', async (req, res) => {
  try {
    const filters = readIntermunicipalFilters(req.query);
    const database = INTERMUNICIPAL_DATABASES[filters.gestion];
    const pool = await getPool();
    const request = pool.request()
      .input('Gestion', sql.Int, filters.gestion)
      .input('Trimestre', sql.Int, filters.trimestre === 'todos' ? null : Number(filters.trimestre))
      .input('Mes1', sql.Int, filters.meses?.[0] ?? null)
      .input('Mes2', sql.Int, filters.meses?.[1] ?? null)
      .input('Mes3', sql.Int, filters.meses?.[2] ?? null)
      .input('IdMunOri', sql.VarChar(10), filters.idMunOri)
      .input('IdEstablecimiento', sql.Int, filters.idEstablecimiento);

    const result = await request.query(`
      SELECT
        @Gestion AS Gestion,
        v.Id_MunOri AS Id_Municipio_Deudor,
        v.Des_MunOri AS Municipio_Deudor,
        SUM(v.Cantidad) AS Cantidad_Total,
        SUM(v.Costo_Total) AS Costo_Total_General
      FROM (
        SELECT
          Id_Mes, Id_Municipio, Id_MunOri, Des_MunOri, Id_Establecimiento, Cantidad, Costo_Total
        FROM [${database}].dbo.v_movserim
        UNION ALL
        SELECT
          Id_Mes, Id_Municipio, Id_MunOri, Des_MunOri, Id_Establecimiento, Cantidad, Costo_Total
        FROM [${database}].dbo.v_movsumim
      ) v
      WHERE (@Trimestre IS NULL OR v.Id_Mes IN (@Mes1, @Mes2, @Mes3))
        AND (@IdMunOri IS NULL OR v.Id_MunOri = @IdMunOri)
        AND (@IdEstablecimiento IS NULL OR v.Id_Establecimiento = @IdEstablecimiento)
        AND v.Id_MunOri IS NOT NULL
        AND v.Id_MunOri <> '71001'
      GROUP BY v.Id_MunOri, v.Des_MunOri
      ORDER BY Costo_Total_General DESC
    `);

    res.json({
      gestion: filters.gestion,
      trimestre: filters.trimestre,
      idMunOri: filters.idMunOri,
      idEstablecimiento: filters.idEstablecimiento,
      generadoEn: new Date().toISOString(),
      rows: result.recordset,
    });
  } catch (err) {
    const invalidRequest = /no válida|no válido/i.test(err.message);
    if (!invalidRequest) console.error('[Reportes /cobros-intermunicipales]', err.message);
    res.status(invalidRequest ? 400 : 500).json({
      error: invalidRequest ? err.message : 'No fue posible generar el reporte de cobros intermunicipales.',
    });
  }
});

module.exports = router;
