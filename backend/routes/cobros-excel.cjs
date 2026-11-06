const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const router = express.Router();
const QUARTERS = [
  { value: 'Primer Trimestre', field: 'Suma_Primer_Trimestre' },
  { value: 'Segundo Trimestre', field: 'Suma_Segundo_Trimestre' },
  { value: 'Tercer Trimestre', field: 'Suma_Tercer_Trimestre' },
  { value: 'Cuarto Trimestre', field: 'Suma_Cuarto_Trimestre' },
];
const MONTH_QUARTERS = {
  1: QUARTERS[0].value,
  2: QUARTERS[0].value,
  3: QUARTERS[0].value,
  4: QUARTERS[1].value,
  5: QUARTERS[1].value,
  6: QUARTERS[1].value,
  7: QUARTERS[2].value,
  8: QUARTERS[2].value,
  9: QUARTERS[2].value,
  10: QUARTERS[3].value,
  11: QUARTERS[3].value,
  12: QUARTERS[3].value,
};
const DEFAULT_EXCEL_PATH = path.resolve(__dirname, '..', '..', 'RepExcelCobros1.xlsx');
const REQUIRED_HEADERS = [
  'Gestion',
  'Des_DepOri',
  'Des_TipoIngreso',
  'Grp',
  'Cantidad',
  'Costo_Total',
  'trimestres',
  'Estado deuda',
];

let cachedWorkbook;

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function readFilter(query, names) {
  const name = names.find((candidate) => query[candidate] !== undefined);
  if (!name || query[name] === 'all' || query[name] === '') return null;
  if (typeof query[name] !== 'string') {
    throw createError(`El filtro ${name} no es válido.`);
  }
  const value = query[name].trim();
  return value && value.toLowerCase() !== 'all' ? value : null;
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function quarterForRow(value, month) {
  const normalized = normalizeText(value).toLocaleLowerCase('es');
  const quarter = QUARTERS.find((item) => item.value.toLocaleLowerCase('es') === normalized);
  return quarter?.value || MONTH_QUARTERS[Number(month)] || '';
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = normalizeText(value);
  if (!text) return 0;

  let numeric = text.replace(/[^\d,.-]/g, '');
  const comma = numeric.lastIndexOf(',');
  const period = numeric.lastIndexOf('.');
  if (comma !== -1 && period !== -1) {
    const decimalSeparator = comma > period ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    numeric = numeric.split(thousandsSeparator).join('');
    if (decimalSeparator === ',') numeric = numeric.replace(',', '.');
  } else if (comma !== -1) {
    numeric = numeric.replace(',', '.');
  }

  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

function findHeaderIndexes(headerRow) {
  const indexes = new Map(
    headerRow.map((header, index) => [normalizeText(header).toLocaleLowerCase('es'), index]),
  );
  const debtorIndex = indexes.has('gam deudor')
    ? indexes.get('gam deudor')
    : indexes.get('des_munori');
  const missing = REQUIRED_HEADERS.filter(
    (header) => !indexes.has(header.toLocaleLowerCase('es')),
  );

  if (debtorIndex === undefined) missing.push('Gam Deudor (o Des_MunOri)');
  if (missing.length) {
    throw createError(`El Excel no contiene las columnas requeridas: ${missing.join(', ')}.`, 500);
  }

  return {
    gestion: indexes.get('gestion'),
    departamento: indexes.get('des_depori'),
    municipio: debtorIndex,
    tipoIngreso: indexes.get('des_tipoingreso'),
    grupo: indexes.get('grp'),
    cantidad: indexes.get('cantidad'),
    costo: indexes.get('costo_total'),
    trimestre: indexes.get('trimestres'),
    estado: indexes.get('estado deuda'),
    mes: indexes.get('id_mes'),
  };
}

function loadWorkbookRows() {
  const filePath = path.resolve(process.env.COBROS_EXCEL_PATH || DEFAULT_EXCEL_PATH);
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (error) {
    throw createError(`No se encontró el archivo de cobros Excel: ${filePath}`, 503);
  }

  if (
    cachedWorkbook
    && cachedWorkbook.filePath === filePath
    && cachedWorkbook.modifiedAt === stats.mtimeMs
    && cachedWorkbook.size === stats.size
  ) {
    return cachedWorkbook;
  }

  const workbook = XLSX.readFile(filePath, { cellDates: false, raw: true });
  const sheet = workbook.Sheets.RepExcel || workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw createError('El archivo Excel no contiene hojas de datos.', 500);

  const values = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  });
  const headers = values[0] || [];
  const columns = findHeaderIndexes(headers);
  const rows = values.slice(1).map((cells) => {
    const quarter = quarterForRow(cells[columns.trimestre], cells[columns.mes]);
    return {
      gestion: normalizeText(cells[columns.gestion]),
      departamento: normalizeText(cells[columns.departamento]),
      municipio: normalizeText(cells[columns.municipio]) || '(Sin municipio)',
      tipoIngreso: normalizeText(cells[columns.tipoIngreso]) || '(Sin tipo de ingreso)',
      grupo: normalizeText(cells[columns.grupo]),
      cantidad: parseNumber(cells[columns.cantidad]),
      costo: parseNumber(cells[columns.costo]),
      trimestre: quarter,
      estado: normalizeText(cells[columns.estado]),
    };
  }).filter((row) => row.gestion || row.municipio !== '(Sin municipio)');

  cachedWorkbook = {
    filePath,
    modifiedAt: stats.mtimeMs,
    size: stats.size,
    rows,
  };
  return cachedWorkbook;
}

