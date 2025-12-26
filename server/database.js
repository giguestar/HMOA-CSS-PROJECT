import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'construction.db'));

// 데이터베이스 초기화
export function initDatabase() {
  try {
    // 1. 시공내역 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS construction_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        construction_date TEXT NOT NULL,
        client_company TEXT NOT NULL,
        customer_name TEXT,
        special_notes TEXT,
        is_resident TEXT,
        site_address TEXT,
        building_unit TEXT,
        team TEXT,
        settlement_status TEXT,
        settlement_date TEXT,
        
        -- 청구 금액 (발주업체에 청구)
        standard_cost INTEGER DEFAULT 0,
        total_cost INTEGER DEFAULT 0,
        protection_cost INTEGER DEFAULT 0,
        demolition_qty INTEGER DEFAULT 0,
        demolition_cost INTEGER DEFAULT 0,
        equipment_desc TEXT,
        equipment_cost INTEGER DEFAULT 0,
        crane_cost INTEGER DEFAULT 0,
        ladder_jg_cost INTEGER DEFAULT 0,
        ladder_partner_cost INTEGER DEFAULT 0,
        other1_desc TEXT,
        other1_cost INTEGER DEFAULT 0,
        other2_desc TEXT,
        other2_cost INTEGER DEFAULT 0,
        other3_desc TEXT,
        other3_cost INTEGER DEFAULT 0,
        other4_desc TEXT,
        other4_cost INTEGER DEFAULT 0,
        other5_desc TEXT,
        other5_cost INTEGER DEFAULT 0,
        measurement_cost INTEGER DEFAULT 0,
        cash_collected INTEGER DEFAULT 0,
        
        -- 지급 금액 (외주팀에 지급)
        outsource_total_cost INTEGER DEFAULT 0,
        outsource_team_cost INTEGER DEFAULT 0,
        actual_settlement INTEGER DEFAULT 0,
        demolition_outsource_cost INTEGER DEFAULT 0,
        demolition_baek_cost INTEGER DEFAULT 0,
        demolition_gs_cost INTEGER DEFAULT 0,
        
        -- 기타
        extra_expenses TEXT,
        extra_expense_amount INTEGER DEFAULT 0,
        company_payment TEXT,
        profit_margin INTEGER DEFAULT 0,
        remarks TEXT,
        
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // 2. 부가작업 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS additional_works (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER NOT NULL,
        work_type TEXT NOT NULL,
        is_required BOOLEAN DEFAULT 0,
        is_prepared BOOLEAN DEFAULT 0,
        cost INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (record_id) REFERENCES construction_records(id) ON DELETE CASCADE
      )
    `);

    // 3. 정산 관리 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS settlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_company TEXT NOT NULL,
        settlement_period_start TEXT NOT NULL,
        settlement_period_end TEXT NOT NULL,
        settlement_due_date TEXT NOT NULL,
        total_amount INTEGER DEFAULT 0,
        payment_received BOOLEAN DEFAULT 0,
        payment_date TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // 4. 업체 설정 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT UNIQUE NOT NULL,
        settlement_type TEXT NOT NULL,
        color_code TEXT,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // 5. 시공팀 설정 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS team_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_name TEXT UNIQUE NOT NULL,
        team_type TEXT NOT NULL,
        payment_rate REAL DEFAULT 0.85,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // 초기 데이터 삽입
    insertInitialData();
    
    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

function insertInitialData() {
  try {
    // 발주업체 초기 데이터
    const companies = [
      { name: 'LX', type: 'monthly_end', color: '#9333ea' },
      { name: '케스코', type: 'bimonthly', color: '#3b82f6' },
      { name: '청암', type: 'bimonthly_custom', color: '#10b981' },
      { name: '한샘', type: 'monthly_end', color: '#f59e0b' },
      { name: '홈CC', type: 'monthly_end', color: '#ef4444' },
      { name: '해모아', type: 'monthly_end', color: '#06b6d4' }
    ];

    const insertCompany = db.prepare(`
      INSERT OR IGNORE INTO company_settings (company_name, settlement_type, color_code)
      VALUES (?, ?, ?)
    `);

    for (const company of companies) {
      insertCompany.run(company.name, company.type, company.color);
    }

    // 시공팀 초기 데이터
    const teams = [
      { name: '직영', type: 'direct', rate: 1.0 },
      { name: '손팀', type: 'outsource', rate: 0.85 },
      { name: '백팀', type: 'outsource', rate: 0.85 },
      { name: '기타', type: 'outsource', rate: 0.85 }
    ];

    const insertTeam = db.prepare(`
      INSERT OR IGNORE INTO team_settings (team_name, team_type, payment_rate)
      VALUES (?, ?, ?)
    `);

    for (const team of teams) {
      insertTeam.run(team.name, team.type, team.rate);
    }
  } catch (error) {
    console.error('❌ Error inserting initial data:', error);
    throw error;
  }
}

export default db;
