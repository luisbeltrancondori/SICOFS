const express = require('express');
const cors = require('cors');
const pacientesRouter = require('./routes/pacientes.cjs');
const serviciosRouter = require('./routes/servicios.cjs');
const medicamentosRouter = require('./routes/medicamentos.cjs');
const produccionRouter = require('./routes/produccion.cjs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', pacientesRouter);
app.use('/api/servicios', serviciosRouter);
app.use('/api/medicamentos', medicamentosRouter);
app.use('/api/produccion', produccionRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`✅ API Server corriendo en http://localhost:${PORT}`);
});
