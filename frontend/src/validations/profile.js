import { z } from 'zod';

const telefonoRegex = /^(0(4(12|14|16|22|24|26)|2\d{2}))-\d{7}$/;

export const updateProfileSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  apellido: z
    .string({ required_error: 'El apellido es requerido' })
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .trim(),
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('Email no válido')
    .trim()
    .toLowerCase(),
  telefono: z
    .string()
    .trim()
    .regex(telefonoRegex, 'Formato de teléfono inválido. Use 04XX-XXXXXXX o 02XX-XXXXXXX')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  direccion: z
    .string()
    .trim()
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  fotoPerfil: z
    .string()
    .trim()
    .url('URL de imagen no válida')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val === '' ? undefined : val)),
});
