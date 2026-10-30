"""
==============================================================================
PUNTO DE ENTRADA (SERVER): MICROSERVICIO DE ACTUALIZACIÓN - PYTHON
==============================================================================
Inicia el servidor HTTP en el puerto designado (por defecto 3002).
"""

import os
import sys

# Asegurar que el directorio raíz del microservicio esté en sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.app import app

if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 3002))
    CREATE_URL = os.environ.get("CREATE_SERVICE_URL", "http://localhost:3001")

    print("=============================================================")
    print("  MICROSERVICIO DE ACTUALIZACIÓN (PYTHON / FLASK)")
    print(f"  Puerto de escucha:      http://0.0.0.0:{PORT}")
    print(f"  Health Check:          http://localhost:{PORT}/health")
    print(f"  Historial Auditoría:   http://localhost:{PORT}/api/actualizaciones/historial")
    print(f"  Conectado a Catálogo:  {CREATE_URL}")
    print("=============================================================")

    # En producción dentro del contenedor se puede usar Gunicorn o Flask incorporado
    app.run(host="0.0.0.0", port=PORT, debug=False)
