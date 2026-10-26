/**
 * ==============================================================================
 * PUNTO DE ENTRADA (SERVER): MICROSERVICIO DE ACTUALIZACIÓN
 * ==============================================================================
 * Inicia el servidor HTTP en el puerto designado (por defecto 3002).
 */

const app = require("./app");

const PORT = process.env.PORT || 3002;
const CREATE_URL = process.env.CREATE_SERVICE_URL || "http://localhost:3001";

app.listen(PORT, () => {
  console.log("=============================================================");
  console.log(`  MICROSERVICIO DE ACTUALIZACIÓN (AUDITORÍA & NEGOCIO)`);
  console.log(`  Puerto de escucha:      http://localhost:${PORT}`);
  console.log(`  Health Check:          http://localhost:${PORT}/health`);
  console.log(`  Historial Auditoría:   http://localhost:${PORT}/api/actualizaciones/historial`);
  console.log(`  Conectado a Catálogo:  ${CREATE_URL}`);
  console.log("=============================================================");
});
