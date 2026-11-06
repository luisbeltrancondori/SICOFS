const { getPool } = require('../legacy-server/db.cjs');

async function viewDefinition() {
  const pool = await getPool();
  const def = await pool.request().query(`
    SELECT OBJECT_DEFINITION(OBJECT_ID('BDTemporal.dbo.v_Consolidado_SICOFS_Historico')) AS Def
  `);
  console.log('--- View Definition ---');
  console.log(def.recordset[0]?.Def?.substring(0, 1500));
  console.log('\n--- Checking if there is another part ---');
  console.log(def.recordset[0]?.Def?.substring(1500, 3000));
  
  process.exit(0);
}

viewDefinition().catch(e => {
  console.error(e);
  process.exit(1);
});
