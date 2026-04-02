<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
h1 { color: #932E20; text-align: center; font-size: 2.5em; border-bottom: 2px solid #F2E9D8; padding-bottom: 10px; }
h2 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
h3 { color: #34495e; }
img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin: 20px 0; border: 1px solid #ddd; }
.note { background-color: #f8f9fa; border-left: 4px solid #932E20; padding: 15px; margin: 20px 0; border-radius: 4px; }
.page-break { page-break-before: always; }
</style>

# Manual de Usuario - Automatización Documental (Simplaw)

Bienvenido al sistema de Automatización Documental. Este manual te guiará paso a paso por todas las funcionalidades de la plataforma, permitiéndote gestionar plantillas, generar documentos mediante inteligencia artificial y administrar usuarios y métricas de uso.

---

## 1. Inicio de Sesión
El acceso a la plataforma está restringido y requiere credenciales válidas. Si eres administrador o un usuario invitado, debes ingresar tu correo electrónico y contraseña.

![Pantalla de Login](./assets/01_login.png)

<div class="note">
<strong>Nota:</strong> Si olvidaste tu contraseña, contacta al administrador del sistema para que restablezca tu acceso desde el panel de Gestión de Usuarios.
</div>

<div class="page-break"></div>

## 2. Panel Principal (Dashboard)
Una vez inicias sesión, accederás al **Dashboard**. Esta pantalla te brinda un resumen instantáneo de tu actividad reciente.

![Dashboard Principal](./assets/02_dashboard.png)

Desde el menú lateral izquierdo podrás navegar rápidamente a las diferentes secciones:
* **Plantillas:** Administra tus archivos base (Word o PDF).
* **Documentos:** Consulta el historial de documentos generados.
* **Nuevo Documento:** El asistente para crear un archivo llenando un formulario.
* **Usuarios/Estadísticas:** (Solo Administradores) Control de acceso y uso.

<div class="page-break"></div>

## 3. Gestión de Plantillas
La sección de **Plantillas** es el corazón del sistema. Aquí subes los archivos Word (`.docx`) o PDF que se usarán como molde.

![Gestión de Plantillas](./assets/03_plantillas.png)

### ¿Cómo configurar una plantilla de Inteligencia Artificial?
1. Haz clic en **Nueva Plantilla** y sube tu archivo base.
2. Una vez subida, haz clic en el botón de configuración (⚙️).
3. En la pantalla de configuración, puedes añadir campos manualmente, o usar el botón **"Detectar Automáticamente"**.
4. **Instrucciones Personalizadas Petición IA:** Opcionalmente, puedes decirle a la IA cómo interpretar el documento (Ej. *"Extrae los nombres completos de las partes, e identifica si hay una tabla de honorarios que se llame 'servicios'"*).

<div class="page-break"></div>

## 4. Generación: Nuevo Documento
Para generar un contrato automatizado, ve a la sección **Nuevo Documento** y selecciona la plantilla que configuraste previamente.

![Formulario de Nuevo Documento](./assets/04_nuevo_documento.png)

### Llenado Dinámico y Listas (Ejemplo)
Si la plantilla requería una lista de elementos (por ejemplo, "Lista de Servicios" o "Inventario"), verás un botón para **+ Añadir Elemento**.
1. Haz clic en añadir.
2. Ingresa los datos individuales para cada fila (por ejemplo: `nombre` del servicio, `precio`, `cantidad`).
3. El sistema se encargará de organizar esta lista dinámicamente en el documento final, e incluso calculará precios totales automáticamente si configuraste la variable de suma.

![Generación y Descarga](./assets/05_documentos.png)
*(Arriba: Lista de documentos generados donde puedes descargar la versión final).*

<div class="page-break"></div>

## 5. Panel de Administración y Estadísticas
Si tu cuenta tiene previlegios de *Superusuario*, verás un botón adicional en el menú lateral llamado **Usuarios** y **Estadísticas**.

![Panel de Estadísticas](./assets/06_estadisticas.png)

### Estadísticas de Uso
Para entender cómo se está utilizando la herramienta, la sección de **Estadísticas** agrupa automáticamente el número de documentos creados. Esto te permite facturar a tus clientes por volumen o simplemente auditar las plantillas más exitosas:
* **Generados por Usuario:** ¿Quién está utilizando más el software?
* **Generados por Plantilla:** ¿Cuál es el contrato más recurrente?

<div class="note">
<strong>Tip Administrativo:</strong> Puedes usar este panel para restringir acceso rápidamente ingresando a "Usuarios" y desactivando el interruptor de estado (🛑) de cualquier empleado o cliente.
</div>