function uniqueSorted(rows, key, numeric = false) {
  const values = [...new Set(rows.map((row) => row[key]).filter(Boolean))];
  return values.sort((left, right) => (
    numeric
      ? Number(left) - Number(right)
      : left.localeCompare(right, 'es', { sensitivity: 'base' })
  ));
}

function buildOptions(rows) {
  return {
    gestiones: uniqueSorted(rows, 'gestion', true),
    departamentos: uniqueSorted(rows, 'departamento'),
    municipios: uniqueSorted(rows, 'municipio'),
    trimestres: QUARTERS.map((quarter) => quarter.value),
    grupos: uniqueSorted(rows, 'grupo'),
    estadosDeuda: uniqueSorted(rows, 'estado'),
  };
}

function getFilters(query) {
  const gestion = readFilter(query, ['gestion']);
  const trimestre = readFilter(query, ['trimestre']);
  const trimestreValue = trimestre?.toLocaleLowerCase('es');
  const selectedQuarter = trimestre
    ? QUARTERS.find((quarter) => quarter.value.toLocaleLowerCase('es') === trimestreValue)
    : null;

  if (gestion && !/^\d{4}$/.test(gestion)) {
    throw createError('Gestión no válida.');
  }
  if (trimestre && trimestre.toLocaleLowerCase('es') !== 'todos' && !selectedQuarter) {
    throw createError('Trimestre no válido. Seleccione uno de los cuatro trimestres.');
  }

  return {
    gestion,
    des_dep_ori: readFilter(query, ['des_dep_ori']),
    gam_deudor: readFilter(query, ['gam_deudor']),
    trimestre: selectedQuarter?.value || null,
    grp: readFilter(query, ['grp', 'grupo']),
    estado_deuda: readFilter(query, ['estado_deuda']),
  };
}

function filterRows(rows, filters) {
  return rows.filter((row) => (
    QUARTERS.some((quarter) => quarter.value === row.trimestre)
    && (!filters.gestion || row.gestion === filters.gestion)
    && (!filters.des_dep_ori || row.departamento.toLocaleLowerCase('es') === filters.des_dep_ori.toLocaleLowerCase('es'))
    && (!filters.gam_deudor || row.municipio.toLocaleLowerCase('es') === filters.gam_deudor.toLocaleLowerCase('es'))
    && (!filters.trimestre || row.trimestre === filters.trimestre)
    && (!filters.grp || row.grupo.toLocaleLowerCase('es') === filters.grp.toLocaleLowerCase('es'))
    && (!filters.estado_deuda || row.estado.toLocaleLowerCase('es') === filters.estado_deuda.toLocaleLowerCase('es'))
  ));
}

