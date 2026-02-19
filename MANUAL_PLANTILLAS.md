# 📘 Guía de Creación de Plantillas

Esta guía explica paso a paso cómo preparar, subir y configurar plantillas en **Automatización Documental**.

---

## 1. Preparar el Documento Word (.docx)

El sistema utiliza **variables** para saber qué partes del documento deben ser dinámicas.

### Sintaxis de Variables
Para crear una variable, encierra el nombre entre dobles llaves: `{{nombre_variable}}`.

**Ejemplo de Contrato:**
> En la ciudad de `{{ciudad}}`, a los `{{dia}}` días del mes de `{{mes}}`, comparecen por una parte `{{nombre_arrendador}}`...

### Reglas Importantes:
- **Sin espacios:** Usa guiones bajos (`_`) en lugar de espacios.
  - ✅ Bien: `{{nombre_completo}}`
  - ❌ Mal: `{{nombre completo}}`
- **Formato:** El sistema respetará el formato (negrita, cursiva, tamaño) que le des a la variable en Word.
- **Tablas:** Puedes usar variables dentro de celdas de tablas.

---

## 2. Subir la Plantilla al Sistema

1. Ve a la sección **Plantillas** en el menú lateral.
2. Haz clic en el botón **"Subir Plantilla"**.
3. **Título:** Dale un nombre descriptivo a tu plantilla (ej: "Contrato de Arrendamiento").
4. **Archivo:** Selecciona tu archivo `.docx` preparado.
5. Haz clic en **"Guardar"**.

El sistema analizará automáticamente tu documento para detectar las variables `{{...}}`.

---

## 3. Configurar los Campos

> **Concepto Clave:** El documento Word define **QUÉ** datos se necesitan (las variables). Tú defines **CÓMO** se piden esos datos en la aplicación.

Una vez subida, es vital configurar cada variable para convertirla en un campo inteligente (Texto, Fecha, Menú, etc.) y definir su comportamiento.

1. Ve a **Plantillas** y busca tu plantilla.
2. Haz clic en el botón **⚙️ (Configurar)**.
3. Verás una lista de campos. Si está vacía, haz clic en **"Importar de Word"** para traer todas las variables detectadas.

### Tipos de Campos
Para cada variable, puedes elegir el tipo de pregunta:

- **Texto:** Para nombres, ciudades, direcciones (una sola línea).
- **Área de Texto:** Para párrafos largos o descripciones.
- **Lista Desplegable (Select):** Para ofrecer opciones predefinidas.
  - *Ejemplo:* Variable `{{estado_civil}}`.
  - *Opciones:* "Soltero, Casado, Viudo, Divorciado" (separadas por coma).
- **Fecha:** Muestra un calendario para seleccionar la fecha.

### Lógica Condicional (Mostrar SI...)
Puedes hacer que una pregunta solo aparezca si se cumple una condición.

**Ejemplo:**
Solo preguntar "¿Nombre del Cónyuge?" si el "Estado Civil" es "Casado".

1. En la variable `{{nombre_conyuge}}`.
2. Busca la sección **"Mostrar SI..."**.
3. Selecciona el campo dependiente: `{{estado_civil}}`.
4. Escribe el valor que activa la pregunta: `Casado`.

---

## 4. Guardar y Probar

1. Haz clic en **"💾 Guardar Cambios"** en la parte superior derecha.
2. Ve a **"Nuevo Documento"**.
3. Selecciona tu plantilla y verás el formulario dinámico que acabas de configurar.
