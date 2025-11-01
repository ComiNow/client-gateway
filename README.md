<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="NestJS Logo" />
  </a>
</p>

# 🌐 Client Gateway - CoffeeNow

Este servicio actúa como **API Gateway** de CoffeeNow. Se encarga de recibir peticiones HTTP desde el cliente (frontend) y enrutar las solicitudes a los distintos microservicios mediante **NATS**.

---

## 🚀 Entorno de desarrollo

### 1. Clonar el repositorio

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.template` y renómbralo a `.env`

### 4. Ejecutar en modo desarrollo

```bash
npm run start:dev
```

### 5. Para ver la documentación en swagger ingresa a

**http://localhost:3000/docs/**

## 🔀 Funcionalidad

- Expone rutas HTTP para interactuar con los microservicios (`products`, `auth`, `orders`, `categories`, etc.).
- Enruta las solicitudes a través de NATS según el `cmd` correspondiente.
- Valida datos de entrada mediante DTOs.
- Utiliza `ValidationPipe` y autenticación JWT.

---

## 📂 Estructura básica

```
src/
 ├── products/
 ├── categories/
 ├── auth/
 ├── orders/
 ├── common/
 ├── config/
 └── main.ts
```

---

## 🧪 Tecnologías

- NestJS
- NATS (como transportador de mensajes)
- DTOs + Pipes para validación
- Arquitectura basada en microservicios

---

## 📄 Licencia

Este proyecto es desarrollado por el equipo **CoffeeNow** ☕
