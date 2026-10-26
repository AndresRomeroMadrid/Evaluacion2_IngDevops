# Microservicio de Creación y Consulta de Productos (Microservicio 1)

## 📌 Descripción y Rol en la Arquitectura
Este microservicio está desarrollado en **Node.js con Express** y tiene como objetivo principal:
1. Administrar el almacén en memoria (lista) de productos.
2. Servir los productos iniciales solicitados: **Mouse**, **Teclado** y **Monitor**, con precios y descripciones.
3. Permitir la inserción de nuevos productos en la lista mediante peticiones HTTP `POST`.
4. Exponer endpoints para listar y consultar detalles de productos.
5. Permitir la modificación y eliminación interna o externa de registros.

---

## 🚀 Endpoints de la API

| Método | Ruta | Descripción | Payload / Parámetros |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Health Check para monitoreo y Docker Compose | N/A |
| `GET` | `/api/productos` | Obtiene la lista completa de productos | N/A |
| `GET` | `/api/productos/:id` | Obtiene un producto por su ID | `id` en URL |
| `POST` | `/api/productos` | Inserta un nuevo producto a la lista | `{ "nombre": "...", "precio": 9990, "descripcion": "..." }` |
| `PUT` | `/api/productos/:id` | Actualiza un producto en la lista | `{ "precio": 12990, "descripcion": "..." }` |
| `DELETE`| `/api/productos/:id` | Elimina un producto de la lista | `id` en URL |

---

## 🧪 Pruebas Unitarias y Cobertura
Las pruebas están implementadas con **Jest** y **Supertest**:
```bash
npm test
```
Genera un reporte de cobertura HTML y LCOV exigiendo umbrales mínimos del 80% en statements, ramas, funciones y líneas.

---

## 🐳 Contenerización (IE1)
Este microservicio utiliza una estrategia **Multi-Stage Build** sobre **Alpine Linux** (`node:20-alpine`), aislando la fase de resolución de dependencias para entregar una imagen final de tamaño mínimo y sin privilegios root (`USER node`).
