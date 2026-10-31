# Proyecto DevOps - Evaluación Parcial N°2: Arquitectura de Microservicios 

---

## Aplicación

La solución gestiona un catálogo de productos informáticos precargados en memoria (**Mouse**, **Teclado** y **Monitor**) a través de dos microservicios especializados y una interfaz web moderna (Frontend Dashboard):

1. **Microservicio 1 (`microservicio-creacion` - Node.js Express):** Administra la lista en memoria de productos, expone endpoints de consulta e inserción (`POST`), y almacena los datos de Mouse, Teclado y Monitor con sus respectivos precios y descripciones. Pruebas automatizadas con **Jest**.
2. **Microservicio 2 (`microservicio-actualizacion` - Python Flask):** Valida reglas de negocio para modificaciones (precios estrictamente mayores a 0, descripciones no vacías), mantiene una lista de auditoría con la trazabilidad histórica de los cambios y sincroniza las actualizaciones con el Microservicio 1. Pruebas automatizadas con **PyTest** (cumpliendo expresamente la recomendación de la rúbrica).
3. **Frontend Dashboard (`frontend` - Node.js BFF):** Aplicación web interactiva que permite a los usuarios visualizar el catálogo en tiempo real, insertar nuevos productos, actualizar datos mediante modal y consultar la bitácora de auditoría.

Para el despliegue de la aplicación se opto por el uso de contenedores Docker y su orquestacion mediante
docker compose para un rapido despliegue, tanto en local como en la nube.

Como los contenedores requieren de una imagen, se crearon imágenes a partir del
código de cada microservicio. Cada Dockerfile tiene 3 stages con el propósito de
obtener una imagen optimizada para producción:

1. **`deps`:** obtiene las dependencias (producción y desarrollo) de forma aislada.
2. **`testing`:** ejecuta las pruebas unitarias (Jest o PyTest). Si fallan, la imagen no se construye.
3. **`production`:** imagen final mínima, con usuario no root y solo con las dependencias de producción.

La configuración (puertos, URLs entre servicios, `NODE_ENV`, etc.) no está dentro
de las imágenes: se inyecta al ejecutar los contenedores desde un archivo `.env`
(ver `.env.example`).

---

## Calidad de la aplicación

Para asegurarse de la calidad de la aplicación se opto por pruebas de codigo mediante
herramientas como pytest para python y jest + supertest para nodejs  para asegurar un codigo limpio y listo para producción.

Estas pruebas se ejecutan tanto en el stage `testing` de la creación de la imagen
de Docker como en el proceso de CI/CD del proyecto, con la restricción de que si
fallan, el código no se construye ni se despliega. Jest además exige un mínimo de
80 % de cobertura.

Además, durante el pipeline se ejecutan `npm audit` y Trivy para detectar
vulnerabilidades en las dependencias, y Dependabot (`.github/dependabot.yml`)
mantiene las dependencias actualizadas.



---

## Proceso de CI/CD

El flujo `.github/workflows/ci-cd.yml` se activa con:

- un **push** a `main`, `master` o `feature/**`,
- un **pull request** hacia `main` o `master`,
- una ejecución manual (`workflow_dispatch`).

Está compuesto por 5 jobs encadenados; si uno falla, los siguientes no se ejecutan:

| # | Job | Qué hace |
|---|-----|----------|
| 1 | `unit-tests` | Ejecuta Jest (microservicio de creación) y PyTest con cobertura (microservicio de actualización). Publica los reportes de cobertura como artefacto. |
| 2 | `security-analysis` | Auditoría de dependencias con `npm audit --audit-level=high` (bloquea ante vulnerabilidades altas o críticas) y escaneo con Trivy (informa, no bloquea). |
| 3 | `docker-build` | Construye las 3 imágenes (los stages `testing` vuelven a correr las pruebas) y, en `main`/`master`, las **publica en Docker Hub**. |
| 4 | `deploy-simulation` | Levanta todo con Docker Compose dentro del runner, ejecuta pruebas de humo (`/health` de los 3 servicios) y genera el registro de trazabilidad del despliegue. |
| 5 | `deploy-ec2` | Despliega en la instancia EC2 de AWS usando **SSM Run Command**. Solo en `main`/`master`. |

### Publicación de imágenes (Docker Hub)

