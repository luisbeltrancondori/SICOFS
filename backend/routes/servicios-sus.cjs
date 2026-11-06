const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db.cjs');

const FILTER_COLUMNS = {
  idServicioPub: 'Id_ServicioPublicado',
  grupoServicio: 'Des_GrupoServicio',
  tipoServicio: 'Des_TipoServicio',
  grupoProcedimiento: 'Des_GrupoProcedimiento',
  nivelHabilitado: 'Des_NivelHabilitado',
};

function addFilters(request, query) {
  const conditions = [];
  const search = String(query.q || '').trim();

  if (search) {
    request.input('Search', sql.NVarChar(300), `%${search}%`);
    conditions.push('(Cod_Servicio LIKE @Search OR Des_Servicio LIKE @Search)');
  }

  for (const [key, column] of Object.entries(FILTER_COLUMNS)) {
    const value = query[key];
    if (!value || value === 'Todos') continue;

    if (key === 'idServicioPub') {
      const publicationId = Number(value);
      if (!Number.isInteger(publicationId)) {
        throw new Error('El número de publicación debe ser un entero.');
      }
      request.input('idServicioPub', sql.Int, publicationId);
      conditions.push(`${column} = @idServicioPub`);
    } else {
      request.input(key, sql.NVarChar(500), String(value));
      conditions.push(`${column} = @${key}`);
    }
  }

  return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
}

router.get('/filters', async (req, res) => {
  try {
    const pool = await getPool();
    const columns = Object.keys(FILTER_COLUMNS);
    const entries = await Promise.all(columns.map(async (key) => {
      const column = FILTER_COLUMNS[key];
      const result = await pool.request().query(`
        SELECT DISTINCT ${column} AS value
        FROM BDCatalogos.dbo.v_Servicio
        WHERE ${column} IS NOT NULL
        ORDER BY ${column}
      `);
      return [key, result.recordset.map((row) => row.value)];
    }));

    res.json({ options: Object.fromEntries(entries) });
  } catch (err) {
    console.error('[Servicios SUS] Error al cargar filtros:', err.message);
    res.status(500).json({
      error: 'No fue posible cargar los filtros del catálogo de Servicios SUS.',
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 25));
    const exportAll = req.query.all === 'true';
    const pool = await getPool();
    const request = pool.request();
    const whereClause = addFilters(request, req.query);

    let query;
    if (exportAll) {
      query = `
      SELECT
        Cod_Servicio AS codigo,
        Des_Servicio AS descripcion,
        Costo AS costo,
        Des_GrupoServicio AS grupoServicio,
        Des_TipoServicio AS tipoServicio,
        Des_GrupoProcedimiento AS grupoProcedimiento,
        Des_NivelHabilitado AS nivelHabilitado,
        Id_ServicioPublicado AS idServicioPub
      FROM BDCatalogos.dbo.v_Servicio
      ${whereClause}
      ORDER BY Id_ServicioPublicado, Cod_Servicio
      `;
    } else {
      request.input('FirstRow', sql.Int, (page - 1) * pageSize + 1);
      request.input('LastRow', sql.Int, page * pageSize);
      query = `
        WITH Catalog AS (
          SELECT
            Cod_Servicio AS codigo,
            Des_Servicio AS descripcion,
            Costo AS costo,
            Des_GrupoServicio AS grupoServicio,
            Des_TipoServicio AS tipoServicio,
            Des_GrupoProcedimiento AS grupoProcedimiento,
            Des_NivelHabilitado AS nivelHabilitado,
            Id_ServicioPublicado AS idServicioPub,
            COUNT(*) OVER() AS totalCount,
            AVG(CAST(Costo AS FLOAT)) OVER() AS averageCost,
            ROW_NUMBER() OVER (ORDER BY Id_ServicioPublicado, Cod_Servicio) AS rowNumber
          FROM BDCatalogos.dbo.v_Servicio
          ${whereClause}
        )
        SELECT
          codigo,
          descripcion,
          costo,
          grupoServicio,
          tipoServicio,
          grupoProcedimiento,
          nivelHabilitado,
          idServicioPub,
          totalCount,
          averageCost
        FROM Catalog
        WHERE rowNumber BETWEEN @FirstRow AND @LastRow
        ORDER BY rowNumber

        SELECT
          COUNT(DISTINCT Des_TipoServicio) AS totalTiposServicio,
          COUNT(DISTINCT Des_GrupoProcedimiento) AS totalGruposProcedimiento,
          COUNT(DISTINCT Des_GrupoServicio) AS totalGruposServicio
        FROM BDCatalogos.dbo.v_Servicio
        ${whereClause}
      `;
    }

    const result = await request.query(query);

    if (exportAll) {
      return res.json({ rows: result.recordset, total: result.recordset.length });
    }

    const firstRow = result.recordset[0];
    const total = Number(firstRow?.totalCount) || 0;
    const averageCost = Number(firstRow?.averageCost) || 0;
    const rows = result.recordset.map(({ totalCount, averageCost: _averageCost, ...row }) => row);
    const summary = result.recordsets[1]?.[0] || {};
    res.json({
      rows,
      total,
      page,
      pageSize,
      averageCost,
      totalTiposServicio: Number(summary.totalTiposServicio) || 0,
      totalGruposProcedimiento: Number(summary.totalGruposProcedimiento) || 0,
      totalGruposServicio: Number(summary.totalGruposServicio) || 0,
    });
  } catch (err) {
    const invalidFilter = /número de publicación debe ser un entero/.test(err.message);
    if (!invalidFilter) {
      console.error('[Servicios SUS] Error al consultar BDCatalogos.dbo.v_Servicio:', err.message);
    }
    res.status(invalidFilter ? 400 : 500).json({
      error: invalidFilter
        ? err.message
        : 'No fue posible cargar el catálogo de Servicios SUS desde BDCatalogos.',
    });
  }
});

module.exports = router;
