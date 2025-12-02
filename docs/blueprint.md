# **App Name**: ASSAM - Registro de Personal

## Core Features:

- Autenticación de Usuario: Inicio de sesión y registro seguros de usuarios mediante Firebase Authentication con correo electrónico/contraseña.
- Control de Acceso Basado en Roles: Reglas de seguridad de Firestore para proteger los datos según los roles de los usuarios (Administrador, Editor, Aprobador, Empleado).
- Check-in/Check-out en Tiempo Real: Registro de las marcas de entrada y salida, coordenadas GPS y firmas digitales.
- Geocercas: Cálculo de la distancia desde las ubicaciones de trabajo predefinidas (frentes) utilizando las coordenadas GPS.
- Captura de Firma: Captura y almacenamiento de firmas digitales como imágenes PNG en Cloud Storage.
- Exportación de Datos: Exporte los datos de usuarios y registros de Firestore a formato Excel (.xlsx) o CSV para facilitar la gestión utilizando una herramienta que descarga todos los datos.
- Validación y Aprobación de Datos: Permita que los administradores, editores y aprobadores revisen y validen/rechacen los registros pendientes con comentarios.

## Style Guidelines:

- Color primario: Azul profundo (#1A237E), que recuerda a la confiabilidad y los cielos despejados.
- Color de fondo: Azul grisáceo claro (#E8EAF6) para una sensación limpia y profesional.
- Color de acento: Lavanda suave (#9FA8DA) para agregar un énfasis suave y accesibilidad.
- Fuente del cuerpo y del título: 'PT Sans' sans-serif para una apariencia moderna y accesible.
- Fuente de código: 'Source Code Pro' para mostrar fragmentos de código.
- Utilice iconos limpios y modernos de Bootstrap Icons para una apariencia coherente.
- Utilice un diseño limpio e intuitivo con el sistema de cuadrícula Bootstrap 5. Priorice la claridad de los datos y la facilidad de navegación.
- Utilice animaciones sutiles para las transiciones y la retroalimentación, evitando cualquier cosa que distraiga. Por ejemplo, indicadores de carga, confirmaciones de envío de formularios y notificaciones toast para las confirmaciones.