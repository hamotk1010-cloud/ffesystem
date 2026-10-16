import React from 'react';
import { Employee } from '../types';
import { formatImageUrl, getInitials } from '../utils/image';

interface PrintBadgeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  qrDataUrl: string;
  onClose: () => void;
}

export const PrintBadgeModal: React.FC<PrintBadgeModalProps> = ({
  isOpen,
  employee,
  qrDataUrl,
  onClose,
}) => {
  if (!isOpen || !employee) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog small">
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Print Employee ID Badge</h3>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Standard workplace badge with scannable FFE verification QR
            </div>
          </div>
          <button type="button" onClick={onClose}>
            [Close]
          </button>
        </div>

        {/* Printable Badge Area */}
        <div className="printable-badge-area" style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '260px',
              border: '2px solid #222',
              backgroundColor: '#fff',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '2px 2px 0px #333',
            }}
          >
            {/* Badge Top Branding */}
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px' }}>
                WORKSPACE FFE
              </div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#666' }}>
                Asset &amp; Employee Tracking Badge
              </div>
            </div>

            {/* Photo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <div
                className="avatar-box"
                style={{
                  width: '90px',
                  height: '90px',
                  fontSize: '28px',
                  border: '2px solid #222',
                }}
              >
                {employee.photo_url ? (
                  <img
                    src={formatImageUrl(employee.photo_url)}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  getInitials(employee.full_name)
                )}
              </div>
            </div>

            {/* Employee Info */}
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>
              ID: <code>{employee.id}</code>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '2px 0' }}>
              {employee.full_name}
            </div>
            <div style={{ fontSize: '11px', color: '#444' }}>
              {employee.job_title || 'Workplace Staff Member'}
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
              {employee.department}
            </div>

            {/* QR Code */}
            <div style={{ marginTop: '12px', borderTop: '1px dashed #888', paddingTop: '10px' }}>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Badge"
                  style={{ width: '130px', height: '130px', display: 'inline-block' }}
                />
              )}
              <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                Scan to verify assigned FFE equipment
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={handlePrint} style={{ fontWeight: 'bold' }}>
            [Print Badge]
          </button>
        </div>
      </div>
    </div>
  );
};
