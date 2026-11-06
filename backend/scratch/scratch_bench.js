const { getPool, sql } = require('../legacy-server/db.cjs');

async function test() {
  const pool = await getPool();

  console.time('Get Montero establishments');
  const ests = await pool.request().query(`
    SELECT Id_Establecimiento, Des_Establecimiento, Des_Nivel 
    FROM BDCatalogos.dbo.v_Establecimiento 
    WHERE Des_Municipio = 'MONTERO'
  `);
  console.timeEnd('Get Montero establishments');
  const ids = ests.recordset.map(e => e.Id_Establecimiento);
  console.log('Montero IDs (' + ids.length + '):', ids.join(','));

  // Test 1: Query with JOIN (current way)
  console.time('Current query with JOIN');
  const r1 = await pool.request().query(`
    SELECT COUNT(DISTINCT h.Id_Paciente) AS TotalPacientes, COUNT(*) AS TotalAtenciones
    FROM BDDatos_2025.dbo.v_Consolidado_SICOFS_2025 h
    INNER JOIN BDCatalogos.dbo.v_Establecimiento e ON h.Id_Establecimiento = e.Id_Establecimiento
    WHERE e.Des_Municipio = 'MONTERO'
  `);
  console.timeEnd('Current query with JOIN');
  console.log('Result 1:', r1.recordset[0]);

  // Test 2: Query with IN (ids)
  console.time('Query with IN (ids)');
  const r2 = await pool.request().query(`
    SELECT COUNT(DISTINCT h.Id_Paciente) AS TotalPacientes, COUNT(*) AS TotalAtenciones
    FROM BDDatos_2025.dbo.v_Consolidado_SICOFS_2025 h
    WHERE h.Id_Establecimiento IN (${ids.join(',')})
  `);
  console.timeEnd('Query with IN (ids)');
  console.log('Result 2:', r2.recordset[0]);

  // Test 3: Check what v_Consolidado_SICOFS_2025 actually is (view definition)
  const viewDef = await pool.request().query(`
    SELECT OBJECT_DEFINITION(OBJECT_ID('BDDatos_2025.dbo.v_Consolidado_SICOFS_2025')) AS def
  `);
  console.log('View def snippet:', (viewDef.recordset[0].def || '').substring(0, 300));

  await pool.close();
}

test().catch(console.error);
