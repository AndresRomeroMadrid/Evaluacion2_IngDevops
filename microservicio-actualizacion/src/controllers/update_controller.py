"""
==============================================================================
CONTROLADOR: UPDATE CONTROLLER (MICROSERVICIO DE ACTUALIZACIÓN) - PYTHON
==============================================================================
Este controlador en Python procesa las peticiones de actualización sobre los
productos del catálogo (Mouse, Teclado, Monitor, etc.).
Implementa:
  1. Validación estricta de reglas de negocio (precios positivos, textos válidos).
  2. Registro de auditoría (trazabilidad de quién/cuándo modificó qué).
  3. Comunicación síncrona con el Microservicio de Creación (Node.js) para actualizar la lista.
"""

from datetime import datetime, timezone
from flask import jsonify, request
from src.services.catalog_client import catalog_client, CatalogClientError

# Lista en memoria que almacena el historial de cambios y auditoría de actualizaciones
historial_actualizaciones = []
contador_actualizacion = 1


def health_check():
    """
    Endpoint de comprobación de salud (Health Check).
    Utilizado por Docker Compose, Kubernetes y pipelines CI/CD.
    """
    return jsonify({
        "status": "UP",
        "servicio": "microservicio-actualizacion",
        "lenguaje": "Python 3.12 (Flask)",
        "descripcion": "Microservicio de Actualización de Productos operativo",
        "totalActualizacionesProcesadas": len(historial_actualizaciones),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }), 200


def obtener_historial():
    """
    Retorna la lista completa del historial de auditoría de actualizaciones.
    """
    return jsonify({
        "mensaje": "Historial de auditoría de actualizaciones obtenido con éxito",
        "total": len(historial_actualizaciones),
        "datos": list(historial_actualizaciones)
    }), 200


def actualizar_producto(product_id, override_body=None):
    """
    Actualiza la información de un producto (precio, descripción o nombre).
    Aplica validaciones de negocio, consulta el estado previo, sincroniza con
    el microservicio de creación y registra la auditoría.
    """
    global contador_actualizacion

    body = override_body if override_body is not None else (request.get_json(silent=True) or {})
    nombre = body.get("nombre")
    precio = body.get("precio")
    descripcion = body.get("descripcion")
    motivo = body.get("motivo")

    # Validación 1: Al menos un campo modificable debe ser enviado
    if nombre is None and precio is None and descripcion is None:
        return jsonify({
            "error": "Petición inválida",
            "mensaje": "Debe proveer al menos un campo para actualizar: 'nombre', 'precio' o 'descripcion'."
        }), 400

    # Validación 2: Validación de precio si viene informado
    if precio is not None:
        try:
            precio_num = float(precio)
            if precio_num <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return jsonify({
                "error": "Validación fallida",
                "mensaje": "El campo 'precio' debe ser un número estrictamente mayor a 0."
            }), 400

    # Validación 3: Validación de descripción si viene informada
    if descripcion is not None:
        if not isinstance(descripcion, str) or descripcion.strip() == "":
            return jsonify({
                "error": "Validación fallida",
                "mensaje": "El campo 'descripcion' no puede ser una cadena vacía."
            }), 400

    # Validación 4: Validación de nombre si viene informado
    if nombre is not None:
        if not isinstance(nombre, str) or nombre.strip() == "":
            return jsonify({
                "error": "Validación fallida",
                "mensaje": "El campo 'nombre' no puede ser una cadena vacía."
            }), 400

    try:
        # 1. Consultar estado previo del producto en el Microservicio 1
        producto_previo = catalog_client.obtener_producto_por_id(product_id)
        if not producto_previo:
            return jsonify({
                "error": "Producto no encontrado",
                "mensaje": f"No se puede actualizar el producto con ID {product_id} porque no existe en la lista del catálogo."
            }), 404

        # 2. Preparar payload con los campos a modificar
        datos_modificados = {}
        if nombre is not None:
            datos_modificados["nombre"] = nombre.strip()
        if precio is not None:
            # Preservar entero si no tiene decimales
            datos_modificados["precio"] = int(precio) if float(precio).is_integer() else float(precio)
        if descripcion is not None:
            datos_modificados["descripcion"] = descripcion.strip()

        # 3. Enviar actualización al Microservicio 1 (Catálogo)
        producto_actualizado = catalog_client.actualizar_producto(product_id, datos_modificados)

        # 4. Generar registro de auditoría para trazabilidad
        registro_auditoria = {
            "idEvento": contador_actualizacion,
            "idProducto": int(product_id) if str(product_id).isdigit() else product_id,
            "nombreProducto": producto_actualizado.get("nombre", producto_previo.get("nombre")),
            "estadoAnterior": {
                "precio": producto_previo.get("precio"),
                "descripcion": producto_previo.get("descripcion"),
                "nombre": producto_previo.get("nombre")
            },
            "estadoNuevo": {
                "precio": producto_actualizado.get("precio"),
                "descripcion": producto_actualizado.get("descripcion"),
                "nombre": producto_actualizado.get("nombre")
            },
            "motivo": motivo or "Actualización de catálogo solicitada",
            "fechaActualizacion": datetime.now(timezone.utc).isoformat()
        }

        contador_actualizacion += 1
        historial_actualizaciones.insert(0, registro_auditoria)

        return jsonify({
            "mensaje": f"Producto '{producto_actualizado.get('nombre')}' (ID {product_id}) actualizado satisfactoriamente",
            "datos": producto_actualizado,
            "auditoria": registro_auditoria
        }), 200

    except CatalogClientError as e:
        return jsonify({
            "error": "Fallo en la actualización",
            "mensaje": str(e)
        }), e.status_code
    except Exception as e:
        return jsonify({
            "error": "Fallo en la actualización",
            "mensaje": str(e)
        }), 500


def actualizar_precio(product_id):
    """
    Endpoint especializado para actualizar exclusivamente el precio de un producto.
    """
    body = request.get_json(silent=True) or {}
    precio = body.get("precio")
    motivo = body.get("motivo", "Ajuste tarifario de precio")

    if precio is None:
        return jsonify({
            "error": "Validación fallida",
            "mensaje": "Debe proporcionar el campo 'precio'."
        }), 400

    nuevo_body = {"precio": precio, "motivo": motivo}
    return actualizar_producto(product_id, override_body=nuevo_body)


def limpiar_historial():
    """Función de utilidad para reiniciar el historial en las pruebas unitarias."""
    global contador_actualizacion, historial_actualizaciones
    historial_actualizaciones.clear()
    contador_actualizacion = 1
