/**
 * ==============================================================================
 * CLIENTE DE COMUNICACIÓN CON MICROSERVICIO 1 (CATÁLOGO / CREACIÓN)
 * ==============================================================================
 * Este servicio gestiona las peticiones HTTP hacia el Microservicio de Creación
 * para obtener información previa del producto y persistir la actualización en la
 * lista centralizada.
 */

class CatalogClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || process.env.CREATE_SERVICE_URL || "http://localhost:3001";
  }

  /**
   * Obtiene los datos actuales de un producto por su ID desde el microservicio 1.
   * @param {number|string} id Identificador del producto
   * @returns {Promise<Object|null>} Producto encontrado o null si no existe
   */
  async obtenerProductoPorId(id) {
    try {
      const response = await fetch(`${this.baseUrl}/api/productos/${id}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`Error en servicio catálogo: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.datos;
    } catch (err) {
      if (err.cause && (err.cause.code === "ECONNREFUSED" || err.cause.code === "ENOTFOUND")) {
        throw new Error(`No se pudo conectar con el Microservicio de Creación en ${this.baseUrl}`);
      }
      throw err;
    }
  }

  /**
   * Envía los campos modificados al microservicio 1 para sincronizar la lista.
   * @param {number|string} id Identificador del producto
   * @param {Object} camposActualizados Datos nuevos a persistir
   * @returns {Promise<Object>} Producto actualizado retornado por el microservicio 1
   */
  async actualizarProducto(id, camposActualizados) {
    try {
      const response = await fetch(`${this.baseUrl}/api/productos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(camposActualizados)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const mensaje = errData.mensaje || `Error al actualizar: código ${response.status}`;
        const error = new Error(mensaje);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data.datos;
    } catch (err) {
      if (err.cause && (err.cause.code === "ECONNREFUSED" || err.cause.code === "ENOTFOUND")) {
        throw new Error(`No se pudo conectar con el Microservicio de Creación en ${this.baseUrl}`);
      }
      throw err;
    }
  }
}

module.exports = new CatalogClient();
