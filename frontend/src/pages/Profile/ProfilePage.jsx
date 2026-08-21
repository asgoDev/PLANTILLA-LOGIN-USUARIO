import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfile, useUpdateProfile, useUpdateProfilePhoto, useChangePassword } from '../../hooks/useProfileQueries';
import { updateProfileSchema, changePasswordSchema } from '../../validations/profile';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';
import { useAuthStore } from '../../stores/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const updatePhotoMutation = useUpdateProfilePhoto();
  const changePasswordMutation = useChangePassword();

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // ── Estado modal de countdown post-cambio de contraseña ─────────────────────
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef(null);

  const isSaving = updateProfileMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      direccion: '',
    },
  });

  // ── Formulario de cambio de contraseña (independiente del formulario de perfil) ───
  const {
    register: registerPwd,
    handleSubmit: handleSubmitPwd,
    reset: resetPwd,
    watch: watchPwd,
    formState: { errors: pwdErrors, isSubmitting: isPwdSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue = watchPwd('newPassword', '');

  // Cargar datos del perfil en el formulario al recibir la respuesta
  useEffect(() => {
    if (profile) {
      reset({
        nombre: profile.nombre || '',
        apellido: profile.apellido || '',
        email: profile.email || '',
        telefono: profile.telefono || '',
        direccion: profile.direccion || '',
      });
      setPhotoPreview(profile.fotoPerfil || null);
    }
  }, [profile, reset]);

  // Manejar error en carga de perfil
  useEffect(() => {
    if (profileError) {
      toast.error('Error al cargar la información del perfil.');
    }
  }, [profileError]);

  // ── Countdown de logout tras cambio de contraseña ──────────────────────────────
  const triggerLogoutCountdown = useCallback(() => {
    setShowLogoutModal(true);
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          logout().then(() => navigate('/login'));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logout, navigate]);

  // Limpiar el interval al desmontar
  useEffect(() => () => clearInterval(countdownRef.current), []);

  // Función para cerrar sesión inmediatamente desde el modal
  const handleImmediateLogout = () => {
    clearInterval(countdownRef.current);
    logout().then(() => navigate('/login'));
  };

  // Manejo de autoformato de teléfono venezolano
  const handleTelefonoChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 4) {
      val = `${val.slice(0, 4)}-${val.slice(4)}`;
    }
    e.target.value = val;
  };

  // Manejo de cambio / subida de foto de perfil
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes en formato JPG, PNG o WEBP.');
      return;
    }

    // Validación de tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('La imagen no debe superar los 5MB de tamaño.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const toastId = toast.loading('Procesando y cargando imagen...');

      // Llamada al servicio preparado para Cloudinary (maqueta / producción)
      const { url, isMock } = await uploadImageToCloudinary(file);

      // Guardar la nueva URL en el backend
      await updatePhotoMutation.mutateAsync(url);
      setPhotoPreview(url);

      toast.dismiss(toastId);
      if (isMock) {
        toast.success('Foto actualizada con éxito (Modo maqueta Cloudinary)');
      } else {
        toast.success('Foto de perfil actualizada en Cloudinary.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar la foto de perfil.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Eliminar foto de perfil
  const handleRemovePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      await updatePhotoMutation.mutateAsync(null);
      setPhotoPreview(null);
      toast.success('Foto de perfil eliminada.');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar la foto de perfil.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Envío del formulario de perfil
  const onSubmit = async (data) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      toast.success('Perfil actualizado correctamente.');
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Error al actualizar el perfil';
      toast.error(serverMessage);
    }
  };

  // ── Fortaleza de la contraseña ─────────────────────────────────────────────────
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score <= 2) return { level: 1, label: 'Débil', color: 'bg-red-500' };
    if (score === 3) return { level: 2, label: 'Media', color: 'bg-amber-500' };
    if (score === 4) return { level: 3, label: 'Fuerte', color: 'bg-emerald-500' };
    return { level: 4, label: 'Muy fuerte', color: 'bg-emerald-600' };
  };
  const pwdStrength = getPasswordStrength(newPasswordValue);

  // ── Submit del formulario de cambio de contraseña ─────────────────────────────
  const onSubmitPassword = async (data) => {
    try {
      await changePasswordMutation.mutateAsync(data);
      resetPwd();
      triggerLogoutCountdown();
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(serverMessage);
    }
  };

  // Cancelar y restablecer cambios
  const handleCancel = () => {
    if (profile) {
      reset({
        nombre: profile.nombre || '',
        apellido: profile.apellido || '',
        email: profile.email || '',
        telefono: profile.telefono || '',
        direccion: profile.direccion || '',
      });
      setPhotoPreview(profile.fotoPerfil || null);
      toast('Cambios descartados.', { icon: 'ℹ️' });
    }
  };

  // Formato legible de fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Calcular edad
  const calculateAge = (dateString) => {
    if (!dateString) return null;
    try {
      const birthDate = new Date(dateString);
      const age = Math.floor(
        (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      return age >= 0 ? age : null;
    } catch {
      return null;
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 font-montserrat">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-body-md text-on-surface-variant font-medium animate-pulse">
          Cargando información del perfil...
        </p>
      </div>
    );
  }

  const fullName = profile ? `${profile.nombre} ${profile.apellido}` : 'Usuario';
  const roleLabel = profile?.role === 'admin' ? 'Administrador' : 'Usuario Estándar';
  const age = calculateAge(profile?.fechaNacimiento);

  return (
    <div className="space-y-lg animate-fade-in-up max-w-7xl mx-auto font-montserrat pb-xl">
      {/* ── Encabezado de Página ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all cursor-pointer"
            title="Volver"
          >
            <Icon name="arrow_back" size="20px" />
          </button>
          <div className="flex items-center gap-sm">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon name="account_circle" size="26px" />
            </div>
            <div>
              <h2 className="text-headline-sm font-bold text-on-surface leading-tight">
                Mi Perfil
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Consulte y administre su información personal y preferencias de cuenta.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Profile Card ── */}
      <div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
        {/* Banner gradient desactivado — activar agregando <ProfileBanner /> cuando se desee */}

        {/* Contenedor del Avatar y Datos Rápidos */}
        <div className="px-lg py-md relative">
          <div className="flex flex-col sm:flex-row items-center gap-md">
            {/* Avatar Grande con Trigger de Carga */}
            <div className="relative group">
              <div className="p-1 rounded-full bg-surface-container-lowest ring-4 ring-surface-container shadow-lg">
                <Avatar
                  src={photoPreview}
                  name={fullName}
                  size="2xl"
                  className="w-28 h-28 sm:w-32 sm:h-32 text-2xl sm:text-3xl"
                />
              </div>

              {/* Botón Flotante para Cambiar Foto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-1 right-1 p-2.5 rounded-full bg-primary text-on-primary shadow-md hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center ring-2 ring-surface-container-lowest"
                title="Cambiar foto de perfil"
              >
                {isUploadingPhoto ? (
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="photo_camera" size="18px" />
                )}
              </button>

              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Información Rápida en el Header */}
            <div className="flex-1 text-center sm:text-left space-y-1 mt-2 sm:mt-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-title-lg font-bold text-on-surface">
                  {fullName}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold self-center sm:self-auto ${profile?.role === 'admin'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-secondary-container/30 text-on-secondary-container border border-secondary-container/50'
                  }`}>
                  <Icon name={profile?.role === 'admin' ? 'verified_user' : 'person'} size="14px" />
                  {roleLabel}
                </span>
              </div>

              <p className="text-body-sm text-on-surface-variant flex items-center justify-center sm:justify-start gap-1">
                <Icon name="mail" size="15px" className="text-outline" />
                {profile?.email}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-label-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Estado: <strong className="text-on-surface font-semibold capitalize">{profile?.estado || 'Activo'}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icon name="badge" size="14px" className="text-outline" />
                  Cédula: <strong className="text-on-surface font-semibold">{profile?.cedula}</strong>
                </span>
              </div>
            </div>

            {/* Acciones de Foto (Eliminar si existe) */}
            {photoPreview && (
              <div className="mt-2 sm:mt-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  className="text-error hover:bg-error/10 hover:text-error text-label-sm"
                  icon={<Icon name="delete" size="16px" />}
                >
                  Quitar Foto
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Formulario de Edición de Perfil ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-0 shadow-sm rounded-2xl overflow-hidden">
        {/* ── Sección 1: Datos Personales ── */}
        <div className="bg-surface-container-lowest rounded-t-2xl border border-outline-variant/20 overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant/15 flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <Icon name="person" size="18px" className="text-primary" />
              <span className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wide">
                Datos Personales
              </span>
            </div>
            <span className="text-label-sm text-on-surface-variant italic">
              Los campos con * son editables
            </span>
          </div>

          <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Nombre */}
            <Input
              label="Nombre *"
              icon="badge"
              placeholder="Su nombre"
              error={errors.nombre?.message}
              {...register('nombre')}
            />

            {/* Apellido */}
            <Input
              label="Apellido *"
              icon="badge"
              placeholder="Su apellido"
              error={errors.apellido?.message}
              {...register('apellido')}
            />

            {/* Cédula (Solo Lectura) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-label-lg font-label-lg text-on-surface-variant">
                  Cédula de Identidad
                </label>
                <span className="text-[11px] text-outline flex items-center gap-0.5">
                  <Icon name="lock" size="12px" /> Inmutable
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <Icon name="credit_card" size="20px" />
                </span>
                <input
                  type="text"
                  value={profile?.cedula || ''}
                  disabled
                  readOnly
                  className="w-full bg-surface-container-low/70 border border-outline-variant/30 rounded-lg pl-10 pr-10 py-3 text-body-md text-on-surface-variant font-montserrat opacity-80 cursor-not-allowed select-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">
                  <Icon name="lock" size="18px" />
                </span>
              </div>
              <p className="text-[11px] text-outline mt-0.5">
                Para solicitar un cambio de cédula, consulte con un administrador.
              </p>
            </div>

            {/* Fecha de Nacimiento (Solo Lectura) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-label-lg font-label-lg text-on-surface-variant">
                  Fecha de Nacimiento
                </label>
                <span className="text-[11px] text-outline flex items-center gap-0.5">
                  <Icon name="lock" size="12px" /> Inmutable
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  <Icon name="calendar_today" size="20px" />
                </span>
                <input
                  type="text"
                  value={
                    profile?.fechaNacimiento
                      ? `${formatDate(profile.fechaNacimiento)} ${age ? `(${age} años)` : ''}`
                      : 'No registrada'
                  }
                  disabled
                  readOnly
                  className="w-full bg-surface-container-low/70 border border-outline-variant/30 rounded-lg pl-10 pr-10 py-3 text-body-md text-on-surface-variant font-montserrat opacity-80 cursor-not-allowed select-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">
                  <Icon name="lock" size="18px" />
                </span>
              </div>
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <Input
                label="Dirección de Habitación"
                icon="home"
                placeholder="Ej. Av. Bolívar, Calle 4, Casa Nro. 12"
                error={errors.direccion?.message}
                {...register('direccion')}
              />
            </div>
          </div>
        </div>

        {/* ── Sección 2: Información de Contacto ── */}
        <div className="bg-surface-container-lowest border-x border-t border-outline-variant/20 overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant/15 flex items-center gap-sm">
            <Icon name="contact_mail" size="18px" className="text-primary" />
            <span className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wide">
              Información de Contacto
            </span>
          </div>

          <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Email */}
            <Input
              label="Correo Electrónico *"
              type="email"
              icon="mail"
              placeholder="ejemplo@correo.com"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Teléfono */}
            <Input
              label="Número Telefónico"
              type="tel"
              icon="phone"
              placeholder="Ej. 0412-1234567"
              error={errors.telefono?.message}
              {...register('telefono', { onChange: handleTelefonoChange })}
            />
          </div>
        </div>

        {/* ── Sección 3: Resumen de Cuenta (Readonly) ── */}
        <div className="bg-surface-container-lowest border-x border-t border-outline-variant/20 overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant/15 flex items-center gap-sm">
            <Icon name="shield" size="18px" className="text-primary" />
            <span className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wide">
              Detalles de la Cuenta
            </span>
          </div>

          <div className="p-lg grid grid-cols-1 sm:grid-cols-3 gap-md">
            {/* Rol */}
            <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/20">
              <span className="text-label-sm text-outline block mb-1">Rol de Acceso</span>
              <div className="flex items-center gap-2">
                <Icon name={profile?.role === 'admin' ? 'admin_panel_settings' : 'badge'} className="text-primary" size="20px" />
                <span className="text-body-md font-semibold text-on-surface capitalize">
                  {profile?.role || 'usuario'}
                </span>
              </div>
            </div>

            {/* Estado */}
            <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/20">
              <span className="text-label-sm text-outline block mb-1">Estado de Cuenta</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-body-md font-semibold text-on-surface capitalize">
                  {profile?.estado || 'activo'}
                </span>
              </div>
            </div>

            {/* Fecha de Registro */}
            <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/20">
              <span className="text-label-sm text-outline block mb-1">Miembro Desde</span>
              <div className="flex items-center gap-2">
                <Icon name="event" className="text-outline" size="20px" />
                <span className="text-body-md font-semibold text-on-surface">
                  {formatDate(profile?.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer de Acciones ── */}
        <div className="bg-surface-container-lowest rounded-b-2xl border border-outline-variant/20 px-lg py-md flex flex-col sm:flex-row items-center justify-between gap-md">
          <p className="text-body-sm text-on-surface-variant text-center sm:text-left">
            {isDirty ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <Icon name="edit" size="16px" /> Tiene cambios sin guardar.
              </span>
            ) : (
              'Su información está actualizada.'
            )}
          </p>

          <div className="flex items-center gap-md w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={!isDirty || isSaving}
              onClick={handleCancel}
              className="active:scale-95 transition-all w-full sm:w-auto"
            >
              Descartar
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSaving}
              disabled={!isDirty || isSaving}
              icon={<Icon name="save" size="18px" />}
              className="active:scale-95 transition-all w-full sm:w-auto px-lg"
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </form>

      {/* ── Formulario de Cambio de Contraseña ── */}
      <form
        onSubmit={handleSubmitPwd(onSubmitPassword)}
        className="space-y-0 shadow-sm rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/20"
      >
        <div className="px-lg py-md border-b border-outline-variant/15 flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <Icon name="lock_reset" size="20px" className="text-primary" />
            <span className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wide">
              Seguridad y Contraseña
            </span>
          </div>
          <span className="text-label-sm text-on-surface-variant">
            Se cerrará la sesión tras el cambio exitoso
          </span>
        </div>

        <div className="p-lg space-y-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {/* Contraseña Actual */}
            <Input
              label="Contraseña Actual *"
              type="password"
              icon="key"
              placeholder="Ingrese su contraseña actual"
              error={pwdErrors.currentPassword?.message}
              {...registerPwd('currentPassword')}
            />

            {/* Nueva Contraseña */}
            <div className="space-y-2">
              <Input
                label="Nueva Contraseña *"
                type="password"
                icon="lock"
                placeholder="Mínimo 8 caracteres"
                error={pwdErrors.newPassword?.message}
                {...registerPwd('newPassword')}
              />

              {/* Indicador de Fortaleza */}
              {newPasswordValue && (
                <div className="space-y-1 animate-fade-in pt-1">
                  <div className="flex items-center justify-between text-label-xs text-on-surface-variant">
                    <span>
                      Fortaleza: <strong className="font-semibold text-on-surface">{pwdStrength.label}</strong>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${pwdStrength.level >= 1 ? pwdStrength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${pwdStrength.level >= 2 ? pwdStrength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${pwdStrength.level >= 3 ? pwdStrength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${pwdStrength.level >= 4 ? pwdStrength.color : 'bg-transparent'}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Nueva Contraseña */}
            <Input
              label="Confirmar Nueva Contraseña *"
              type="password"
              icon="check_circle"
              placeholder="Repita la nueva contraseña"
              error={pwdErrors.confirmPassword?.message}
              {...registerPwd('confirmPassword')}
            />
          </div>

          <div className="p-md rounded-xl bg-surface-container-low/70 border border-outline-variant/15 flex items-start gap-sm">
            <Icon name="info" size="18px" className="text-primary mt-0.5 shrink-0" />
            <p className="text-label-sm text-on-surface-variant">
              La contraseña debe tener al menos <strong>8 caracteres</strong> e incluir al menos una letra <strong>mayúscula</strong>, una <strong>minúscula</strong> y un <strong>número</strong>. No puede ser idéntica a su contraseña actual.
            </p>
          </div>
        </div>

        {/* Footer de Acciones del Formulario de Contraseña */}
        <div className="bg-surface-container-lowest border-t border-outline-variant/15 px-lg py-md flex flex-col sm:flex-row items-center justify-between gap-md">
          <p className="text-body-sm text-on-surface-variant">
            Asegúrese de recordar su nueva contraseña para el próximo inicio de sesión.
          </p>

          <div className="flex items-center gap-md w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => resetPwd()}
              disabled={changePasswordMutation.isPending}
              className="active:scale-95 transition-all w-full sm:w-auto"
            >
              Limpiar
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={changePasswordMutation.isPending}
              disabled={changePasswordMutation.isPending}
              icon={<Icon name="lock_reset" size="18px" />}
              className="active:scale-95 transition-all w-full sm:w-auto px-lg"
            >
              Actualizar Contraseña
            </Button>
          </div>
        </div>
      </form>

      {/* ── Modal de Logout con Countdown de 5 Segundos ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-xl shadow-2xl border border-outline-variant/30 text-center space-y-lg animate-scale-in font-montserrat"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ícono de éxito con animación */}
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center ring-8 ring-emerald-500/5">
              <Icon name="check_circle" size="44px" />
            </div>

            {/* Texto informativo */}
            <div className="space-y-2">
              <h3 className="text-headline-sm font-bold text-on-surface">
                ¡Contraseña Actualizada!
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                Su contraseña se ha modificado exitosamente. Por razones de seguridad, debe volver a iniciar sesión con sus nuevas credenciales.
              </p>
            </div>

            {/* Contador animado */}
            <div className="py-3 px-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 inline-flex items-center justify-center gap-3 w-full">
              <span className="w-3 h-3 rounded-full bg-primary animate-ping" />
              <p className="text-body-md font-medium text-on-surface">
                Cerrando sesión en{' '}
                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-primary text-on-primary font-bold text-title-sm">
                  {countdown}
                </span>{' '}
                {countdown === 1 ? 'segundo' : 'segundos'}...
              </p>
            </div>

            {/* Botón de acción inmediata */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleImmediateLogout}
              icon={<Icon name="logout" size="20px" />}
              className="w-full shadow-md active:scale-95 transition-all"
            >
              Cerrar Sesión Ahora
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

