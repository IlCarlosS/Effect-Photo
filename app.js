const { createApp } = Vue;
// =========================================================================
// MÓDULO DE UTILIDADES DE IMAGEN
// =========================================================================
const ImageUtils = {
    /**
     * Convierte un color hexadecimal
     * @param {string} hex - Color en formato hexadecimal.
     * @returns {number[]} Array con los valores [R, G, B].
     */
    hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16), // R
            parseInt(result[2], 16), // G
            parseInt(result[3], 16)  // B
        ] : [0, 0, 0];
    },

    /**
     * Calcula la luminancia (brillo) de un píxel RGB usando el estándar ITU-R BT.709.
     * @param {number} r - Valor de Rojo (0-255).
     * @param {number} g - Valor de Verde (0-255).
     * @param {number} b - Valor de Azul (0-255).
     * @returns {number} Valor de luminancia (0-255).
     */
    calculateLuminance(r, g, b) {
        const R_LUMINANCE = 0.2126;
        const G_LUMINANCE = 0.7152;
        const B_LUMINANCE = 0.0722;
        return (R_LUMINANCE * r) + (G_LUMINANCE * g) + (B_LUMINANCE * b);
    },

    /**
     * Aplica un filtro de mediana (kernel 3x3) para reducir el ruido y suavizar bordes.
     * Se usa como pre-proceso para simular el ruido/difusión de tinta de una fotocopiadora.
     * @param {ImageData} imageData - Datos originales de píxeles.
     * @returns {ImageData} Los nuevos datos de píxeles con el filtro de mediana aplicado.
     */
    applyMedianFilter(imageData) {
        const { width, height, data } = imageData;
        const tempImageData = new ImageData(width, height);
        const tempData = tempImageData.data;
        const kernelSize = 3; // Kernel 3x3
        const radius = Math.floor(kernelSize / 2); // Radio = 1

        // Función auxiliar para obtener el valor mediano de un array
        const getMedian = (arr) => {
            arr.sort((a, b) => a - b);
            return arr[Math.floor(arr.length / 2)];
        };

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const rValues = [];
                const gValues = [];
                const bValues = [];

                // Recorrer el kernel 3x3 alrededor del píxel (x, y)
                for (let ky = -radius; ky <= radius; ky++) {
                    for (let kx = -radius; kx <= radius; kx++) {
                        const nx = x + kx;
                        const ny = y + ky;

                        // Verificar límites de la imagen
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const index = (ny * width + nx) * 4;
                            rValues.push(data[index]);
                            gValues.push(data[index + 1]);
                            bValues.push(data[index + 2]);
                        }
                    }
                }

                // Calcular la mediana para cada componente de color
                const medianR = getMedian(rValues);
                const medianG = getMedian(gValues);
                const medianB = getMedian(bValues);

                // Reemplazar el píxel central con los valores medianos
                const outputIndex = (y * width + x) * 4;
                tempData[outputIndex] = medianR;
                tempData[outputIndex + 1] = medianG;
                tempData[outputIndex + 2] = medianB;
                tempData[outputIndex + 3] = data[outputIndex + 3]; // Mantener el Alpha (opacidad)
            }
        }
        return tempImageData;
    },

    /**
     * Realiza una interpolación lineal entre dos valores.
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
};


// =========================================================================
// MÓDULOS DE FILTRO
// =========================================================================
const Filters = {
    /**
     * Aplica el filtro Xerox Bi-Color (Binarización).
     * @param {ImageData} imageData - Datos de píxeles de la imagen.
     * @param {Object} params - Parámetros del filtro (color1, color2, threshold, useMedian).
     * @returns {ImageData} Los datos de píxeles modificados.
     */
    xerox(imageData, params) {
        let currentImageData = imageData;

        // Opcionalmente aplicar el filtro de mediana como pre-proceso
        if (params.useMedian) {
             currentImageData = ImageUtils.applyMedianFilter(currentImageData);
        }

        const data = currentImageData.data;
        const len = data.length;

        // Parámetros de entrada ya convertidos a RGB
        const rgb1 = ImageUtils.hexToRgb(params.color1); // Color Claro
        const rgb2 = ImageUtils.hexToRgb(params.color2); // Color Oscuro
        const threshold = params.threshold;

        for (let i = 0; i < len; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            //Calcular Brillo (Luminancia)
            const luminance = ImageUtils.calculateLuminance(r, g, b);

            //Aplicar Binarización (Paletización Bi-Color)
            if (luminance > threshold) {
                // CLARO
                data[i]     = rgb1[0];
                data[i + 1] = rgb1[1];
                data[i + 2] = rgb1[2];
            } else {
                // OSCURO
                data[i]     = rgb2[0];
                data[i + 1] = rgb2[1];
                data[i + 2] = rgb2[2];
            }
        }
        return currentImageData;
    },

    /**
     * Aplica el filtro Duotone (Doble Luz).
     * @param {ImageData} imageData 
     * @param {Object} params 
     */
    duotone(imageData, params) {
        const { width, height, data } = imageData;
        const rgb1 = ImageUtils.hexToRgb(params.color1);
        const rgb2 = ImageUtils.hexToRgb(params.color2);
        
        const angleRad = (params.angle * Math.PI) / 180;
        const dirX = Math.cos(angleRad);
        const dirY = Math.sin(angleRad);
        
        const exposure = params.exposure || 1.0;
        const intensity = params.neonIntensity || 1.0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;

                // 1. Obtener Luminancia base
                const gray = ImageUtils.calculateLuminance(data[i], data[i+1], data[i+2]);
                
                // 2. APLICAR EXPOSICIÓN Y CONTRASTE
                // Multiplicamos por la exposición para rescatar luces o sombras
                let normGray = (gray / 255) * exposure;
                
                // Aplicamos un ligero contraste (curva S simplificada) para que no sea plano
                normGray = Math.pow(normGray, 1.2); 
                
                // Limitar a 1.0 máximo
                if (normGray > 1) normGray = 1;

                // 3. Calcular factor de degradado (donde cae cada color)
                let factor = (x / width - 0.5) * dirX + (y / height - 0.5) * dirY;
                factor = Math.max(0, Math.min(1, factor + 0.5));

                // 4. Mezcla de los dos colores elegidos
                const rMix = rgb1[0] * (1 - factor) + rgb2[0] * factor;
                const gMix = rgb1[1] * (1 - factor) + rgb2[1] * factor;
                const bMix = rgb1[2] * (1 - factor) + rgb2[2] * factor;

                // 5. Resultado final: Color Mezclado * Luminancia Ajustada * Intensidad
                data[i]     = Math.min(255, rMix * normGray * intensity);
                data[i + 1] = Math.min(255, gMix * normGray * intensity);
                data[i + 2] = Math.min(255, bMix * normGray * intensity);
            }
        }
        return imageData;
    }
    
    // Futuros Filtros se añadirían aquí (duotone, posterize, etc.)
};


