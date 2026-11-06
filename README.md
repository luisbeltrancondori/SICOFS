# 🏥 SICOFS — Dashboard de Salud - Pacientes Atendidos

### Gobierno Autónomo Municipal de Montero • Secretaría Municipal de Salud • SUS

Dashboard interactivo de salud pública para consultar y analizar información de pacientes atendidos, servicios, medicamentos y producción de la Red de Salud Montero. La interfaz está desarrollada con **React 18**, **Vite**, **Tailwind CSS**, **Recharts** y **Lucide Icons**. El backend utiliza **Node.js**, **Express** y **SQL Server**.

Esta guía describe cómo instalar, configurar, ejecutar y compilar el sistema en una computadora nueva con **Windows, Linux o macOS**.

---

## 📋 Índice

- [Requisitos previos](#-requisitos-previos)
- [Guía de instalación paso a paso en un nuevo PC](#-guía-de-instalación-paso-a-paso-en-un-nuevo-pc)
- [Preparación de la base de datos](#-preparación-de-la-base-de-datos)
- [Ejecución rápida desde la raíz](#-ejecución-rápida-desde-la-raíz)
- [Compilación y despliegue de producción](#-compilación-y-despliegue-de-producción)
- [Acceso remoto con Cloudflare Tunnel o ngrok](#acceso-remoto-con-cloudflare-tunnel-o-ngrok)
- [Cachés de datos](#-cachés-de-datos)
- [Características del sistema](#-características-del-sistema)
- [Centro de Reportes SICOFS](#-centro-de-reportes-sicofs)
- [Rutas API principales](#-rutas-api-principales)
- [Solución de problemas](#-solución-de-problemas)

---

## 📋 Requisitos previos

1. **Git**, para clonar el repositorio.
2. **Node.js 22 LTS o una versión compatible posterior**, con npm. La versión 22 LTS se recomienda porque los comandos de inicio del backend usan `--env-file-if-exists`.
3. Acceso de red y credenciales válidas para un **SQL Server** que contenga las bases de datos requeridas por el sistema.
4. Un navegador actualizado, como Chrome, Edge, Firefox o Safari.

Comprueba las herramientas desde una terminal:

```bash
git --version
node --version
npm --version
```

Si Node.js no está instalado, descárgalo desde [nodejs.org](https://nodejs.org/) e instala la versión LTS. Cierra y vuelve a abrir la terminal después de la instalación.

---

## 🚀 Guía de instalación paso a paso en un nuevo PC

Los comandos de esta guía se ejecutan desde una terminal. Abre **dos terminales** después de instalar dependencias: una para el backend y otra para el frontend. No cierres la terminal donde se ejecute un servidor.

### Paso 1: Clonar el repositorio

Si todavía no clonaste el proyecto, abre una terminal en la carpeta donde deseas guardarlo y ejecuta:

```bash
git clone <URL_DEL_REPOSITORIO>
cd <CARPETA_DEL_REPOSITORIO>
```

Reemplaza `<URL_DEL_REPOSITORIO>` por la URL de Git del proyecto y `<CARPETA_DEL_REPOSITORIO>` por el nombre de la carpeta creada. Si ya lo clonaste, abre una terminal directamente en la **raíz del proyecto**, es decir, la carpeta que contiene `backend`, `frontend` y este `README.md`.

Confirma que estás en la raíz del proyecto. En Windows PowerShell:

```powershell
Get-Location
Get-ChildItem
```

En Linux o macOS:

```bash
pwd
ls
```

Debes ver las carpetas `backend` y `frontend`.

### Paso 2: Configurar el backend y sus dependencias

Abre una terminal en la **raíz del proyecto** y entra en `backend`.

#### Windows — PowerShell

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

#### Linux o macOS — Terminal

```bash
cd backend
npm install
cp .env.example .env
```

El archivo `.env.example` es una plantilla. Edita el archivo recién creado `backend/.env` y configura las variables que correspondan a tu entorno:

| Variable | Obligatoria | Qué configurar |
|---|---:|---|
| `PORT` | No, salvo que el puerto `3001` esté ocupado | Puerto HTTP del backend. Por defecto es `3001`. Si lo cambias, actualiza también el destino del proxy del frontend en `frontend/vite.config.js`. |
| `DB_SERVER` | Sí | Nombre o dirección del servidor SQL. Para una instancia con nombre puedes usar, por ejemplo, `SERVIDOR\INSTANCIA`. Para una instancia con puerto TCP fijo, usa solo el host, sin `\INSTANCIA`. |
| `DB_DATABASE` | Sí | Base de datos inicial de la conexión. La plantilla usa `BDTemporal`. |
| `DB_USER` | Sí | Usuario SQL autorizado a consultar las bases de datos requeridas. |
| `DB_PASSWORD` | Sí | Contraseña real del usuario SQL. Sustituye `your_password_here`; no uses esa cadena como contraseña productiva. |
| `DB_PORT` | Solo si se usa un puerto TCP fijo | Puerto TCP configurado para la instancia SQL. Si se conecta a una instancia con nombre, déjalo sin definir y asegúrate de que SQL Server Browser y la red permitan resolverla. No supongas que el puerto es `1433`: confirma el valor configurado en el servidor. |

Ejemplo ilustrativo de `backend/.env`:

```dotenv
PORT=3001
DB_SERVER=SERVIDOR\INSTANCIA
DB_DATABASE=BDTemporal
DB_USER=usuario_lectura
DB_PASSWORD=REEMPLAZAR_POR_LA_CLAVE_REAL
# DB_PORT=PUERTO_TCP_REAL
```

No copies este ejemplo como credenciales reales. Para un puerto fijo, configura `DB_SERVER` con el nombre del host (sin `\INSTANCIA`) y agrega `DB_PORT` con el puerto TCP que el administrador de SQL Server haya confirmado.

**Importante:** `backend/.env` contiene secretos. No lo publiques, no lo envíes por correo y no lo agregues al control de versiones.

### Paso 3: Preparar y comprobar el acceso a SQL Server

Este proyecto **no incluye migraciones, scripts para crear las bases de datos ni un proceso de seeding**. Debes contar previamente con las bases de datos oficiales y sus tablas/vistas, o solicitar su restauración y los permisos al administrador de SQL Server.

El backend consulta, según la función y la gestión solicitada:

- `BDDatos_2023`, `BDDatos_2024`, `BDDatos_2025` y `BDDatos_2026`, con las tablas de pacientes, movimientos de servicios y movimientos de suministros que utiliza el dashboard.
- `BDTemporal`, con la vista histórica consolidada que utiliza el Centro de Reportes.
- `BDCatalogos`, con el catálogo de establecimientos usado por los reportes.

El usuario configurado en `.env` necesita permisos de lectura en los objetos consultados de estas bases. `DB_DATABASE` selecciona la base inicial de la conexión; no crea ni restaura las otras bases. Si solo se va a habilitar un subconjunto de gestiones, confirma de todos modos cuáles datos consulta cada sección antes de dar por completada la instalación.

Para una instancia nombrada, confirma con el administrador que SQL Server acepta conexiones remotas, que TCP/IP está habilitado y que la resolución de la instancia está permitida por la red. Si se utiliza un puerto fijo, confirma el puerto y las reglas del firewall. No habilites acceso remoto ni abras puertos en el firewall sin autorización del responsable de infraestructura.

### Paso 4: Instalar dependencias del frontend

Abre una **segunda terminal** en la raíz del proyecto y entra en `frontend`.

#### Windows — PowerShell

```powershell
cd frontend
npm install
```

#### Linux o macOS — Terminal

```bash
cd frontend
npm install
```

### Paso 5: Iniciar el backend

En la primera terminal, que debe estar ubicada en la carpeta `backend`, inicia la API:

```bash
npm run dev
```

También puedes usar el comando de inicio:

```bash
npm start
```

Cuando el backend se inicie correctamente, mostrará que la API está disponible en `http://localhost:3001` (o en el puerto configurado). Mantén esta terminal abierta.

Comprueba la API abriendo esta dirección en el navegador:

```text
http://localhost:3001/health
```

La respuesta esperada es un objeto JSON con `"status":"ok"`. Esta comprobación valida que el servidor HTTP inició; para confirmar la conexión SQL, abre el dashboard y verifica que los datos carguen.

### Paso 6: Iniciar el frontend

En la segunda terminal, ubicada en la carpeta `frontend`, inicia Vite:

```bash
npm run dev
```

Abre la dirección que Vite muestre en la terminal. La configuración del proyecto usa:

```text
http://localhost:3000
```

El frontend envía las peticiones `/api` al backend en `http://127.0.0.1:3001` mediante el proxy de desarrollo. Mantén ambas terminales abiertas. Al entrar al sistema, el menú predeterminado es **Inicio**.

### Paso 7: Detener los servidores

Para detener cada servidor, enfoca la terminal correspondiente y presiona:

```text
Ctrl + C
```

---

## 🗄️ Preparación de la base de datos

La instalación de paquetes de Node.js no instala ni crea las bases de datos. Antes de habilitar el sistema en una computadora nueva:

1. Solicita al administrador de base de datos acceso al SQL Server oficial.
2. Confirma que están disponibles las bases requeridas por las secciones que se utilizarán: `BDTemporal`, `BDCatalogos` y las bases `BDDatos_<gestión>` correspondientes.
3. Confirma que existan las tablas y vistas de origen que consume el backend y que el usuario de `.env` tenga permisos de lectura.
4. Completa `backend/.env` con el host/instancia o el puerto TCP real, base inicial, usuario y contraseña.
5. Inicia el backend y luego valida `/health` y la carga de datos en la interfaz.

Si la institución entrega un respaldo, script oficial o procedimiento de restauración, debe ejecutarlo el DBA siguiendo sus políticas de seguridad y respaldos. **No ejecutes scripts de creación, restauración ni cambios de esquema improvisados contra una base productiva.**

Las cachés JSON son datos precalculados para acelerar la carga; no reemplazan la base de datos fuente. Se pueden regenerar después de configurar el acceso SQL, como se describe en [Cachés de datos](#-cachés-de-datos).

---

## ⚡ Ejecución rápida desde la raíz

Después de haber instalado las dependencias de `backend` y `frontend` y configurado `backend/.env`, también puedes iniciar ambos servicios con el script de desarrollo del proyecto. Ejecuta desde la **raíz**:

```bash
npm run dev
```

Para instalar nuevamente las dependencias si hace falta, ejecuta desde la raíz:

```bash
npm --prefix backend install
npm --prefix frontend install
```

El modo con dos terminales, descrito anteriormente, es el recomendado para principiantes porque permite ver por separado los errores del backend y del frontend.

---

## 📦 Compilación y despliegue de producción

Para generar la versión estática optimizada del frontend, ejecuta desde la **raíz del proyecto**:

```bash
npm run build
```

El resultado se genera en `frontend/dist/`. Comprueba la compilación localmente con:

```bash
cd frontend
npm run preview
```

Vite mostrará la dirección local para abrir la vista previa. La vista previa de Vite sirve los archivos compilados; el backend debe seguir en ejecución para atender las rutas `/api`.

Para un despliegue productivo:

1. Publica `frontend/dist/` en el servidor web institucional.
2. Ejecuta el backend como servicio gestionado por la infraestructura autorizada.
3. Configura el servidor web/reverse proxy para reenviar `/api` al backend.
4. Mantén `backend/.env` fuera de la carpeta pública del sitio y limita sus permisos.
5. Configura TLS/HTTPS, firewall, credenciales y acceso de red de acuerdo con las políticas institucionales.

El proxy de `frontend/vite.config.js` está destinado al desarrollo local. Antes de publicar en otro host o puerto, el administrador debe configurar el enrutamiento de `/api` correspondiente al entorno productivo.

El proyecto incluye `frontend/dashboard.html` como archivo independiente, pero la aplicación React completa usa la API y la base de datos. Para instalar el sistema actual se recomienda ejecutar backend y frontend como se indica en esta guía; abrir un HTML directamente con doble clic no inicia la API.

### Acceso remoto con Cloudflare Tunnel o ngrok

Estas herramientas crean un túnel seguro hacia un servicio que ya se está ejecutando en la computadora. Para una demostración remota sencilla, publica **solo el frontend de desarrollo en el puerto `3000`**: las peticiones `/api` pasan por el proxy de Vite hacia el backend local `3001`. **No publiques el puerto `3001` directamente.**

El túnel no instala el sistema en un servidor y depende de que la computadora permanezca encendida, conectada a Internet y con los servidores locales activos. La aplicación no implementa autenticación propia; utiliza Cloudflare Access o la protección disponible en ngrok para limitar quién puede abrir el sitio. Como el túnel permite consultar los datos que el backend entrega, compártelo únicamente con usuarios autorizados.

#### Opción A: Cloudflare Tunnel

**Para pruebas rápidas y temporales**, Cloudflare ofrece Quick Tunnels. Instala `cloudflared` desde [la documentación oficial de Cloudflare](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) en Windows, Linux o macOS.

1. Inicia el backend en una terminal desde `backend`:

   ```bash
   npm run dev
   ```

2. Inicia el frontend en otra terminal desde `frontend`:

   ```bash
   npm run dev
   ```

3. Abre una tercera terminal e inicia el túnel hacia el frontend:

   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

4. Abre la URL `https://...trycloudflare.com` que muestre la terminal y compártela solo para la prueba. La URL temporal cambia al reiniciar el túnel.

Quick Tunnels no configura una política de acceso para la aplicación. **No lo uses para publicar información sensible o para un servicio permanente.**

**Para un acceso persistente con dominio y control de usuarios:**

1. Usa un dominio administrado en Cloudflare y habilita **Cloudflare Zero Trust**.
2. Instala `cloudflared` desde la documentación oficial en la computadora que ejecutará el sistema.
3. En el panel de Zero Trust, abre **Networks > Tunnels**, crea un túnel, elige `cloudflared` y ejecuta en esa computadora el comando de instalación/conexión que el panel genera para tu sistema operativo. Mantén el túnel en ejecución.
4. En la configuración del túnel, crea una ruta pública para un subdominio, por ejemplo `salud.ejemplo.gob.bo`, con servicio de origen:

   ```text
   http://localhost:3000
   ```

5. En **Access > Applications**, crea una aplicación para ese hostname y una política que permita únicamente las cuentas institucionales autorizadas. Comprueba la política desde una ventana privada antes de compartir el enlace.
6. Inicia backend y frontend como en la prueba rápida. La URL pública usa el mismo origen para la interfaz y `/api`; Vite reenvía las llamadas API a `localhost:3001`.

Para un despliegue productivo, no dejes el servidor de desarrollo de Vite como origen permanente. Publica `frontend/dist/` detrás de un servidor web o reverse proxy que entregue la interfaz y reenvíe `/api` al backend; apunta el túnel a ese proxy y conserva la política de Cloudflare Access. El proyecto no incluye actualmente una configuración de servidor web productivo.

#### Opción B: ngrok

1. Crea una cuenta en [ngrok](https://ngrok.com/) y sigue la guía oficial para instalar ngrok en Windows, Linux o macOS.
2. Desde el panel de ngrok, copia tu authtoken. Regístralo una sola vez en la terminal:

   ```bash
   ngrok config add-authtoken <TU_AUTHTOKEN>
   ```

   Reemplaza `<TU_AUTHTOKEN>` por el token de tu cuenta. No lo compartas ni lo publiques.

3. Inicia el backend y el frontend en sus terminales siguiendo los pasos de instalación. Comprueba que `http://localhost:3000` abre el dashboard.
4. En una tercera terminal, crea el túnel solo al puerto del frontend:

   ```bash
   ngrok http 3000
   ```

5. Abre la URL HTTPS que ngrok muestre y úsala mientras el proceso del túnel esté activo. En el plan o configuración que lo permita, restringe el acceso con autenticación/Traffic Policy antes de compartirlo. Si utilizas autenticación básica de ngrok, crea una contraseña temporal y fuerte; no reutilices credenciales institucionales.
6. No cierres la terminal de ngrok ni las del backend/frontend durante la demostración. Al terminar, detén cada proceso con `Ctrl + C`.

La dirección pública puede cambiar al reiniciar ngrok, según el plan y la configuración de la cuenta. Esta opción es para demostraciones temporales del servidor de desarrollo, no para alojar producción.

#### ¿Cuál opción usar?

| Necesidad | Recomendación |
|---|---|
| Compartir una demostración por poco tiempo | ngrok o un Quick Tunnel de Cloudflare, con control de acceso y únicamente con usuarios autorizados. |
| Mantener un hostname institucional y restringir usuarios | Cloudflare Tunnel con dominio propio y Cloudflare Access. |
| Servicio productivo continuo | Despliegue en infraestructura administrada, frontend compilado, reverse proxy para `/api`, HTTPS y controles de acceso institucionales. No depender de una computadora personal ni del servidor de desarrollo. |

---

## ⚙️ Cachés de datos

La aplicación puede utilizar archivos JSON precalculados ubicados en `backend/`. La generación requiere que el SQL Server esté accesible y que `backend/.env` tenga credenciales válidas. Ejecuta los comandos desde la **raíz del proyecto**:

| Comando | Uso |
|---|---|
| `npm run cache:all` | Regenera todas las cachés de pacientes, servicios, volumen de servicios, medicamentos y producción. Puede tardar y realizar consultas intensivas; ejecútalo de forma planificada. |
| `npm run cache:pacientes` | Regenera la caché del dashboard de pacientes. |
| `npm run cache:servicios` | Regenera cachés de servicios y del volumen por establecimiento y mes. |
| `npm run cache:servicios:volumen` | Regenera solamente el volumen por establecimiento y mes de servicios. |
| `npm run cache:medicamentos` | Regenera la caché de medicamentos. |
| `npm run cache:produccion` | Regenera la caché de producción. |

Al finalizar una generación, reinicia el backend para que vuelva a cargar los archivos. No borres ni sustituyas las cachés existentes sin confirmar que la conexión a SQL Server funciona y que el proceso de generación terminó correctamente.

---

## 📊 Características del sistema

1. **Encabezado institucional**
   - Identidad del Gobierno Autónomo Municipal de Montero y del Sistema Único de Salud (SUS).
   - Controles para modo oscuro/claro, impresión y exportación, según la vista.

2. **Menú de navegación**
   - Inicio, Servicios, Pacientes, Medicamentos, Producción y Reportes.
   - La pestaña **Inicio** es la opción predeterminada al abrir la aplicación.

3. **Filtros y análisis de pacientes**
   - Filtros por gestión, mes, sexo y establecimiento.
   - Indicadores KPI, evolución mensual, distribución por sexo y ranking de establecimientos.
   - Tabla de establecimientos con búsqueda, ordenamiento y exportación disponible.
   - Reporte al final de la vista con pacientes por edad/grupo etario, totales y visualización gráfica por establecimiento.

4. **Servicios, medicamentos y producción**
   - Dashboards, tablas y gráficos específicos para las secciones disponibles en el menú.
   - Filtros, análisis y exportaciones según la funcionalidad de cada vista.

5. **Lema y actualización**
   - *“Más salud, mejor futuro”*.
   - Indicador de última actualización en la vista de pacientes.

---

## 📑 Centro de Reportes SICOFS

El menú **Reportes** reúne informes ejecutivos imprimibles, monitoreo financiero y exportación agregada:

- Informe mensual de consolidación, ficha por centro de salud y consolidado anual para rendición de cuentas.
- Vista previa imprimible desde el botón **Imprimir / Guardar PDF** del informe generado.
- Exportación filtrada por gestión, mes, centro, grupo, texto del servicio y rango de fechas. CSV se puede abrir directamente en Excel; también está disponible JSON.
- Dataset abierto agregado por gestión, mes, establecimiento, grupo y servicio. No incluye identificadores ni datos personales de pacientes. Cada descarga tiene un límite de 50.000 filas e informa si el resultado quedó truncado.

**Alcance de auditoría:** la fuente histórica contiene ejecución real, pero no presupuesto aprobado por partida ni datos de capacidad instalada. Por ello la pantalla no inventa desviaciones presupuestarias o porcentajes de saturación; ambos requieren integrar sus fuentes oficiales para habilitar esos cálculos.

Para regenerar los datos precalculados de servicios, ejecuta `npm run cache:servicios`. Esto incluye el desglose de volumen por establecimiento y mes, que se carga desde caché para evitar repetir agregaciones lentas en cada visita al dashboard. La generación completa (`npm run cache:all`) también incluye este desglose. Si solo falta ese componente, ejecuta `npm run cache:servicios:volumen`; luego reinicia el backend para que lea la caché actualizada.

---

## 🔌 Rutas API principales

La API se sirve en el puerto `3001` por defecto. En desarrollo, Vite reenvía las peticiones `/api` al backend.

### Pacientes

- `GET /health`: estado del servidor API.
- `GET /api/filters/years`: gestiones disponibles para pacientes.
- `GET /api/filters/establecimientos`: establecimientos disponibles.
- `GET /api/dashboard-all`: indicadores, evolución mensual, principales establecimientos y distribución por sexo.
- `GET /api/reporte-grupo-etario`: distribución por edad para el reporte de pacientes.
- `GET /api/kpis`: indicadores principales.
- `GET /api/evolucion-mensual`: pacientes y atenciones por mes.
- `GET /api/top-establecimientos`: ranking de establecimientos.
- `GET /api/distribucion-sexo`: distribución por sexo.
- `GET /api/detalle-establecimiento`: detalle mensual de un establecimiento.

Las rutas de pacientes aceptan los parámetros aplicables a cada consulta, incluyendo `year`, `mes`, `sexo` e `id_establecimiento`.

### Servicios, medicamentos y producción

- `GET /api/servicios/filters` y `GET /api/servicios/dashboard-all`.
- `GET /api/medicamentos/filters` y `GET /api/medicamentos/dashboard-all`.
- `GET /api/produccion/filters` y `GET /api/produccion/dashboard-all`.

### Cobros intermunicipales desde Excel

- `GET /api/cobros/reporte`: lee `RepExcelCobros1.xlsx` desde la raíz del proyecto (o la ruta definida en `COBROS_EXCEL_PATH`) y devuelve las matrices de costo total, cantidad y costo por tipo de ingreso.
- Admite `gestion`, `des_dep_ori`, `gam_deudor`, `trimestre`, `grp` y `estado_deuda`; los valores disponibles para los selectores vienen en `opciones`.
- Las tablas presentan los cuatro trimestres del año. El archivo debe incluir una columna `Gam Deudor` o, como alternativa, `Des_MunOri`.

### Centro de Reportes SICOFS

- `GET /api/reportes/filters`: gestiones, grupos y los 12 establecimientos de la red.
- `GET /api/reportes/executive`: resumen de atenciones, pacientes únicos, servicios, costo ejecutado, desglose por nivel y prestaciones principales.
- `GET /api/reportes/dataset`: datos agregados para exportación; admite `year`, `month`, `facility`, `group`, `service`, `fromDate`, `toDate` y `limit`.

---

## 🧰 Solución de problemas

### El comando `node` o `npm` no se reconoce

- Instala Node.js 22 LTS o una versión compatible posterior desde [nodejs.org](https://nodejs.org/).
- Cierra y vuelve a abrir la terminal para que se actualice el `PATH`.
- Comprueba de nuevo `node --version` y `npm --version`.

### El backend no inicia por la opción `--env-file-if-exists`

- Comprueba la versión con `node --version`; utiliza Node.js 22 LTS o una versión compatible posterior.
- Si acabas de instalar Node, abre una terminal nueva.

### La API no puede conectar con SQL Server

- Revisa que `backend/.env` exista y que `DB_SERVER`, `DB_DATABASE`, `DB_USER` y `DB_PASSWORD` sean correctos.
- Confirma con el DBA que el servidor está encendido, que las bases requeridas existen y que el usuario tiene permisos.
- Para una instancia nombrada, confirma que el nombre sea correcto y que SQL Server Browser/resolución de instancia y firewall permitan la conexión.
- Para un puerto fijo, usa el host sin `\INSTANCIA` y especifica el puerto TCP real en `DB_PORT`.
- No supongas que el puerto es `1433`.
- Revisa la terminal del backend; allí se registran errores de conexión y consulta.

### El navegador muestra error de conexión, CORS o `Failed to fetch`

- Asegúrate de que **backend y frontend estén ejecutándose a la vez**.
- Comprueba que el backend responda en `http://localhost:3001/health`.
- Comprueba que el puerto del backend coincida con el destino configurado en `frontend/vite.config.js`.
- Accede al frontend mediante la URL que muestra Vite (por defecto `http://localhost:3000`), no abriendo la aplicación desde un archivo `file://`.
- Si accedes desde otra computadora, revisa el proxy, las direcciones de red, HTTPS/CORS y firewall con el administrador del sistema. No expongas el backend directamente a Internet.

### El puerto `3000` del frontend está ocupado

- Detén la aplicación que usa ese puerto o pide al administrador que asigne y configure otro puerto.
- La configuración actual utiliza `strictPort: true`: Vite se detiene en vez de cambiar de puerto silenciosamente.

### El puerto `3001` del backend está ocupado

- Detén el proceso anterior del backend o cambia `PORT` en `backend/.env`.
- Si cambias el puerto, actualiza el destino del proxy en `frontend/vite.config.js` y reinicia ambos servidores.

### El dashboard abre, pero no aparecen datos

- Verifica que las bases, tablas y vistas de origen estén instaladas y accesibles.
- Confirma que haya datos para la gestión y filtros seleccionados.
- Consulta los errores de la terminal del backend y la respuesta de la pestaña **Network/Red** de las herramientas de desarrollo del navegador.
- Si la respuesta usa caché, verifica que el archivo correspondiente de `backend/` exista. Regenera esa caché solamente después de confirmar la conexión con la base.

### Un comando de caché falla o tarda mucho

- Los comandos de caché ejecutan consultas a SQL Server y pueden tardar según el volumen de datos y el rendimiento de la red.
- Revisa la conexión, permisos y logs en la terminal.
- Ejecuta un comando específico (`cache:pacientes`, `cache:servicios`, `cache:servicios:volumen`, `cache:medicamentos` o `cache:produccion`) cuando no sea necesario regenerar todas las cachés.
- Espera a que el proceso finalice antes de reiniciar el backend.

### `npm install` falla

- Comprueba que estés dentro de la carpeta correcta (`backend` o `frontend`) y que esa carpeta contenga `package.json`.
- Comprueba la conexión a Internet o al registro privado de paquetes de la institución.
- Revisa que la versión de Node.js sea compatible y vuelve a ejecutar `npm install`.

---

## 🔐 Seguridad

- No publiques `backend/.env` ni compartas sus contraseñas.
- Usa una cuenta SQL de mínimo privilegio, preferentemente de solo lectura para los objetos que consume el dashboard.
- No expongas las bases de datos ni el backend a Internet sin controles de seguridad aprobados.
- Mantén las dependencias y el sistema operativo actualizados según las políticas de la institución.
