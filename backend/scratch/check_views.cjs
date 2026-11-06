const { getPool } = require('../legacy-server/db.cjs');

async function checkViews() {
  const pool = await getPool();

  const vList = await pool.request().query(`
    SELECT TABLE_NAME, TABLE_TYPE 
    FROM BDDatos_2025.INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME LIKE 'v_Mov%'
  `);
  console.table(vList.recordset);

  for (const row of vList.recordset) {
    const def = await pool.request().query(`
      SELECT m.definition 
      FROM BDDatos_2025.sys.sql_modules m
      INNER JOIN BDDatos_2025.sys.views v ON m.object_id = v.object_id
      WHERE v.name = '${row.TABLE_NAME}'
    `);
    console.log(`\n=== Definition of ${row.TABLE_NAME} ===`);
    console.log(def.recordset[0]?.definition?.substring(0, 500));
  }

  process.exit(0);
}

checkViews().catch(e => {
  console.error(e);
  process.exit(1);
});
