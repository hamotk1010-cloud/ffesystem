import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog small">
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
          <button type="button" onClick={onCancel}>
            [Close]
          </button>
        </div>
        <p style={{ margin: '14px 0', fontSize: '13px' }}>{message}</p>
        <div className="modal-footer">
          <button type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ fontWeight: 'bold', borderColor: '#900', color: '#900' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