// =========================================================================
// COMPONENTE PRINCIPAL VUE
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    createApp({
        data() {
            return {
                imageElement: null,     // Referencia al objeto Image cargado
                //parametros duo tono
                exposure: 1.0,
                gradientAngle: 45,
                neonIntensity: 1.5,
                //parametros default
                color1: '#ffffff',      
                color2: '#000000', 
                // Parámetros del filtro Xerox     
                threshold: 128,
                useMedianFilter: false, // NUEVO: Control para activar el filtro de mediana
                // Control de la UI
                selectedFilter: 'xerox',// Filtro actualmente seleccionado
                canvasWidth: 0,
                canvasHeight: 0,
                isLoading: false,
                isProcessed: false,
                showToast: false, //visibilidad toast
            }
        },
        methods: {
            /**
             * Maneja la subida del archivo de imagen y carga el objeto Image.
             */
            handleImageUpload(event) {
                const file = event.target.files[0];
                if (!file) return;

                this.isProcessed = false;
                this.isLoading = true;

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        this.imageElement = img;
                        this.canvasWidth = img.width;
                        this.canvasHeight = img.height;
                        this.isLoading = false;
                        this.applyFilter(); // Aplicar el filtro al cargar
                    };
                    img.onerror = () => {
                        this.isLoading = false;
                        console.error("Error al cargar la imagen.");
                    }
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            },

            /**
             * Función principal que aplica el filtro seleccionado al canvas.
             */
            applyFilter() {
                if (!this.imageElement || this.isLoading) return;

                this.isLoading = true;
                this.isProcessed = false;
                
                // procesamiento se ejecute después del próximo tick de la UI
                this.$nextTick(() => {
                    const canvas = this.$refs.outputCanvas;
                    const ctx = canvas.getContext('2d');

                    // Dibujar la imagen original
                    ctx.drawImage(this.imageElement, 0, 0, this.canvasWidth, this.canvasHeight);
                    
                    // Obtener los datos de píxeles
                    // Es importante trabajar con una COPIA de los datos originales si se va a hacer pre-procesamiento aunque en este caso dibujamos la original y luego extraemos los datos limpios.
                    let imageData = ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);

                    // Seleccionar y aplicar el filtro
                    const currentFilter = Filters[this.selectedFilter];
                    
                    if (currentFilter) {
                        // Parámetros que pasaremos al filtro Xerox
                        const params = {
                            color1: this.color1,
                            color2: this.color2,
                            threshold: this.threshold,
                            useMedian: this.useMedianFilter, // NUEVO: Añadir parámetro de filtro de mediana
                            exposure: this.exposure,
                            angle: this.gradientAngle, // duotono
                            neonIntensity: this.neonIntensity,
                        };
                        
                        // El filtro modifica los datos
                        imageData = currentFilter(imageData, params);
                    } else {
                        console.error(`Filtro no implementado: ${this.selectedFilter}`);
                        this.isLoading = false;
                        this.isProcessed = true;
                        return;
                    }

                    // 4. Escribir los datos modificados de vuelta al canvas
                    ctx.putImageData(imageData, 0, 0);

                    this.isLoading = false;
                    this.isProcessed = true;
                });
            },

            /**
             * Permite al usuario descargar la imagen actual del canvas.
             */
            downloadImage() {
                if (!this.isProcessed || this.isLoading) {
                    console.error("Proceso no terminado.");
                    return;
                }
                const canvas = this.$refs.outputCanvas;
                const link = document.createElement('a');
                link.download = `filtro-studio-${this.selectedFilter}-${Date.now()}.png`; 
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // --- Lógica del Toast ---
                this.showToast = true;

                // Ocultar automáticamente después de 3 segundos
                setTimeout(() => {
                    this.showToast = false;
                }, 3000);
            }
        }
    }).mount('#app');
});