import { useCallback } from 'react';
import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export const useToast = () => {
  const success = useCallback((message: string, duration?: number) => {
    return toast.success(message, { duration });
  }, []);

  const error = useCallback((message: string, duration?: number) => {
    return toast.error(message, { duration });
  }, []);

  const warning = useCallback((message: string, duration?: number) => {
    return toast.warning(message, { duration });
  }, []);

  const info = useCallback((message: string, duration?: number) => {
    return toast.info(message, { duration });
  }, []);

  return {
    success,
    error,
    warning,
    info,
  };
};
