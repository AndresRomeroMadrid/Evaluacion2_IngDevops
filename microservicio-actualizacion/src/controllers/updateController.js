/**
 * ==============================================================================
 * CONTROLADOR: UPDATE CONTROLLER (MICROSERVICIO DE ACTUALIZACIÓN)
 * ==============================================================================
 * Este controlador procesa las peticiones de actualización sobre los productos
 * (Mouse, Teclado, Monitor, etc.).
 * Implementa:
 *   1. Validación estricta de reglas de negocio (precios positivos, textos válidos).
 *   2. Registro de auditoría (trazabilidad de quién/cuándo modificó qué).
 *   3. Comunicación síncrona con el Microservicio de Creación para actualizar la lista.
 */

const catalogClient = require("../services/catalogClient");

// Lista en memoria que almacena el historial de cambios y auditoría de actualizaciones
let historialActualizaciones = [];
let contadorActualizacion = 1;

/**
 * Health check del microservicio de actualización.
 */
function healthCheck(req, res) {
  res.status(200).json({
    status: "UP",
    servicio: "microservicio-actualizacion",
    descripcion: "Microservicio de Actualización de Productos operativo",
    totalActualizacionesProcesadas: historialActualizaciones.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * Retorna el historial de actualizaciones realizadas.
 */
function obtenerHistorial(req, res) {
  res.status(200).json({
    mensaje: "Historial de auditoría de actualizaciones obtenido con éxito",
    total: historialActualizaciones.length,
    datos: [...historialActualizaciones]
  });
}

/**
 * Actualiza la información de un producto (precio, descripción o nombre).
 */
async function actualizarProducto(req, res) {
  const { id } = req.params;
  const { nombre, precio, descripcion, motivo } = req.body;

  // Validación: Al menos un campo modificable debe ser enviado
  if (nombre === undefined && precio === undefined && descripcion === undefined) {
    return res.status(400).json({
      error: "Petición inválida",
      mensaje: "Debe proveer al menos un campo para actualizar: 'nombre', 'precio' o 'descripcion'."
    });
  }

  // Validación de precio si viene informado
  if (precio !== undefined) {
    const precioNum = Number(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({
        error: "Validación fallida",
        mensaje: "El campo 'precio' debe ser un número estrictamente mayor a 0."
      });
    }
  }

  // Validación de descripción si viene informada
  if (descripcion !== undefined) {
    if (typeof descripcion !== "string" || descripcion.trim() === "") {
      return res.status(400).json({
        error: "Validación fallida",
        mensaje: "El campo 'descripcion' no puede ser una cadena vacía."
      });
    }
  }

  // Validación de nombre si viene informado
  if (nombre !== undefined) {
    if (typeof nombre !== "string" || nombre.trim() === "") {
      return res.status(400).json({
        error: "Validación fallida",
        mensaje: "El campo 'nombre' no puede ser una cadena vacía."
      });
    }
  }

  try {
    // 1. Consultar estado previo del producto en el Microservicio de Creación
    const productoPrevio = await catalogClient.obtenerProductoPorId(id);
    if (!productoPrevio) {
      return res.status(404).json({
        error: "Producto no encontrado",
        mensaje: `No se puede actualizar el producto con ID ${id} porque no existe en la lista del catálogo.`
      });
    }

    // 2. Preparar el payload de actualización para el Microservicio 1
    const datosModificados = {};
    if (nombre !== undefined) datosModificados.nombre = nombre.trim();
    if (precio !== undefined) datosModificados.precio = Number(precio);
    if (descripcion !== undefined) datosModificados.descripcion = descripcion.trim();

    // 3. Enviar actualización al Microservicio 1
    const productoActualizado = await catalogClient.actualizarProducto(id, datosModificados);

    // 4. Generar registro de auditoría para trazabilidad
    const registroAuditoria = {
      idEvento: contadorActualizacion++,
      idProducto: Number(id),
      nombreProducto: productoActualizado.nombre,
      estadoAnterior: {
        precio: productoPrevio.precio,
        descripcion: productoPrevio.descripcion,
        nombre: productoPrevio.nombre
      },
      estadoNuevo: {
        precio: productoActualizado.precio,
        descripcion: productoActualizado.descripcion,
        nombre: productoActualizado.nombre
      },
      motivo: motivo || "Actualización de catálogo solicitada",
      fechaActualizacion: new Date().toISOString()
    };

    historialActualizaciones.unshift(registroAuditoria);

    return res.status(200).json({
      mensaje: `Producto '${productoActualizado.nombre}' (ID ${id}) actualizado satisfactoriamente`,
      datos: productoActualizado,
      auditoria: registroAuditoria
    });
  } catch (error) {
    console.error("[ERROR EN ACTUALIZACION]:", error.message);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      error: "Fallo en la actualización",
      mensaje: error.message
    });
  }
}

/**
 * Actualización especializada y rápida únicamente del precio de un producto.
 */
async function actualizarPrecio(req, res) {
  const { id } = req.params;
  const { precio, motivo } = req.body;

  if (precio === undefined) {
    return res.status(400).json({
      error: "Validación fallida",
      mensaje: "Debe proporcionar el campo 'precio'."
    });
  }

  // Reutiliza la función principal pasando sólo el precio
  req.body = { precio, motivo: motivo || "Ajuste tarifario de precio" };
  return actualizarProducto(req, res);
}

/**
 * Función auxiliar para limpiar historial en pruebas unitarias.
 */
function limpiarHistorial() {
  historialActualizaciones = [];
  contadorActualizacion = 1;
}

module.exports = {
  healthCheck,
  obtenerHistorial,
  actualizarProducto,
  actualizarPrecio,
  limpiarHistorial
};