function aggregate(rows, measure, includeIncomeType = false) {
  return [...rows.reduce((groups, row) => {
    const keys = includeIncomeType
      ? [row.municipio, row.tipoIngreso]
      : [row.municipio];
    const groupKey = JSON.stringify(keys);
    let result = groups.get(groupKey);

    if (!result) {
      result = {
        'Nombre Municipio': row.municipio,
        ...(includeIncomeType ? { Des_TipoIngreso: row.tipoIngreso } : {}),
        Suma_Primer_Trimestre: 0,
        Suma_Segundo_Trimestre: 0,
        Suma_Tercer_Trimestre: 0,
        Suma_Cuarto_Trimestre: 0,
        Total_General: 0,
      };
      groups.set(groupKey, result);
    }

    const quarter = QUARTERS.find((item) => item.value === row.trimestre);
    if (quarter) {
      const value = row[measure];
      result[quarter.field] += value;
      result.Total_General += value;
    }
    return groups;
  }, new Map()).values()].sort((left, right) => (
    right.Total_General - left.Total_General
    || left['Nombre Municipio'].localeCompare(right['Nombre Municipio'], 'es')
    || (includeIncomeType
      ? left.Des_TipoIngreso.localeCompare(right.Des_TipoIngreso, 'es')
      : 0)
  ));
}

function aggregateCostBy(rows, key) {
  return [...rows.reduce((totals, row) => {
    const name = row[key] || `(Sin ${key === 'departamento' ? 'departamento' : 'tipo de ingreso'})`;
    totals.set(name, (totals.get(name) || 0) + row.costo);
    return totals;
  }, new Map())]
    .map(([name, total]) => ({ name, total }))
    .sort((left, right) => (
      right.total - left.total || left.name.localeCompare(right.name, 'es')
    ));
}

router.get('/reporte', (req, res) => {
  try {
    const workbook = loadWorkbookRows();
    const filters = getFilters(req.query);
    const filteredRows = filterRows(workbook.rows, filters);
    const { costoServicios, costoSuministros } = filteredRows.reduce(
      (totals, row) => {
        if (row.grupo.toLocaleUpperCase('es') === 'Z') {
          totals.costoSuministros += row.costo;
        } else {
          totals.costoServicios += row.costo;
        }
        return totals;
      },
      { costoServicios: 0, costoSuministros: 0 },
    );

    res.json({
      filtros: filters,
      opciones: buildOptions(workbook.rows),
      tablaCostoTotal: aggregate(filteredRows, 'costo'),
      tablaCantidad: aggregate(filteredRows, 'cantidad'),
      tablaPorTipoIngreso: aggregate(filteredRows, 'costo', true),
      tabla4: aggregate(
        filteredRows.filter((row) => row.grupo.toLocaleUpperCase('es') === 'Z'),
        'costo',
      ),
      tabla5: aggregate(
        filteredRows.filter((row) => row.grupo.toLocaleUpperCase('es') !== 'Z'),
        'costo',
      ),
      graficaDepartamentos: aggregateCostBy(filteredRows, 'departamento'),
      graficaTipoIngreso: aggregateCostBy(filteredRows, 'tipoIngreso'),
      costoServicios,
      costoSuministros,
      registrosFiltrados: filteredRows.length,
      generadoEn: new Date().toISOString(),
    });
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error('[Cobros Excel /reporte]', error.message);
    res.status(status).json({ error: error.message || 'No fue posible generar el reporte de cobros.' });
  }
});

module.exports = router;
