import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, queryAll, queryOne, executeRun, logAudit } from './db.js';
import { requireAuth, generateToken, AuthenticatedRequest } from './auth.js';

export const apiRouter = Router();

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================

// Public QR profile endpoint: /api/public/employee/:id
apiRouter.get('/public/employee/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const employee = queryOne(
      db,
      'SELECT id, full_name, department, job_title, email, photo_url, created_at FROM employees WHERE id = ?',
      [id]
    );

    if (!employee) {
      res.status(404).json({ error: `Employee ${id} not found.` });
      return;
    }

    const assets = queryAll(
      db,
      `SELECT id, name, tag_number, serial_number, category, location, purchase_cost, status, image_url, notes, updated_at
       FROM assets
       WHERE employee_id = ?
       ORDER BY category ASC, name ASC`,
      [id]
    );

    res.json({ employee, assets });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Admin Login: POST /api/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const db = await getDb();
    const admin = queryOne(
      db,
      'SELECT id, username, password_hash FROM admin WHERE username = ?',
      [username.trim()]
    );

    if (!admin) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const isValid = bcrypt.compareSync(password, admin.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const token = generateToken({ id: admin.id, username: admin.username });
    logAudit(db, 'LOGIN', 'ADMIN', admin.username, 'Admin logged in successfully.');

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// ==========================================
// 2. AUTHENTICATED ADMIN ROUTES
// ==========================================

// Verify Session
apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ admin: req.admin });
});

// Change Password: PUT /api/auth/password
apiRouter.put('/auth/password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: 'All password fields are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New password and confirmation do not match.' });
      return;
    }

    const db = await getDb();
    const admin = queryOne(
      db,
      'SELECT id, username, password_hash FROM admin WHERE id = ?',
      [req.admin!.id]
    );

    if (!admin) {
      res.status(404).json({ error: 'Admin account not found.' });
      return;
    }

    const isMatch = bcrypt.compareSync(currentPassword, admin.password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    const now = new Date().toISOString();

    executeRun(
      db,
      'UPDATE admin SET password_hash = ?, updated_at = ? WHERE id = ?',
      [newHash, now, admin.id]
    );

    logAudit(db, 'UPDATE_PASSWORD', 'ADMIN', admin.username, 'Admin updated security password.');
    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Password update failed' });
  }
});

// Dashboard Overview: GET /api/dashboard
apiRouter.get('/dashboard', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();

    const counts = queryOne(
      db,
      `SELECT
        COUNT(*) AS total_assets,
        COALESCE(SUM(purchase_cost), 0) AS total_value,
        SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) AS assigned_count,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_count,
        SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_count,
        SUM(CASE WHEN status = 'Retired' THEN 1 ELSE 0 END) AS retired_count,
        SUM(CASE WHEN category = 'Furniture' THEN 1 ELSE 0 END) AS furniture_count,
        SUM(CASE WHEN category = 'Fixture' THEN 1 ELSE 0 END) AS fixture_count,
        SUM(CASE WHEN category = 'Equipment' THEN 1 ELSE 0 END) AS equipment_count
       FROM assets`
    ) || {};

    const empCount = queryOne(db, 'SELECT COUNT(*) AS total_employees FROM employees')?.total_employees || 0;

    const recentAssets = queryAll(
      db,
      `SELECT a.id, a.name, a.tag_number, a.serial_number, a.category, a.location,
              a.purchase_cost, a.status, a.image_url, a.updated_at,
              e.id AS employee_id, e.full_name AS employee_name, e.department AS employee_department, e.photo_url AS employee_photo_url
       FROM assets a
       LEFT JOIN employees e ON a.employee_id = e.id
       ORDER BY a.updated_at DESC
       LIMIT 8`
    );

    const staffSummary = queryAll(
      db,
      `SELECT e.id, e.full_name, e.department, e.job_title, e.email, e.photo_url,
              COUNT(a.id) AS assigned_count
       FROM employees e
       LEFT JOIN assets a ON a.employee_id = e.id
       GROUP BY e.id
       ORDER BY assigned_count DESC, e.full_name ASC
       LIMIT 6`
    );

    const totalAssets = Number(counts.total_assets) || 0;
    const assignedCount = Number(counts.assigned_count) || 0;
    const assignedPercent = totalAssets > 0 ? Math.round((assignedCount / totalAssets) * 100) : 0;

    res.json({
      total_assets: totalAssets,
      total_value: Number(counts.total_value) || 0,
      assigned_count: assignedCount,
      assigned_percent: assignedPercent,
      available_count: Number(counts.available_count) || 0,
      maintenance_count: Number(counts.maintenance_count) || 0,
      retired_count: Number(counts.retired_count) || 0,
      total_employees: empCount,
      categories: {
        furniture: Number(counts.furniture_count) || 0,
        fixture: Number(counts.fixture_count) || 0,
        equipment: Number(counts.equipment_count) || 0,
      },
      recent_assets: recentAssets,
      staff_summary: staffSummary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load dashboard data' });
  }
});

