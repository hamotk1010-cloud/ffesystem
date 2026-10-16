import React from 'react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenScanModal: () => void;
  onOpenSecurityModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenScanModal,
  onOpenSecurityModal,
  onLogout,
}) => {
  return (
    <header className="ffe-header">
      <div className="ffe-header-top">
        <div>
          <div className="ffe-brand">
            <h1>WorkSpace FFE</h1>
            <span className="ffe-brand-tag">[ADMIN]</span>
          </div>
          <div className="ffe-brand-subtitle">
            Asset &amp; Employee Tracking — Furniture, Fixtures &amp; Equipment Monitoring System
          </div>
        </div>

        <div className="ffe-header-actions">
          <button type="button" onClick={onOpenScanModal} title="Scan Employee QR Badge via camera or ID">
            [Scan QR Badge]
          </button>
          <button type="button" onClick={onOpenSecurityModal} title="Change admin password">
            [Security Settings]
          </button>
          <button type="button" onClick={onLogout} title="Sign out of admin session">
            [Logout]
          </button>
        </div>
      </div>

      <nav className="ffe-nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`ffe-nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          Dashboard Overview
        </button>
        <button
          type="button"
          className={`ffe-nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => onTabChange('inventory')}
        >
          FFE Inventory
        </button>
        <button
          type="button"
          className={`ffe-nav-tab ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => onTabChange('employees')}
        >
          Employee Directory
        </button>
        <button
          type="button"
          className={`ffe-nav-tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => onTabChange('gallery')}
        >
          Asset Gallery
        </button>
        <button
          type="button"
          className={`ffe-nav-tab ${activeTab === 'qr-manager' ? 'active' : ''}`}
          onClick={() => onTabChange('qr-manager')}
        >
          QR Code Manager
        </button>
      </nav>
    </header>
  );
};
