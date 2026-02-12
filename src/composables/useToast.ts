import { ref } from "vue";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  message: string;
  type: ToastType;
  id: number;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
  function showToast(message: string, type: ToastType = "success", duration = 4000) {
    const id = nextId++;
    toasts.value.push({ message, type, id });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, duration);
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, showToast, removeToast };
}
