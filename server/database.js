import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'construction.db'));

// 데이터베이스 초기화
export function initDatabase() {
  try {
    // 0. 사용자 테이블 (로그인)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // 기본 사용자 데이터 삽입 (없을 경우)
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
      const insertUser = db.prepare(`
        INSERT INTO users (username, password, role, display_name)
        VALUES (?, ?, ?, ?)
      `);
      
      insertUser.run('admin', 'admin1234', 'admin', '관리자');
      insertUser.run('manager1', 'manager1234', 'manager', '매니저1');
      insertUser.run('viewer', 'viewer1234', 'viewer', '뷰어');
      insertUser.run('lee', 'l1234', 'manager', '이상무');
      insertUser.run('jung', 'j1234', 'manager', '정호규');
      insertUser.run('kim', 'k1234', 'manager', '김남군');
      
      console.log('✅ 기본 사용자 생성 완료');
    }

    // 1. 시공내역 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS construction_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        construction_date TEXT NOT NULL,
        client_company TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        special_notes TEXT,
        is_resident TEXT,
        site_address TEXT,
        address_detail TEXT,
        building_unit TEXT,
        frame_count INTEGER DEFAULT 0,
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
        equipment_provider TEXT DEFAULT '직영',
        demolition_team TEXT DEFAULT '시공팀',
        
        -- 스케줄 표기용 체크박스
        has_railing BOOLEAN DEFAULT 0,
        has_security_window BOOLEAN DEFAULT 0,
        has_roll_screen BOOLEAN DEFAULT 0,
        has_louver BOOLEAN DEFAULT 0,
        has_molding BOOLEAN DEFAULT 0,
        has_tile BOOLEAN DEFAULT 0,
        has_molding_tile BOOLEAN DEFAULT 0,
        needs_fabrication BOOLEAN DEFAULT 0,
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

    // 3. 업체 설정 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT UNIQUE NOT NULL,
        settlement_type TEXT NOT NULL,
        color_code TEXT,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // 4. 시공팀 설정 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS team_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_name TEXT UNIQUE NOT NULL,
        team_type TEXT NOT NULL,
        payment_rate REAL DEFAULT 0.85,
        is_active BOOLEAN DEFAULT 1
      )
    `);

    // 5. 달력 노트 테이블 (휴가자, 일당, 쉬는 팀)
    db.exec(`
      CREATE TABLE IF NOT EXISTS calendar_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_date TEXT NOT NULL,
        vacation_members TEXT,
        daily_workers TEXT,
        off_teams TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // 6. 실측 요청 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS measurement_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_company TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        site_address TEXT NOT NULL,
        address_detail TEXT,
        request_date TEXT NOT NULL,
        scheduled_measurement_date TEXT,
        scheduled_measurement_time TEXT,
        actual_measurement_date TEXT,
        assigned_manager TEXT,
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        desired_construction_date TEXT,
        confirmed_construction_date TEXT,
        notes TEXT,
        measurement_photo_url TEXT,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // 7. 정산 마스터 테이블 (settlements)
    db.exec(`
      CREATE TABLE IF NOT EXISTS settlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        
        -- 시공 정보 연결
        construction_record_id INTEGER NOT NULL,
        
        -- 기본 정보
        construction_date TEXT NOT NULL,
        client_company TEXT NOT NULL,
        customer_name TEXT,
        site_address TEXT,
        address_detail TEXT,
        team TEXT,
        
        -- 청구 금액 (대리점에 청구)
        billing_standard_cost_1 INTEGER DEFAULT 0,
        billing_is_electronic_1 BOOLEAN DEFAULT 1,  -- 1: 전산, 0: 현금
        billing_standard_cost_2 INTEGER DEFAULT 0,
        billing_is_electronic_2 BOOLEAN DEFAULT 1,  -- 1: 전산, 0: 현금
        billing_frame_count INTEGER DEFAULT 0,
        billing_protection_cost INTEGER DEFAULT 0,
        billing_demolition_qty INTEGER DEFAULT 0,
        billing_demolition_unit_price INTEGER DEFAULT 40000,
        billing_demolition_cost INTEGER DEFAULT 0,
        billing_equipment_desc TEXT,
        billing_equipment_cost INTEGER DEFAULT 0,
        billing_molding_cost INTEGER DEFAULT 0,
        billing_tile_cost INTEGER DEFAULT 0,
        billing_other_cost INTEGER DEFAULT 0,
        billing_measurement_cost INTEGER DEFAULT 0,
        billing_total_amount INTEGER DEFAULT 0,
        billing_additional_items TEXT, -- JSON array
        
        -- 지급 금액 (외주팀에 지급)
        payment_standard_cost INTEGER DEFAULT 0,
        payment_protection_cost INTEGER DEFAULT 0,
        payment_demolition_qty INTEGER DEFAULT 0,
        payment_demolition_unit_price INTEGER DEFAULT 40000,
        payment_demolition_cost INTEGER DEFAULT 0,
        payment_equipment_cost INTEGER DEFAULT 0,
        payment_molding_cost INTEGER DEFAULT 0,
        payment_tile_cost INTEGER DEFAULT 0,
        payment_other_cost INTEGER DEFAULT 0,
        payment_measurement_cost INTEGER DEFAULT 0,
        payment_total_amount INTEGER DEFAULT 0,
        payment_additional_items TEXT, -- JSON array
        
        -- 수익 계산
        profit_amount INTEGER DEFAULT 0,
        profit_rate REAL DEFAULT 0,
        
        -- 주문제작 업체
        custom_order_company TEXT,
        custom_order_desc TEXT,
        custom_order_amount INTEGER DEFAULT 0,
        custom_order_items TEXT, -- JSON array
        
        -- 고객 원수금 내역
        customer_direct_items TEXT, -- JSON array
        
        -- 고객 추가 청구
        customer_extra_charge_desc TEXT,
        customer_extra_charge_amount INTEGER DEFAULT 0,
        
        -- 현금 수금
        is_cash_payment BOOLEAN DEFAULT 0,
        cash_payment BOOLEAN DEFAULT 0,
        cash_amount INTEGER DEFAULT 0,
        
        -- 정산 상태
        billing_status TEXT DEFAULT '청구 대기',
        billing_date TEXT,
        payment_received_date TEXT,
        
        outsource_payment_status TEXT DEFAULT '지급 대기',
        outsource_payment_date TEXT,
        
        settlement_status TEXT DEFAULT '정산 대기',
        settlement_date TEXT,
        settlement_period TEXT,
        
        -- 메모 (핵심!)
        billing_notes TEXT,
        payment_notes TEXT,
        payment_diff_notes TEXT,
        customer_notes TEXT,
        site_notes TEXT,
        
        -- 생성/수정 일시
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        
        FOREIGN KEY (construction_record_id) REFERENCES construction_records(id)
      )
    `);

    // 8. 회사별 정산 설정 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS client_settlement_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_company TEXT NOT NULL UNIQUE,
        
        -- 정산 주기 유형
        settlement_type TEXT NOT NULL,
        
        -- 월말 정산 설정
        monthly_settlement_day INTEGER,
        
        -- 격월 정산 설정
        first_period_start INTEGER,
        first_period_end INTEGER,
        first_settlement_day INTEGER,
        second_period_start INTEGER,
        second_period_end INTEGER,
        second_settlement_day INTEGER,
        
        -- 커스텀 정산 설정
        custom_settlement_days TEXT,
        
        is_active BOOLEAN DEFAULT 1,
        
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // 9. 외주팀 비율 설정 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS outsource_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_name TEXT NOT NULL,
        client_company TEXT,
        
        -- 지급 비율
        payment_rate REAL NOT NULL DEFAULT 0.85,
        
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        
        UNIQUE(team_name, client_company)
      )
    `);

    // 10. 월별 정산 요약 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS settlement_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        
        settlement_year INTEGER NOT NULL,
        settlement_month INTEGER NOT NULL,
        client_company TEXT,
        settlement_period TEXT,
        
        -- 청구 합계
        total_billing_count INTEGER DEFAULT 0,
        total_billing_amount INTEGER DEFAULT 0,
        
        -- 지급 합계
        total_payment_count INTEGER DEFAULT 0,
        total_payment_amount INTEGER DEFAULT 0,
        
        -- 수익 합계
        total_profit_amount INTEGER DEFAULT 0,
        profit_rate REAL DEFAULT 0,
        
        -- 정산 상태
        settlement_status TEXT DEFAULT '진행 중',
        settlement_date TEXT,
        
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        
        UNIQUE(settlement_year, settlement_month, client_company, settlement_period)
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
      { name: 'LX', type: 'monthly_end', color: '#8B1538' },        // 붉은 자주색
      { name: '케스코', type: 'bimonthly', color: '#8B4513' },      // 갈색
      { name: '청암', type: 'bimonthly_custom', color: '#1E3A8A' }, // 군청색
      { name: '한샘', type: 'monthly_end', color: '#16A34A' },      // 녹색
      { name: '홈CC', type: 'monthly_end', color: '#F97316' },      // 주황색
      { name: '해모아', type: 'monthly_end', color: '#6B7280' }     // 회색
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

    // 회사별 정산 설정 초기 데이터
    const settlementConfigs = [
      {
        company: 'LX',
        type: 'monthly',
        monthly_day: 30,
        data: [30, null, null, null, null, null, null, null]
      },
      {
        company: '홈CC',
        type: 'monthly',
        monthly_day: 30,
        data: [30, null, null, null, null, null, null, null]
      },
      {
        company: '한샘',
        type: 'monthly',
        monthly_day: 30,
        data: [30, null, null, null, null, null, null, null]
      },
      {
        company: '케스코',
        type: 'biweekly',
        monthly_day: null,
        data: [null, 1, 15, 30, 16, 30, 15, null]
      },
      {
        company: '청암',
        type: 'custom',
        monthly_day: null,
        data: [null, null, null, null, null, null, null, '[11, 21]']
      }
    ];

    const insertSettlementConfig = db.prepare(`
      INSERT OR IGNORE INTO client_settlement_config (
        client_company, settlement_type, monthly_settlement_day,
        first_period_start, first_period_end, first_settlement_day,
        second_period_start, second_period_end, second_settlement_day,
        custom_settlement_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const config of settlementConfigs) {
      insertSettlementConfig.run(
        config.company,
        config.type,
        config.data[0],
        config.data[1],
        config.data[2],
        config.data[3],
        config.data[4],
        config.data[5],
        config.data[6],
        config.data[7]
      );
    }

    // 외주팀 비율 초기 데이터
    const outsourceRates = [
      { team: '손팀', company: null, rate: 0.85 },
      { team: '백팀', company: null, rate: 0.85 },
      { team: '직영', company: null, rate: 1.0 },
      { team: '기타', company: null, rate: 0.85 }
    ];

    const insertOutsourceRate = db.prepare(`
      INSERT OR IGNORE INTO outsource_rates (team_name, client_company, payment_rate)
      VALUES (?, ?, ?)
    `);

    for (const rate of outsourceRates) {
      insertOutsourceRate.run(rate.team, rate.company, rate.rate);
    }

    console.log('✅ Initial data inserted successfully!');
  } catch (error) {
    console.error('❌ Error inserting initial data:', error);
    throw error;
  }
}

export default db;
