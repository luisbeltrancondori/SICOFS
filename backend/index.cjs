const express = require('express');
const cors = require('cors');
const pacientesRouter = require('./routes/pacientes.cjs');
const serviciosRouter = require('./routes/servicios.cjs');
const serviciosSUSRouter = require('./routes/servicios-sus.cjs');
const medicamentosRouter = require('./routes/medicamentos.cjs');
const produccionRouter = require('./routes/produccion.cjs');
const reportesRouter = require('./routes/reportes.cjs');
const cobrosRouter = require('./routes/cobros-excel.cjs');
const localDataRouter = require('./routes/local-data.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', pacientesRouter);
app.use('/api/servicios', serviciosRouter);
app.use('/api/servicios-sus', serviciosSUSRouter);
app.use('/api/medicamentos', medicamentosRouter);
app.use('/api/produccion', produccionRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/cobros', cobrosRouter);
app.use('/api', localDataRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta API no encontrada.',
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(`[API ${req.method} ${req.originalUrl}]`, err.message);
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600
    ? err.status
    : 500;
  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor.' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`✅ API Server corriendo en http://localhost:${PORT}`);
});