// Assets List with filters: GET /api/assets
apiRouter.get('/assets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const { search, category, status, employee_id } = req.query;

    let query = `
      SELECT a.id, a.name, a.tag_number, a.serial_number, a.category, a.location,
             a.purchase_cost, a.status, a.employee_id, a.image_url, a.notes, a.created_at, a.updated_at,
             e.full_name AS employee_name, e.department AS employee_department,
             e.job_title AS employee_job_title, e.photo_url AS employee_photo_url
      FROM assets a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'ALL') {
      query += ' AND a.category = ?';
      params.push(category);
    }

    if (status && status !== 'ALL') {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (employee_id) {
      query += ' AND a.employee_id = ?';
      params.push(employee_id);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (
        LOWER(a.id) LIKE ? OR
        LOWER(a.tag_number) LIKE ? OR
        LOWER(a.name) LIKE ? OR
        LOWER(COALESCE(a.serial_number, '')) LIKE ? OR
        LOWER(a.location) LIKE ? OR
        LOWER(COALESCE(e.full_name, '')) LIKE ?
      )`;
      params.push(term, term, term, term, term, term);
    }

    query += ' ORDER BY a.updated_at DESC, a.id DESC';

    const assets = queryAll(db, query, params);
    res.json(assets);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assets' });
  }
});

