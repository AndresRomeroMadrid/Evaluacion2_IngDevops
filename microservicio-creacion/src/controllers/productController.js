/**
 * ==============================================================================
 * CONTROLADOR: PRODUCT CONTROLLER (MICROSERVICIO DE CREACIÓN)
 * ==============================================================================
 * Controla las peticiones HTTP entrantes para listar, consultar, insertar y
 * actualizar elementos dentro de la lista de productos en memoria.
 */

const productStore = require("../data/productStore");

/**
 * Endpoint de comprobación de salud (Health Check).
 * Empleado por orquestadores (Docker Compose / Kubernetes) y pipelines de CI/CD.
 */
function healthCheck(req, res) {
  res.status(200).json({
    status: "UP",
    servicio: "microservicio-creacion",
    descripcion: "Microservicio de Creación y Consulta de Productos operativo",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}

/**
 * Obtiene la lista completa de productos.
 */
function listarProductos(req, res) {
  const productos = productStore.obtenerTodos();
  res.status(200).json({
    mensaje: "Listado de productos obtenido con éxito",
    total: productos.length,
    datos: productos
  });
}

/**
 * Obtiene el detalle de un producto específico mediante su ID.
 */
function obtenerProductoPorId(req, res) {
  const { id } = req.params;
  const producto = productStore.obtenerPorId(id);

  if (!producto) {
    return res.status(404).json({
      error: "Producto no encontrado",
      mensaje: `No existe ningún producto con el identificador ${id}`
    });
  }

  res.status(200).json({
    mensaje: "Producto encontrado con éxito",
    datos: producto
  });
}

/**
 * Inserta un nuevo producto en la lista.
 * Valida que los campos requeridos (nombre, precio, descripcion) estén presentes
 * y que el precio sea un número positivo.
 */
function crearProducto(req, res) {
  const { nombre, precio, descripcion } = req.body;

  // Validación de campos obligatorios
  if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
    return res.status(400).json({
      error: "Validación fallida",
      mensaje: "El campo 'nombre' es obligatorio y debe ser una cadena de texto no vacía."
    });
  }

  const precioNum = Number(precio);
  if (precio === undefined || isNaN(precioNum) || precioNum <= 0) {
    return res.status(400).json({
      error: "Validación fallida",
      mensaje: "El campo 'precio' es obligatorio y debe ser un valor numérico mayor a 0."
    });
  }

  if (!descripcion || typeof descripcion !== "string" || descripcion.trim() === "") {
    return res.status(400).json({
      error: "Validación fallida",
      mensaje: "El campo 'descripcion' es obligatorio y debe contener texto descriptivo."
    });
  }

  // Creación del nuevo producto en el almacén de datos
  const nuevoProducto = productStore.insertarProducto({
    nombre,
    precio: precioNum,
    descripcion
  });

  res.status(201).json({
    mensaje: "Producto insertado correctamente en la lista",
    datos: nuevoProducto
  });
}

/**
 * Endpoint de actualización directa en la lista.
 * Invocado internamente por el Microservicio de Actualización para persistir cambios.
 */
function modificarProducto(req, res) {
  const { id } = req.params;
  const datosActualizar = req.body;

  const productoExistente = productStore.obtenerPorId(id);
  if (!productoExistente) {
    return res.status(404).json({
      error: "Producto no encontrado",
      mensaje: `No se pudo actualizar: el producto con ID ${id} no existe.`
    });
  }

  // Validación si se envía precio
  if (datosActualizar.precio !== undefined) {
    const precioNum = Number(datosActualizar.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({
        error: "Validación fallida",
        mensaje: "Si proporciona 'precio', este debe ser un número mayor a 0."
      });
    }
    datosActualizar.precio = precioNum;
  }

  const productoActualizado = productStore.actualizarProducto(id, datosActualizar);

  res.status(200).json({
    mensaje: "Producto actualizado correctamente en la lista del catálogo",
    datos: productoActualizado
  });
}

/**
 * Elimina un producto de la lista según su identificador.
 */
function borrarProducto(req, res) {
  const { id } = req.params;
  const eliminado = productStore.eliminarProducto(id);

  if (!eliminado) {
    return res.status(404).json({
      error: "Producto no encontrado",
      mensaje: `No se pudo eliminar: el producto con ID ${id} no existe.`
    });
  }

  res.status(200).json({
    mensaje: `Producto con ID ${id} eliminado satisfactoriamente`
  });
}

module.exports = {
  healthCheck,
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  modificarProducto,
  borrarProducto
};
