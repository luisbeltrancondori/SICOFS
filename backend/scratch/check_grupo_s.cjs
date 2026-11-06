const { getPool } = require('../legacy-server/db.cjs');

async function checkGrupoS() {
  const pool = await getPool();

  console.log('--- Sample 10 records from v_Consolidado_SICOFS_Historico WHERE Grupo = "S" ---');
  const sampleS = await pool.request().query(`
    SELECT TOP 10 
      Gestion, Año, Mes, Id_Establecimiento, Id_Paciente,
      Grupo, Codigo, [Nombre Servicio/Suministro], Cantidad, Costo_Unitario, Costo_Total
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
    WHERE Grupo = 'S'
  `);
  console.table(sampleS.recordset);

  console.log('\n--- Top 10 Suministros/Medicamentos by total count in 2025 ---');
  const top2025 = await pool.request().query(`
    SELECT TOP 10 
      Codigo, 
      [Nombre Servicio/Suministro] AS Nombre, 
      SUM(Cantidad) AS CantidadTotal, 
      SUM(Costo_Total) AS CostoTotal,
      AVG(Costo_Unitario) AS CostoUnitarioPromedio,
      COUNT(*) AS Registros
    FROM BDTemporal.dbo.v_Consolidado_SICOFS_Historico
    WHERE Grupo = 'S' AND Gestion = 2025
    GROUP BY Codigo, [Nombre Servicio/Suministro]
    ORDER BY SUM(Cantidad) DESC
  `);
  console.table(top2025.recordset);

  console.log('\n--- Check what databases exist on this SQL Server ---');
  const dbs = await pool.request().query(`SELECT name FROM sys.databases ORDER BY name`);
  console.table(dbs.recordset);

  process.exit(0);
}

checkGrupoS().catch(e => {
  console.error(e);
  process.exit(1);
});
