import React, { useState } from 'react';
import { Employee, Asset } from '../types';
import { formatImageUrl, getInitials } from '../utils/image';
import { exportStaffDirectoryPdf, exportEmployeeAccountabilityPdf } from '../utils/pdf';

interface EmployeeDirectoryViewProps {
  employees: Employee[];
  assets: Asset[];
  departments: { department: string; count: number }[];
  isLoading: boolean;
  onRegisterEmployee: () => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (emp: Employee) => void;
  onOpenProfile: (emp: Employee) => void;
  onOpenQrBadge: (emp: Employee) => void;
}

export const EmployeeDirectoryView: React.FC<EmployeeDirectoryViewProps> = ({
  employees,
  assets,
  departments,
  isLoading,
  onRegisterEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onOpenProfile,
  onOpenQrBadge,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredEmployees = employees.filter((emp) => {
    if (selectedDept !== 'ALL' && emp.department !== selectedDept) {
      return false;
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const matchName = emp.full_name.toLowerCase().includes(term);
      const matchId = emp.id.toLowerCase().includes(term);
      const matchDept = emp.department.toLowerCase().includes(term);
      const matchTitle = (emp.job_title || '').toLowerCase().includes(term);
      const matchEmail = (emp.email || '').toLowerCase().includes(term);

      if (!matchName && !matchId && !matchDept && !matchTitle && !matchEmail) {
        return false;
      }
    }
    return true;
  });

  const handleExportStaffPdf = () => {
    exportStaffDirectoryPdf(filteredEmployees);
  };

  const handleDownloadAccountability = (emp: Employee) => {
    const employeeAssets = assets.filter((a) => a.employee_id === emp.id);
    exportEmployeeAccountabilityPdf(emp, employeeAssets);
  };

  return (
    <div className="employee-directory-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
            Staff &amp; Employee Directory ({filteredEmployees.length} of {employees.length})
          </h2>
          <div style={{ color: '#666', fontSize: '13px' }}>
            Registered personnel with assigned FFE tracking badges and scannable QR codes
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleExportStaffPdf}>
            [Export Staff PDF]
          </button>
          <button
            type="button"
            onClick={onRegisterEmployee}
            style={{ fontWeight: 'bold' }}
          >
            [+ Register Employee]
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="ffe-toolbar">
        <div className="ffe-toolbar-filters">
          <input
            type="text"
            placeholder="Search name, ID, department, job title, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '320px', maxWidth: '100%' }}
          />

          <label htmlFor="emp-dept-filter" style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>
            Department:
          </label>
          <select
            id="emp-dept-filter"
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

        <div>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{ fontWeight: viewMode === 'grid' ? 'bold' : 'normal' }}
          >
            [Grid View]
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{ fontWeight: viewMode === 'list' ? 'bold' : 'normal', marginLeft: '4px' }}
          >
            [List View]
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
          Loading staff directory...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredEmployees.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #ccc', marginTop: '16px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>No staff members match the filters.</p>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            Clear your search term or register a new personnel record.
          </p>
          <button type="button" onClick={onRegisterEmployee}>
            [+ Register Employee]
          </button>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && filteredEmployees.length > 0 && viewMode === 'grid' && (
        <div className="grid-cards">
          {filteredEmployees.map((emp) => {
            const hasAssignedAssets = (emp.assigned_count ?? 0) > 0;

            return (
              <div key={emp.id} className="ffe-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                  <div className="avatar-box large">
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
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#444' }}>{emp.id}</span>
                    <h3 style={{ margin: '2px 0', fontSize: '15px' }}>{emp.full_name}</h3>
                    <div style={{ fontSize: '12px', color: '#555' }}>{emp.job_title || 'Staff Member'}</div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px' }}>
                  <div><strong>Department:</strong> {emp.department}</div>
                  <div><strong>Email:</strong> {emp.email || 'N/A'}</div>
                  <div style={{ marginTop: '4px', fontWeight: 'bold', color: '#222' }}>
                    Assigned Assets: {emp.assigned_count ?? 0} Items
                  </div>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => onOpenProfile(emp)}
                    style={{ fontSize: '11px', flex: 1 }}
                    title="View employee profile & assigned assets"
                  >
                    [Profile]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadAccountability(emp)}
                    style={{ fontSize: '11px', flex: 1 }}
                    title="Download asset accountability PDF"
                  >
                    [Download]
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenQrBadge(emp)}
                    style={{ fontSize: '11px', flex: 1 }}
                    title="View and print QR badge"
                  >
                    [QR]
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditEmployee(emp)}
                    style={{ fontSize: '11px', flex: 1 }}
                  >
                    [Edit]
                  </button>
                  <button
                    type="button"
                    disabled={hasAssignedAssets}
                    onClick={() => onDeleteEmployee(emp)}
                    title={
                      hasAssignedAssets
                        ? 'Delete is disabled because employee still has assigned assets. Unassign assets first.'
                        : 'Delete employee record'
                    }
                    style={{
                      fontSize: '11px',
                      flex: 1,
                      color: hasAssignedAssets ? '#888' : '#900',
                      borderColor: hasAssignedAssets ? '#ccc' : '#c00',
                    }}
                  >
                    [Delete]
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!isLoading && filteredEmployees.length > 0 && viewMode === 'list' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="ffe-table" aria-label="Staff Table">
            <thead>
              <tr>
                <th>Personnel</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Work Email</th>
                <th>Assigned Assets</th>
                <th style={{ width: '250px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const hasAssignedAssets = (emp.assigned_count ?? 0) > 0;

                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        <span style={{ fontWeight: 'bold' }}>{emp.full_name}</span>
                      </div>
                    </td>
                    <td><code>{emp.id}</code></td>
                    <td>{emp.department}</td>
                    <td>{emp.job_title || 'N/A'}</td>
                    <td>{emp.email || 'N/A'}</td>
                    <td style={{ fontWeight: 'bold' }}>{emp.assigned_count ?? 0} Items</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => onOpenProfile(emp)}
                          style={{ fontSize: '11px', padding: '2px 5px' }}
                        >
                          [Profile]
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadAccountability(emp)}
                          style={{ fontSize: '11px', padding: '2px 5px' }}
                        >
                          [Download]
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenQrBadge(emp)}
                          style={{ fontSize: '11px', padding: '2px 5px' }}
                        >
                          [QR]
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditEmployee(emp)}
                          style={{ fontSize: '11px', padding: '2px 5px' }}
                        >
                          [Edit]
                        </button>
                        <button
                          type="button"
                          disabled={hasAssignedAssets}
                          onClick={() => onDeleteEmployee(emp)}
                          title={
                            hasAssignedAssets
                              ? 'Disabled: Personnel has assigned assets. Unassign assets first.'
                              : 'Delete employee'
                          }
                          style={{
                            fontSize: '11px',
                            padding: '2px 5px',
                            color: hasAssignedAssets ? '#888' : '#900',
                            borderColor: hasAssignedAssets ? '#ccc' : '#c00',
                          }}
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
    </div>
  );
};
