/**
 * ==============================================================================
 * PRUEBAS UNITARIAS: MICROSERVICIO DE ACTUALIZACIÓN (JEST + SUPERTEST)
 * ==============================================================================
 * Verifica las validaciones de negocio, trazabilidad/auditoría y la lógica
 * de actualización sobre los productos.
 */

const request = require("supertest");
const app = require("../src/app");
const updateController = require("../src/controllers/updateController");
const catalogClient = require("../src/services/catalogClient");

// Espías / mocks para simular la comunicación con el microservicio 1
jest.mock("../src/services/catalogClient");

describe("Microservicio de Actualización - Pruebas Unitarias y Auditoría", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateController.limpiarHistorial();
  });

  describe("GET /health", () => {
    it("Debe retornar 200 con status UP y el nombre del microservicio", async () => {
      const res = await request(app).get("/health");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("UP");
      expect(res.body.servicio).toBe("microservicio-actualizacion");
    });
  });

  describe("GET /api/actualizaciones/historial", () => {
    it("Debe retornar la lista vacía de auditoría inicialmente", async () => {
      const res = await request(app).get("/api/actualizaciones/historial");
      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(0);
      expect(Array.isArray(res.body.datos)).toBe(true);
    });
  });

  describe("PUT /api/actualizaciones/:id", () => {
    it("Debe fallar con 400 si no se envía ningún campo a actualizar", async () => {
      const res = await request(app).put("/api/actualizaciones/1").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Petición inválida");
    });

    it("Debe fallar con 400 si el precio no es un número positivo", async () => {
      const res = await request(app).put("/api/actualizaciones/1").send({ precio: -500 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Validación fallida");
    });

    it("Debe fallar con 400 si la descripción es una cadena vacía", async () => {
      const res = await request(app).put("/api/actualizaciones/1").send({ descripcion: "   " });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Validación fallida");
    });

    it("Debe fallar con 400 si el nombre es una cadena vacía", async () => {
      const res = await request(app).put("/api/actualizaciones/1").send({ nombre: "   " });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Validación fallida");
    });

    it("Debe retornar 404 si el producto no existe en el catálogo", async () => {
      catalogClient.obtenerProductoPorId.mockResolvedValue(null);

      const res = await request(app).put("/api/actualizaciones/999").send({
        precio: 25000,
        motivo: "Ajuste de precio"
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Producto no encontrado");
      expect(catalogClient.obtenerProductoPorId).toHaveBeenCalledWith("999");
    });

    it("Debe actualizar con éxito, invocar al catálogo y guardar la auditoría", async () => {
      const productoExistente = {
        id: 1,
        nombre: "Mouse",
        precio: 19990,
        descripcion: "Mouse óptico ergonómico"
      };

      const productoActualizado = {
        id: 1,
        nombre: "Mouse Gamer Pro",
        precio: 24990,
        descripcion: "Mouse óptico ergonómico con iluminación"
      };

      catalogClient.obtenerProductoPorId.mockResolvedValue(productoExistente);
      catalogClient.actualizarProducto.mockResolvedValue(productoActualizado);

      const res = await request(app).put("/api/actualizaciones/1").send({
        nombre: "Mouse Gamer Pro",
        precio: 24990,
        descripcion: "Mouse óptico ergonómico con iluminación",
        motivo: "Lanzamiento nueva versión"
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.datos.precio).toBe(24990);
      expect(res.body.auditoria).toBeDefined();
      expect(res.body.auditoria.estadoAnterior.precio).toBe(19990);
      expect(res.body.auditoria.estadoNuevo.precio).toBe(24990);

      // Verificamos que el historial registre este cambio
      const historial = await request(app).get("/api/actualizaciones/historial");
      expect(historial.body.total).toBe(1);
    });

    it("Debe manejar errores de conexión o falla con el catálogo (500)", async () => {
      catalogClient.obtenerProductoPorId.mockRejectedValue(new Error("Error de conexión con servicio catálogo"));

      const res = await request(app).put("/api/actualizaciones/1").send({
        precio: 30000
      });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Fallo en la actualización");
    });
  });

  describe("PATCH /api/actualizaciones/:id/precio", () => {
    it("Debe rechazar la petición si no se provee el precio", async () => {
      const res = await request(app).patch("/api/actualizaciones/2/precio").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Validación fallida");
    });

    it("Debe actualizar el precio llamando a la lógica central de actualización", async () => {
      const productoExistente = {
        id: 2,
        nombre: "Teclado",
        precio: 45990,
        descripcion: "Teclado mecánico"
      };

      const productoActualizado = {
        id: 2,
        nombre: "Teclado",
        precio: 39990,
        descripcion: "Teclado mecánico"
      };

      catalogClient.obtenerProductoPorId.mockResolvedValue(productoExistente);
      catalogClient.actualizarProducto.mockResolvedValue(productoActualizado);

      const res = await request(app).patch("/api/actualizaciones/2/precio").send({
        precio: 39990,
        motivo: "Oferta fin de semana"
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.datos.precio).toBe(39990);
    });
  });

  describe("Rutas 404", () => {
    it("Debe retornar 404 para rutas inexistentes", async () => {
      const res = await request(app).get("/ruta-invalida");
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Ruta no encontrada");
    });
  });
});
