# Microservicio de Actualización de Productos (Microservicio 2)

## 📌 Descripción y Rol en la Arquitectura
Este microservicio está desarrollado en **Node.js con Express** y cumple la función de:
1. Validar reglas de negocio sobre modificaciones de productos (los precios no pueden ser negativos o cero, descripciones obligatorias).
2. Servir como punto de auditoría: mantiene un historial en memoria de cada modificación efectuada (`precioAnterior`, `precioNuevo`, fecha, motivo).
3. Sincronizar los cambios comunicándose síncronamente con el **Microservicio de Creación** (Microservicio 1).
4. Exponer endpoints REST para la actualización integral (`PUT`) o específica de precio (`PATCH`).

---

## 🚀 Endpoints de la API

| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Health Check para monitoreo nativo y Docker Compose | N/A |
| `GET` | `/api/actualizaciones/historial` | Lista en memoria con el historial de auditoría de cambios | N/A |
| `PUT` | `/api/actualizaciones/:id` | Modifica datos del producto (precio, descripción, nombre) | `{ "precio": 24990, "descripcion": "...", "motivo": "..." }` |
| `PATCH`| `/api/actualizaciones/:id/precio` | Actualiza exclusivamente el precio del producto | `{ "precio": 19990, "motivo": "Oferta" }` |

---

## 🧪 Pruebas Unitarias y Cobertura
Las pruebas están implementadas con **Jest** y **Supertest**, empleando mocks sobre el cliente de catálogo:
```bash
npm test
```
Garantiza cobertura superior al 80% en statements, ramas, funciones y líneas.

---

## 🐳 Contenerización (IE1)
Este microservicio utiliza **Debian Slim** (`node:20-bookworm-slim`) en una estrategia **Single-Stage Hardened**, incorporando `curl` para soporte nativo de la directiva `HEALTHCHECK` a nivel de Docker Engine y ejecutándose bajo el usuario `node`.
