import { createPortal } from 'react-dom';
import { useModalStore } from '../../stores/modalStore';
import UserDetailModal from '../../pages/Users/UserDetailModal';
import AuditoriaDetailModal from '../../pages/Auditoria/AuditoriaDetailModal';

const MODAL_REGISTRY = {
  userDetail: UserDetailModal,
  auditoriaDetail: AuditoriaDetailModal,
};

/**
 * Componente Outlet montado a nivel de layout principal.
 * Renderiza el modal activo vía Portal directamente en document.body.
 */
export default function ModalOutlet() {
  const modalType = useModalStore((s) => s.modalType);
  const modalProps = useModalStore((s) => s.modalProps);

  if (!modalType) return null;

  const ModalComponent = MODAL_REGISTRY[modalType];
  if (!ModalComponent) return null;

  return createPortal(
    <ModalComponent {...modalProps} />,
    document.body
  );
}
