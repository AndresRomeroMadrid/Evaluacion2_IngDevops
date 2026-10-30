"""
==============================================================================
CLIENTE DE COMUNICACIÓN CON MICROSERVICIO 1 (CATÁLOGO / CREACIÓN) - PYTHON
==============================================================================
Este servicio gestiona las peticiones HTTP hacia el Microservicio de Creación
(Node.js en puerto 3001) para obtener información previa del producto y persistir
la actualización en la lista centralizada en memoria.
"""

import os
import requests


class CatalogClientError(Exception):
    """Excepción personalizada para fallos de comunicación con el Microservicio 1."""
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.status_code = status_code


class CatalogClient:
    def __init__(self, base_url=None):
        self.base_url = (base_url or os.environ.get("CREATE_SERVICE_URL", "http://localhost:3001")).rstrip("/")

    def obtener_producto_por_id(self, product_id):
        """
        Obtiene los datos actuales de un producto por su ID desde el microservicio 1.
        
        :param product_id: Identificador numérico o string del producto
        :return: Diccionario con los datos del producto o None si no existe (404)
        """
        url = f"{self.base_url}/api/productos/{product_id}"
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 404:
                return None
            if not response.ok:
                raise CatalogClientError(
                    f"Error en servicio catálogo: {response.status_code} {response.reason}",
                    status_code=response.status_code
                )
            data = response.json()
            return data.get("datos")
        except requests.exceptions.ConnectionError:
            raise CatalogClientError(
                f"No se pudo conectar con el Microservicio de Creación en {self.base_url}",
                status_code=503
            )
        except requests.exceptions.RequestException as e:
            if isinstance(e, CatalogClientError):
                raise
            raise CatalogClientError(f"Error de red al consultar producto: {str(e)}", status_code=500)

    def actualizar_producto(self, product_id, campos_actualizados):
        """
        Envía los campos modificados al microservicio 1 para sincronizar la lista en memoria.
        
        :param product_id: Identificador del producto
        :param campos_actualizados: Diccionario con los datos a actualizar (precio, descripcion, etc.)
        :return: Diccionario del producto actualizado retornado por el microservicio 1
        """
        url = f"{self.base_url}/api/productos/{product_id}"
        try:
            response = requests.put(url, json=campos_actualizados, timeout=5)
            if not response.ok:
                try:
                    err_data = response.json()
                    mensaje = err_data.get("mensaje", f"Error al actualizar: código {response.status_code}")
                except Exception:
                    mensaje = f"Error al actualizar: código {response.status_code}"
                raise CatalogClientError(mensaje, status_code=response.status_code)

            data = response.json()
            return data.get("datos")
        except requests.exceptions.ConnectionError:
            raise CatalogClientError(
                f"No se pudo conectar con el Microservicio de Creación en {self.base_url}",
                status_code=503
            )
        except requests.exceptions.RequestException as e:
            if isinstance(e, CatalogClientError):
                raise
            raise CatalogClientError(f"Error de red al actualizar producto: {str(e)}", status_code=500)


# Instancia por defecto singleton para ser consumida por los controladores
catalog_client = CatalogClient()
