# Políticas de Calidad del Software, Seguridad y Trazabilidad

> **Asignatura:** Ingeniería DevOps (DOY0101) &bull; Duoc UC  
> **Evaluación:** Evaluación Parcial N°2 &bull; Indicadores: IE2, IE3, IE4

---

## 🎯 1. Estrategia y Políticas de Calidad del Código (IE2)

La calidad del software se fundamenta en pruebas automatizadas y métricas cuantitativas que validan cada componente antes de su integración, incorporando los frameworks recomendados en la rúbrica (**PyTest** y **Jest**).

### 1.1 Frameworks de Pruebas Unitarias
- **Microservicio 1 (`microservicio-creacion` - Node.js):** Cuenta con **14 pruebas unitarias** implementadas en **Jest** y **Supertest** que evalúan la inicialización del catálogo en memoria (Mouse, Teclado, Monitor), validación de campos obligatorios, tipado de precio, inserción, actualización interna y eliminación.
- **Microservicio 2 (`microservicio-actualizacion` - Python):** Cuenta con **21 pruebas unitarias** implementadas en **PyTest** (cumpliendo expresamente el indicador IE2 de la rúbrica) y Flask Test Client que evalúan validaciones de reglas de negocio tarifarias, generación de bitácora de auditoría, manejo de errores de conexión con el catálogo y métodos del cliente HTTP.

### 1.2 Umbrales Mínimos de Cobertura (Coverage Thresholds)
- **Node.js (Jest):** Configurado en `package.json` con umbral del **80%** en branches, functions, lines y statements. Cobertura alcanzada: **>96%**.
- **Python (PyTest):** Evaluado con `pytest-cov`, exigiendo un mínimo del **80%** en líneas y sentencias. Cobertura alcanzada: **83%** global (**97%** en controlador).

Si una modificación de código reduce la cobertura por debajo del 80%, las pruebas unitarias en el pipeline CI finalizan con código de error `1`, impidiendo que el pipeline avance hacia las etapas de seguridad y construcción.

---

## 🛡️ 2. Políticas de Seguridad y Reglas de Bloqueo (IE3)

La gobernanza de seguridad en el pipeline se gestiona en dos niveles: **SCA (Software Composition Analysis)** y **SAST (Static Application Security Testing)**.

### 2.1 Auditoría Continua con Dependabot
Configurado en `.github/dependabot.yml`, realiza revisiones periódicas semanales sobre:
- Ecosistema `npm` para `microservicio-creacion` y `frontend`.
- Ecosistema `pip` para `microservicio-actualizacion` (Python).
- Ecosistema `github-actions` para flujos de CI/CD.

### 2.2 Bloqueo de Pipeline (Quality Gate de Seguridad)
El job `security-analysis` ejecuta `npm audit --audit-level=high` y análisis con **Aqua Security Trivy**.
- **Regla de Bloqueo:** La presencia de vulnerabilidades de severidad `HIGH` o `CRITICAL` aborta inmediatamente la ejecución del pipeline con `exit 1`.
- **Alerta de Gobernanza:** Se emite un mensaje de error formal con el detalle de la vulnerabilidad y la instrucción para su mitigación, protegiendo los entornos de despliegue.

---

## 🔍 3. Trazabilidad de Extremo a Extremo (IE4)

La trazabilidad garantiza que cualquier artefacto en ejecución pueda ser rastreado con precisión hasta el commit y el desarrollador que originó el cambio.

### 3.1 Trazabilidad en el Código y Control de Versiones
- Cada commit en Git posee un hash SHA único (ej. `3a4f89b...`).
- El pipeline utiliza el `${{ github.sha }}` como etiqueta inmutable en las imágenes de Docker construidas:
  - `microservicio-creacion:<commit_sha>`
  - `microservicio-actualizacion:<commit_sha>`
  - `frontend-dashboard:<commit_sha>`

### 3.2 Trazabilidad en el Despliegue Simulado (Audit Trail)
Durante la etapa de despliegue en GitHub Actions, se genera automáticamente un manifiesto JSON en el artefacto `.trazabilidad/despliegue_<sha>.json`:

```json
{
  "evento": "push",
  "commit_sha": "a1b2c3d4e5f6789...",
  "rama": "main",
  "autor": "desarrollador-devops",
  "run_id": "184920482",
  "run_number": "14",
  "fecha_utc": "2026-10-30T15:30:00Z",
  "entorno": "Simulado Cloud (Docker Compose CI)",
  "estado": "DESPLIEGUE_EXITOSO",
  "servicios": [
    { "nombre": "service-create", "lenguaje": "Node.js", "puerto": 3001, "imagen": "microservicio-creacion:a1b2c3d..." },
    { "nombre": "service-update", "lenguaje": "Python", "puerto": 3002, "imagen": "microservicio-actualizacion:a1b2c3d..." },
    { "nombre": "frontend", "lenguaje": "Node.js", "puerto": 3000, "imagen": "frontend-dashboard:a1b2c3d..." }
  ]
}
```

### 3.3 Trazabilidad a Nivel de Aplicación (Auditoría de Datos)
El **Microservicio de Actualización (Python)** registra en una lista en memoria cada operación de cambio realizada sobre cualquier producto:
- **Identificador de evento:** Número incremental de transacción.
- **ID y Nombre del Producto afectado.**
- **Estado anterior:** Precio, nombre y descripción previos.
- **Estado nuevo:** Precio, nombre y descripción actualizados.
- **Motivo de la modificación:** Justificación operativa ingresada por el usuario.
- **Timestamp ISO 8601:** Fecha y hora exacta de la modificación.

Esta bitácora es consultable en tiempo real desde la API (`GET /api/actualizaciones/historial`) y se muestra en la tabla inferior del Dashboard Frontend.
