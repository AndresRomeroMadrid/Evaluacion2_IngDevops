/**
 * ==============================================================================
 * SERVIDOR FRONTEND (BFF - BACKEND FOR FRONTEND)
 * ==============================================================================
 * Sirve los archivos estáticos de la interfaz gráfica y actúa como gateway/proxy
 * hacia los microservicios de creación (3001) y actualización (3002).
 */

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// URLs internas para comunicación entre contenedores o localmente
const CREATE_SERVICE_URL = process.env.CREATE_SERVICE_URL || "http://localhost:3001";
const UPDATE_SERVICE_URL = process.env.UPDATE_SERVICE_URL || "http://localhost:3002";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Endpoint de Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    servicio: "frontend-dashboard",
    timestamp: new Date().toISOString()
  });
});

// Endpoint de configuración de entorno para el cliente JavaScript
app.get("/api/config", (req, res) => {
  res.json({
    createServiceUrl: CREATE_SERVICE_URL,
    updateServiceUrl: UPDATE_SERVICE_URL
  });
});

// Proxy BFF hacia el Microservicio de Creación
app.all("/api/proxy/creacion*", async (req, res) => {
  try {
    const targetPath = req.url.replace("/api/proxy/creacion", "");
    const url = `${CREATE_SERVICE_URL}${targetPath}`;
    
    const options = {
      method: req.method,
      headers: { "Content-Type": "application/json" }
    };

    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({
      error: "Servicio no disponible",
      mensaje: `No se pudo comunicar con el Microservicio de Creación: ${err.message}`
    });
  }
});

// Proxy BFF hacia el Microservicio de Actualización
app.all("/api/proxy/actualizacion*", async (req, res) => {
  try {
    const targetPath = req.url.replace("/api/proxy/actualizacion", "");
    const url = `${UPDATE_SERVICE_URL}${targetPath}`;

    const options = {
      method: req.method,
      headers: { "Content-Type": "application/json" }
    };

    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({
      error: "Servicio no disponible",
      mensaje: `No se pudo comunicar con el Microservicio de Actualización: ${err.message}`
    });
  }
});

app.listen(PORT, () => {
  console.log("=============================================================");
  console.log(`  FRONTEND DASHBOARD WEB OPERATIVO`);
  console.log(`  Acceso URL:             http://localhost:${PORT}`);
  console.log(`  Microservicio Creación: ${CREATE_SERVICE_URL}`);
  console.log(`  Microservicio Updates:  ${UPDATE_SERVICE_URL}`);
  console.log("=============================================================");
});
