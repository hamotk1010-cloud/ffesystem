import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'workspace_ffe.db');

let dbInstance: Database | null = null;
let SQL: SqlJsStatic | null = null;

export interface DBStatement {
  all<T = any>(...params: any[]): T[];
  get<T = any>(...params: any[]): T | undefined;
  run(...params: any[]): { changes: number; lastInsertRowid: number };
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      department TEXT NOT NULL,
      job_title TEXT,
      email TEXT,
      photo_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tag_number TEXT UNIQUE NOT NULL,
      serial_number TEXT,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      purchase_cost REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL,
      employee_id TEXT,
      image_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  seedData(db);
}

function seedData(db: Database): void {
  // Check admin
  const adminCheck = queryAll(db, 'SELECT id FROM admin LIMIT 1');
  if (adminCheck.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    const now = new Date().toISOString();
    db.run(
      'INSERT INTO admin (username, password_hash, updated_at) VALUES (?, ?, ?)',
      ['admin', hash, now]
    );
  }

  // Check employees
  const empCheck = queryAll(db, 'SELECT id FROM employees LIMIT 1');
  if (empCheck.length === 0) {
    const employeesSeed = [
      {
        id: 'EMP-101',
        full_name: 'Alex Rivera',
        job_title: 'Senior Staff Engineer',
        department: 'Software Engineering',
        email: 'alex.rivera@workplace.co',
        photo_url: '',
        created_at: new Date('2024-01-15T08:30:00Z').toISOString(),
      },
      {
        id: 'EMP-102',
        full_name: 'Sarah Chen',
        job_title: 'Head of Facilities Operations',
        department: 'Workplace & Facilities',
        email: 'sarah.chen@workplace.co',
        photo_url: '',
        created_at: new Date('2024-01-20T09:00:00Z').toISOString(),
      },
      {
        id: 'EMP-103',
        full_name: 'Michael Vance',
        job_title: 'Lead Product Designer',
        department: 'Product Design',
        email: 'michael.vance@workplace.co',
        photo_url: '',
        created_at: new Date('2024-02-01T10:15:00Z').toISOString(),
      },
      {
        id: 'EMP-104',
        full_name: 'Samantha Cruz',
        job_title: 'Operations Specialist',
        department: 'Workplace & Facilities',
        email: 'samantha.cruz@workplace.co',
        photo_url: '',
        created_at: new Date('2024-02-10T11:00:00Z').toISOString(),
      },
      {
        id: 'EMP-105',
        full_name: 'David Lim',
        job_title: 'DevOps Engineer',
        department: 'Infrastructure & IT',
        email: 'david.lim@workplace.co',
        photo_url: '',
        created_at: new Date('2024-02-15T14:20:00Z').toISOString(),
      },
      {
        id: 'EMP-106',
        full_name: 'Patricia Gomez',
        job_title: 'HR People Partner',
        department: 'People Operations',
        email: 'patricia.gomez@workplace.co',
        photo_url: '',
        created_at: new Date('2024-03-01T09:45:00Z').toISOString(),
      },
    ];

    for (const emp of employeesSeed) {
      db.run(
        'INSERT INTO employees (id, full_name, department, job_title, email, photo_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          emp.id,
          emp.full_name,
          emp.department,
          emp.job_title,
          emp.email,
          emp.photo_url,
          emp.created_at,
        ]
      );
    }
  }

  // Check assets
  const assetCheck = queryAll(db, 'SELECT id FROM assets LIMIT 1');
  if (assetCheck.length === 0) {
    // 12 assets satisfying exact requirements:
    // Total: 12
    // Sum of purchase cost = 22,458.00
    // Assigned: 8
    // Available: 3
    // Maintenance: 1
    // Retired: 0
    // Furniture: 6
    // Fixture: 2
    // Equipment: 4
    const assetsSeed = [
      {
        id: 'AST-1001',
        name: 'Herman Miller Aeron Chair (Size B)',
        tag_number: 'TAG-2023-001',
        serial_number: 'HM-AERON-88291',
        category: 'Furniture',
        location: 'Building A - Floor 3 - Station 304',
        purchase_cost: 4850.0,
        status: 'Assigned',
        employee_id: 'EMP-101',
        image_url: '',
        notes: 'Equipped with posture fit SL and forward tilt mechanism.',
        created_at: new Date('2024-01-16T10:00:00Z').toISOString(),
        updated_at: new Date('2024-01-16T10:00:00Z').toISOString(),
      },
      {
        id: 'AST-1002',
        name: 'Jarvis Dual-Motor Electric Standing Desk (72")',
        tag_number: 'TAG-2023-002',
        serial_number: 'JRV-SD72-9901',
        category: 'Furniture',
        location: 'Building A - Floor 3 - Station 304',
        purchase_cost: 3600.0,
        status: 'Assigned',
        employee_id: 'EMP-101',
        image_url: '',
        notes: 'Bamboo desktop with programmable OLED handset controller.',
        created_at: new Date('2024-01-16T11:00:00Z').toISOString(),
        updated_at: new Date('2024-01-16T11:00:00Z').toISOString(),
      },
      {
        id: 'AST-1003',
        name: 'Dell UltraSharp 32" 4K USB-C Hub Monitor',
        tag_number: 'TAG-2023-003',
        serial_number: 'DELL-U3223QE-104',
        category: 'Equipment',
        location: 'Building A - Floor 3 - Station 304',
        purchase_cost: 4100.0,
        status: 'Assigned',
        employee_id: 'EMP-101',
        image_url: '',
        notes: '90W USB-C Power Delivery and integrated RJ45 ethernet.',
        created_at: new Date('2024-01-17T09:30:00Z').toISOString(),
        updated_at: new Date('2024-01-17T09:30:00Z').toISOString(),
      },
      {
        id: 'AST-1004',
        name: 'Ergotron LX Dual Stacking Monitor Arm',
        tag_number: 'TAG-2023-004',
        serial_number: 'ERG-LX-45248',
        category: 'Fixture',
        location: 'Building A - Floor 2 - Tech Storage',
        purchase_cost: 1450.0,
        status: 'Available',
        employee_id: null,
        image_url: '',
        notes: 'Polished aluminum desk clamp mount with cable management channels.',
        created_at: new Date('2024-01-18T13:00:00Z').toISOString(),
        updated_at: new Date('2024-01-18T13:00:00Z').toISOString(),
      },
      {
        id: 'AST-1005',
        name: 'Steelcase Gesture Ergonomic Office Chair',
        tag_number: 'TAG-2023-005',
        serial_number: 'SC-GST-7712',
        category: 'Furniture',
        location: 'Building B - Floor 1 - Facilities Suite',
        purchase_cost: 3200.0,
        status: 'Assigned',
        employee_id: 'EMP-102',
        image_url: '',
        notes: '360-degree rotating arms designed for multidevice posture support.',
        created_at: new Date('2024-01-21T08:15:00Z').toISOString(),
        updated_at: new Date('2024-01-21T08:15:00Z').toISOString(),
      },
      {
        id: 'AST-1006',
        name: 'Apple Studio Display 27" 5K Retina',
        tag_number: 'TAG-2023-006',
        serial_number: 'APL-SD27-5501',
        category: 'Equipment',
        location: 'Building A - Floor 4 - Design Pod 12',
        purchase_cost: 2150.0,
        status: 'Assigned',
        employee_id: 'EMP-103',
        image_url: '',
        notes: 'Standard glass with tilt-adjustable stand, A13 Bionic chip.',
        created_at: new Date('2024-02-02T14:00:00Z').toISOString(),
        updated_at: new Date('2024-02-02T14:00:00Z').toISOString(),
      },
      {
        id: 'AST-1007',
        name: 'Humanscale Freedom Task Chair with Headrest',
        tag_number: 'TAG-2023-007',
        serial_number: 'HMS-FRD-9912',
        category: 'Furniture',
        location: 'Building A - Floor 4 - Design Pod 12',
        purchase_cost: 950.0,
        status: 'Assigned',
        employee_id: 'EMP-103',
        image_url: '',
        notes: 'Self-adjusting recline mechanism and dynamic headrest.',
        created_at: new Date('2024-02-02T14:30:00Z').toISOString(),
        updated_at: new Date('2024-02-02T14:30:00Z').toISOString(),
      },
      {
        id: 'AST-1008',
        name: 'Logitech Rally Bar Video Conferencing System',
        tag_number: 'TAG-2023-008',
        serial_number: 'LOG-RBR-3301',
        category: 'Equipment',
        location: 'Building A - Floor 3 - Boardroom B',
        purchase_cost: 1100.0,
        status: 'Assigned',
        employee_id: 'EMP-104',
        image_url: '',
        notes: 'All-in-one 4K video conference bar with motorized PTZ camera.',
        created_at: new Date('2024-02-12T11:00:00Z').toISOString(),
        updated_at: new Date('2024-02-12T11:00:00Z').toISOString(),
      },
      {
        id: 'AST-1009',
        name: 'ThinkPad Thunderbolt 4 Workstation Dock',
        tag_number: 'TAG-2023-009',
        serial_number: 'LEN-TB4-4421',
        category: 'Equipment',
        location: 'Building C - Server Hub 10',
        purchase_cost: 450.0,
        status: 'Assigned',
        employee_id: 'EMP-105',
        image_url: '',
        notes: 'Dual 8K/Triple 4K support, 230W power delivery.',
        created_at: new Date('2024-02-16T16:00:00Z').toISOString(),
        updated_at: new Date('2024-02-16T16:00:00Z').toISOString(),
      },
      {
        id: 'AST-1010',
        name: 'Dyson Pure Cool Air Purifier Tower Fan',
        tag_number: 'TAG-2023-010',
        serial_number: 'DYS-TP07-8820',
        category: 'Fixture',
        location: 'Building A - Floor 1 - Reception Lounge',
        purchase_cost: 380.0,
        status: 'Maintenance',
        employee_id: null,
        image_url: '',
        notes: 'Oscillating HEPA H13 filtration unit. Fan motor undergoing bearing repair.',
        created_at: new Date('2024-02-20T10:00:00Z').toISOString(),
        updated_at: new Date('2024-02-20T10:00:00Z').toISOString(),
      },
      {
        id: 'AST-1011',
        name: 'Clarus Glassboard Magnetic Mobile Whiteboard',
        tag_number: 'TAG-2023-011',
        serial_number: 'CLR-MB-7011',
        category: 'Furniture',
        location: 'Building B - Floor 2 - Storage Bay 4',
        purchase_cost: 130.0,
        status: 'Available',
        employee_id: null,
        image_url: '',
        notes: 'Heavy-duty steel casters with locking brakes, tempered safety glass.',
        created_at: new Date('2024-02-22T09:00:00Z').toISOString(),
        updated_at: new Date('2024-02-22T09:00:00Z').toISOString(),
      },
      {
        id: 'AST-1012',
        name: 'Muuto Linear System Wooden Coffee Table',
        tag_number: 'TAG-2023-012',
        serial_number: 'MUT-LST-6602',
        category: 'Furniture',
        location: 'Building A - Level 2 - Breakout Annex',
        purchase_cost: 98.0,
        status: 'Available',
        employee_id: null,
        image_url: '',
        notes: 'Solid oak construction with matte lacquer protective finish.',
        created_at: new Date('2024-02-25T15:30:00Z').toISOString(),
        updated_at: new Date('2024-02-25T15:30:00Z').toISOString(),
      },
    ];

    for (const item of assetsSeed) {
      db.run(
        `INSERT INTO assets (
          id, name, tag_number, serial_number, category, location, purchase_cost,
          status, employee_id, image_url, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.name,
          item.tag_number,
          item.serial_number,
          item.category,
          item.location,
          item.purchase_cost,
          item.status,
          item.employee_id,
          item.image_url,
          item.notes,
          item.created_at,
          item.updated_at,
        ]
      );
    }
  }

  // Audit log entry for initial seed
  const auditCheck = queryAll(db, 'SELECT id FROM audit_logs LIMIT 1');
  if (auditCheck.length === 0) {
    db.run(
      'INSERT INTO audit_logs (action, entity_type, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [
        'SEED_SYSTEM',
        'SYSTEM',
        'INIT',
        'Initialized WorkSpace FFE database with standard seed data.',
        new Date().toISOString(),
      ]
    );
  }
}

export function queryAll<T = any>(db: Database, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    return results;
  } finally {
    stmt.free();
  }
}

export function queryOne<T = any>(db: Database, sql: string, params: any[] = []): T | undefined {
  const rows = queryAll<T>(db, sql, params);
  return rows[0];
}

export function executeRun(
  db: Database,
  sql: string,
  params: any[] = []
): { changes: number; lastInsertRowid: number } {
  db.run(sql, params);
  saveDb();
  const lastId = queryOne<{ id: number }>(db, 'SELECT last_insert_rowid() AS id')?.id || 0;
  return {
    changes: 1,
    lastInsertRowid: lastId,
  };
}

export function logAudit(
  db: Database,
  action: string,
  entityType: string,
  entityId: string,
  details: string
): void {
  try {
    executeRun(
      db,
      'INSERT INTO audit_logs (action, entity_type, entity_id, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [action, entityType, entityId, details, new Date().toISOString()]
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
