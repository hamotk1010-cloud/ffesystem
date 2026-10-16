import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(currentPassword, newPassword, confirmPassword);
      onSuccess('Admin password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog small">
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Admin Security Settings</h3>
            <div style={{ fontSize: '11px', color: '#666' }}>Update system administrator credentials</div>
          </div>
          <button type="button" onClick={onClose}>
            [Close]
          </button>
        </div>

        {error && <div className="alert-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sec-current">Current Password *</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                id="sec-current"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {showCurrent ? '[Hide]' : '[Show]'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sec-new">New Password (min 6 chars) *</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                id="sec-new"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {showNew ? '[Hide]' : '[Show]'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sec-confirm">Confirm New Password *</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                id="sec-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {showConfirm ? '[Hide]' : '[Show]'}
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={{ fontWeight: 'bold' }}>
              {isSubmitting ? 'Saving...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
