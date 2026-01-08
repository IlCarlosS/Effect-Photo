# Studio de Filtros (Effect Photo)

## Descripción del Proyecto

Esta aplicación web es una herramienta de procesamiento de imágenes diseñada para simular efectos. Utiliza la potencia del HTML Canvas y JavaScript para aplicar transformaciones de píxeles en tiempo real.
El proyecto está estructurado de forma modular utilizando Vue.js (CDN) para la interfaz de usuario y Tailwind CSS para un diseño limpio y responsivo.

## Estructura de Archivos

La aplicación sigue una arquitectura modular simple para separar la presentación, el estilo y la lógica:
- index.html: Contiene la estructura principal de la interfaz de usuario y carga las dependencias (style.css, Vue, Tailwind y app.js).
- style.css: Aloja todos los estilos CSS personalizados que complementan a Tailwind CSS.
- app.js: Contiene toda la lógica de la aplicación Vue, las utilidades de imagen y las implementaciones de los filtros de píxeles.

## Características Implementadas

1. Filtro Xerox Bi-Color (Binarización)
Este es el filtro principal implementado actualmente. Permite al usuario reducir la paleta de colores de la imagen a solo dos tonos (Color Claro y Color Oscuro) basándose en un umbral de luminosidad.
- Color Claro: El color que reemplazará a los píxeles más brillantes que el Umbral.
- Color Oscuro: El color que reemplazará a los píxeles más oscuros que el Umbral.
- Umbral de Brillo: El punto de corte (0-255) para decidir qué píxeles son claros y cuáles son oscuros.
- Ruido por Filtro de Mediana (Median Filter) Para lograr un efecto más auténtico de fotocopiadora "sucia" o impresión difusa, se ha implementado opcionalmente un Filtro de Mediana (Kernel 3x3). Efecto: Al aplicarse, simula la difusión de la tinta y la pérdida de detalle granular, dando ese aspecto orgánico y menos digital a la imagen final.

2. Filtro de Doble Luz (Duotono Neón)
Este filtro simula un esquema de iluminación de estudio profesional, donde se proyectan dos fuentes de luz de distintos colores desde ángulos opuestos. A diferencia de la binarización, este efecto conserva la textura, el volumen y la profundidad de la imagen original, transformándola en una pieza estética.
- Colores de Iluminación (Color A y B): Define los dos tonos cromáticos que bañarán la escena.
- Ángulo del Degradado: Permite rotar la dirección de las "luces" en un rango de 0° a 360°.
- Exposición Base (Ajuste de Luminancia): Antes de aplicar el color, el filtro procesa la imagen en escalas de grises. Este parámetro permite "empujar" la luz de la foto original; una exposición alta rescatará detalles en sombras, mientras que una baja hará que los colores se concentren solo en los brillos más intensos.
- Intensidad Neón (Brillo de Color): Actúa como un multiplicador de saturación y brillo para los pigmentos seleccionados. Al aumentar este valor, los colores "explotan" sobre la imagen, simulando la incandescencia de una lámpara de neón o un foco LED de alta potencia.
- Lógica Técnica: El efecto convierte cada píxel a luminancia ITU-R BT.709, aplica una corrección de contraste mediante una curva Gamma, y finalmente realiza una mezcla aditiva entre el degradado espacial y la luminosidad de la imagen, asegurando que las zonas negras de la foto original se mantengan profundas para dar realismo.

## Módulos Clave en app.js
El archivo de lógica está dividido en tres objetos principales para mantener la modularidad:
- ImageUtils: Contiene funciones matemáticas para la manipulación de color y píxeles, incluyendo hexToRgb, calculateLuminance y el applyMedianFilter.
- Filters: Un objeto que actúa como un mapa, donde cada clave es el nombre de un filtro (ej: xerox). Cada función de filtro toma imageData y params y devuelve los datos modificados.
- Componente Vue: Gestiona el estado de la aplicación (imagen cargada, parámetros del filtro, estado de carga) y se encarga de llamar al Filters adecuado a través del método applyFilter.

## Próximas Adiciones
- Implementación del filtro Mapa de Bits (Posterización).
