export interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
  duration?: number;
}