// Single Asset: GET /api/assets/:id
apiRouter.get('/assets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const asset = queryOne(
      db,
      `SELECT a.*, e.full_name AS employee_name, e.department AS employee_department,
              e.job_title AS employee_job_title, e.photo_url AS employee_photo_url
       FROM assets a
       LEFT JOIN employees e ON a.employee_id = e.id
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (!asset) {
      res.status(404).json({ error: 'Asset not found.' });
      return;
    }

    res.json(asset);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch asset' });
  }
});

// Helper to generate next AST ID
function getNextAssetId(db: any): string {
  const rows = queryAll(db, 'SELECT id FROM assets');
  let maxNum = 1000;
  for (const row of rows) {
    const match = String(row.id).match(/^AST-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `AST-${maxNum + 1}`;
}

// Create Asset (Single or Batch): POST /api/assets
apiRouter.post('/assets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const {
      isBatch,
      quantity,
      name,
      tag_number,
      tag_prefix,
      serial_number,
      serial_prefix,
      category,
      location,
      purchase_cost,
      status,
      employee_id,
      image_url,
      notes,
    } = req.body;

    // Validate category
    const validCategories = ['Furniture', 'Fixture', 'Equipment'];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: 'Invalid category. Choose Furniture, Fixture, or Equipment.' });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Asset Item Name is required.' });
      return;
    }

    if (!location || !location.trim()) {
      res.status(400).json({ error: 'Workplace Location is required.' });
      return;
    }

    const cost = parseFloat(purchase_cost) || 0.0;
    const now = new Date().toISOString();

    if (isBatch) {
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty < 1 || qty > 50) {
        res.status(400).json({ error: 'Batch quantity must be between 1 and 50.' });
        return;
      }

      // Check tag uniqueness for generated batch
      const cleanTagPrefix = (tag_prefix || 'TAG-' + new Date().getFullYear() + '-').trim();
      const cleanSerialPrefix = (serial_prefix || 'SN-').trim();

      // Find highest existing tag with this prefix
      const existingTags = queryAll(db, 'SELECT tag_number FROM assets WHERE tag_number LIKE ?', [
        `${cleanTagPrefix}%`,
      ]).map((r) => r.tag_number);

      let tagCounter = 1;
      const createdAssets = [];

      for (let i = 0; i < qty; i++) {
        const nextAstId = getNextAssetId(db);

        // Find next unused tag
        let nextTag = '';
        while (true) {
          const candidate = `${cleanTagPrefix}${String(tagCounter).padStart(3, '0')}`;
          tagCounter++;
          if (!existingTags.includes(candidate)) {
            nextTag = candidate;
            existingTags.push(candidate);
            break;
          }
        }

        const sn = cleanSerialPrefix ? `${cleanSerialPrefix}${String(tagCounter - 1).padStart(4, '0')}` : '';

        // Business rule for status and employee:
        let finalStatus = status || 'Available';
        let finalEmployee = employee_id || null;

        if (finalStatus === 'Maintenance' || finalStatus === 'Retired') {
          finalEmployee = null;
        } else if (finalEmployee) {
          finalStatus = 'Assigned';
        } else {
          finalStatus = 'Available';
        }

        executeRun(
          db,
          `INSERT INTO assets (
            id, name, tag_number, serial_number, category, location, purchase_cost,
            status, employee_id, image_url, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nextAstId,
            name.trim(),
            nextTag,
            sn,
            category,
            location.trim(),
            cost,
            finalStatus,
            finalEmployee,
            image_url || '',
            notes || '',
            now,
            now,
          ]
        );

        createdAssets.push(nextAstId);
      }

      logAudit(
        db,
        'CREATE_BATCH_ASSET',
        'ASSET',
        createdAssets.join(', '),
        `Created batch of ${qty} items under category ${category}`
      );

      res.status(201).json({
        message: `Successfully created ${qty} assets.`,
        assetIds: createdAssets,
      });
      return;
    }

    // Single item creation
    let finalTag = tag_number ? tag_number.trim() : '';
    if (!finalTag) {
      const year = new Date().getFullYear();
      finalTag = `TAG-${year}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Check tag uniqueness
    const tagExists = queryOne(db, 'SELECT id FROM assets WHERE tag_number = ?', [finalTag]);
    if (tagExists) {
      res.status(400).json({ error: `Tag number '${finalTag}' already exists. Must be unique.` });
      return;
    }

    const nextId = getNextAssetId(db);

    // Business Rules:
    // "Assigning an asset sets it to Assigned. Unassigning sets it to Available.
    // An asset with status Maintenance or Retired cannot be assigned to an employee."
    let finalStatus = status || 'Available';
    let finalEmployee = employee_id ? employee_id.trim() : null;

    if (finalStatus === 'Maintenance' || finalStatus === 'Retired') {
      if (finalEmployee) {
        res.status(400).json({
          error: `An asset with status '${finalStatus}' cannot be assigned to an employee.`,
        });
        return;
      }
      finalEmployee = null;
    } else {
      if (finalEmployee && finalEmployee !== '') {
        finalStatus = 'Assigned';
      } else {
        finalStatus = 'Available';
        finalEmployee = null;
      }
    }

    executeRun(
      db,
      `INSERT INTO assets (
        id, name, tag_number, serial_number, category, location, purchase_cost,
        status, employee_id, image_url, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        name.trim(),
        finalTag,
        serial_number ? serial_number.trim() : '',
        category,
        location.trim(),
        cost,
        finalStatus,
        finalEmployee,
        image_url ? image_url.trim() : '',
        notes ? notes.trim() : '',
        now,
        now,
      ]
    );

    logAudit(
      db,
      'CREATE_ASSET',
      'ASSET',
      nextId,
      `Added asset '${name}' (Tag: ${finalTag}, Status: ${finalStatus})`
    );

    const created = queryOne(db, 'SELECT * FROM assets WHERE id = ?', [nextId]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create asset' });
  }
});

