# Microservicio de Actualización de Productos (Microservicio 2 - Python / Flask)

## 📌 Descripción y Rol en la Arquitectura
Este microservicio está desarrollado en **Python con Flask** y cumple la función de:
1. Validar reglas de negocio sobre modificaciones de productos (los precios no pueden ser negativos o cero, descripciones obligatorias).
2. Servir como punto de auditoría: mantiene un historial en memoria de cada modificación efectuada (`precioAnterior`, `precioNuevo`, fecha, motivo).
3. Sincronizar los cambios comunicándose síncronamente con el **Microservicio de Creación** (Microservicio 1 en Node.js).
4. Exponer endpoints REST para la actualización integral (`PUT`) o específica de precio (`PATCH`).

---

## 🚀 Endpoints de la API

| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Health Check para monitoreo nativo y Docker Compose | N/A |
| `GET` | `/api/actualizaciones/historial` | Lista en memoria con el historial de auditoría de cambios | N/A |
| `PUT` | `/api/actualizaciones/<id>` | Modifica datos del producto (precio, descripción, nombre) | `{"precio": 24990, "descripcion": "...", "motivo": "..."}` |
| `PATCH`| `/api/actualizaciones/<id>/precio` | Actualiza exclusivamente el precio del producto | `{"precio": 19990, "motivo": "Oferta"}` |

---

## 🧪 Pruebas Unitarias y Cobertura (PyTest - IE2)
Las pruebas están implementadas con **PyTest** y **Flask Test Client**, evaluando casos críticos y mocks:
```bash
python -m pytest --cov=src --cov-report=term-missing
```
Garantiza cobertura superior al 80% en líneas y sentencias de código.

---

## 🐳 Contenerización (IE1)
Este microservicio utiliza **Python 3.12 Debian Slim** (`python:3.12-slim`) en una estrategia **Hardened Production Container**, incorporando `curl` para soporte nativo de la directiva `HEALTHCHECK` a nivel de Docker Engine y ejecutándose bajo el usuario no root `appuser`.
