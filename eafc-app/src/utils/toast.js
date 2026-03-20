import useToastStore from '../store/toastStore';

export function showToast(message) {
  useToastStore.getState().show(message);
}
