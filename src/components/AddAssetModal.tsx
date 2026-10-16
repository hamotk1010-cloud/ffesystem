import React, { useState, useEffect } from 'react';
import { Asset, Employee } from '../types';
import { formatImageUrl, getCategoryPlaceholder } from '../utils/image';
import { apiRequest } from '../utils/api';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  assetToEdit?: Asset | null;
  employees: Employee[];
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  assetToEdit,
  employees,
}) => {
  const [tab, setTab] = useState<'single' | 'batch'>('single');

  // Fields
  const [name, setName] = useState('');
  const [tagNumber, setTagNumber] = useState('');
  const [tagPrefix, setTagPrefix] = useState('TAG-' + new Date().getFullYear() + '-');
  const [serialNumber, setSerialNumber] = useState('');
  const [serialPrefix, setSerialPrefix] = useState('SN-');
  const [category, setCategory] = useState<'Furniture' | 'Fixture' | 'Equipment'>('Furniture');
  const [location, setLocation] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<string>('0');
  const [status, setStatus] = useState<'Available' | 'Assigned' | 'Maintenance' | 'Retired'>('Available');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Batch specific
  const [quantity, setQuantity] = useState<number>(3);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(assetToEdit);

  useEffect(() => {
    if (assetToEdit) {
      setTab('single');
      setName(assetToEdit.name || '');
      setTagNumber(assetToEdit.tag_number || '');
      setSerialNumber(assetToEdit.serial_number || '');
      setCategory(assetToEdit.category || 'Furniture');
      setLocation(assetToEdit.location || '');
      setPurchaseCost(String(assetToEdit.purchase_cost ?? '0'));
      setStatus(assetToEdit.status || 'Available');
      setEmployeeId(assetToEdit.employee_id || '');
      setImageUrl(assetToEdit.image_url || '');
      setNotes(assetToEdit.notes || '');
    } else {
      setTab('single');
      setName('');
      const defaultTag = `TAG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      setTagNumber(defaultTag);
      setTagPrefix(`TAG-${new Date().getFullYear()}-`);
      setSerialNumber('');
      setSerialPrefix('SN-');
      setCategory('Furniture');
      setLocation('Building A - Level 3 - Room 302');
      setPurchaseCost('0.00');
      setStatus('Available');
      setEmployeeId('');
      setImageUrl('');
      setNotes('');
      setQuantity(3);
    }
    setError(null);
  }, [assetToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle employee selection: auto-sets status to Assigned
  const handleEmployeeChange = (empId: string) => {
    setEmployeeId(empId);
    if (empId) {
      setStatus('Assigned');
    } else {
      if (status === 'Assigned') {
        setStatus('Available');
      }
    }
  };

  // Handle status selection: if Maintenance or Retired, clear employee
  const handleStatusChange = (newStatus: 'Available' | 'Assigned' | 'Maintenance' | 'Retired') => {
    setStatus(newStatus);
    if (newStatus === 'Maintenance' || newStatus === 'Retired') {
      setEmployeeId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Asset Item Name is required.');
      return;
    }

    if (!location.trim()) {
      setError('Workplace Location is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && assetToEdit) {
        await apiRequest(`/api/assets/${assetToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            tag_number: tagNumber,
            serial_number: serialNumber,
            category,
            location,
            purchase_cost: parseFloat(purchaseCost) || 0,
            status,
            employee_id: employeeId || null,
            image_url: imageUrl,
            notes,
          }),
        });
        onSuccess(`Asset ${assetToEdit.id} updated successfully.`);
      } else {
        if (tab === 'batch') {
          await apiRequest('/api/assets', {
            method: 'POST',
            body: JSON.stringify({
              isBatch: true,
              quantity,
              name,
              tag_prefix: tagPrefix,
              serial_prefix: serialPrefix,
              category,
              location,
              purchase_cost: parseFloat(purchaseCost) || 0,
              status,
              employee_id: employeeId || null,
              image_url: imageUrl,
              notes,
            }),
          });
          onSuccess(`Batch of ${quantity} FFE assets created successfully.`);
        } else {
          await apiRequest('/api/assets', {
            method: 'POST',
            body: JSON.stringify({
              isBatch: false,
              name,
              tag_number: tagNumber,
              serial_number: serialNumber,
              category,
              location,
              purchase_cost: parseFloat(purchaseCost) || 0,
              status,
              employee_id: employeeId || null,
              image_url: imageUrl,
              notes,
            }),
          });
          onSuccess(`Asset '${name}' recorded successfully.`);
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewSrc = formatImageUrl(imageUrl) || getCategoryPlaceholder(category);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog large">
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              {isEditMode ? `Edit FFE Asset (${assetToEdit?.id})` : 'Add New FFE Asset'}
            </h3>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Record single workplace furniture, fixture, or technical equipment
            </div>
          </div>
          <button type="button" onClick={onClose}>
            [Close]
          </button>
        </div>

        {/* Tab switch for Add mode only */}
        {!isEditMode && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #ccc' }}>
            <button
              type="button"
              className={`ffe-nav-tab ${tab === 'single' ? 'active' : ''}`}
              onClick={() => setTab('single')}
              style={{ padding: '6px 14px' }}
            >
              Single Item
            </button>
            <button
              type="button"
              className={`ffe-nav-tab ${tab === 'batch' ? 'active' : ''}`}
              onClick={() => setTab('batch')}
              style={{ padding: '6px 14px' }}
            >
              Add Group of Items (Batch)
            </button>
          </div>
        )}

        {error && <div className="alert-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Batch quantity control */}
          {tab === 'batch' && !isEditMode && (
            <div className="form-group" style={{ backgroundColor: '#f9f9f9', padding: '10px', border: '1px solid #ddd' }}>
              <label htmlFor="batch-qty" style={{ fontWeight: 'bold' }}>
                Batch Units Count to Generate (1 to 50) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  id="batch-qty"
                  type="number"
                  min={1}
                  max={50}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                  style={{ width: '100px' }}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Multiple records will be created with incremented tag numbers.
                </span>
              </div>
            </div>
          )}

          {/* Asset Item Name */}
          <div className="form-group">
            <label htmlFor="asset-name">Asset Item Name *</label>
            <input
              id="asset-name"
              type="text"
              placeholder="e.g. Herman Miller Aeron Chair"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Tags & Serial Numbers */}
          <div className="form-row">
            {tab === 'single' || isEditMode ? (
              <>
                <div className="form-group">
                  <label htmlFor="asset-tag">Asset Tag Number (e.g. TAG-2024-001)</label>
                  <input
                    id="asset-tag"
                    type="text"
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="asset-sn">Serial Number (e.g. SN-HM-88291)</label>
                  <input
                    id="asset-sn"
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="batch-tag-prefix">Tag Number Prefix (e.g. TAG-2024-)</label>
                  <input
                    id="batch-tag-prefix"
                    type="text"
                    value={tagPrefix}
                    onChange={(e) => setTagPrefix(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="batch-sn-prefix">Serial Number Prefix (e.g. SN-)</label>
                  <input
                    id="batch-sn-prefix"
                    type="text"
                    value={serialPrefix}
                    onChange={(e) => setSerialPrefix(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Category & Location */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="asset-category">Category *</label>
              <select
                id="asset-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="Furniture">Furniture (Chairs, Desks, Tables)</option>
                <option value="Fixture">Fixture (Mounts, Purifiers, Lamps)</option>
                <option value="Equipment">Equipment (Monitors, Boards, Tech)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="asset-location">Workplace Location *</label>
              <input
                id="asset-location"
                type="text"
                placeholder="e.g. Building A - Level 3 - Room 302"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Cost & Status */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="asset-cost">Purchase Cost (₱) *</label>
              <input
                id="asset-cost"
                type="number"
                step="0.01"
                min="0"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="asset-status">Initial Status *</label>
              <select
                id="asset-status"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
              >
                <option value="Available">Available (In Stock / Unassigned)</option>
                <option value="Assigned">Assigned (In Custody)</option>
                <option value="Maintenance">Maintenance (Under Repair)</option>
                <option value="Retired">Retired (Decommissioned)</option>
              </select>
            </div>
          </div>

          {/* Assigned Employee */}
          <div className="form-group">
            <label htmlFor="asset-employee">
              Assigned Employee (Choosing an employee auto-sets status to Assigned)
            </label>
            <select
              id="asset-employee"
              value={employeeId}
              disabled={status === 'Maintenance' || status === 'Retired'}
              onChange={(e) => handleEmployeeChange(e.target.value)}
            >
              <option value="">-- No Employee Assigned (Available) --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.id} - {emp.department})
                </option>
              ))}
            </select>
            {(status === 'Maintenance' || status === 'Retired') && (
              <div style={{ fontSize: '11px', color: '#900', marginTop: '2px' }}>
                Note: Assets marked {status} cannot be assigned to an employee.
              </div>
            )}
          </div>

          {/* Google Drive Link & Live Preview Box */}
          <div className="form-group">
            <label htmlFor="asset-image">Google Drive Photo Link / Image URL</label>
            <input
              id="asset-image"
              type="text"
              placeholder="e.g. https://drive.google.com/file/d/... or https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              Paste Google Drive share links; they are automatically converted to direct preview images.
            </div>

            {/* Live Preview Box */}
            <div style={{ marginTop: '8px', border: '1px solid #ccc', padding: '8px', backgroundColor: '#fafafa', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '60px', border: '1px solid #999', backgroundColor: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={previewSrc}
                  alt="Preview"
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getCategoryPlaceholder(category);
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>
                <strong>Preview Asset Image:</strong> {imageUrl ? 'Using custom image/Drive URL' : `Falling back to default ${category} placeholder.`}
              </div>
            </div>
          </div>

          {/* Notes / Specs */}
          <div className="form-group">
            <label htmlFor="asset-notes">Common Notes / Specifications</label>
            <textarea
              id="asset-notes"
              rows={2}
              placeholder="e.g. Warranty details, dimensions, accessories included"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#444' }}>
              {isEditMode
                ? 'Saving changes to existing asset record'
                : tab === 'batch'
                ? `${quantity} FFE items will be recorded`
                : '1 FFE item will be recorded'}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} style={{ fontWeight: 'bold' }}>
                {isSubmitting
                  ? 'Saving...'
                  : isEditMode
                  ? 'Save Changes'
                  : tab === 'batch'
                  ? `Add Batch (${quantity})`
                  : 'Add Asset'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
