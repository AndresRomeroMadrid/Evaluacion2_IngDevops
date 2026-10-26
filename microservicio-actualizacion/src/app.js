/**
 * ==============================================================================
 * APLICACIÓN EXPRESS: MICROSERVICIO DE ACTUALIZACIÓN DE PRODUCTOS
 * ==============================================================================
 * Configura los middlewares, políticas CORS y expone las rutas REST
 * correspondientes al microservicio 2.
 */

const express = require("express");
const cors = require("cors");
const updateController = require("./controllers/updateController");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Log de solicitudes para observabilidad
app.use((req, res, next) => {
  const ahora = new Date().toISOString();
  console.log(`[MICROSERVICIO-ACTUALIZACION] [${ahora}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/health", updateController.healthCheck);

// Rutas de actualización y auditoría
app.get("/api/actualizaciones/historial", updateController.obtenerHistorial);
app.put("/api/actualizaciones/:id", updateController.actualizarProducto);
app.patch("/api/actualizaciones/:id/precio", updateController.actualizarPrecio);

// Manejador 404
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    mensaje: `La ruta ${req.method} ${req.url} no existe en el microservicio de actualización.`
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error("[ERROR INTERNO ACTUALIZACION]:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    mensaje: err.message
  });
});

module.exports = app;
