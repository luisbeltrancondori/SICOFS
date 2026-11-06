const { getPool } = require('../legacy-server/db.cjs');

async function checkTipoSuministro() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT * FROM BDCatalogos.dbo.t_TipoSuministro
  `);
  console.log('--- BDCatalogos.dbo.t_TipoSuministro ---');
  console.table(res.recordset);

  const sampleSum = await pool.request().query(`
    SELECT TOP 5 Id_Suministro, Cod_Suministro, Des_Suministro, Des_FormaFar, Des_Concentra, Id_TipoSuministro
    FROM BDDatos_2025.dbo.t_Suministro
  `);
  console.log('\n--- Sample t_Suministro ---');
  console.table(sampleSum.recordset);

  process.exit(0);
}

checkTipoSuministro().catch(e => {
  console.error(e);
  process.exit(1);
});
