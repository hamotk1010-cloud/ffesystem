import React, { useEffect, useState } from 'react';
import { Employee, Asset } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatImageUrl, getCategoryPlaceholder, getInitials } from '../utils/image';

interface PublicEmployeeProfileProps {
  employeeId: string;
  onReturnToAdmin?: () => void;
}

export const PublicEmployeeProfile: React.FC<PublicEmployeeProfileProps> = ({
  employeeId,
  onReturnToAdmin,
}) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/employee/${encodeURIComponent(employeeId)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Could not find employee record for ${employeeId}.`);
        }
        const data = await res.json();
        setEmployee(data.employee);
        setAssets(data.assets || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load public profile.');
      } finally {
        setIsLoading(false);
      }
    };

    if (employeeId) {
      fetchProfile();
    }
  }, [employeeId]);

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '16px' }}>
      {/* Top bar for public verification */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #333',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>WorkSpace FFE</span>
            <span style={{ fontSize: '11px', border: '1px solid #666', padding: '1px 4px' }}>
              PUBLIC ASSET VERIFICATION
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Official Furniture, Fixtures &amp; Equipment Accountability Record
          </div>
        </div>

        {onReturnToAdmin && (
          <button type="button" onClick={onReturnToAdmin}>
            [Admin Login / Console]
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          Verifying employee badge and assigned asset inventory...
        </div>
      )}

      {error && (
        <div className="alert-box">
          <strong>Verification Error:</strong> {error}
        </div>
      )}

      {!isLoading && employee && (
        <div>
          {/* Employee Badge Card */}
          <div
            className="ffe-card"
            style={{
              padding: '20px',
              marginBottom: '20px',
              backgroundColor: '#fafafa',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            <div className="avatar-box large" style={{ width: '80px', height: '80px', fontSize: '24px' }}>
              {employee.photo_url ? (
                <img
                  src={formatImageUrl(employee.photo_url)}
                  alt={employee.full_name}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                getInitials(employee.full_name)
              )}
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                BADGE ID: <code>{employee.id}</code>
              </div>
              <h2 style={{ margin: '2px 0 4px 0', fontSize: '22px' }}>{employee.full_name}</h2>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#222' }}>
                {employee.job_title || 'Workplace Staff Member'}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                Department: <strong>{employee.department}</strong>
                {employee.email && <span> | Email: {employee.email}</span>}
              </div>
            </div>

            <div
              style={{
                border: '1px solid #ccc',
                padding: '10px 16px',
                textAlign: 'center',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{assets.length}</div>
              <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>
                Assigned FFE Assets
              </div>
            </div>
          </div>

          {/* Assigned Assets Section */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
              Active Assigned Equipment &amp; Property ({assets.length} items)
            </h3>
            <div style={{ fontSize: '12px', color: '#666' }}>
              The following workplace assets are in active custody of {employee.full_name}:
            </div>
          </div>

          {assets.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed #ccc' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                No FFE assets are currently registered to this employee.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ffe-table" aria-label="Assigned Property">
                <thead>
                  <tr>
                    <th>Asset Item</th>
                    <th>Tag &amp; Serial</th>
                    <th>Category</th>
                    <th>Registered Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((item) => {
                    const img = formatImageUrl(item.image_url) || getCategoryPlaceholder(item.category);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={img}
                              alt=""
                              className="asset-thumbnail"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getCategoryPlaceholder(item.category);
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                              <div style={{ fontSize: '11px', color: '#666' }}>ID: {item.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>Tag: <code>{item.tag_number}</code></div>
                          {item.serial_number && (
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              S/N: <code>{item.serial_number}</code>
                            </div>
                          )}
                        </td>
                        <td>{item.category}</td>
                        <td>{item.location}</td>
                        <td>
                          <span className={`status-tag status-${item.status}`}>{item.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div
            style={{
              marginTop: '30px',
              paddingTop: '16px',
              borderTop: '1px solid #ccc',
              fontSize: '11px',
              color: '#888',
              textAlign: 'center',
            }}
          >
            WorkSpace FFE Verification Portal • All registered company assets are subject to regular physical audits.
          </div>
        </div>
      )}
    </div>
  );
};