Las imágenes se publican como `<DOCKERHUB_USERNAME>/microservicio-creacion`,
`<DOCKERHUB_USERNAME>/microservicio-actualizacion` y
`<DOCKERHUB_USERNAME>/frontend-dashboard`, con dos tags: el SHA del commit
(inmutable, permite trazar y volver a una versión anterior) y `latest`.

En pull requests y ramas `feature/**` las imágenes solo se construyen para validar,
sin publicarlas y sin usar secrets.

### Despliegue en AWS (EC2 + SSM)

El job `deploy-ec2` no abre conexiones SSH: usa las credenciales de AWS para enviar
un comando a la instancia mediante SSM (`.github/scripts/deploy-ec2.sh`). En la EC2
ese script:

1. Escribe el `docker-compose.yml` y un `.env` en `/opt/microservicios`. El `.env` sale de
   `.env.example` con `IMAGE_TAG` igual al SHA del commit desplegado.
2. Descarga las imágenes desde Docker Hub (`docker compose pull`); no se construye nada en la instancia.
3. Levanta los contenedores (`docker compose up -d --no-build`).
4. Comprueba el `/health` de los tres servicios. Si alguno no responde, el despliegue se marca como fallido.

El job espera el resultado del comando y muestra su salida en el log del pipeline.

### Secrets requeridos

Se configuran en GitHub, en *Settings → Secrets and variables → Actions*:

| Secret | Uso |
|--------|-----|
| `DOCKERHUB_USERNAME` | Usuario de Docker Hub; también es el prefijo de los nombres de las imágenes. |
| `DOCKERHUB_TOKEN` | Token de acceso de Docker Hub con permiso de **push**. |
| `AWS_SECRET_KEY_ID` | Access key ID del usuario IAM que ejecuta el despliegue. |
| `AWS_SECRET_ACCESS_KEY` | Secret access key de ese usuario IAM. |
| `AWS_REGION` | Región de AWS donde está la instancia (por ejemplo `us-east-1`). |
| `EC2_INSTANCE_ID` | ID de la instancia EC2 destino (`i-xxxxxxxxxxxxxxxxx`). |

El token de Docker Hub no se envía a la EC2. Si los repositorios de Docker Hub son
privados, hay que ejecutar `docker login` una vez directamente en la instancia.

### Requisitos de la instancia EC2

- SSM Agent instalado y un rol de instancia con la política `AmazonSSMManagedInstanceCore`.
- Docker con el plugin Docker Compose instalado.
- Security Group con los puertos `3000`, `3001` y `3002` abiertos según corresponda.
- El usuario IAM del pipeline necesita, como mínimo, los permisos `ssm:SendCommand` y `ssm:GetCommandInvocation`.

---

## 📂 Estructura del Repositorio

```text
Evaluacion_2/
├── .github/
│   ├── dependabot.yml                      # Configuración de escaneo continuo Dependabot (IE3)
│   ├── scripts/
│   │   └── deploy-ec2.sh                   # Script que se ejecuta en la EC2 vía SSM
│   └── workflows/
│       └── ci-cd.yml                       # Pipeline CI/CD en GitHub Actions (IE1, IE2, IE3, IE4)
├── microservicio-creacion/                 # Microservicio 1: Catálogo y Creación (Node.js)
│   ├── src/
│   │   ├── app.js                          # Configuración Express y rutas REST
│   │   ├── server.js                       # Servidor HTTP (Puerto 3001)
│   │   ├── controllers/
│   │   │   └── productController.js        # Lógica CRUD comentada en detalle
│   │   └── data/
│   │       └── productStore.js             # Almacén en lista: Mouse, Teclado, Monitor
│   ├── tests/
│   │   └── product.test.js                 # 14 Pruebas unitarias Jest + Supertest (IE2)
│   ├── Dockerfile                          # Dockerfile Alpine de 3 stages: deps, testing, production (IE1)
│   ├── .dockerignore
│   ├── package.json
│   └── README.md
├── microservicio-actualizacion/            # Microservicio 2: Actualización y Auditoría (Python)
│   ├── src/
│   │   ├── __init__.py
│   │   ├── app.py                          # Configuración Flask, CORS y middlewares
│   │   ├── server.py                       # Servidor HTTP (Puerto 3002)
│   │   ├── controllers/
│   │   │   ├── __init__.py
│   │   │   └── update_controller.py        # Lógica de actualización y auditoría comentada
│   │   └── services/
│   │       ├── __init__.py
│   │       └── catalog_client.py           # Cliente HTTP hacia Microservicio 1 (Requests)
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_update.py                  # 14 Pruebas unitarias Flask + PyTest (IE2)
│   │   └── test_catalog_client.py          # 7 Pruebas unitarias de cliente HTTP (PyTest)
│   ├── Dockerfile                          # Dockerfile Python Debian Slim de 3 stages con Healthcheck nativo (IE1)
│   ├── .dockerignore
│   ├── requirements.txt                    # Dependencias de producción (Flask, Requests)
│   ├── requirements-dev.txt                # Dependencias de pruebas (PyTest, PyTest-Cov)
│   └── README.md
├── frontend/                               # Interfaz gráfica de usuario (Dashboard)
│   ├── public/
│   │   ├── index.html                      # Vista HTML5 semántica y responsiva
│   │   ├── styles.css                      # Estilos modernos, estados en tiempo real y modals
│   │   └── app.js                          # Lógica cliente para interactuar con ambos servicios
│   ├── server.js                           # Servidor Express BFF (Puerto 3000)
│   ├── Dockerfile                          # Contenedor para la capa frontend
│   ├── .dockerignore
│   └── package.json
├── .env.example                            # Plantilla de variables de entorno para Docker Compose
├── docker-compose.yml                      # Orquestación con redes, healthchecks y resource limits (IE5)
├── README.md                               # Documento principal de la evaluación
├── PIPELINE.md                             # Documentación exhaustiva del pipeline CI/CD
├── CALIDAD_TRAZABILIDAD.md                 # Garantía de calidad, seguridad y trazabilidad
└── ARQUITECTURA.md                         # Documentación técnica de la arquitectura
```

