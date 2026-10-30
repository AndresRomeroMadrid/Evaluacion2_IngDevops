"""
==============================================================================
PRUEBAS UNITARIAS: CLIENTE HTTP DE CATÁLOGO (PYTEST & MOCK)
==============================================================================
Verifica el comportamiento del cliente HTTP en Python frente a respuestas exitosas,
códigos 404, fallos de servidor y errores de desconexión de red.
"""

from unittest.mock import MagicMock, patch
import pytest
import requests
from src.services.catalog_client import CatalogClient, CatalogClientError


@pytest.fixture
def client():
    return CatalogClient(base_url="http://test-catalog:3001")


def test_obtener_producto_por_id_exitoso(client):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.ok = True
    mock_resp.json.return_value = {
        "datos": {"id": 1, "nombre": "Mouse", "precio": 19990, "descripcion": "Mouse óptico"}
    }

    with patch("requests.get", return_value=mock_resp):
        res = client.obtener_producto_por_id(1)
        assert res is not None
        assert res["id"] == 1
        assert res["nombre"] == "Mouse"
        assert res["precio"] == 19990


def test_obtener_producto_por_id_no_encontrado(client):
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    mock_resp.ok = False

    with patch("requests.get", return_value=mock_resp):
        res = client.obtener_producto_por_id(999)
        assert res is None


def test_obtener_producto_por_id_error_servidor(client):
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.reason = "Internal Server Error"
    mock_resp.ok = False

    with patch("requests.get", return_value=mock_resp):
        with pytest.raises(CatalogClientError) as exc_info:
            client.obtener_producto_por_id(1)
        assert "500" in str(exc_info.value)
        assert exc_info.value.status_code == 500


def test_obtener_producto_por_id_error_conexion(client):
    with patch("requests.get", side_effect=requests.exceptions.ConnectionError("Connection refused")):
        with pytest.raises(CatalogClientError) as exc_info:
            client.obtener_producto_por_id(1)
        assert "No se pudo conectar" in str(exc_info.value)
        assert exc_info.value.status_code == 503


def test_actualizar_producto_exitoso(client):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.ok = True
    mock_resp.json.return_value = {
        "datos": {"id": 1, "nombre": "Mouse Gamer", "precio": 24990, "descripcion": "Actualizado"}
    }

    with patch("requests.put", return_value=mock_resp):
        res = client.actualizar_producto(1, {"precio": 24990})
        assert res is not None
        assert res["precio"] == 24990
        assert res["nombre"] == "Mouse Gamer"


def test_actualizar_producto_error_validacion(client):
    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.ok = False
    mock_resp.json.return_value = {"mensaje": "El campo 'precio' debe ser mayor a 0"}

    with patch("requests.put", return_value=mock_resp):
        with pytest.raises(CatalogClientError) as exc_info:
            client.actualizar_producto(1, {"precio": -100})
        assert "mayor a 0" in str(exc_info.value)
        assert exc_info.value.status_code == 400


def test_actualizar_producto_error_conexion(client):
    with patch("requests.put", side_effect=requests.exceptions.ConnectionError("Connection refused")):
        with pytest.raises(CatalogClientError) as exc_info:
            client.actualizar_producto(1, {"precio": 20000})
        assert "No se pudo conectar" in str(exc_info.value)
        assert exc_info.value.status_code == 503
