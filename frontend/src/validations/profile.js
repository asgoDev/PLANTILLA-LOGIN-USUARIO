import { z } from 'zod';

const telefonoRegex = /^(0(4(12|14|16|22|24|26)|2\d{2}))-\d{7}$/;

// ── Campo de contraseña fuerte (reutilizable) ─────────────────────────────────
const strongPassword = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

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

/**
 * changePasswordSchema
 *
 * Valida el formulario de cambio de contraseña del propio usuario.
 * - currentPassword: mínimo 8 chars (igual al requisito del modelo)
 * - newPassword: política de fortaleza completa
 * - confirmPassword: debe coincidir con newPassword
 *
 * Refines:
 *  1. newPassword !== currentPassword
 *  2. confirmPassword === newPassword
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'La contraseña actual es requerida' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    newPassword: strongPassword,
    confirmPassword: z
      .string({ required_error: 'Confirme su nueva contraseña' })
      .min(1, 'Confirme su nueva contraseña'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

