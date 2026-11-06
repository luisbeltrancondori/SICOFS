const fs = require('fs');
const path = require('path');
const { getPool } = require('../db.cjs');

const YEARS = [2023, 2024, 2025, 2026];
const CACHE_FILE = path.join(__dirname, '..', 'cache_servicios.json');

async function main() {
  if (!fs.existsSync(CACHE_FILE)) {
    throw new Error('No existe cache_servicios.json. Genera primero la caché base de servicios.');
  }

  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  const pool = await getPool();

  try {
    for (const year of YEARS) {
      if (!cache[year]) {
        console.warn(`[Servicios volumen] Se omite ${year}: no hay caché base para esta gestión.`);
        continue;
      }

      console.time(`[Servicios volumen] ${year}`);
      const result = await pool.request().query(`
        SELECT
          m.Id_Mes AS mes,
          m.Id_Establecimiento,
          ISNULL(e.Des_Establecimiento, 'Establecimiento ' + CAST(m.Id_Establecimiento AS VARCHAR)) AS establecimiento,
          ISNULL(e.Des_Nivel, 'No definido') AS nivel,
          SUM(m.Cantidad) AS cantidad,
          COUNT(*) AS atenciones,
          COUNT(DISTINCT NULLIF(m.Id_Paciente, 0)) AS pacientesUnicos
        FROM BDDatos_${year}.dbo.t_MovSer m
        LEFT JOIN BDCatalogos.dbo.v_Establecimiento e
          ON m.Id_Establecimiento = e.Id_Establecimiento
        GROUP BY m.Id_Mes, m.Id_Establecimiento, e.Des_Establecimiento, e.Des_Nivel
        ORDER BY m.Id_Mes, establecimiento
      `);

      const volumeRows = result.recordset;
      cache[year].volumenPorEstablecimiento = volumeRows;

      for (const [month, monthData] of Object.entries(cache[year].byMonth || {})) {
        monthData.volumenPorEstablecimiento = volumeRows.filter((row) => Number(row.mes) === Number(month));
      }

      console.timeEnd(`[Servicios volumen] ${year}`);
      console.log(`[Servicios volumen] ${year}: ${volumeRows.length} filas mensuales por establecimiento.`);
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
    console.log(`[Servicios volumen] Caché actualizada: ${CACHE_FILE}`);
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error('[Servicios volumen] Error al generar caché:', error.message);
  process.exitCode = 1;
});
