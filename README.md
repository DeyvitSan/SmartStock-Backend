# SmartStock Backend 📦

API REST desarrollada con **Node.js** y **Express** para la gestión de inventarios y notificaciones push en tiempo real.

## 🚀 Tecnologías
- **Node.js** & **Express**
- **MySQL2** (Pool de conexiones con Promises)
- **Firebase Admin SDK** (FCM para alertas de stock bajo)
- **Dotenv** (Variables de entorno)

## 🛠️ Configuración
1. Clonar el repositorio.
2. Ejecutar `npm install`.
3. Crear un archivo `.env` basado en las credenciales de tu DB.
4. Agregar el archivo `serviceAccountKey.json` de Firebase en la raíz.
5. Ejecutar con `node server.js`.

## 📌 Endpoints Principales
- `POST /login` - Autenticación de usuarios.
- `POST /save-token` - Registro de tokens de dispositivos para FCM.
- `GET /products` - Listado de productos.
- `PUT /products/:id` - Actualización de stock (dispara alerta si <= 5).