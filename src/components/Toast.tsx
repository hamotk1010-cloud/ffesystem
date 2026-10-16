import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'error';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item">
          <span>
            {toast.type === 'error' && '[ERROR] '}
            {toast.type === 'success' && '[SUCCESS] '}
            {toast.type === 'info' && '[INFO] '}
            {toast.text}
          </span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            style={{ padding: '1px 6px', fontSize: '11px' }}
          >
            [x]
          </button>
        </div>
      ))}
    </div>
  );
};