---

## ⚙️ Microservicios en Detalle

### 1. Microservicio de Creación (`microservicio-creacion` - Node.js)
- **Puerto:** `3001`
- **Tecnología:** Node.js v20, Express, Jest, Supertest.
- **Datos iniciales:**
  - `Mouse`: Precio \$19.990 - *Mouse óptico ergonómico inalámbrico con sensor de alta precisión 6400 DPI*.
  - `Teclado`: Precio \$45.990 - *Teclado mecánico con interruptores táctiles y retroiluminación personalizable*.
  - `Monitor`: Precio \$139.990 - *Monitor LED de 24 pulgadas Full HD con panel IPS y tasa de refresco de 144Hz*.
- **Endpoints:**
  - `GET /health`: Estado de salud del servicio.
  - `GET /api/productos`: Retorna el arreglo completo de productos en memoria.
  - `GET /api/productos/:id`: Retorna el producto correspondiente al identificador numérico.
  - `POST /api/productos`: Inserta un nuevo producto a la lista tras validar campos requeridos.
  - `PUT /api/productos/:id`: Modifica la información del producto en la lista (usado para sincronización).
  - `DELETE /api/productos/:id`: Elimina un producto por ID.

### 2. Microservicio de Actualización (`microservicio-actualizacion` - Python)
- **Puerto:** `3002`
- **Tecnología:** Python 3.12, Flask, Requests, PyTest, PyTest-Cov.
- **Responsabilidades:**
  - Valida que las actualizaciones cumplan las políticas de negocio (precios estrictamente mayores a cero, descripciones obligatorias).
  - Mantiene un registro histórico de auditoría con el estado anterior y el nuevo estado de cada producto modificado.
  - Se comunica con el Microservicio 1 mediante el cliente `catalog_client.py` para persistir la mutación en la lista central.
- **Endpoints:**
  - `GET /health`: Estado de salud del servicio.
  - `GET /api/actualizaciones/historial`: Lista con la bitácora de auditoría histórica.
  - `PUT /api/actualizaciones/<id>`: Actualiza nombre, precio y/o descripción registrando el evento.
  - `PATCH /api/actualizaciones/<id>/precio`: Endpoint directo para variaciones de precio.

---



##  Instrucciones de Ejecución

### Despliegue con Docker Compose (Recomendada - IE5)

Asegúrate de contar con Docker Desktop en ejecución y corre:

```bash
# 1. Posicionarse en el directorio del proyecto
cd "Evaluacion_2"

# 2. Crear el archivo de variables de entorno (obligatorio, el compose falla sin él)
cp .env.example .env

# 3. Construir y levantar todos los contenedores en segundo plano
docker compose up -d --build

# 4. Comprobar el estado de salud de los servicios
docker compose ps

# 5. Acceder al Frontend Dashboard en el navegador
# Abre: http://localhost:3000
```

Para detener la solución:
```bash
docker compose down
```