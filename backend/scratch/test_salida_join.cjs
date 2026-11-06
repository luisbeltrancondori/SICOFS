const { getPool } = require('../legacy-server/db.cjs');

async function testJoinSalida() {
  const pool = await getPool();

  const res = await pool.request().query(`
    SELECT TOP 5 
      ms.Id_Salida, 
      ms.Id_Suministro, 
      ms.Dispensado,
      ser.Id_Servicio,
      ts.Des_TipoServicio
    FROM BDDatos_2025.dbo.t_MovSum ms
    LEFT JOIN BDDatos_2025.dbo.t_MovSer ser ON ms.Id_Salida = ser.Id_Salida AND ms.Id_Establecimiento = ser.Id_Establecimiento
    LEFT JOIN BDCatalogos.dbo.t_Servicio s ON ser.Id_Servicio = s.Id_Servicio
    LEFT JOIN BDCatalogos.dbo.t_TipoServicio ts ON s.Id_TipoServicio = ts.Id_TipoServicio
    WHERE ms.Id_Suministro > 0
  `);
  console.log('--- Join MovSum and MovSer on Id_Salida ---');
  console.table(res.recordset);

  process.exit(0);
}

testJoinSalida().catch(e => {
  console.error(e);
  process.exit(1);
});
