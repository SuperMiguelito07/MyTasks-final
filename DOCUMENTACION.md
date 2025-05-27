# Documentación de MyTask

## Descripción General

MyTask es una aplicación de gestión de tareas moderna desarrollada con React y Supabase. Permite a los usuarios organizar sus proyectos y tareas en un tablero Kanban intuitivo, con funcionalidades de arrastrar y soltar para mover tareas entre diferentes estados (To Do, Doing, Done).

La aplicación cuenta con un sistema completo de notificaciones que incluye:
- Notificaciones en la aplicación
- Notificaciones por correo electrónico (SendGrid)
- Notificaciones por SMS (Twilio)
- Gestión de preferencias de usuario para las notificaciones

Además, la aplicación es completamente responsive, adaptándose perfectamente a dispositivos móviles y de escritorio, con interacciones táctiles optimizadas para una mejor experiencia en smartphones y tablets.

## Estructura del Proyecto

```
MyTasks-main/
├── public/                 # Archivos públicos estáticos
├── src/                    # Código fuente principal
│   ├── components/         # Componentes reutilizables de React
│   ├── contexts/           # Contextos de React para gestión de estado global
│   ├── pages/              # Páginas principales de la aplicación
│   ├── services/           # Servicios para lógica de negocio
│   ├── styles/             # Archivos CSS y estilos
│   ├── App.tsx             # Componente principal de la aplicación
│   ├── App.css             # Estilos principales
│   ├── index.tsx           # Punto de entrada de la aplicación
│   └── supabase.ts         # Configuración de conexión a Supabase
├── package.json            # Dependencias y scripts
└── tsconfig.json           # Configuración de TypeScript
```

## Tecnologías Utilizadas

- **Frontend**: React 19.1.0, TypeScript, CSS moderno
- **Backend**: Supabase (base de datos PostgreSQL, autenticación, almacenamiento)
- **Notificaciones**: Sistema propio de notificaciones en la aplicación, SMS (simulado/Twilio)
- **Enrutamiento**: React Router v7
- **Gestión de Estado**: Contextos de React

## Componentes Principales

### 1. Sistema de Autenticación

El sistema de autenticación está gestionado por Supabase y se implementa a través del contexto `AuthContext`. Permite:

- Registro de usuarios
- Inicio de sesión con email y contraseña
- Cierre de sesión
- Persistencia de sesión

### 2. Dashboard (Tablero Kanban)

El dashboard es la interfaz principal donde los usuarios gestionan sus tareas. Características:

- Vista de proyectos del usuario
- Tablero Kanban con tres columnas: To Do, Doing, Done
- Funcionalidad de arrastrar y soltar para mover tareas entre columnas
- Creación y eliminación de tareas y proyectos
- Adaptación responsive para dispositivos móviles

### 3. Sistema de Notificaciones

El sistema de notificaciones está compuesto por:

- **NotificationContext**: Gestiona el estado de las notificaciones
- **NotificationCenter**: Componente UI para mostrar notificaciones
- **NotificationSettings**: Permite a los usuarios configurar sus preferencias

Las notificaciones se envían en los siguientes eventos:
- Creación de una nueva tarea
- Tareas próximas a vencer (1 día antes)
- Tareas completadas

### 4. Componentes Draggables

Para implementar la funcionalidad de arrastrar y soltar:

- **DraggableTask**: Componente que representa una tarea que puede ser arrastrada
  - Soporte para interacciones táctiles en dispositivos móviles
  - Diseño expandible para mejor visualización en pantallas pequeñas
  - Indicadores visuales de fechas de vencimiento
- **KanbanColumn**: Componente que representa una columna que puede recibir tareas arrastradas
  - Adaptación responsive para dispositivos móviles
  - Contadores de tareas para mejor visibilidad

### 5. Navegación Móvil

Para mejorar la experiencia en dispositivos móviles:

- **MobileNav**: Barra de navegación inferior para dispositivos móviles
  - Cambio entre vista de proyectos y tareas
  - Acceso rápido a notificaciones
  - Iconos intuitivos y etiquetas descriptivas

## Flujo de Datos

1. **Autenticación**:
   - El usuario accede a la aplicación y es redirigido a la página de autenticación
   - Tras iniciar sesión, se crea una sesión en Supabase y se almacena localmente

2. **Carga de Datos**:
   - Al entrar al dashboard, se cargan los proyectos del usuario desde Supabase
   - Al seleccionar un proyecto, se cargan las tareas asociadas
   - Las notificaciones se cargan periódicamente

3. **Gestión de Tareas**:
   - El usuario puede crear, editar, eliminar y mover tareas
   - Al mover una tarea (arrastrar y soltar), se actualiza su estado en la base de datos
   - Cuando se completa una tarea, se envían notificaciones según las preferencias del usuario

