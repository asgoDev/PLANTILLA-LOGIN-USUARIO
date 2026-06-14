import mongoose from 'mongoose';

/**
 * Schema de Auditoría
 *
 * Campos de primer nivel tipados e indexados para permitir queries útiles
 * sin depender de buscar dentro de un bloque Mixed.
 *
 * detalles.body  → payload sanitizado del request (sin passwords)
 * detalles.error → mensaje de error si el resultado fue FALLIDO
 */
const auditoriaSchema = new mongoose.Schema(
  {
    // ── Quién ─────────────────────────────────────────────────────────────
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // ── Qué ───────────────────────────────────────────────────────────────
    accion: {
      type: String,
      enum: ['CREAR', 'ACTUALIZAR', 'ELIMINAR'],
      required: true,
    },
    modulo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // ── Resultado ─────────────────────────────────────────────────────────
    resultado: {
      type: String,
      enum: ['EXITOSO', 'FALLIDO'],
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },

    // ── Contexto HTTP ─────────────────────────────────────────────────────
    recurso_id: {
      // ID del recurso afectado extraído de req.params.id o la respuesta
      type: String,
      default: null,
    },
    url: {
      type: String,
      required: true,
    },
    metodo: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },

    // ── Payload libre ─────────────────────────────────────────────────────
    detalles: {
      // body sanitizado, mensaje de error, datos anteriores/nuevos, etc.
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Cuándo ────────────────────────────────────────────────────────────
    fecha: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

// ── Índices compuestos para las queries más frecuentes ────────────────────────
auditoriaSchema.index({ usuario_id: 1, fecha: -1 });
auditoriaSchema.index({ modulo: 1, fecha: -1 });
auditoriaSchema.index({ resultado: 1, fecha: -1 });
auditoriaSchema.index({ statusCode: 1, fecha: -1 });

const Auditoria = mongoose.model('Auditoria', auditoriaSchema);
export default Auditoria;
