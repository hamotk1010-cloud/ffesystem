import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Employee, Asset } from '../types';
import { formatImageUrl, getCategoryPlaceholder, getInitials } from '../utils/image';

interface ScanQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployeeProfile: (empId: string) => void;
}

export const ScanQrModal: React.FC<ScanQrModalProps> = ({
  isOpen,
  onClose,
  onSelectEmployeeProfile,
}) => {
  const [manualId, setManualId] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<{ employee: Employee; assets: Asset[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'reader-qr-region';

  // Helper to extract employee ID from URL or raw string
  const parseEmployeeId = (text: string): string => {
    const clean = text.trim();
    // Check if it's a URL with id=EMP-xxx or id=xxx
    const urlMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase();
    }
    // Check if it's a direct EMP-xxx
    const empMatch = clean.match(/(EMP-\d+)/i);
    if (empMatch && empMatch[1]) {
      return empMatch[1].toUpperCase();
    }
    return clean.toUpperCase();
  };

  const handleLookup = async (idToLookup: string) => {
    const empId = parseEmployeeId(idToLookup);
    if (!empId) {
      setScanError('Please enter a valid Employee ID.');
      return;
    }

    setIsLoading(true);
    setScanError(null);

    try {
      const res = await fetch(`/api/public/employee/${encodeURIComponent(empId)}`);
      if (!res.ok) {
        throw new Error(`Employee with ID '${empId}' not found in records.`);
      }
      const data = await res.json();
      setEmployeeData(data);
      setScannedResult(empId);
      // Stop camera once scanned successfully
      stopCamera();
    } catch (err: any) {
      setScanError(err.message || 'Lookup failed.');
      setEmployeeData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    setScanError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setScanError('No camera found on this device. Please use manual Employee ID entry below.');
        return;
      }

      const cameraId = devices[0].id;
      setCameraActive(true);

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          handleLookup(decodedText);
        },
        () => {
          // Ignore scanning frames that didn't detect QR
        }
      );
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setScanError(
        'Unable to access camera feed (permission denied or insecure context). You can use manual Employee ID entry below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setEmployeeData(null);
      setManualId('');
      setScanError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog large">
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Scan Staff QR Badge</h3>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Verify assigned FFE equipment via camera scan or manual Employee ID
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            [Close]
          </button>
        </div>

        {scanError && <div className="alert-box">{scanError}</div>}

        {/* Camera Scanner View */}
        <div style={{ marginBottom: '16px', border: '1px solid #ccc', padding: '12px', backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong>Live Camera Scanner:</strong>
            {!cameraActive ? (
              <button type="button" onClick={startCamera}>
                [Start Camera]
              </button>
            ) : (
              <button type="button" onClick={stopCamera}>
                [Stop Camera]
              </button>
            )}
          </div>

          <div
            id={qrRegionId}
            style={{
              width: '100%',
              maxWidth: '360px',
              minHeight: cameraActive ? '260px' : '60px',
              margin: '0 auto',
              backgroundColor: '#eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!cameraActive && (
              <span style={{ fontSize: '12px', color: '#666', padding: '16px' }}>
                Camera is off. Click [Start Camera] to scan QR code on a staff badge.
              </span>
            )}
          </div>
        </div>

        {/* Manual Fallback Entry */}
        <div style={{ border: '1px solid #ccc', padding: '12px', marginBottom: '16px' }}>
          <label htmlFor="manual-emp-id" style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
            Manual Entry Fallback:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="manual-emp-id"
              type="text"
              placeholder="e.g. EMP-101 or full scan URL"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLookup(manualId);
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => handleLookup(manualId)}
              disabled={isLoading || !manualId.trim()}
              style={{ fontWeight: 'bold' }}
            >
              {isLoading ? 'Searching...' : '[Look Up Employee]'}
            </button>
          </div>
        </div>

        {/* Scanned / Looked Up Results */}
        {employeeData && (
          <div style={{ border: '2px solid #222', padding: '14px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="avatar-box large">
                  {employeeData.employee.photo_url ? (
                    <img
                      src={formatImageUrl(employeeData.employee.photo_url)}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    getInitials(employeeData.employee.full_name)
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                    {employeeData.employee.id} | {employeeData.employee.department}
                  </span>
                  <h3 style={{ margin: '2px 0', fontSize: '18px' }}>{employeeData.employee.full_name}</h3>
                  <div style={{ fontSize: '12px', color: '#555' }}>{employeeData.employee.job_title}</div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectEmployeeProfile(employeeData.employee.id);
                  }}
                  style={{ fontWeight: 'bold' }}
                >
                  [Manage in Employee Profile →]
                </button>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
              Assigned Assets ({employeeData.assets.length} items):
            </div>

            {employeeData.assets.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                No assets currently assigned to this personnel.
              </div>
            ) : (
              <table className="ffe-table" style={{ margin: 0 }} aria-label="Scanned Employee Assets">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Tag Number</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeData.assets.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                      <td><code>{item.tag_number}</code></td>
                      <td>{item.category}</td>
                      <td>{item.location}</td>
                      <td>
                        <span className={`status-tag status-${item.status}`}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            [Close]
          </button>
        </div>
      </div>
    </div>
  );
};
