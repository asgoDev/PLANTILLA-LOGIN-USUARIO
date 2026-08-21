import { z } from 'zod';

const telefonoRegex = /^(0(4(12|14|16|22|24|26)|2\d{2}))-\d{7}$/;

export const updateProfileSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim()
    .optional(),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Correo electrónico inválido')
    .trim()
    .toLowerCase()
    .optional(),
  telefono: z
    .string()
    .trim()
    .regex(telefonoRegex, 'Formato de teléfono inválido. Use 04XX-XXXXXXX o 02XX-XXXXXXX')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  direccion: z
    .string()
    .trim()
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  fotoPerfil: z
    .string()
    .trim()
    .url('URL de foto inválida')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val === '' ? null : val)),
});

export const updatePhotoSchema = z.object({
  fotoPerfil: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val === '' ? null : val)),
});

/**
 * changePasswordSchema
 *
 * Valida el cuerpo de la solicitud de cambio de contraseña del propio usuario.
 * - currentPassword: mínimo 8 caracteres (mismo requisito que el schema del modelo)
 * - newPassword: política de fortaleza completa (mayúscula, minúscula, número)
 * - confirmPassword: debe coincidir exactamente con newPassword
 *
 * Reglas de negocio (refine):
 *  1. newPassword debe ser diferente a currentPassword
 *  2. confirmPassword debe ser igual a newPassword
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'La contraseña actual es requerida' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    newPassword: z
      .string({ required_error: 'La nueva contraseña es requerida' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z
      .string({ required_error: 'La confirmación de contraseña es requerida' })
      .min(1, 'Confirme su nueva contraseña'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'La nueva contraseña debe ser diferente a la contraseña actual',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

