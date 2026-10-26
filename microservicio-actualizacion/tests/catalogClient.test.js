/**
 * ==============================================================================
 * PRUEBAS UNITARIAS: CLIENTE HTTP DE CATÁLOGO (JEST)
 * ==============================================================================
 * Verifica el comportamiento del cliente ante respuestas exitosas, errores 404,
 * errores de servidor y desconexiones de red.
 */

describe("CatalogClient - Pruebas de integración HTTP del cliente", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("obtenerProductoPorId retorna los datos del producto cuando la respuesta es 200", async () => {
    const mockData = { datos: { id: 1, nombre: "Mouse", precio: 19990 } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const catalogClient = require("../src/services/catalogClient");
    const resultado = await catalogClient.obtenerProductoPorId(1);
    expect(resultado).toEqual(mockData.datos);
  });

  it("obtenerProductoPorId retorna null cuando el servicio responde 404", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404
    });

    const catalogClient = require("../src/services/catalogClient");
    const resultado = await catalogClient.obtenerProductoPorId(999);
    expect(resultado).toBeNull();
  });

  it("obtenerProductoPorId arroja un error cuando el servicio responde con error de servidor", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error"
    });

    const catalogClient = require("../src/services/catalogClient");
    await expect(catalogClient.obtenerProductoPorId(1)).rejects.toThrow("Error en servicio catálogo: 500 Internal Server Error");
  });

  it("obtenerProductoPorId maneja errores de desconexión de red", async () => {
    const networkError = new Error("fetch failed");
    networkError.cause = { code: "ECONNREFUSED" };
    global.fetch = jest.fn().mockRejectedValue(networkError);

    const catalogClient = require("../src/services/catalogClient");
    await expect(catalogClient.obtenerProductoPorId(1)).rejects.toThrow("No se pudo conectar con el Microservicio de Creación");
  });

  it("actualizarProducto retorna el producto modificado exitosamente", async () => {
    const mockUpdated = { datos: { id: 1, nombre: "Mouse Gamer", precio: 22000 } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUpdated
    });

    const catalogClient = require("../src/services/catalogClient");
    const resultado = await catalogClient.actualizarProducto(1, { precio: 22000 });
    expect(resultado).toEqual(mockUpdated.datos);
  });

  it("actualizarProducto arroja error cuando la respuesta no es ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ mensaje: "Precio inválido" })
    });

    const catalogClient = require("../src/services/catalogClient");
    await expect(catalogClient.actualizarProducto(1, { precio: -10 })).rejects.toThrow("Precio inválido");
  });

  it("actualizarProducto maneja errores de desconexión de red", async () => {
    const networkError = new Error("fetch failed");
    networkError.cause = { code: "ECONNREFUSED" };
    global.fetch = jest.fn().mockRejectedValue(networkError);

    const catalogClient = require("../src/services/catalogClient");
    await expect(catalogClient.actualizarProducto(1, { precio: 20000 })).rejects.toThrow("No se pudo conectar con el Microservicio de Creación");
  });
});
