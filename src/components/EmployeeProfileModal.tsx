import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Employee, Asset } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatImageUrl, getCategoryPlaceholder, getInitials } from '../utils/image';
import { exportEmployeeAccountabilityPdf } from '../utils/pdf';

interface EmployeeProfileModalProps {
  isOpen: boolean;
  employee: Employee | null;
  assets: Asset[];
  onClose: () => void;
  onUnassignAsset: (asset: Asset) => void;
  onEditEmployee: (emp: Employee) => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  isOpen,
  employee,
  assets,
  onClose,
  onUnassignAsset,
  onEditEmployee,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (employee) {
      const fullUrl = `${window.location.origin}/?view=employee&id=${employee.id}`;
      QRCode.toDataURL(fullUrl, { width: 160, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(''));
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const assignedAssets = assets.filter((a) => a.employee_id === employee.id);
  const totalValuation = assignedAssets.reduce(
    (sum, a) => sum + (Number(a.purchase_cost) || 0),
    0
  );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog large">
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Staff Profile &amp; Asset Custody</h3>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Employee Record: {employee.id} — {employee.full_name}
            </div>
          </div>
          <button type="button" onClick={onClose}>
            [Close]
          </button>
        </div>

        {/* Profile Card Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            backgroundColor: '#fafafa',
            border: '1px solid #ddd',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div className="avatar-box large">
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

          <div style={{ flex: 1, minWidth: '200px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{employee.id}</span>
            <h3 style={{ margin: '2px 0 4px 0', fontSize: '18px' }}>{employee.full_name}</h3>
            <div style={{ fontSize: '13px', fontWeight: '500' }}>{employee.job_title || 'Staff Member'}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Dept: {employee.department} {employee.email && `| Email: ${employee.email}`}
            </div>
          </div>

          {/* Mini QR display */}
          {qrDataUrl && (
            <div style={{ textAlign: 'center', border: '1px solid #ccc', padding: '6px', backgroundColor: '#fff' }}>
              <img src={qrDataUrl} alt="QR" style={{ width: '80px', height: '80px', display: 'block' }} />
              <span style={{ fontSize: '10px', color: '#666' }}>QR Badge</span>
            </div>
          )}
        </div>

        {/* Assigned Assets summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <strong style={{ fontSize: '14px' }}>
              Assigned Workplace FFE Assets ({assignedAssets.length})
            </strong>
            <span style={{ fontSize: '12px', color: '#555', marginLeft: '8px' }}>
              Total Custodial Value: {formatCurrency(totalValuation)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => exportEmployeeAccountabilityPdf(employee, assignedAssets)}
            style={{ fontSize: '12px' }}
          >
            [Download Accountability PDF]
          </button>
        </div>

        {assignedAssets.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed #ccc', marginBottom: '16px' }}>
            <p style={{ margin: 0, color: '#666' }}>No FFE assets currently assigned to this personnel.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table className="ffe-table" aria-label="Assigned Assets Table">
              <thead>
                <tr>
                  <th>Asset Item</th>
                  <th>Tag / SN</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedAssets.map((asset) => {
                  const img = formatImageUrl(asset.image_url) || getCategoryPlaceholder(asset.category);

                  return (
                    <tr key={asset.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={img}
                            alt=""
                            className="asset-thumbnail"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getCategoryPlaceholder(asset.category);
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{asset.name}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>{asset.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div><code>{asset.tag_number}</code></div>
                        {asset.serial_number && (
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            <code>{asset.serial_number}</code>
                          </div>
                        )}
                      </td>
                      <td>{asset.category}</td>
                      <td>{asset.location}</td>
                      <td style={{ fontWeight: '600' }}>{formatCurrency(asset.purchase_cost)}</td>
                      <td>
                        <span className={`status-tag status-${asset.status}`}>{asset.status}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onUnassignAsset(asset)}
                          style={{ fontSize: '11px', padding: '2px 6px' }}
                          title="Unassign asset and set status to Available"
                        >
                          [Unassign]
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-footer">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEditEmployee(employee);
            }}
          >
            [Edit Employee Info]
          </button>
          <button type="button" onClick={onClose}>
            [Close]
          </button>
        </div>
      </div>
    </div>
  );
};
