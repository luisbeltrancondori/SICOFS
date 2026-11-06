const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const counterPath = path.join(__dirname, '..', 'counter.json');
const usersPath = path.join(__dirname, '..', 'users.json');
const accessLogsPath = path.join(__dirname, '..', 'access_logs.txt');

function readUsers() {
  return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
}

function writeUsers(users) {
  const temporaryPath = `${usersPath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(users, null, 2), 'utf8');
  fs.renameSync(temporaryPath, usersPath);
}

function isAdmin(adminEmail) {
  const email = String(adminEmail || '').trim().toLowerCase();
  return readUsers().some((item) => (
    String(item.email).trim().toLowerCase() === email
    && item.rol === 'administrador'
    && (item.estado || 'aprobado') === 'aprobado'
 ));
}

router.post('/visitas/incrementar', (req, res, next) => {
  try {
    const counter = JSON.parse(fs.readFileSync(counterPath, 'utf8'));
    const currentTotal = Number.isInteger(counter.total) && counter.total >= 0 ? counter.total : 0;
    const updatedCounter = { total: currentTotal + 1 };
    const temporaryPath = `${counterPath}.tmp`;

    fs.writeFileSync(temporaryPath, JSON.stringify(updatedCounter, null, 2), 'utf8');
    fs.renameSync(temporaryPath, counterPath);

    res.json(updatedCounter);
  } catch (error) {
    next(error);
  }
});

router.post('/auth/login', (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = users.find((item) => (
      String(item.email).trim().toLowerCase() === email && item.password === password
    ));

    if (!user || (user.estado || 'aprobado') !== 'aprobado') {
      if (user && user.estado === 'pendiente') {
        return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación.' });
      }
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const logLine = `[${new Date().toISOString()}] email=${email}\n`;
    fs.appendFileSync(accessLogsPath, logLine, 'utf8');

    res.json({
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      estado: 'aprobado',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/auth/register', (req, res, next) => {
  try {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (nombre.length < 3) return res.status(400).json({ error: 'Ingrese su nombre completo.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Ingrese un correo válido.' });
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });

    const users = readUsers();
    if (users.some((item) => String(item.email).trim().toLowerCase() === email)) {
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }

    users.push({
      nombre,
      email,
      password,
      rol: 'usuario',
      estado: 'pendiente',
    });
    writeUsers(users);

    res.status(201).json({
      message: 'Registro enviado. Su cuenta está pendiente de aprobación por el administrador.',
      estado: 'pendiente',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/auth/pending', (req, res, next) => {
  try {
    if (!isAdmin(req.headers['x-admin-email'])) {
      return res.status(403).json({ error: 'Acceso restringido al administrador.' });
    }
    const pending = readUsers()
      .filter((item) => item.estado === 'pendiente')
      .map(({ nombre, email, rol, estado }) => ({ nombre, email, rol, estado }));
    res.json(pending);
  } catch (error) {
    next(error);
  }
});

router.post('/auth/approve', (req, res, next) => {
  try {
    if (!isAdmin(req.headers['x-admin-email'])) {
      return res.status(403).json({ error: 'Acceso restringido al administrador.' });
    }
    const email = String(req.body.email || '').trim().toLowerCase();
    const action = String(req.body.action || '').toLowerCase();
    if (!email || !['aprobar', 'rechazar'].includes(action)) {
      return res.status(400).json({ error: 'Solicitud inválida.' });
    }

    const users = readUsers();
    const index = users.findIndex((item) => String(item.email).trim().toLowerCase() === email);
    if (index === -1) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (action === 'rechazar') {
      users.splice(index, 1);
    } else {
      users[index].estado = 'aprobado';
    }
    writeUsers(users);

    res.json({ message: action === 'aprobar' ? 'Usuario aprobado correctamente.' : 'Registro rechazado.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
