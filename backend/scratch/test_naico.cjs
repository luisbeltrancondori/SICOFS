const { getPool } = require('../legacy-server/db.cjs');

async function testNaico() {
  const pool = await getPool();
  console.log('Testing NAICO (700559) 2026 with and without Id_Paciente = 0...');

  // Without filter
  const qAll = await pool.request().query(`
    WITH Combined AS (
      SELECT Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total
      FROM BDDatos_2026.dbo.t_MovSer WHERE Id_Establecimiento = 700559
      UNION ALL
      SELECT Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total
      FROM BDDatos_2026.dbo.t_MovSum WHERE Id_Establecimiento = 700559
    )
    SELECT SUM(Costo_Total) AS TotalCosto
    FROM Combined
  `);
  console.log('All patients (current):', qAll.recordset[0]?.TotalCosto);

  // With Id_Paciente <> 0
  const qFilter = await pool.request().query(`
    WITH Combined AS (
      SELECT Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total
      FROM BDDatos_2026.dbo.t_MovSer WHERE Id_Establecimiento = 700559 AND Id_Paciente <> 0
      UNION ALL
      SELECT Id_Mes, Id_Establecimiento, Id_Paciente, Costo_Total
      FROM BDDatos_2026.dbo.t_MovSum WHERE Id_Establecimiento = 700559 AND Id_Paciente <> 0
    )
    SELECT SUM(Costo_Total) AS TotalCosto
    FROM Combined
  `);
  console.log('With Id_Paciente <> 0 (expected ~108.584,59):', qFilter.recordset[0]?.TotalCosto);

  process.exit(0);
}

testNaico().catch(e => { console.error(e); process.exit(1); });
