"""
==============================================================================
PRUEBAS UNITARIAS: ENDPOINTS Y LÓGICA DE ACTUALIZACIÓN (PYTEST & FLASK TEST CLIENT)
==============================================================================
Evalúa validaciones de negocio, persistencia de auditoría y manejo de errores
utilizando el framework PyTest (Requerimiento IE2 de la evaluación).
"""

from unittest.mock import patch
import pytest
from src.app import create_app
from src.controllers import update_controller
from src.services.catalog_client import CatalogClientError


@pytest.fixture
def app():
    app = create_app()
    app.config.update({"TESTING": True})
    return app


@pytest.fixture
def client(app):
    update_controller.limpiar_historial()
    return app.test_client()


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "UP"
    assert data["servicio"] == "microservicio-actualizacion"
    assert "Python" in data["lenguaje"]
    assert "timestamp" in data


def test_historial_inicial_vacio(client):
    response = client.get("/api/actualizaciones/historial")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] == 0
    assert data["datos"] == []


def test_actualizar_sin_campos_retorna_400(client):
    response = client.put("/api/actualizaciones/1", json={})
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Petición inválida"


def test_actualizar_precio_negativo_retorna_400(client):
    response = client.put("/api/actualizaciones/1", json={"precio": -1500})
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Validación fallida"
    assert "mayor a 0" in data["mensaje"]


def test_actualizar_precio_cero_retorna_400(client):
    response = client.put("/api/actualizaciones/1", json={"precio": 0})
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Validación fallida"


def test_actualizar_precio_invalido_texto_retorna_400(client):
    response = client.put("/api/actualizaciones/1", json={"precio": "gratis"})
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Validación fallida"


def test_actualizar_descripcion_vacia_retorna_400(client):
    response = client.put("/api/actualizaciones/1", json={"descripcion": "   "})
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Validación fallida"


def test_actualizar_nombre_vacio_retorna_400(client):
    response = client.put("/api/actualizaciones/1", json={"nombre": "   "})
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Validación fallida"


def test_actualizar_producto_no_encontrado_retorna_404(client):
    with patch("src.controllers.update_controller.catalog_client.obtener_producto_por_id", return_value=None):
        response = client.put("/api/actualizaciones/999", json={"precio": 25000})
        assert response.status_code == 404
        data = response.get_json()
        assert data["error"] == "Producto no encontrado"


def test_actualizar_producto_exitoso_y_registra_auditoria(client):
    producto_existente = {
        "id": 1,
        "nombre": "Mouse",
        "precio": 19990,
        "descripcion": "Mouse óptico ergonómico"
    }
    producto_actualizado = {
        "id": 1,
        "nombre": "Mouse Gamer Pro",
        "precio": 24990,
        "descripcion": "Mouse óptico ergonómico con iluminación"
    }

    with patch("src.controllers.update_controller.catalog_client.obtener_producto_por_id", return_value=producto_existente), \
         patch("src.controllers.update_controller.catalog_client.actualizar_producto", return_value=producto_actualizado):

        response = client.put("/api/actualizaciones/1", json={
            "nombre": "Mouse Gamer Pro",
            "precio": 24990,
            "descripcion": "Mouse óptico ergonómico con iluminación",
            "motivo": "Lanzamiento versión Pro"
        })

        assert response.status_code == 200
        data = response.get_json()
        assert data["datos"]["precio"] == 24990
        assert data["auditoria"]["idEvento"] == 1
        assert data["auditoria"]["estadoAnterior"]["precio"] == 19990
        assert data["auditoria"]["estadoNuevo"]["precio"] == 24990
        assert data["auditoria"]["motivo"] == "Lanzamiento versión Pro"

        # Verificar que el historial ahora tiene 1 registro
        hist_resp = client.get("/api/actualizaciones/historial")
        hist_data = hist_resp.get_json()
        assert hist_data["total"] == 1
        assert hist_data["datos"][0]["idProducto"] == 1


def test_actualizar_error_conexion_catalogo(client):
    with patch(
        "src.controllers.update_controller.catalog_client.obtener_producto_por_id",
        side_effect=CatalogClientError("No se pudo conectar con el Microservicio de Creación", status_code=503)
    ):
        response = client.put("/api/actualizaciones/1", json={"precio": 30000})
        assert response.status_code == 503
        data = response.get_json()
        assert "No se pudo conectar" in data["mensaje"]


def test_patch_precio_sin_precio_retorna_400(client):
    response = client.patch("/api/actualizaciones/2/precio", json={})
    assert response.status_code == 400
    data = response.get_json()
    assert data["error"] == "Validación fallida"


def test_patch_precio_exitoso(client):
    producto_existente = {
        "id": 2,
        "nombre": "Teclado",
        "precio": 45990,
        "descripcion": "Teclado mecánico"
    }
    producto_actualizado = {
        "id": 2,
        "nombre": "Teclado",
        "precio": 39990,
        "descripcion": "Teclado mecánico"
    }

    with patch("src.controllers.update_controller.catalog_client.obtener_producto_por_id", return_value=producto_existente), \
         patch("src.controllers.update_controller.catalog_client.actualizar_producto", return_value=producto_actualizado):

        response = client.patch("/api/actualizaciones/2/precio", json={
            "precio": 39990,
            "motivo": "Oferta fin de semana"
        })

        assert response.status_code == 200
        data = response.get_json()
        assert data["datos"]["precio"] == 39990


def test_ruta_no_encontrada_404(client):
    response = client.get("/ruta-inexistente")
    assert response.status_code == 404
    data = response.get_json()
    assert data["error"] == "Ruta no encontrada"
