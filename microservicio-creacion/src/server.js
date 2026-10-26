/**
 * ==============================================================================
 * PUNTO DE ENTRADA (SERVER): MICROSERVICIO DE CREACIÓN
 * ==============================================================================
 * Inicia el servidor HTTP en el puerto designado (por defecto 3001).
 */

const app = require("./app");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("=============================================================");
  console.log(`  MICROSERVICIO DE CREACIÓN (CATÁLOGO EN MEMORIA)`);
  console.log(`  Puerto de escucha: http://localhost:${PORT}`);
  console.log(`  Health Check:     http://localhost:${PORT}/health`);
  console.log(`  API Productos:    http://localhost:${PORT}/api/productos`);
  console.log("=============================================================");
});
