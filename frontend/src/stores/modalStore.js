import { create } from 'zustand';

export const useModalStore = create((set) => ({
  modalType: null,
  modalProps: {},
  openModal: (modalType, modalProps = {}) => set({ modalType, modalProps }),
  closeModal: () => set({ modalType: null, modalProps: {} }),
}));
