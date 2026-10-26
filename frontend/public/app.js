/**
 * ==============================================================================
 * LOGICA DEL FRONTEND DASHBOARD (CRUD & AUDITORÍA)
 * ==============================================================================
 * Conecta la interfaz de usuario con:
 *   - Microservicio 1 (Creación / Catálogo) para listar, insertar y borrar.
 *   - Microservicio 2 (Actualización) para modificar precios/descripción y auditar.
 */

// Rutas a través del BFF (Backend For Frontend) para máxima portabilidad
const API_CREACION = "/api/proxy/creacion";
const API_ACTUALIZACION = "/api/proxy/actualizacion";

// Elementos del DOM
const statusCreacionEl = document.getElementById("status-creacion");
const statusActualizacionEl = document.getElementById("status-actualizacion");
const formCrear = document.getElementById("form-crear");
const tablaProductosBody = document.getElementById("lista-productos-body");
const tablaAuditoriaBody = document.getElementById("lista-auditoria-body");
const totalProductosEl = document.getElementById("total-productos");
const btnRefrescar = document.getElementById("btn-refrescar");

// Elementos del Modal de Edición
const modalEditar = document.getElementById("modal-editar");
const formEditar = document.getElementById("form-editar");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");
const editIdInput = document.getElementById("edit-id");
const editNombreInput = document.getElementById("edit-nombre");
const editPrecioInput = document.getElementById("edit-precio");
const editDescripcionInput = document.getElementById("edit-descripcion");
const editMotivoInput = document.getElementById("edit-motivo");

/**
 * Muestra una notificación visual temporal (Toast).
 */
function mostrarToast(mensaje, tipo = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  
  const icon = tipo === "success" ? "✅" : (tipo === "error" ? "❌" : "ℹ️");
  toast.innerHTML = `<span>${icon}</span><span>${mensaje}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

/**
 * Formatea un número en formato moneda (CLP).
 */
function formatoMoneda(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP"
  }).format(valor);
}

/**
 * Comprueba el estado de salud de ambos microservicios.
 */
async function verificarSaludMicroservicios() {
  // Microservicio 1 (Creación)
  try {
    const res1 = await fetch(`${API_CREACION}/health`);
    const ind1 = statusCreacionEl.querySelector(".status-indicator");
    if (res1.ok) {
      ind1.className = "status-indicator online";
      statusCreacionEl.title = "Microservicio 1 conectado y en línea";
    } else {
      ind1.className = "status-indicator offline";
    }
  } catch {
    statusCreacionEl.querySelector(".status-indicator").className = "status-indicator offline";
  }

  // Microservicio 2 (Actualización)
  try {
    const res2 = await fetch(`${API_ACTUALIZACION}/health`);
    const ind2 = statusActualizacionEl.querySelector(".status-indicator");
    if (res2.ok) {
      ind2.className = "status-indicator online";
      statusActualizacionEl.title = "Microservicio 2 conectado y en línea";
    } else {
      ind2.className = "status-indicator offline";
    }
  } catch {
    statusActualizacionEl.querySelector(".status-indicator").className = "status-indicator offline";
  }
}

/**
 * Carga y renderiza el listado de productos desde el Microservicio 1.
 */
async function cargarProductos() {
  try {
    const res = await fetch(`${API_CREACION}/api/productos`);
    if (!res.ok) throw new Error("Fallo al obtener productos");
    const data = await res.json();
    const productos = data.datos || [];

    totalProductosEl.textContent = `${productos.length} producto${productos.length === 1 ? '' : 's'}`;

    if (productos.length === 0) {
      tablaProductosBody.innerHTML = `
        <tr>
          <td colspan="5" class="table-empty">No hay productos en la lista. ¡Inserta uno nuevo arriba!</td>
        </tr>
      `;
      return;
    }

    tablaProductosBody.innerHTML = productos.map(prod => `
      <tr>
        <td><strong>#${prod.id}</strong></td>
        <td>
          <span class="product-tag">${escapeHtml(prod.nombre)}</span>
        </td>
        <td>
          <span class="price-tag">${formatoMoneda(prod.precio)}</span>
        </td>
        <td>${escapeHtml(prod.descripcion)}</td>
        <td style="text-align: center;">
          <div class="action-buttons">
            <button class="btn btn-edit-sm" onclick="abrirModalEdicion(${prod.id}, '${escapeAttr(prod.nombre)}', ${prod.precio}, '${escapeAttr(prod.descripcion)}')">
              ✏️ Modificar
            </button>
            <button class="btn btn-danger-sm" onclick="eliminarProducto(${prod.id}, '${escapeAttr(prod.nombre)}')">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    tablaProductosBody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty" style="color: var(--danger);">
          ⚠️ Error conectando al Microservicio de Creación (${err.message})
        </td>
      </tr>
    `;
  }
}

/**
 * Carga y renderiza el historial de auditoría desde el Microservicio 2.
 */
async function cargarHistorialAuditoria() {
  try {
    const res = await fetch(`${API_ACTUALIZACION}/api/actualizaciones/historial`);
    if (!res.ok) throw new Error("Fallo al obtener historial");
    const data = await res.json();
    const eventos = data.datos || [];

    if (eventos.length === 0) {
      tablaAuditoriaBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty">No se han registrado modificaciones todavía. Actualiza un producto para ver la auditoría.</td>
        </tr>
      `;
      return;
    }

    tablaAuditoriaBody.innerHTML = eventos.map(ev => {
      const fecha = new Date(ev.fechaActualizacion).toLocaleString("es-CL");
      return `
        <tr>
          <td><strong>#${ev.idEvento}</strong></td>
          <td>${escapeHtml(ev.nombreProducto)} <small class="text-muted">(ID ${ev.idProducto})</small></td>
          <td><span class="price-tag" style="color: #94a3b8;">${formatoMoneda(ev.estadoAnterior.precio)}</span></td>
          <td><span class="price-tag">${formatoMoneda(ev.estadoNuevo.precio)}</span></td>
          <td>${escapeHtml(ev.motivo || 'Actualización')}</td>
          <td><small style="color: var(--text-muted);">${fecha}</small></td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    tablaAuditoriaBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty" style="color: var(--danger);">
          ⚠️ Error conectando al Microservicio de Actualización
        </td>
      </tr>
    `;
  }
}

