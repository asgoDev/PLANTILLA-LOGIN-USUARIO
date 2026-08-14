import { useEffect } from 'react';
import { useModalStore } from '../../stores/modalStore';

/**
 * Shell unificado para modales que abstrae overlay, centrado,
 * atajo Escape y animación.
 *
 * @param {{
 *   children: React.ReactNode,
 *   maxWidth?: string,
 *   onClose?: () => void,
 * }} props
 */
export default function ModalShell({ children, maxWidth = 'max-w-lg', onClose }) {
  const closeModal = useModalStore((s) => s.closeModal);
  const handleClose = onClose || closeModal;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
