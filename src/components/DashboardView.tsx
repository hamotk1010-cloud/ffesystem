import React from 'react';
import { DashboardStats, Asset, Employee, ActiveTab } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatImageUrl, getCategoryPlaceholder, getInitials } from '../utils/image';

interface DashboardViewProps {
  stats: DashboardStats | null;
  isLoading: boolean;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectEmployee: (empId: string) => void;
  onSelectAsset: (asset: Asset) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  isLoading,
  onNavigateTab,
  onSelectEmployee,
  onSelectAsset,
}) => {
  if (isLoading || !stats) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  const {
    total_assets,
    total_value,
    assigned_count,
    assigned_percent,
    available_count,
    maintenance_count,
    total_employees,
    categories,
    recent_assets,
    staff_summary,
  } = stats;

  return (
    <div className="dashboard-container">
      {/* 4 Stat Blocks */}
      <div className="grid-stats">
        {/* TOTAL FFE */}
        <div className="ffe-card">
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
            TOTAL FFE
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '4px 0' }}>
            {total_assets}
          </div>
          <div style={{ fontSize: '12px', color: '#333' }}>
            Valued at {formatCurrency(total_value)}
          </div>
        </div>

        {/* ASSIGNED */}
        <div className="ffe-card">
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
            ASSIGNED
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '4px 0' }}>
            {assigned_count}
          </div>
          <div style={{ fontSize: '12px', color: '#333' }}>
            {assigned_percent}% of total inventory
          </div>
          <div className="progress-bar-container" title={`${assigned_percent}% assigned`}>
            <div className="progress-bar-fill" style={{ width: `${assigned_percent}%` }} />
          </div>
        </div>

        {/* AVAILABLE */}
        <div className="ffe-card">
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
            AVAILABLE
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '4px 0' }}>
            {available_count}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            In storage or unassigned status
          </div>
        </div>

        {/* EMPLOYEES */}
        <div className="ffe-card">
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
            EMPLOYEES
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '4px 0' }}>
            {total_employees}
          </div>
          <div style={{ fontSize: '12px', color: maintenance_count > 0 ? '#b34700' : '#666' }}>
            {maintenance_count} item(s) in repair
          </div>
        </div>
      </div>

      {/* 3 Category Blocks */}
      <div className="grid-categories">
        {/* Furniture */}
        <div className="ffe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>Furniture</h3>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{categories.furniture}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Chairs, Desks, Tables
          </div>
        </div>

        {/* Fixtures */}
        <div className="ffe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>Fixtures</h3>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{categories.fixture}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Mounts, Purifiers, Lamps
          </div>
        </div>

        {/* Equipment */}
        <div className="ffe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>Equipment</h3>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{categories.equipment}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Monitors, Boards, Tech
          </div>
        </div>
      </div>

      {/* Main Content: Split Master Inventory Quick View & Staff Directory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Master Inventory Quick View */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px' }}>Master Inventory Quick View</h3>
              <div style={{ fontSize: '11px', color: '#666' }}>
                Recently updated assets &amp; active custodians
              </div>
            </div>
            <a onClick={() => onNavigateTab('inventory')} style={{ fontSize: '12px', fontWeight: 'bold' }}>
              View All ({total_assets}) →
            </a>
          </div>

          <table className="ffe-table" aria-label="Recent Assets">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Location</th>
                <th>Assigned To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent_assets.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>
                    No recent assets found.
                  </td>
                </tr>
              ) : (
                recent_assets.map((asset) => {
                  const img = formatImageUrl(asset.image_url) || getCategoryPlaceholder(asset.category);
                  const isTruncatedLocation = asset.location.length > 25;
                  const displayLocation = isTruncatedLocation ? asset.location.slice(0, 25) + '...' : asset.location;

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
                            <div
                              onClick={() => onSelectAsset(asset)}
                              style={{ fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              {asset.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              <span>{asset.id}</span> | <span>Tag: {asset.tag_number}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{asset.category}</td>
                      <td title={asset.location}>{displayLocation}</td>
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
                            <a
                              onClick={() => onSelectEmployee(asset.employee_id!)}
                              style={{ fontSize: '12px', fontWeight: 'bold' }}
                            >
                              {asset.employee_name}
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: '#888', fontStyle: 'italic', fontSize: '12px' }}>
                            -- Unassigned --
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-tag status-${asset.status}`}>{asset.status}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Staff Directory Panel */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px' }}>Staff Directory</h3>
              <div style={{ fontSize: '11px', color: '#666' }}>
                QR badges &amp; assigned assets
              </div>
            </div>
            <a onClick={() => onNavigateTab('employees')} style={{ fontSize: '12px', fontWeight: 'bold' }}>
              All ({total_employees}) →
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {staff_summary.map((emp) => (
              <div
                key={emp.id}
                className="ffe-card"
                style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="avatar-box">
                    {emp.photo_url ? (
                      <img
                        src={formatImageUrl(emp.photo_url)}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      getInitials(emp.full_name)
                    )}
                  </div>
                  <div>
                    <a
                      onClick={() => onSelectEmployee(emp.id)}
                      style={{ fontWeight: '600', fontSize: '13px' }}
                    >
                      {emp.full_name}
                    </a>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {emp.department}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      border: '1px solid #ccc',
                      padding: '2px 6px',
                      backgroundColor: '#f7f7f7',
                    }}
                  >
                    {emp.assigned_count ?? 0} FFE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
