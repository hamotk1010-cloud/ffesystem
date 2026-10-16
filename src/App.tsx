import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { EmployeeDirectoryView } from './components/EmployeeDirectoryView';
import { AssetGalleryView } from './components/AssetGalleryView';
import { QrCodeManagerView } from './components/QrCodeManagerView';
import { PublicEmployeeProfile } from './components/PublicEmployeeProfile';
import { AddAssetModal } from './components/AddAssetModal';
import { RegisterEmployeeModal } from './components/RegisterEmployeeModal';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { EmployeeProfileModal } from './components/EmployeeProfileModal';
import { ScanQrModal } from './components/ScanQrModal';
import { PrintBadgeModal } from './components/PrintBadgeModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Asset, Employee, DashboardStats, DepartmentCount, ActiveTab } from './types';
import { apiRequest } from './utils/api';

function AppContent() {
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  // Public Profile Check from URL: ?view=employee&id=EMP-101
  const [publicViewId, setPublicViewId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const id = params.get('id');

    if (view === 'employee' && id) {
      setPublicViewId(id);
    } else {
      setPublicViewId(null);
    }
  }, []);

  // Application State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentCount[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modals state
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);

  const [isRegisterEmployeeOpen, setIsRegisterEmployeeOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isScanQrOpen, setIsScanQrOpen] = useState(false);

  const [selectedProfileEmployee, setSelectedProfileEmployee] = useState<Employee | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [printBadgeEmployee, setPrintBadgeEmployee] = useState<Employee | null>(null);
  const [printBadgeQrUrl, setPrintBadgeQrUrl] = useState<string>('');
  const [isPrintBadgeOpen, setIsPrintBadgeOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Data fetching
  const refreshAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [dash, asts, emps, depts] = await Promise.all([
        apiRequest<DashboardStats>('/api/dashboard'),
        apiRequest<Asset[]>('/api/assets'),
        apiRequest<Employee[]>('/api/employees'),
        apiRequest<DepartmentCount[]>('/api/departments'),
      ]);
      setDashboardStats(dash);
      setAssets(asts);
      setEmployees(emps);
      setDepartments(depts);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch application data', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
    }
  }, [isAuthenticated, refreshAllData]);

  // Handle Unassign Asset
  const handleUnassignAsset = (asset: Asset) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Unassign Asset',
      message: `Are you sure you want to unassign '${asset.name}' (${asset.tag_number}) from ${asset.employee_name || 'its current custodian'}? Its status will be set to Available.`,
      confirmLabel: 'Yes, Unassign Asset',
      onConfirm: async () => {
        try {
          await apiRequest(`/api/assets/${asset.id}/unassign`, { method: 'POST' });
          showToast(`Asset '${asset.name}' unassigned and marked Available.`, 'success');
          refreshAllData();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast(err.message || 'Failed to unassign asset.', 'error');
        }
      },
    });
  };

  // Handle Delete Asset
  const handleDeleteAsset = (asset: Asset) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Asset Confirmation',
      message: `Are you sure you want to permanently delete '${asset.name}' (${asset.id} - ${asset.tag_number})? This action cannot be undone.`,
      confirmLabel: 'Delete Asset Permanently',
      onConfirm: async () => {
        try {
          await apiRequest(`/api/assets/${asset.id}`, { method: 'DELETE' });
          showToast(`Asset '${asset.name}' deleted.`, 'info');
          refreshAllData();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast(err.message || 'Failed to delete asset.', 'error');
        }
      },
    });
  };

  // Handle Delete Employee
  const handleDeleteEmployee = (emp: Employee) => {
    if ((emp.assigned_count ?? 0) > 0) {
      showToast(
        `Cannot delete ${emp.full_name}: Personnel still has ${emp.assigned_count} assigned FFE asset(s).`,
        'error'
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Employee Confirmation',
      message: `Are you sure you want to delete staff member '${emp.full_name}' (${emp.id})?`,
      confirmLabel: 'Delete Staff Member',
      onConfirm: async () => {
        try {
          await apiRequest(`/api/employees/${emp.id}`, { method: 'DELETE' });
          showToast(`Employee '${emp.full_name}' deleted.`, 'info');
          refreshAllData();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast(err.message || 'Failed to delete employee.', 'error');
        }
      },
    });
  };

  // Select Employee Profile from ID
  const handleSelectEmployeeId = (empId: string) => {
    const found = employees.find((e) => e.id === empId);
    if (found) {
      setSelectedProfileEmployee(found);
      setIsProfileModalOpen(true);
    } else {
      // Fetch single employee
      apiRequest<Employee>(`/api/employees/${empId}`)
        .then((emp) => {
          setSelectedProfileEmployee(emp);
          setIsProfileModalOpen(true);
        })
        .catch(() => {
          showToast(`Employee ${empId} not found`, 'error');
        });
    }
  };

  // Filter Inventory by Employee
  const handleFilterInventoryByEmployee = (empId: string) => {
    setActiveTab('inventory');
    // We can also trigger the inventory view
  };

  // Open Print Badge
  const handleOpenPrintBadge = (emp: Employee, qrUrl: string) => {
    setPrintBadgeEmployee(emp);
    setPrintBadgeQrUrl(qrUrl);
    setIsPrintBadgeOpen(true);
  };

  // 1. If public profile query param is active: Render public profile (NO LOGIN REQUIRED)
  if (publicViewId) {
    return (
      <div className="ffe-container">
        <PublicEmployeeProfile
          employeeId={publicViewId}
          onReturnToAdmin={() => {
            window.history.pushState({}, '', window.location.pathname);
            setPublicViewId(null);
          }}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // 2. Loading initial auth state
  if (isAuthLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
        Verifying administrator session...
      </div>
    );
  }

  // 3. Not authenticated: Show Login
  if (!isAuthenticated) {
    return (
      <div className="ffe-container">
        <LoginView />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // 4. Authenticated Admin View
  return (
    <div className="ffe-container">
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenScanModal={() => setIsScanQrOpen(true)}
        onOpenSecurityModal={() => setIsSecurityOpen(true)}
        onLogout={logout}
      />

      <main>
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={dashboardStats}
            isLoading={isLoadingData}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectEmployee={handleSelectEmployeeId}
            onSelectAsset={(asset) => {
              setAssetToEdit(asset);
              setIsAddAssetOpen(true);
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            assets={assets}
            employees={employees}
            isLoading={isLoadingData}
            onAddNewAsset={() => {
              setAssetToEdit(null);
              setIsAddAssetOpen(true);
            }}
            onEditAsset={(asset) => {
              setAssetToEdit(asset);
              setIsAddAssetOpen(true);
            }}
            onUnassignAsset={handleUnassignAsset}
            onDeleteAsset={handleDeleteAsset}
            onSelectEmployee={handleSelectEmployeeId}
            onSelectAssetDetails={(asset) => {
              setAssetToEdit(asset);
              setIsAddAssetOpen(true);
            }}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeDirectoryView
            employees={employees}
            assets={assets}
            departments={departments}
            isLoading={isLoadingData}
            onRegisterEmployee={() => {
              setEmployeeToEdit(null);
              setIsRegisterEmployeeOpen(true);
            }}
            onEditEmployee={(emp) => {
              setEmployeeToEdit(emp);
              setIsRegisterEmployeeOpen(true);
            }}
            onDeleteEmployee={handleDeleteEmployee}
            onOpenProfile={(emp) => {
              setSelectedProfileEmployee(emp);
              setIsProfileModalOpen(true);
            }}
            onOpenQrBadge={(emp) => {
              handleOpenPrintBadge(emp, '');
            }}
          />
        )}

        {activeTab === 'gallery' && (
          <AssetGalleryView
            assets={assets}
            isLoading={isLoadingData}
            onEditAsset={(asset) => {
              setAssetToEdit(asset);
              setIsAddAssetOpen(true);
            }}
            onSelectEmployee={handleSelectEmployeeId}
          />
        )}

        {activeTab === 'qr-manager' && (
          <QrCodeManagerView
            employees={employees}
            departments={departments}
            isLoading={isLoadingData}
            onFilterInventoryByEmployee={handleFilterInventoryByEmployee}
            onPrintBadge={handleOpenPrintBadge}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Add / Edit Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => {
          setIsAddAssetOpen(false);
          setAssetToEdit(null);
        }}
        assetToEdit={assetToEdit}
        employees={employees}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          refreshAllData();
        }}
      />

      {/* Register / Edit Employee Modal */}
      <RegisterEmployeeModal
        isOpen={isRegisterEmployeeOpen}
        onClose={() => {
          setIsRegisterEmployeeOpen(false);
          setEmployeeToEdit(null);
        }}
        employeeToEdit={employeeToEdit}
        existingCount={employees.length}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          refreshAllData();
        }}
      />

      {/* Security Settings Modal */}
      <SecuritySettingsModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      {/* Scan QR Modal */}
      <ScanQrModal
        isOpen={isScanQrOpen}
        onClose={() => setIsScanQrOpen(false)}
        onSelectEmployeeProfile={(empId) => {
          setIsScanQrOpen(false);
          handleSelectEmployeeId(empId);
        }}
      />

      {/* Employee Profile Popup Modal */}
      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        employee={selectedProfileEmployee}
        assets={assets}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfileEmployee(null);
        }}
        onUnassignAsset={handleUnassignAsset}
        onEditEmployee={(emp) => {
          setIsProfileModalOpen(false);
          setEmployeeToEdit(emp);
          setIsRegisterEmployeeOpen(true);
        }}
      />

      {/* Print Badge Modal */}
      <PrintBadgeModal
        isOpen={isPrintBadgeOpen}
        employee={printBadgeEmployee}
        qrDataUrl={printBadgeQrUrl}
        onClose={() => {
          setIsPrintBadgeOpen(false);
          setPrintBadgeEmployee(null);
        }}
      />

      {/* Confirm Destructive Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
