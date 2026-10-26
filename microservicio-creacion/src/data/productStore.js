/**
 * ==============================================================================
 * ALMACÉN DE DATOS EN MEMORIA (LISTA DE PRODUCTOS)
 * ==============================================================================
 * Este módulo gestiona la colección de productos requerida por la evaluación.
 * Los datos se almacenan en una lista (Array en memoria) con elementos iniciales:
 * - Mouse
 * - Teclado
 * - Monitor
 * Cada producto cuenta con un identificador único (id), nombre, precio y descripción.
 */

// Lista en memoria inicializada con los productos solicitados en la rúbrica
let productos = [
  {
    id: 1,
    nombre: "Mouse",
    precio: 19990,
    descripcion: "Mouse óptico ergonómico inalámbrico con sensor de alta precisión 6400 DPI"
  },
  {
    id: 2,
    nombre: "Teclado",
    precio: 45990,
    descripcion: "Teclado mecánico con interruptores táctiles y retroiluminación personalizable"
  },
  {
    id: 3,
    nombre: "Monitor",
    precio: 139990,
    descripcion: "Monitor LED de 24 pulgadas Full HD con panel IPS y tasa de refresco de 144Hz"
  }
];

// Contador incremental para la asignación de IDs únicos
let proximoId = 4;

/**
 * Obtiene todos los productos actualmente almacenados en la lista.
 * @returns {Array} Lista completa de productos
 */
function obtenerTodos() {
  return [...productos];
}

/**
 * Busca un producto en la lista según su ID numérico.
 * @param {number} id Identificador del producto
 * @returns {Object|null} El producto encontrado o null si no existe
 */
function obtenerPorId(id) {
  const prod = productos.find(p => p.id === Number(id));
  return prod ? { ...prod } : null;
}

/**
 * Inserta un nuevo producto a la lista en memoria.
 * @param {Object} datos Datos del nuevo producto (nombre, precio, descripcion)
 * @returns {Object} El producto creado con su ID asignado
 */
function insertarProducto(datos) {
  const nuevoProducto = {
    id: proximoId++,
    nombre: datos.nombre.trim(),
    precio: Number(datos.precio),
    descripcion: datos.descripcion.trim()
  };

  productos.push(nuevoProducto);
  return { ...nuevoProducto };
}

/**
 * Actualiza la información de un producto existente en la lista.
 * Este método permite sincronizar las modificaciones enviadas por el
 * microservicio de actualización.
 * @param {number} id Identificador del producto a actualizar
 * @param {Object} nuevosDatos Campos a modificar (nombre, precio, descripcion)
 * @returns {Object|null} El producto con los datos actualizados o null si no se halló
 */
function actualizarProducto(id, nuevosDatos) {
  const indice = productos.findIndex(p => p.id === Number(id));
  if (indice === -1) {
    return null;
  }

  // Se preserva el ID original y se sobreescriben solo los campos válidos
  productos[indice] = {
    ...productos[indice],
    ...(nuevosDatos.nombre !== undefined && { nombre: nuevosDatos.nombre.trim() }),
    ...(nuevosDatos.precio !== undefined && { precio: Number(nuevosDatos.precio) }),
    ...(nuevosDatos.descripcion !== undefined && { descripcion: nuevosDatos.descripcion.trim() })
  };

  return { ...productos[indice] };
}

/**
 * Elimina un producto de la lista según su ID.
 * @param {number} id Identificador del producto
 * @returns {boolean} true si fue eliminado, false si no se encontró
 */
function eliminarProducto(id) {
  const indice = productos.findIndex(p => p.id === Number(id));
  if (indice === -1) {
    return false;
  }
  productos.splice(indice, 1);
  return true;
}

/**
 * Restablece la lista a los productos predeterminados (Mouse, Teclado, Monitor).
 * Muy útil para garantizar el aislamiento entre ejecuciones de pruebas unitarias.
 */
function restablecerDatos() {
  productos = [
    {
      id: 1,
      nombre: "Mouse",
      precio: 19990,
      descripcion: "Mouse óptico ergonómico inalámbrico con sensor de alta precisión 6400 DPI"
    },
    {
      id: 2,
      nombre: "Teclado",
      precio: 45990,
      descripcion: "Teclado mecánico con interruptores táctiles y retroiluminación personalizable"
    },
    {
      id: 3,
      nombre: "Monitor",
      precio: 139990,
      descripcion: "Monitor LED de 24 pulgadas Full HD con panel IPS y tasa de refresco de 144Hz"
    }
  ];
  proximoId = 4;
}

module.exports = {
  obtenerTodos,
  obtenerPorId,
  insertarProducto,
  actualizarProducto,
  eliminarProducto,
  restablecerDatos
};
