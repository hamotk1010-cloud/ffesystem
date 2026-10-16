import React, { useState } from 'react';
import { Asset, Employee } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatImageUrl, getCategoryPlaceholder, getInitials } from '../utils/image';
import { exportFfeInventoryPdf } from '../utils/pdf';

interface InventoryViewProps {
  assets: Asset[];
  employees: Employee[];
  isLoading: boolean;
  onAddNewAsset: () => void;
  onEditAsset: (asset: Asset) => void;
  onUnassignAsset: (asset: Asset) => void;
  onDeleteAsset: (asset: Asset) => void;
  onSelectEmployee: (empId: string) => void;
  onSelectAssetDetails: (asset: Asset) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  assets,
  isLoading,
  onAddNewAsset,
  onEditAsset,
  onUnassignAsset,
  onDeleteAsset,
  onSelectEmployee,
  onSelectAssetDetails,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter logic
  const filteredAssets = assets.filter((asset) => {
    // Category match
    if (categoryFilter !== 'ALL' && asset.category !== categoryFilter) {
      return false;
    }
    // Status match
    if (statusFilter !== 'ALL' && asset.status !== statusFilter) {
      return false;
    }
    // Search match across ID, Tag, Name, S/N, Location, or Employee
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const matchId = asset.id.toLowerCase().includes(term);
      const matchTag = (asset.tag_number || '').toLowerCase().includes(term);
      const matchName = asset.name.toLowerCase().includes(term);
      const matchSn = (asset.serial_number || '').toLowerCase().includes(term);
      const matchLoc = asset.location.toLowerCase().includes(term);
      const matchEmp = (asset.employee_name || '').toLowerCase().includes(term);

      if (!matchId && !matchTag && !matchName && !matchSn && !matchLoc && !matchEmp) {
        return false;
      }
    }
    return true;
  });

  const handleExportPdf = () => {
    let summary = `Category: ${categoryFilter}, Status: ${statusFilter}`;
    if (search.trim()) {
      summary += `, Search: "${search.trim()}"`;
    }
    exportFfeInventoryPdf(filteredAssets, summary);
  };

  return (
    <div className="inventory-view-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
            Master FFE Inventory ({filteredAssets.length} of {assets.length})
          </h2>
          <div style={{ color: '#666', fontSize: '13px' }}>
            Furniture, Fixtures, and Technical Equipment workplace directory
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleExportPdf}>
            [Export FFE Report (PDF)]
          </button>
          <button
            type="button"
            onClick={onAddNewAsset}
            style={{ fontWeight: 'bold' }}
          >
            [+ Add New FFE Item]
          </button>
        </div>
      </div>

      {/* Toolbar & Filter Controls */}
      <div className="ffe-toolbar">
        <div className="ffe-toolbar-filters">
          <input
            type="text"
            placeholder="Search ID, Tag, Name, S/N, Location, or Employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '320px', maxWidth: '100%' }}
          />

          <label htmlFor="inv-cat-filter" style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>
            Category:
          </label>
          <select
            id="inv-cat-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">ALL Categories</option>
            <option value="Furniture">Furniture</option>
            <option value="Fixture">Fixture</option>
            <option value="Equipment">Equipment</option>
          </select>

          <label htmlFor="inv-status-filter" style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>
            Status:
          </label>
          <select
            id="inv-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">ALL Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>

          {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
              }}
              style={{ fontSize: '12px' }}
            >
              [Reset Filters]
            </button>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{ fontWeight: viewMode === 'list' ? 'bold' : 'normal' }}
          >
            [List View]
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{ fontWeight: viewMode === 'grid' ? 'bold' : 'normal', marginLeft: '4px' }}
          >
            [Grid View]
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
          Loading inventory records...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAssets.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #ccc', marginTop: '16px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>No FFE assets match your filter criteria.</p>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            Try adjusting your search terms or status filters.
          </p>
          <button type="button" onClick={onAddNewAsset}>
            [+ Add New FFE Item]
          </button>
        </div>
      )}

      {/* List View Table */}
      {!isLoading && filteredAssets.length > 0 && viewMode === 'list' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="ffe-table" aria-label="FFE Master Inventory">
            <thead>
              <tr>
                <th>Asset Details</th>
                <th>Category</th>
                <th>Workplace Location</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Assigned Custodian</th>
                <th style={{ width: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const img = formatImageUrl(asset.image_url) || getCategoryPlaceholder(asset.category);

                return (
                  <tr key={asset.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={img}
                          alt=""
                          className="asset-thumbnail"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getCategoryPlaceholder(asset.category);
                          }}
                        />
                        <div>
                          <div
                            onClick={() => onSelectAssetDetails(asset)}
                            style={{ fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {asset.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                            <strong>{asset.id}</strong> | Tag: <code>{asset.tag_number}</code>
                            {asset.serial_number && <span> | S/N: <code>{asset.serial_number}</code></span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{asset.category}</td>
                    <td>{asset.location}</td>
                    <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {formatCurrency(asset.purchase_cost)}
                    </td>
                    <td>
                      <span className={`status-tag status-${asset.status}`}>{asset.status}</span>
                    </td>
                    <td>
                      {asset.employee_id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className="avatar-box">
                            {asset.employee_photo_url ? (
                              <img
                                src={formatImageUrl(asset.employee_photo_url)}
                                alt=""
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              getInitials(asset.employee_name)
                            )}
                          </div>
                          <div>
                            <a
                              onClick={() => onSelectEmployee(asset.employee_id!)}
                              style={{ fontWeight: 'bold', fontSize: '12px' }}
                            >
                              {asset.employee_name}
                            </a>
                            <div style={{ fontSize: '11px', color: '#666' }}>{asset.employee_id}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#888', fontStyle: 'italic', fontSize: '12px' }}>
                          -- Available (Unassigned) --
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {asset.employee_id && (
                          <button
                            type="button"
                            onClick={() => onUnassignAsset(asset)}
                            title="Remove custodian and mark Available"
                            style={{ fontSize: '12px', padding: '3px 6px' }}
                          >
                            [Unassign]
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditAsset(asset)}
                          style={{ fontSize: '12px', padding: '3px 6px' }}
                        >
                          [Edit]
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAsset(asset)}
                          style={{ fontSize: '12px', padding: '3px 6px', color: '#900', borderColor: '#c00' }}
                        >
                          [Delete]
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View Cards */}
      {!isLoading && filteredAssets.length > 0 && viewMode === 'grid' && (
        <div className="grid-cards">
          {filteredAssets.map((asset) => {
            const img = formatImageUrl(asset.image_url) || getCategoryPlaceholder(asset.category);

            return (
              <div key={asset.id} className="ffe-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '140px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', marginBottom: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={img}
                    alt={asset.name}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getCategoryPlaceholder(asset.category);
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{asset.id}</span>
                  <span className={`status-tag status-${asset.status}`}>{asset.status}</span>
                </div>

                <div
                  onClick={() => onSelectAssetDetails(asset)}
                  style={{ fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginBottom: '4px', textDecoration: 'underline' }}
                >
                  {asset.name}
                </div>

                <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>
                  <div><strong>Category:</strong> {asset.category}</div>
                  <div><strong>Tag:</strong> <code>{asset.tag_number}</code></div>
                  {asset.serial_number && <div><strong>S/N:</strong> <code>{asset.serial_number}</code></div>}
                  <div><strong>Location:</strong> {asset.location}</div>
                  <div><strong>Cost:</strong> {formatCurrency(asset.purchase_cost)}</div>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '8px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Assigned Custodian:</div>
                  {asset.employee_id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="avatar-box">
                        {asset.employee_photo_url ? (
                          <img
                            src={formatImageUrl(asset.employee_photo_url)}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          getInitials(asset.employee_name)
                        )}
                      </div>
                      <div>
                        <a onClick={() => onSelectEmployee(asset.employee_id!)} style={{ fontWeight: 'bold', fontSize: '12px' }}>
                          {asset.employee_name}
                        </a>
                        <div style={{ fontSize: '10px', color: '#666' }}>{asset.employee_id}</div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                      -- Available --
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                  {asset.employee_id && (
                    <button
                      type="button"
                      onClick={() => onUnassignAsset(asset)}
                      style={{ fontSize: '11px', flex: 1 }}
                    >
                      [Unassign]
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEditAsset(asset)}
                    style={{ fontSize: '11px', flex: 1 }}
                  >
                    [Edit]
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAsset(asset)}
                    style={{ fontSize: '11px', flex: 1, color: '#900', borderColor: '#c00' }}
                  >
                    [Delete]
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
