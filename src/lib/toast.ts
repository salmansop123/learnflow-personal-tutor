import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  warning: (message: string) => sonnerToast.warning(message),
  info: (message: string) => sonnerToast.info(message),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};

export function toastError(error: unknown, fallback = "Something went wrong") {
  const message =
    error instanceof Error ? error.message : fallback;
  toast.error(message);
}
