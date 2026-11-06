const { getPool } = require('../legacy-server/db.cjs');

async function checkBDCatalogos() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT TABLE_NAME, TABLE_TYPE 
    FROM BDCatalogos.INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME LIKE '%Sum%' OR TABLE_NAME LIKE '%Med%' OR TABLE_NAME LIKE '%Prod%' OR TABLE_NAME LIKE '%Farm%'
    ORDER BY TABLE_NAME
  `);
  console.table(res.recordset);

  // Check columns of t_MovSum
  const movSumCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM BDDatos_2025.INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 't_MovSum'
    ORDER BY ORDINAL_POSITION
  `);
  console.log('\n--- Columns of t_MovSum in BDDatos_2025 ---');
  console.table(movSumCols.recordset);

  // Check columns of t_Suministro in BDDatos_2025
  const sumCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM BDDatos_2025.INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 't_Suministro'
    ORDER BY ORDINAL_POSITION
  `);
  console.log('\n--- Columns of t_Suministro in BDDatos_2025 ---');
  console.table(sumCols.recordset);

  process.exit(0);
}

checkBDCatalogos().catch(e => {
  console.error(e);
  process.exit(1);
});