// Update Asset: PUT /api/assets/:id
apiRouter.put('/assets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const existing = queryOne(db, 'SELECT * FROM assets WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Asset not found.' });
      return;
    }

    const {
      name,
      tag_number,
      serial_number,
      category,
      location,
      purchase_cost,
      status,
      employee_id,
      image_url,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Asset Item Name is required.' });
      return;
    }

    if (!location || !location.trim()) {
      res.status(400).json({ error: 'Workplace Location is required.' });
      return;
    }

    const finalTag = tag_number ? tag_number.trim() : existing.tag_number;
    const tagConflict = queryOne(
      db,
      'SELECT id FROM assets WHERE tag_number = ? AND id != ?',
      [finalTag, id]
    );
    if (tagConflict) {
      res.status(400).json({ error: `Tag number '${finalTag}' is already in use by another asset.` });
      return;
    }

    const cost = parseFloat(purchase_cost) !== undefined ? parseFloat(purchase_cost) : existing.purchase_cost;
    const now = new Date().toISOString();

    // Business Rules:
    let finalStatus = status || existing.status;
    let finalEmployee = employee_id !== undefined ? (employee_id ? employee_id.trim() : null) : existing.employee_id;

    if (finalStatus === 'Maintenance' || finalStatus === 'Retired') {
      if (finalEmployee) {
        res.status(400).json({
          error: `An asset with status '${finalStatus}' cannot be assigned to an employee. Unassign the employee first or choose Available/Assigned.`,
        });
        return;
      }
      finalEmployee = null;
    } else {
      if (finalEmployee) {
        finalStatus = 'Assigned';
      } else {
        finalStatus = 'Available';
        finalEmployee = null;
      }
    }

    executeRun(
      db,
      `UPDATE assets SET
        name = ?,
        tag_number = ?,
        serial_number = ?,
        category = ?,
        location = ?,
        purchase_cost = ?,
        status = ?,
        employee_id = ?,
        image_url = ?,
        notes = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        name.trim(),
        finalTag,
        serial_number !== undefined ? (serial_number ? serial_number.trim() : '') : existing.serial_number,
        category || existing.category,
        location.trim(),
        cost,
        finalStatus,
        finalEmployee,
        image_url !== undefined ? (image_url ? image_url.trim() : '') : existing.image_url,
        notes !== undefined ? (notes ? notes.trim() : '') : existing.notes,
        now,
        id,
      ]
    );

    logAudit(
      db,
      'UPDATE_ASSET',
      'ASSET',
      id,
      `Updated asset details (Status: ${finalStatus}, Assigned: ${finalEmployee || 'None'})`
    );

    const updated = queryOne(
      db,
      `SELECT a.*, e.full_name AS employee_name, e.department AS employee_department
       FROM assets a
       LEFT JOIN employees e ON a.employee_id = e.id
       WHERE a.id = ?`,
      [id]
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update asset' });
  }
});

// Unassign Asset: POST /api/assets/:id/unassign
apiRouter.post('/assets/:id/unassign', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const existing = queryOne(db, 'SELECT * FROM assets WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Asset not found.' });
      return;
    }

    const previousEmployee = existing.employee_id;
    const now = new Date().toISOString();

    executeRun(
      db,
      'UPDATE assets SET employee_id = NULL, status = "Available", updated_at = ? WHERE id = ?',
      [now, id]
    );

    logAudit(
      db,
      'UNASSIGN_ASSET',
      'ASSET',
      id,
      `Unassigned asset from employee ${previousEmployee || 'none'}. Status set to Available.`
    );

    res.json({ message: 'Asset successfully unassigned and marked Available.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to unassign asset' });
  }
});

// Delete Asset: DELETE /api/assets/:id
apiRouter.delete('/assets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const existing = queryOne(db, 'SELECT * FROM assets WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Asset not found.' });
      return;
    }

    executeRun(db, 'DELETE FROM assets WHERE id = ?', [id]);
    logAudit(db, 'DELETE_ASSET', 'ASSET', id, `Deleted asset '${existing.name}' (${existing.tag_number})`);

    res.json({ message: 'Asset deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete asset' });
  }
});

// ==========================================
// 3. EMPLOYEE ROUTES
// ==========================================

// Helper to generate next EMP ID
function getNextEmployeeId(db: any): string {
  const rows = queryAll(db, 'SELECT id FROM employees');
  let maxNum = 100;
  for (const row of rows) {
    const match = String(row.id).match(/^EMP-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `EMP-${maxNum + 1}`;
}

// List Employees: GET /api/employees
apiRouter.get('/employees', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const { search, department } = req.query;

    let query = `
      SELECT e.id, e.full_name, e.department, e.job_title, e.email, e.photo_url, e.created_at,
             COUNT(a.id) AS assigned_count
      FROM employees e
      LEFT JOIN assets a ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (department && department !== 'ALL') {
      query += ' AND e.department = ?';
      params.push(department);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (
        LOWER(e.id) LIKE ? OR
        LOWER(e.full_name) LIKE ? OR
        LOWER(e.department) LIKE ? OR
        LOWER(COALESCE(e.job_title, '')) LIKE ? OR
        LOWER(COALESCE(e.email, '')) LIKE ?
      )`;
      params.push(term, term, term, term, term);
    }

    query += ' GROUP BY e.id ORDER BY e.full_name ASC';

    const employees = queryAll(db, query, params);
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch employees' });
  }
});

// Single Employee with assigned assets: GET /api/employees/:id
apiRouter.get('/employees/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const employee = queryOne(db, 'SELECT * FROM employees WHERE id = ?', [id]);
    if (!employee) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const assets = queryAll(
      db,
      'SELECT * FROM assets WHERE employee_id = ? ORDER BY category ASC, name ASC',
      [id]
    );

    res.json({ ...employee, assigned_assets: assets });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch employee' });
  }
});

// Create Employee: POST /api/employees
apiRouter.post('/employees', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const { id, full_name, department, job_title, email, photo_url } = req.body;

    if (!full_name || !full_name.trim()) {
      res.status(400).json({ error: 'Full Name is required.' });
      return;
    }

    if (!department || !department.trim()) {
      res.status(400).json({ error: 'Department is required.' });
      return;
    }

    const empId = id && id.trim() ? id.trim().toUpperCase() : getNextEmployeeId(db);

    const existing = queryOne(db, 'SELECT id FROM employees WHERE id = ?', [empId]);
    if (existing) {
      res.status(400).json({ error: `Employee ID '${empId}' already exists. Must be unique.` });
      return;
    }

    const now = new Date().toISOString();
    executeRun(
      db,
      `INSERT INTO employees (id, full_name, department, job_title, email, photo_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        empId,
        full_name.trim(),
        department.trim(),
        job_title ? job_title.trim() : '',
        email ? email.trim() : '',
        photo_url ? photo_url.trim() : '',
        now,
      ]
    );

    logAudit(db, 'REGISTER_EMPLOYEE', 'EMPLOYEE', empId, `Registered staff member '${full_name}'`);

    const created = queryOne(db, 'SELECT * FROM employees WHERE id = ?', [empId]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register employee' });
  }
});

