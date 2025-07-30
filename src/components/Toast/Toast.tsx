import React, { useState, useEffect, useCallback } from 'react';
import './Toast.css';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type'], duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'info', duration = 5000) => {
      const id = Date.now().toString();
      const newToast: ToastMessage = { id, message, type, duration };

      setToasts(prev => [...prev, newToast]);

      // Auto-dismiss after duration
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const Toast: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div className={`toast toast--${toast.type}`} role="alert">
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};
