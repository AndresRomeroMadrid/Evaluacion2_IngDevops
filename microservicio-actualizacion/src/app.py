"""
==============================================================================
APLICACIÓN FLASK: MICROSERVICIO DE ACTUALIZACIÓN DE PRODUCTOS - PYTHON
==============================================================================
Configura middlewares, políticas CORS, enrutamiento y manejadores de error
del microservicio 2 en Python.
"""

from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS
from src.controllers import update_controller


def create_app():
    """Fábrica de la aplicación Flask."""
    app = Flask(__name__)
    
    # Habilitar CORS para permitir invocaciones desde frontend o navegadores
    CORS(app)

    # Middleware de logging para trazabilidad y observabilidad de peticiones
    @app.before_request
    def log_request_info():
        ahora = datetime.now(timezone.utc).isoformat()
        print(f"[MICROSERVICIO-ACTUALIZACION-PY] [{ahora}] {request.method} {request.path}")

    # Rutas principales del microservicio
    app.add_url_rule("/health", view_func=update_controller.health_check, methods=["GET"])
    app.add_url_rule("/api/actualizaciones/historial", view_func=update_controller.obtener_historial, methods=["GET"])
    app.add_url_rule("/api/actualizaciones/<product_id>", view_func=update_controller.actualizar_producto, methods=["PUT"])
    app.add_url_rule("/api/actualizaciones/<product_id>/precio", view_func=update_controller.actualizar_precio, methods=["PATCH"])

    # Manejo de rutas no encontradas (404)
    @app.errorhandler(404)
    def ruta_no_encontrada(e):
        return jsonify({
            "error": "Ruta no encontrada",
            "mensaje": f"La ruta {request.method} {request.path} no existe en el microservicio de actualización."
        }), 404

    # Manejo global de errores no controlados (500)
    @app.errorhandler(500)
    def error_interno(e):
        return jsonify({
            "error": "Error interno del servidor",
            "mensaje": str(e)
        }), 500

    return app


app = create_app()
