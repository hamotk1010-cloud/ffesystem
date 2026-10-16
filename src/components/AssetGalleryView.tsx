import React, { useState } from 'react';
import { Asset } from '../types';
import { formatImageUrl, getCategoryPlaceholder, getInitials } from '../utils/image';

interface AssetGalleryViewProps {
  assets: Asset[];
  isLoading: boolean;
  onEditAsset: (asset: Asset) => void;
  onSelectEmployee: (empId: string) => void;
}

export const AssetGalleryView: React.FC<AssetGalleryViewProps> = ({
  assets,
  isLoading,
  onEditAsset,
  onSelectEmployee,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lightboxAsset, setLightboxAsset] = useState<Asset | null>(null);

  const filteredAssets = assets.filter((asset) => {
    if (categoryFilter !== 'ALL' && asset.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && asset.status !== statusFilter) return false;

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const matchName = asset.name.toLowerCase().includes(term);
      const matchId = asset.id.toLowerCase().includes(term);
      const matchLoc = asset.location.toLowerCase().includes(term);
      const matchStaff = (asset.employee_name || '').toLowerCase().includes(term);

      if (!matchName && !matchId && !matchLoc && !matchStaff) return false;
    }
    return true;
  });

  return (
    <div className="asset-gallery-container">
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
          Asset Visual Gallery ({filteredAssets.length} of {assets.length})
        </h2>
        <div style={{ color: '#666', fontSize: '13px' }}>
          Visual photographic directory of workplace furniture, fixtures, and technical hardware
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="ffe-toolbar">
        <div className="ffe-toolbar-filters">
          <input
            type="text"
            placeholder="Search asset name, ID, location, assigned staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '320px', maxWidth: '100%' }}
          />

          <label htmlFor="gal-cat-filter" style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>
            Category:
          </label>
          <select
            id="gal-cat-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Furniture">Furniture</option>
            <option value="Fixture">Fixture</option>
            <option value="Equipment">Equipment</option>
          </select>

          <label htmlFor="gal-status-filter" style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>
            Status:
          </label>
          <select
            id="gal-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
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
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
          Loading visual gallery...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredAssets.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #ccc', marginTop: '16px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>No asset photos match the criteria.</p>
          <p style={{ fontSize: '12px', color: '#666' }}>Try adjusting your search terms or filters.</p>
        </div>
      )}

      {/* Photo Cards Grid */}
      {!isLoading && filteredAssets.length > 0 && (
        <div className="grid-cards">
          {filteredAssets.map((asset) => {
            const hasCustomImage = Boolean(asset.image_url && asset.image_url.trim());
            const displayImage = formatImageUrl(asset.image_url) || getCategoryPlaceholder(asset.category);

            // Truncated asset name if longer than 36 chars
            const isTruncated = asset.name.length > 36;
            const displayName = isTruncated ? asset.name.slice(0, 36) + '...' : asset.name;

            return (
              <div
                key={asset.id}
                className="ffe-card"
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                {/* Image Container */}
                <div
                  style={{
                    height: '180px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={displayImage}
                    alt={asset.name}
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getCategoryPlaceholder(asset.category);
                    }}
                  />

                  {/* Quick View Button */}
                  <button
                    type="button"
                    onClick={() => setLightboxAsset(asset)}
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      fontSize: '11px',
                      padding: '2px 6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #333',
                    }}
                  >
                    [Quick View Photo]
                  </button>
                </div>

                {/* Metadata Labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{asset.id}</span>
                  <div>
                    <span style={{ fontSize: '11px', marginRight: '4px', border: '1px solid #ccc', padding: '1px 4px' }}>
                      {asset.category}
                    </span>
                    <span className={`status-tag status-${asset.status}`}>{asset.status}</span>
                  </div>
                </div>

                {/* Asset Name */}
                <div
                  title={asset.name}
                  style={{ fontWeight: 'bold', fontSize: '14px', margin: '6px 0 2px 0' }}
                >
                  {displayName}
                </div>

                {/* Tag & Location */}
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>
                  <div>Tag: <code>{asset.tag_number}</code></div>
                  <div>Loc: {asset.location}</div>
                  {!hasCustomImage && (
                    <div style={{ color: '#888', fontStyle: 'italic', marginTop: '2px' }}>
                      (Default {asset.category} placeholder)
                    </div>
                  )}
                </div>

                {/* Footer Custodian + Edit Link */}
                <div
                  style={{
                    marginTop: 'auto',
                    borderTop: '1px solid #eee',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
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
                      <a
                        onClick={() => onSelectEmployee(asset.employee_id!)}
                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                      >
                        {asset.employee_name}
                      </a>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                      Unassigned Asset
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onEditAsset(asset)}
                    style={{ fontSize: '11px', padding: '2px 6px' }}
                  >
                    [Edit]
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxAsset && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxAsset(null)}
        >
          <div
            className="modal-dialog large"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: 'center' }}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{lightboxAsset.name}</h3>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {lightboxAsset.id} | Tag: {lightboxAsset.tag_number} | {lightboxAsset.category}
                </div>
              </div>
              <button type="button" onClick={() => setLightboxAsset(null)}>
                [Close]
              </button>
            </div>

            <div style={{ padding: '10px 0', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={formatImageUrl(lightboxAsset.image_url) || getCategoryPlaceholder(lightboxAsset.category)}
                alt={lightboxAsset.name}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', border: '1px solid #ccc' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getCategoryPlaceholder(lightboxAsset.category);
                }}
              />
            </div>

            <div style={{ fontSize: '12px', textAlign: 'left', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <div><strong>Workplace Location:</strong> {lightboxAsset.location}</div>
              <div><strong>Status:</strong> {lightboxAsset.status}</div>
              {lightboxAsset.serial_number && <div><strong>Serial Number:</strong> {lightboxAsset.serial_number}</div>}
              {lightboxAsset.employee_name && <div><strong>Custodian:</strong> {lightboxAsset.employee_name} ({lightboxAsset.employee_id})</div>}
              {lightboxAsset.notes && <div><strong>Notes:</strong> {lightboxAsset.notes}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setLightboxAsset(null)}>
                [Close Lightbox]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
