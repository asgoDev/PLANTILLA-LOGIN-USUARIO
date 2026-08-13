import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../stores/authStore';
import { useUserById, useCreateUser, useUpdateUser } from '../../hooks/useUserQueries';
import { createUserSchema, updateUserSchema } from '../../validations/user.js';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import toast from 'react-hot-toast';

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const isEditMode = !!id;
  const isReadOnly = false;

  const { data: userData, isLoading: isQueryLoading, error: queryError } = useUserById(id);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const isLoading = isQueryLoading || createUserMutation.isPending || updateUserMutation.isPending;

  const [cedulaTipo, setCedulaTipo] = useState('V');
  const [cedulaNum, setCedulaNum] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      cedula: '',
      email: '',
      password: '',
      role: 'usuario',
      telefono: '',
      direccion: '',
      fechaNacimiento: '',
    },
  });

  if (!currentUser || currentUser.role !== 'admin') {
    toast.error('No tiene permisos para acceder a esta sección.');
    return <Navigate to="/" replace />;
  }

  // Sincronizar la cédula de los estados locales al campo de react-hook-form
  useEffect(() => {
    const cleanNum = cedulaNum.trim();
    if (cleanNum) {
      setValue('cedula', `${cedulaTipo}-${cleanNum}`, { shouldValidate: true });
    } else {
      setValue('cedula', '');
    }
  }, [cedulaTipo, cedulaNum, setValue]);

  // Manejar errores de carga
  useEffect(() => {
    if (queryError) {
      console.error(queryError);
      toast.error('Error al cargar la información del usuario.');
      navigate('/usuarios');
    }
  }, [queryError, navigate]);

  // Cargar información del usuario en modo edición/lectura
  useEffect(() => {
    if (userData) {
      reset({
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        email: userData.email || '',
        password: '', // Vacío por seguridad
        role: userData.role || '',
        telefono: userData.telefono || '',
        direccion: userData.direccion || '',
        fechaNacimiento: userData.fechaNacimiento
          ? new Date(userData.fechaNacimiento).toISOString().split('T')[0]
          : '',
        cedula: userData.cedula || '',
      });

      // Desglosar cédula en estados locales
      if (userData.cedula) {
        const parts = userData.cedula.split('-');
        if (parts.length === 2) {
          setCedulaTipo(parts[0]);
          setCedulaNum(parts[1]);
        } else {
          setCedulaNum(userData.cedula);
        }
      }
    }
  }, [userData, reset]);

  const handleTelefonoChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 4) {
      val = `${val.slice(0, 4)}-${val.slice(4)}`;
    }
    e.target.value = val;
  };

  const onSubmit = async (data) => {
    if (isReadOnly) return;

    try {
      const userData = { ...data };

      // Remover password si está vacío en edición
      if (isEditMode && !userData.password) {
        delete userData.password;
      }

      if (isEditMode) {
        await updateUserMutation.mutateAsync({ id, data: userData });
        toast.success('Usuario actualizado exitosamente.');
      } else {
        await createUserMutation.mutateAsync(userData);
        toast.success('Usuario registrado exitosamente.');
      }
      navigate('/usuarios');
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Error al registrar el usuario';
      toast.error(serverMessage);

      if (serverMessage.toLowerCase().includes('cédula') || serverMessage.toLowerCase().includes('cedula')) {
        setError('cedula', { message: 'Cédula ya registrada en el sistema' });
      } else if (serverMessage.toLowerCase().includes('email') || serverMessage.toLowerCase().includes('correo')) {
        setError('email', { message: 'Correo electrónico ya registrado en el sistema' });
      }
    }
  };

  // Títulos dinámicos según el modo
  const getPageTitle = () => {
    if (isReadOnly) return 'Detalles del Usuario';
    if (isEditMode) return 'Actualizar Información del Usuario';
    return 'Registro de Nuevo Usuario';
  };

  const getPageSubtitle = () => {
    if (isReadOnly) return 'Visualización detallada de la información de usuario.';
    if (isEditMode) return 'Modifique los campos necesarios para actualizar la cuenta.';
    return 'Complete todos los campos para crear una cuenta con privilegios en la plataforma.';
  };

  const getPageIcon = () => {
    if (isReadOnly) return 'visibility';
    if (isEditMode) return 'manage_accounts';
    return 'person_add';
  };

  return (
    <div className="space-y-lg animate-fade-in-up max-w-4xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <button
            onClick={() => navigate('/usuarios')}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all cursor-pointer"
            title="Volver a Usuarios"
          >
            <Icon name="arrow_back" size="20px" />
          </button>
          <div className="flex items-center gap-sm">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon name={getPageIcon()} size="24px" />
            </div>
            <div>
              <h2 className="text-headline-sm font-bold text-on-surface leading-tight">
                {getPageTitle()}
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                {getPageSubtitle()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">

        {/* Sección: Datos Personales */}
        <div className="bg-surface-container-lowest rounded-t-xl border border-outline-variant/20 overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant/15 flex items-center gap-sm">
            <Icon name="person_outline" size="18px" className="text-primary" />
            <span className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wide">
              Datos Personales
            </span>
          </div>
          <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg">

            <Input
              label="Nombre"
              icon="person"
              placeholder="Ej. Juan"
              error={errors.nombre?.message}
              disabled={isReadOnly}
              required={!isReadOnly}
              {...register('nombre')}
            />

            <Input
              label="Apellido"
              icon="person"
              placeholder="Ej. Pérez"
              error={errors.apellido?.message}
              disabled={isReadOnly}
              required={!isReadOnly}
              {...register('apellido')}
            />

            {/* Cédula Combinada */}
            <div className="space-y-1">
              <label className="block text-label-lg font-label-lg text-on-surface-variant">
                Cédula {!isReadOnly && <span className="text-error font-bold">*</span>}
              </label>
              <div className="flex gap-xs">
                <div className="relative flex-shrink-0">
                  <select
                    value={cedulaTipo}
                    onChange={(e) => !isReadOnly && setCedulaTipo(e.target.value)}
                    disabled={isReadOnly}
                    className="h-full bg-surface-container-low border border-outline-variant/40 rounded-lg pl-3 pr-8 text-body-md text-on-surface font-montserrat focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="V">V</option>
                    <option value="E">E</option>
                  </select>
                  {!isReadOnly && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                      <Icon name="arrow_drop_down" />
                    </span>
                  )}
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                    <Icon name="badge" size="20px" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="12345678"
                    value={cedulaNum}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      if (isReadOnly) return;
                      const val = e.target.value.replace(/\D/g, '');
                      setCedulaNum(val);
                    }}
                    className={`
                      w-full bg-surface-container-low border rounded-lg
                      pl-10 pr-4 py-3 text-body-md text-on-surface
                      placeholder:text-outline font-montserrat
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                      ${errors.cedula ? 'border-error focus:ring-error/30 focus:border-error' : 'border-outline-variant/40 hover:border-outline'}
                    `}
                  />
                </div>
              </div>
              {errors.cedula && (
                <p className="text-label-sm text-error flex items-center gap-1 mt-1">
                  <Icon name="error" size="14px" />
                  {errors.cedula.message}
                </p>
              )}
            </div>

            <Input
              label="Fecha de Nacimiento"
              type="date"
              icon="calendar_today"
              error={errors.fechaNacimiento?.message}
              disabled={isReadOnly}
              {...register('fechaNacimiento')}
            />

            <Input
              label="Dirección de Habitación"
              icon="home"
              placeholder="Ej. Av. Principal de Coro, Casa Nro. 5"
              error={errors.direccion?.message}
              disabled={isReadOnly}
              className="md:col-span-2"
              {...register('direccion')}
            />

          </div>
        </div>

        {/* Sección: Acceso y Seguridad */}
        <div className="bg-surface-container-lowest border-x border-outline-variant/20 overflow-hidden">
          <div className="px-lg py-md border-y border-outline-variant/15 flex items-center gap-sm">
            <Icon name="shield" size="18px" className="text-primary" />
            <span className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wide">
              Acceso y Seguridad
            </span>
          </div>
          <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg">

            <Input
              label="Correo Electrónico"
              type="email"
              icon="mail"
              placeholder="ejemplo@correo.com"
              error={errors.email?.message}
              disabled={isReadOnly}
              required={!isReadOnly}
              {...register('email')}
            />

            {!isReadOnly && (
              <Input
                label={isEditMode ? 'Nueva Contraseña' : 'Contraseña'}
                type="password"
                icon="lock"
                placeholder={isEditMode ? 'Dejar en blanco para no modificar' : 'Mínimo 6 caracteres'}
                error={errors.password?.message}
                required={!isEditMode}
                {...register('password')}
              />
            )}

            {/* Rol de Usuario */}
            <div className="space-y-1">
              <label className="block text-label-lg font-label-lg text-on-surface-variant">
                Rol del Usuario {!isReadOnly && <span className="text-error font-bold">*</span>}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  <Icon name="admin_panel_settings" size="20px" />
                </span>
                <select
                  disabled={isReadOnly}
                  className={`
                    w-full bg-surface-container-low border rounded-lg
                    pl-10 pr-10 py-3 text-body-md text-on-surface
                    font-montserrat focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-all duration-200 appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                    ${errors.role ? 'border-error focus:ring-error/30 focus:border-error' : 'border-outline-variant/40 hover:border-outline'}
                  `}
                  required={!isReadOnly}
                  {...register('role')}
                >
                  <option value="" disabled>Seleccione un rol...</option>
                  <option value="admin">Administrador</option>
                  <option value="usuario">Usuario</option>
                </select>
                {!isReadOnly && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                    <Icon name="arrow_drop_down" />
                  </span>
                )}
              </div>
              {errors.role && (
                <p className="text-label-sm text-error flex items-center gap-1 mt-1">
                  <Icon name="error" size="14px" />
                  {errors.role.message}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Sección: Información de Contacto */}
        <div className="bg-surface-container-lowest border-x border-outline-variant/20 overflow-hidden">
          <div className="px-lg py-md border-y border-outline-variant/15 flex items-center gap-sm">
            <Icon name="contact_phone" size="18px" className="text-primary" />
            <span className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wide">
              Información de Contacto
            </span>
          </div>
          <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg">

            <Input
              label="Teléfono"
              type="tel"
              icon="phone"
              placeholder="Ej. 0412-1234567"
              error={errors.telefono?.message}
              disabled={isReadOnly}
              {...register('telefono', { onChange: handleTelefonoChange })}
            />

          </div>
        </div>

        {/* ── Footer de acciones ── */}
        <div className="bg-surface-container-lowest rounded-b-xl border border-outline-variant/20 px-lg py-md flex items-center justify-between gap-md">
          <p className="text-body-sm text-on-surface-variant hidden sm:block">
            {!isReadOnly && (isEditMode
              ? 'Los campos con * son obligatorios.'
              : 'Complete todos los campos requeridos para continuar.'
            )}
          </p>
          <div className="flex gap-md ml-auto">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => navigate('/usuarios')}
              className="active:scale-95 transition-all"
            >
              {isReadOnly ? 'Volver' : 'Cancelar'}
            </Button>
            {!isReadOnly && (
              <Button
                type="submit"
                loading={isLoading}
                icon={<Icon name="save" size="20px" />}
                className="active:scale-95 transition-all px-lg"
              >
                {isEditMode ? 'Guardar Cambios' : 'Registrar Usuario'}
              </Button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
