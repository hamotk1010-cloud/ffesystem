import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Employee } from '../types';
import { formatImageUrl, getInitials } from '../utils/image';

interface QrCodeManagerViewProps {
  employees: Employee[];
  departments: { department: string; count: number }[];
  isLoading: boolean;
  onFilterInventoryByEmployee: (empId: string) => void;
  onPrintBadge: (emp: Employee, qrDataUrl: string) => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const QrCodeManagerView: React.FC<QrCodeManagerViewProps> = ({
  employees,
  departments,
  isLoading,
  onFilterInventoryByEmployee,
  onPrintBadge,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  // Generate QR codes for all employees
  useEffect(() => {
    let isCancelled = false;

    const generateQrs = async () => {
      const urls: Record<string, string> = {};
      const baseUrl = window.location.origin;

      for (const emp of employees) {
        const fullUrl = `${baseUrl}/?view=employee&id=${emp.id}`;
        try {
          const dataUrl = await QRCode.toDataURL(fullUrl, {
            width: 200,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          urls[emp.id] = dataUrl;
        } catch (err) {
          console.error(`Failed to generate QR code for ${emp.id}:`, err);
        }
      }

      if (!isCancelled) {
        setQrCodeUrls(urls);
      }
    };

    if (employees.length > 0) {
      generateQrs();
    }

    return () => {
      isCancelled = true;
    };
  }, [employees]);

  const filteredEmployees = employees.filter((emp) => {
    if (selectedDept !== 'ALL' && emp.department !== selectedDept) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const matchName = emp.full_name.toLowerCase().includes(term);
      const matchId = emp.id.toLowerCase().includes(term);
      const matchDept = emp.department.toLowerCase().includes(term);
      if (!matchName && !matchId && !matchDept) return false;
    }
    return true;
  });

  const handleDownloadQrPng = (emp: Employee) => {
    const dataUrl = qrCodeUrls[emp.id];
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_${emp.id}_${emp.full_name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Downloaded QR Code PNG for ${emp.full_name}`, 'success');
  };

  const handleCopyLink = async (emp: Employee) => {
    const fullUrl = `${window.location.origin}/?view=employee&id=${emp.id}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      onShowToast(`Copied QR Profile link for ${emp.id} to clipboard!`, 'success');
    } catch (err) {
      onShowToast(`Could not copy link automatically: ${fullUrl}`, 'info');
    }
  };

  const handleTestScan = (emp: Employee) => {
    // Navigate directly in new window or view
    window.location.href = `/?view=employee&id=${emp.id}`;
  };

  return (
    <div className="qr-manager-container">
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
          QR Code Manager &amp; Badge Center ({filteredEmployees.length} of {employees.length})
        </h2>
        <div style={{ color: '#666', fontSize: '13px' }}>
          Generate, download, test, and print scannable QR verification badges for registered staff members
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="ffe-toolbar">
        <div className="ffe-toolbar-filters">
          <input
            type="text"
            placeholder="Search employee name, ID (e.g. EMP-101), or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '340px', maxWidth: '100%' }}
          />

          <label htmlFor="qr-dept-filter" style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>
            Department:
          </label>
          <select
            id="qr-dept-filter"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="ALL">All Departments ({employees.length})</option>
            {departments.map((d) => (
              <option key={d.department} value={d.department}>
                {d.department} ({d.count})
              </option>
            ))}
          </select>

          {(search || selectedDept !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedDept('ALL');
              }}
              style={{ fontSize: '12px' }}
            >
              [Reset Filters]
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
          Generating and loading QR tracking badges...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredEmployees.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #ccc', marginTop: '16px' }}>
          <p style={{ fontWeight: 'bold' }}>No staff members match the QR search criteria.</p>
        </div>
      )}

      {/* Cards Grid */}
      {!isLoading && filteredEmployees.length > 0 && (
        <div className="grid-cards">
          {filteredEmployees.map((emp) => {
            const qrImage = qrCodeUrls[emp.id];
            const encodedPath = `?view=employee&id=${emp.id}`;

            return (
              <div
                key={emp.id}
                className="ffe-card"
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                {/* Employee Header */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="avatar-box">
                    {emp.photo_url ? (
                      <img
                        src={formatImageUrl(emp.photo_url)}
                        alt={emp.full_name}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      getInitials(emp.full_name)
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>
                      {emp.id} | {emp.department}
                    </div>
                    <h3 style={{ margin: '2px 0', fontSize: '15px' }}>{emp.full_name}</h3>
                    <div style={{ fontSize: '12px', color: '#666' }}>{emp.job_title || 'Staff Member'}</div>
                  </div>
                </div>

                {/* QR Code Container */}
                <div
                  style={{
                    backgroundColor: '#fafafa',
                    border: '1px solid #ddd',
                    padding: '12px',
                    textAlign: 'center',
                    marginBottom: '10px',
                  }}
                >
                  {qrImage ? (
                    <img
                      src={qrImage}
                      alt={`QR code for ${emp.full_name}`}
                      style={{ width: '150px', height: '150px', display: 'inline-block' }}
                    />
                  ) : (
                    <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                      Generating QR...
                    </div>
                  )}

                  <div style={{ marginTop: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                    {emp.assigned_count ?? 0} Assigned FFE Assets
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: '#555',
                      wordBreak: 'break-all',
                      backgroundColor: '#fff',
                      padding: '4px',
                      border: '1px solid #eee',
                      marginTop: '6px',
                    }}
                  >
                    <code>{encodedPath}</code>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadQrPng(emp)}
                    style={{ fontSize: '11px' }}
                    title="Download PNG image of QR Code"
                  >
                    [Download QR]
                  </button>
                  <button
                    type="button"
                    onClick={() => onPrintBadge(emp, qrImage)}
                    style={{ fontSize: '11px' }}
                    title="Open print dialog for official badge card"
                  >
                    [Print Badge]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(emp)}
                    style={{ fontSize: '11px' }}
                    title="Copy direct verification URL to clipboard"
                  >
                    [Copy Link]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestScan(emp)}
                    style={{ fontSize: '11px' }}
                    title="Simulate scanning badge directly in browser"
                  >
                    [Test Scan]
                  </button>
                </div>

                {/* Admin Management Deep Link */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '8px', textAlign: 'center' }}>
                  <a
                    onClick={() => onFilterInventoryByEmployee(emp.id)}
                    style={{ fontSize: '11px', fontWeight: 'bold' }}
                  >
                    Manage Assigned Assets in Admin Console →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
