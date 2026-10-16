import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { formatImageUrl, getInitials } from '../utils/image';
import { apiRequest } from '../utils/api';

interface RegisterEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  employeeToEdit?: Employee | null;
  existingCount: number;
}

export const RegisterEmployeeModal: React.FC<RegisterEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit,
  existingCount,
}) => {
  const [empId, setEmpId] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Software Engineering');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(employeeToEdit);

  useEffect(() => {
    if (employeeToEdit) {
      setEmpId(employeeToEdit.id);
      setFullName(employeeToEdit.full_name);
      setDepartment(employeeToEdit.department);
      setJobTitle(employeeToEdit.job_title || '');
      setEmail(employeeToEdit.email || '');
      setPhotoUrl(employeeToEdit.photo_url || '');
    } else {
      const generatedId = `EMP-${100 + existingCount + 1}`;
      setEmpId(generatedId);
      setFullName('');
      setDepartment('Workplace & Facilities');
      setJobTitle('');
      setEmail('');
      setPhotoUrl('');
    }
    setError(null);
  }, [employeeToEdit, isOpen, existingCount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (!department.trim()) {
      setError('Department is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && employeeToEdit) {
        await apiRequest(`/api/employees/${employeeToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            full_name: fullName,
            department,
            job_title: jobTitle,
            email,
            photo_url: photoUrl,
          }),
        });
        onSuccess(`Employee ${fullName} (${employeeToEdit.id}) updated successfully.`);
      } else {
        await apiRequest('/api/employees', {
          method: 'POST',
          body: JSON.stringify({
            id: empId,
            full_name: fullName,
            department,
            job_title: jobTitle,
            email,
            photo_url: photoUrl,
          }),
        });
        onSuccess(`Employee ${fullName} registered with ID ${empId}.`);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewPhoto = formatImageUrl(photoUrl);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog">
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              {isEditMode ? `Edit Employee Profile (${employeeToEdit?.id})` : 'Register New Employee'}
            </h3>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Manage employee profile details &amp; QR badge ID
            </div>
          </div>
          <button type="button" onClick={onClose}>
            [Close]
          </button>
        </div>

        {error && <div className="alert-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Employee ID & Full Name */}
          <div className="form-row">
            <div className="form-group" style={{ maxWidth: '140px' }}>
              <label htmlFor="reg-emp-id">Employee ID *</label>
              <input
                id="reg-emp-id"
                type="text"
                value={empId}
                disabled={isEditMode}
                onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                placeholder="EMP-107"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-full-name">Full Name *</label>
              <input
                id="reg-full-name"
                type="text"
                placeholder="e.g. Alex Rivera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Department & Job Title */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-department">Department *</label>
              <input
                id="reg-department"
                type="text"
                placeholder="e.g. Software Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-job-title">Job Title</label>
              <input
                id="reg-job-title"
                type="text"
                placeholder="e.g. Senior Staff Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              placeholder="e.g. alex.rivera@workplace.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Photo URL & Profile Photo Preview */}
          <div className="form-group">
            <label htmlFor="reg-photo">Google Drive Profile Picture Link</label>
            <input
              id="reg-photo"
              type="text"
              placeholder="e.g. https://drive.google.com/file/d/... or https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />

            {/* Profile Photo Preview Box */}
            <div style={{ marginTop: '8px', border: '1px solid #ccc', padding: '8px', backgroundColor: '#fafafa', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="avatar-box large">
                {previewPhoto ? (
                  <img
                    src={previewPhoto}
                    alt="Preview"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  getInitials(fullName || 'EM')
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>
                <strong>Profile Photo Preview:</strong>{' '}
                {previewPhoto ? 'Displaying linked photo' : `Generated initials avatar: "${getInitials(fullName || 'EM')}" until a photo is provided.`}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={{ fontWeight: 'bold' }}>
              {isSubmitting
                ? 'Saving...'
                : isEditMode
                ? 'Save Profile'
                : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
