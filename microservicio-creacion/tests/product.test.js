/**
 * ==============================================================================
 * PRUEBAS UNITARIAS: MICROSERVICIO DE CREACIÓN (JEST + SUPERTEST)
 * ==============================================================================
 * Verifica el correcto funcionamiento de las operaciones de consulta, inserción
 * y validación en la lista en memoria de productos.
 */

const request = require("supertest");
const app = require("../src/app");
const productStore = require("../src/data/productStore");

describe("Microservicio de Creación - Pruebas de API y Almacén", () => {
  // Antes de cada prueba, se restablecen los datos por defecto (Mouse, Teclado, Monitor)
  beforeEach(() => {
    productStore.restablecerDatos();
  });

  describe("GET /health", () => {
    it("Debe responder 200 con status UP y nombre del microservicio", async () => {
      const res = await request(app).get("/health");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("UP");
      expect(res.body.servicio).toBe("microservicio-creacion");
      expect(res.body).toHaveProperty("timestamp");
    });
  });

  describe("GET /api/productos", () => {
    it("Debe obtener la lista de productos inicial con Mouse, Teclado y Monitor", async () => {
      const res = await request(app).get("/api/productos");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.datos)).toBe(true);
      expect(res.body.total).toBe(3);

      const nombres = res.body.datos.map(p => p.nombre);
      expect(nombres).toContain("Mouse");
      expect(nombres).toContain("Teclado");
      expect(nombres).toContain("Monitor");
    });
  });

  describe("GET /api/productos/:id", () => {
    it("Debe retornar el producto con ID 1 (Mouse)", async () => {
      const res = await request(app).get("/api/productos/1");
      expect(res.statusCode).toBe(200);
      expect(res.body.datos.id).toBe(1);
      expect(res.body.datos.nombre).toBe("Mouse");
      expect(res.body.datos.precio).toBe(19990);
    });

    it("Debe retornar 404 si el producto con ID solicitado no existe", async () => {
      const res = await request(app).get("/api/productos/999");
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Producto no encontrado");
    });
  });

  describe("POST /api/productos", () => {
    it("Debe insertar exitosamente un nuevo producto en la lista", async () => {
      const nuevo = {
        nombre: "Audífonos Gamer",
        precio: 35000,
        descripcion: "Audífonos con cancelación de ruido y micrófono retráctil"
      };

      const res = await request(app).post("/api/productos").send(nuevo);
      expect(res.statusCode).toBe(201);
      expect(res.body.datos.nombre).toBe("Audífonos Gamer");
      expect(res.body.datos.precio).toBe(35000);
      expect(res.body.datos.id).toBe(4);

      // Verificamos que se haya agregado a la lista general
      const listado = await request(app).get("/api/productos");
      expect(listado.body.total).toBe(4);
    });

    it("Debe rechazar la inserción si falta el campo 'nombre'", async () => {
      const invalido = {
        precio: 20000,
        descripcion: "Sin nombre"
      };
      const res = await request(app).post("/api/productos").send(invalido);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Validación fallida");
    });

    it("Debe rechazar la inserción si el precio es menor o igual a 0", async () => {
      const invalido = {
        nombre: "Webcam",
        precio: -100,
        descripcion: "Precio inválido"
      };
      const res = await request(app).post("/api/productos").send(invalido);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Validación fallida");
    });

    it("Debe rechazar la inserción si falta la descripción", async () => {
      const invalido = {
        nombre: "Webcam",
        precio: 25000
      };
      const res = await request(app).post("/api/productos").send(invalido);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Validación fallida");
    });
  });

  describe("PUT /api/productos/:id", () => {
    it("Debe actualizar los datos de un producto existente en la lista", async () => {
      const cambios = {
        precio: 22990,
        descripcion: "Mouse óptico ergonómico actualizado con nuevo sensor"
      };
      const res = await request(app).put("/api/productos/1").send(cambios);
      expect(res.statusCode).toBe(200);
      expect(res.body.datos.precio).toBe(22990);
      expect(res.body.datos.descripcion).toBe(cambios.descripcion);
    });

    it("Debe responder 404 al intentar actualizar un producto inexistente", async () => {
      const res = await request(app).put("/api/productos/999").send({ precio: 1000 });
      expect(res.statusCode).toBe(404);
    });

    it("Debe responder 400 si el precio a actualizar es inválido", async () => {
      const res = await request(app).put("/api/productos/1").send({ precio: -50 });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("DELETE /api/productos/:id", () => {
    it("Debe eliminar un producto existente de la lista", async () => {
      const res = await request(app).delete("/api/productos/1");
      expect(res.statusCode).toBe(200);

      const consulta = await request(app).get("/api/productos/1");
      expect(consulta.statusCode).toBe(404);
    });

    it("Debe responder 404 al intentar eliminar un producto no existente", async () => {
      const res = await request(app).delete("/api/productos/999");
      expect(res.statusCode).toBe(404);
    });
  });

  describe("Manejo de rutas 404", () => {
    it("Debe retornar 404 ante rutas no registradas", async () => {
      const res = await request(app).get("/ruta-que-no-existe");
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Ruta no encontrada");
    });
  });
});
