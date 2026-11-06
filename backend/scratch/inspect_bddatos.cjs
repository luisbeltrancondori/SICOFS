const { getPool } = require('../legacy-server/db.cjs');

async function inspectBDDatos2025() {
  const pool = await getPool();
  
  const tables = await pool.request().query(`
    SELECT TABLE_NAME, TABLE_TYPE 
    FROM BDDatos_2025.INFORMATION_SCHEMA.TABLES 
    ORDER BY TABLE_NAME
  `);
  console.table(tables.recordset);

  const defQuery = await pool.request().query(`
    SELECT m.definition 
    FROM BDDatos_2025.sys.sql_modules m
    INNER JOIN BDDatos_2025.sys.views v ON m.object_id = v.object_id
    WHERE v.name = 'v_Consolidado_SICOFS_2025'
  `);
  console.log('--- View Definition from sys.sql_modules ---');
  console.log(defQuery.recordset[0]?.definition?.substring(0, 2000));
  if (defQuery.recordset[0]?.definition?.length > 2000) {
    console.log(defQuery.recordset[0]?.definition?.substring(2000, 4000));
  }

  process.exit(0);
}

inspectBDDatos2025().catch(e => {
  console.error(e);
  process.exit(1);
});
