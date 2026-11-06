const { getPool } = require('../legacy-server/db.cjs');

async function checkDef() {
  const pool = await getPool();
  const res = await pool.request().query(`
    USE BDDatos_2023;
    SELECT OBJECT_DEFINITION(OBJECT_ID('v_Consolidado_SICOFS_2023')) AS Def;
  `);
  console.log(res.recordset[0]?.Def?.substring(0, 2000));
  process.exit(0);
}

checkDef().catch(e => { console.error(e); process.exit(1); });