4. **Sistema de Notificaciones**:
   - Las notificaciones se almacenan en la base de datos
   - Se muestran en el centro de notificaciones
   - El usuario puede marcarlas como leídas o eliminarlas

## Base de Datos (Supabase)

La estructura de la base de datos incluye las siguientes tablas:

- **users**: Información de los usuarios
- **projects**: Proyectos creados por los usuarios
- **tasks**: Tareas asociadas a proyectos
- **notifications**: Notificaciones para los usuarios
- **user_preferences**: Preferencias de notificación de los usuarios
- **sms_logs**: Registro de SMS enviados

## Servicios

### 1. SMS Service

Simula el envío de SMS para notificaciones. En un entorno de producción, se integraría con Twilio u otro proveedor de SMS.

### 2. Task Reminder Service

Comprueba periódicamente las tareas próximas a vencer y envía notificaciones según corresponda.

### 3. Supabase Service

Proporciona funciones de utilidad para interactuar con la base de datos Supabase.

## Flujo de Usuario

1. El usuario se registra o inicia sesión
2. Accede al dashboard donde puede ver sus proyectos
3. Selecciona un proyecto para ver sus tareas
4. Puede crear nuevas tareas, moverlas entre columnas (To Do, Doing, Done)
5. Recibe notificaciones sobre eventos importantes relacionados con sus tareas
6. Puede configurar sus preferencias de notificación

## Características Visuales

- Diseño moderno y atractivo con una paleta de colores coherente
- Interfaz completamente responsive que se adapta a diferentes tamaños de pantalla
- Navegación específica para dispositivos móviles con barra inferior
- Interacciones táctiles optimizadas para dispositivos móviles
- Tarjetas de tareas expandibles en móvil para mejor usabilidad
- Indicadores visuales de fechas de vencimiento
- Animaciones suaves para mejorar la experiencia de usuario
- Iconos intuitivos para las diferentes acciones

## Configuración del Entorno

Para ejecutar la aplicación localmente:

1. Clonar el repositorio
2. Instalar dependencias con `npm install`
3. Configurar las variables de entorno en un archivo `.env.local`:
   ```
   # Supabase
   REACT_APP_SUPABASE_URL=https://egoxgyvexjjykwmatiap.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnb3hneXZleGpqeWt3bWF0aWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNDIxOTMsImV4cCI6MjA2MjgxODE5M30.qUqgTq9aQtRGbdmxws_CyfLHQw31TnRElQbyDT7Tcow
   
   # SendGrid (opcional)
   REACT_APP_SENDGRID_API_KEY=your-sendgrid-api-key
   REACT_APP_SENDER_EMAIL=your-sender-email@example.com
   
   # Twilio (opcional)
   REACT_APP_TWILIO_ACCOUNT_SID=your-twilio-account-sid
   REACT_APP_TWILIO_AUTH_TOKEN=your-twilio-auth-token
   REACT_APP_TWILIO_PHONE_NUMBER=your-twilio-phone-number
   ```
4. Configurar la base de datos ejecutando el script SQL incluido o importándolo en Supabase
5. Ejecutar `npm start` para iniciar la aplicación en modo desarrollo

## Despliegue

La aplicación está configurada para ser desplegada en Netlify, con un archivo `netlify.toml` que define la configuración necesaria:

```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "16"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Pasos para desplegar en Netlify:

1. Crear una cuenta en Netlify
2. Conectar el repositorio de GitHub/GitLab/Bitbucket
3. Configurar las variables de entorno:
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_ANON_KEY
   - REACT_APP_SENDGRID_API_KEY (opcional)
   - REACT_APP_SENDER_EMAIL (opcional)
   - REACT_APP_TWILIO_ACCOUNT_SID (opcional)
   - REACT_APP_TWILIO_AUTH_TOKEN (opcional)
   - REACT_APP_TWILIO_PHONE_NUMBER (opcional)
4. Iniciar el despliegue

Alternativamente, la aplicación puede desplegarse en otros servicios como:
- Vercel
- GitHub Pages
- Firebase Hosting

## Mantenimiento y Extensibilidad

El código está estructurado de manera modular, lo que facilita:
- Añadir nuevas funcionalidades
- Modificar componentes existentes
- Integrar con servicios adicionales
- Escalar la aplicación según las necesidades

## Conclusión

MyTask es una aplicación moderna y completa para la gestión de tareas, con un enfoque en la experiencia de usuario y la funcionalidad. Su arquitectura basada en React y Supabase proporciona una base sólida para futuras mejoras y extensiones.
