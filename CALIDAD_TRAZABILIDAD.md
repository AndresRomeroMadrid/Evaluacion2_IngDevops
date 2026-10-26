# Políticas de Calidad del Software, Seguridad y Trazabilidad

> **Asignatura:** Ingeniería DevOps (DOY0101) &bull; Duoc UC  
> **Evaluación:** Evaluación Parcial N°2 &bull; Indicadores: IE2, IE3, IE4

---

## 🎯 1. Estrategia y Políticas de Calidad del Código (IE2)

La calidad del software se fundamenta en pruebas automatizadas y métricas cuantitativas que validan cada componente antes de su integración.

### 1.1 Framework de Pruebas Unitarias
Para ambos microservicios desarrollados en Node.js se seleccionó **Jest** junto a **Supertest**, el estándar de la industria para pruebas de APIs REST.
- **Microservicio 1 (`microservicio-creacion`):** Cuenta con **14 pruebas unitarias** que evalúan la inicialización del catálogo en memoria (Mouse, Teclado, Monitor), validación de campos obligatorios, tipado de precio, inserción, actualización interna y eliminación.
- **Microservicio 2 (`microservicio-actualizacion`):** Cuenta con **19 pruebas unitarias** que evalúan validaciones de reglas de negocio, generación de bitácora de auditoría, manejo de errores de conexión con el catálogo y métodos del cliente HTTP.

### 1.2 Umbrales Mínimos de Cobertura (Coverage Thresholds)
Cada microservicio tiene configurado en su `package.json` un umbral estricto del **80%** en todas las dimensiones:
```json
"coverageThreshold": {
  "global": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  }
}
```
Si una modificación de código reduce la cobertura por debajo del 80%, el comando `npm test` finaliza con código de error `1`, impidiendo que el pipeline CI avance hacia las etapas de seguridad y construcción.

---

## 🛡️ 2. Políticas de Seguridad y Reglas de Bloqueo (IE3)

La gobernanza de seguridad en el pipeline se gestiona en dos niveles: **SCA (Software Composition Analysis)** y **SAST (Static Application Security Testing)**.

### 2.1 Auditoría Continua con Dependabot
Configurado en `.github/dependabot.yml`, realiza revisiones periódicas de los manifiestos `package.json` y de los workflows de GitHub Actions para detectar dependencias obsoletas o con CVEs conocidos.

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
  "fecha_utc": "2026-10-26T03:30:00Z",
  "entorno": "Simulado Cloud (Docker Compose CI)",
  "estado": "DESPLIEGUE_EXITOSO",
  "servicios": [
    { "nombre": "service-create", "puerto": 3001, "imagen": "microservicio-creacion:a1b2c3d..." },
    { "nombre": "service-update", "puerto": 3002, "imagen": "microservicio-actualizacion:a1b2c3d..." },
    { "nombre": "frontend", "puerto": 3000, "imagen": "frontend-dashboard:a1b2c3d..." }
  ]
}
```

### 3.3 Trazabilidad a Nivel de Aplicación (Auditoría de Datos)
El **Microservicio de Actualización** registra en una lista en memoria cada operación de cambio realizada sobre cualquier producto:
- **Identificador de evento:** Número incremental de transacción.
- **ID y Nombre del Producto afectado.**
- **Estado anterior:** Precio, nombre y descripción previos.
- **Estado nuevo:** Precio, nombre y descripción actualizados.
- **Motivo de la modificación:** Justificación operativa ingresada por el usuario.
- **Timestamp ISO 8601:** Fecha y hora exacta de la modificación.

Esta bitácora es consultable en tiempo real desde la API (`GET /api/actualizaciones/historial`) y se muestra en la tabla inferior del Dashboard Frontend.