/**
 * Inserta un nuevo producto llamando al Microservicio 1.
 */
formCrear.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-crear");
  btn.disabled = true;

  const payload = {
    nombre: document.getElementById("nombre").value.trim(),
    precio: Number(document.getElementById("precio").value),
    descripcion: document.getElementById("descripcion").value.trim()
  };

  try {
    const res = await fetch(`${API_CREACION}/api/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.mensaje || "Error en validación");
    }

    mostrarToast(`¡Producto '${data.datos.nombre}' insertado en la lista exitosamente!`, "success");
    formCrear.reset();
    await cargarProductos();
  } catch (err) {
    mostrarToast(`Error al insertar: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
  }
});

/**
 * Abre el modal de edición para modificar información con el Microservicio 2.
 */
window.abrirModalEdicion = function(id, nombre, precio, descripcion) {
  editIdInput.value = id;
  editNombreInput.value = nombre;
  editPrecioInput.value = precio;
  editDescripcionInput.value = descripcion;
  modalEditar.classList.add("active");
};

function cerrarModal() {
  modalEditar.classList.remove("active");
}

modalCloseBtn.addEventListener("click", cerrarModal);
modalCancelBtn.addEventListener("click", cerrarModal);

/**
 * Procesa la actualización del producto llamando al Microservicio 2.
 */
formEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = editIdInput.value;
  const btn = document.getElementById("btn-guardar-edicion");
  btn.disabled = true;

  const payload = {
    nombre: editNombreInput.value.trim(),
    precio: Number(editPrecioInput.value),
    descripcion: editDescripcionInput.value.trim(),
    motivo: editMotivoInput.value.trim() || "Modificación desde interfaz de usuario"
  };

  try {
    const res = await fetch(`${API_ACTUALIZACION}/api/actualizaciones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.mensaje || "Error al actualizar");
    }

    mostrarToast(`¡Producto ID ${id} actualizado correctamente por Microservicio 2!`, "success");
    cerrarModal();
    await cargarProductos();
    await cargarHistorialAuditoria();
  } catch (err) {
    mostrarToast(`Fallo al actualizar: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
  }
});

/**
 * Elimina un producto de la lista llamando al Microservicio 1.
 */
window.eliminarProducto = async function(id, nombre) {
  if (!confirm(`¿Estás seguro de que deseas eliminar el producto '${nombre}' (ID ${id})?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_CREACION}/api/productos/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("No se pudo eliminar el producto");

    mostrarToast(`Producto '${nombre}' eliminado de la lista`, "info");
    await cargarProductos();
  } catch (err) {
    mostrarToast(`Error al borrar: ${err.message}`, "error");
  }
};

/**
 * Helpers para sanitizar strings insertados en HTML
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

btnRefrescar.addEventListener("click", () => {
  verificarSaludMicroservicios();
  cargarProductos();
  cargarHistorialAuditoria();
  mostrarToast("Datos actualizados", "info");
});

// Inicialización de la aplicación
verificarSaludMicroservicios();
cargarProductos();
cargarHistorialAuditoria();

// Polling de salud cada 15 segundos
setInterval(verificarSaludMicroservicios, 15000);
