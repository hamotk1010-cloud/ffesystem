export interface Asset {
  id: string;
  name: string;
  tag_number: string;
  serial_number: string;
  category: 'Furniture' | 'Fixture' | 'Equipment';
  location: string;
  purchase_cost: number;
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Retired';
  employee_id: string | null;
  image_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee_name?: string | null;
  employee_department?: string | null;
  employee_job_title?: string | null;
  employee_photo_url?: string | null;
}

export interface Employee {
  id: string;
  full_name: string;
  department: string;
  job_title: string;
  email: string;
  photo_url: string;
  created_at: string;
  assigned_count?: number;
  assigned_assets?: Asset[];
}

export interface DashboardStats {
  total_assets: number;
  total_value: number;
  assigned_count: number;
  assigned_percent: number;
  available_count: number;
  maintenance_count: number;
  retired_count: number;
  total_employees: number;
  categories: {
    furniture: number;
    fixture: number;
    equipment: number;
  };
  recent_assets: Asset[];
  staff_summary: Employee[];
}

export interface DepartmentCount {
  department: string;
  count: number;
}

export type ActiveTab =
  | 'dashboard'
  | 'inventory'
  | 'employees'
  | 'gallery'
  | 'qr-manager';
