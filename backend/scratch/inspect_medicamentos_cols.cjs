const { getPool } = require('../legacy-server/db.cjs');

async function inspectColumns() {
  const pool = await getPool();

  console.log('--- Columns of BDTemporal.dbo.v_Consolidado_SICOFS_Historico ---');
  const vCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM BDTemporal.INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'v_Consolidado_SICOFS_Historico'
  `);
  console.table(vCols.recordset);

  console.log('\n--- Columns of BDDatos_2025.dbo.t_MovMed ---');
  const mCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM BDDatos_2025.INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 't_MovMed'
  `);
  console.table(mCols.recordset);

  console.log('\n--- Columns of BDCatalogos.dbo.v_Medicamento or t_Medicamento ---');
  const medCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM BDCatalogos.INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 't_Medicamento'
  `);
  console.table(medCols.recordset);

  console.log('\n--- Columns of BDCatalogos.dbo.t_GrupoMedicamentos ---');
  const grpCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM BDCatalogos.INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 't_GrupoMedicamentos'
  `);
  console.table(grpCols.recordset);

  console.log('\n--- Sample 3 records from v_Consolidado_SICOFS_Historico WHERE Grupo = "M" ---');
  const sampleV = await pool.request().query(`
    SELECT TOP 3 *
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
    WHERE Grupo = 'M'
  `);
  console.log(sampleV.recordset);

  console.log('\n--- Sample 3 records from BDDatos_2025.dbo.t_MovMed ---');
  const sampleM = await pool.request().query(`
    SELECT TOP 3 *
    FROM BDDatos_2025.dbo.t_MovMed
  `);
  console.log(sampleM.recordset);

  process.exit(0);
}

inspectColumns().catch(e => {
  console.error(e);
  process.exit(1);
});
