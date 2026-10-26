/**
 * ==============================================================================
 * APLICACIÓN EXPRESS: MICROSERVICIO DE CREACIÓN Y LISTA DE PRODUCTOS
 * ==============================================================================
 * Este archivo configura middlewares, CORS, parsers y define las rutas REST
 * expuestas por el microservicio 1.
 */

const express = require("express");
const cors = require("cors");
const productController = require("./controllers/productController");

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Log básico de peticiones para auditoría y trazabilidad
app.use((req, res, next) => {
  const ahora = new Date().toISOString();
  console.log(`[MICROSERVICIO-CREACION] [${ahora}] ${req.method} ${req.url}`);
  next();
});

// Ruta de Health Check
app.get("/health", productController.healthCheck);

// Rutas de la API de Productos
app.get("/api/productos", productController.listarProductos);
app.get("/api/productos/:id", productController.obtenerProductoPorId);
app.post("/api/productos", productController.crearProducto);
app.put("/api/productos/:id", productController.modificarProducto);
app.delete("/api/productos/:id", productController.borrarProducto);

// Middleware para manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    mensaje: `La ruta ${req.method} ${req.url} no existe en este microservicio.`
  });
});

// Middleware para manejo global de errores (500)
app.use((err, req, res, next) => {
  console.error("[ERROR INTERNO CREACION]:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    mensaje: err.message
  });
});

module.exports = app;
