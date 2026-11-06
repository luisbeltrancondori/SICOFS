const { getPool } = require('../legacy-server/db.cjs');

async function view2025Def() {
  const pool = await getPool();
  const def = await pool.request().query(`
    SELECT OBJECT_DEFINITION(OBJECT_ID('BDDatos_2025.dbo.v_Consolidado_SICOFS_2025')) AS Def
  `);
  console.log('--- v_Consolidado_SICOFS_2025 Definition ---');
  console.log(def.recordset[0]?.Def);

  process.exit(0);
}

view2025Def().catch(e => {
  console.error(e);
  process.exit(1);
});