// Update Employee: PUT /api/employees/:id
apiRouter.put('/employees/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const existing = queryOne(db, 'SELECT * FROM employees WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const { full_name, department, job_title, email, photo_url } = req.body;

    if (!full_name || !full_name.trim()) {
      res.status(400).json({ error: 'Full Name is required.' });
      return;
    }

    if (!department || !department.trim()) {
      res.status(400).json({ error: 'Department is required.' });
      return;
    }

    executeRun(
      db,
      `UPDATE employees SET
        full_name = ?,
        department = ?,
        job_title = ?,
        email = ?,
        photo_url = ?
       WHERE id = ?`,
      [
        full_name.trim(),
        department.trim(),
        job_title !== undefined ? (job_title ? job_title.trim() : '') : existing.job_title,
        email !== undefined ? (email ? email.trim() : '') : existing.email,
        photo_url !== undefined ? (photo_url ? photo_url.trim() : '') : existing.photo_url,
        id,
      ]
    );

    logAudit(db, 'UPDATE_EMPLOYEE', 'EMPLOYEE', id, `Updated staff profile for '${full_name}'`);

    const updated = queryOne(db, 'SELECT * FROM employees WHERE id = ?', [id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update employee' });
  }
});

// Delete Employee: DELETE /api/employees/:id
// Business Rule: "Delete is DISABLED if the employee still has assigned assets. Otherwise it asks for confirmation."
apiRouter.delete('/employees/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const existing = queryOne(db, 'SELECT * FROM employees WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const assignedCount =
      queryOne(db, 'SELECT COUNT(*) AS count FROM assets WHERE employee_id = ?', [id])?.count || 0;

    if (assignedCount > 0) {
      res.status(400).json({
        error: `Cannot delete employee ${existing.full_name} (${id}) because they still have ${assignedCount} assigned FFE asset(s). Unassign or transfer the assets first.`,
      });
      return;
    }

    executeRun(db, 'DELETE FROM employees WHERE id = ?', [id]);
    logAudit(db, 'DELETE_EMPLOYEE', 'EMPLOYEE', id, `Deleted staff member '${existing.full_name}'`);

    res.json({ message: 'Employee deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete employee' });
  }
});

// Get Departments list: GET /api/departments
apiRouter.get('/departments', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const depts = queryAll(
      db,
      `SELECT department, COUNT(*) as count
       FROM employees
       GROUP BY department
       ORDER BY department ASC`
    );
    res.json(depts);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch departments' });
  }
});

// Audit Logs: GET /api/audit-logs
apiRouter.get('/audit-logs', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const logs = queryAll(
      db,
      'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50'
    );
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
  }
});
