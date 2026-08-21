/**
 * Servicio de carga de imágenes preparado para Cloudinary.
 *
 * Configuración en .env:
 *   VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
 *   VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset
 *   VITE_CLOUDINARY_API_KEY=tu_api_key
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Sube una imagen a Cloudinary (o retorna maqueta local si no está configurado).
 *
 * @param {File} file - Archivo de imagen seleccionado por el usuario
 * @returns {Promise<{ url: string, isMock: boolean }>}
 */
export async function uploadImageToCloudinary(file) {
  // Si Cloudinary está configurado con unsigned preset, se realiza la subida real
  if (CLOUD_NAME && UPLOAD_PRESET) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'perfiles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error en la respuesta de Cloudinary');
      }

      const data = await response.json();
      return {
        url: data.secure_url,
        isMock: false,
      };
    } catch (error) {
      console.warn('Fallo en la subida a Cloudinary, usando fallback de maqueta:', error);
    }
  }

  // ── MODO MAQUETA (Simulación local con Data URL) ──────────────────────────
  // Simula la latencia de red y convierte el archivo a Data URL para preview persistente
  await new Promise((resolve) => setTimeout(resolve, 800));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result, // Data URL base64 utilizable inmediatamente
        isMock: true,
      });
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo de imagen local'));
    };
    reader.readAsDataURL(file);
  });
}
