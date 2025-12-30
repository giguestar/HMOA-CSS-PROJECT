import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'no-origin'}`);
  next();
});

// Serve static files in production
if (isProduction) {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  console.log(`📂 Serving static files from: ${distPath}`);
}

// Initialize database
try {
  initDatabase();
} catch (err) {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
}

// ==================== API Routes ====================

// 0. 인증 관련 API
// 로그인
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요.' });
    }

    // 사용자 조회 (is_active 컬럼 제거)
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 확인 (평문 비교)
    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('❌ 로그인 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 현재 사용자 정보 조회
app.get('/api/auth/me', (req, res) => {
  try {
    const username = req.headers['x-username'];
    
    if (!username) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('❌ 사용자 정보 조회 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 1. 시공내역 관련 API
// 시공내역 전체 조회
app.get('/api/records', (req, res) => {
  try {
    const { startDate, endDate, clientCompany, team } = req.query;
    
    let query = 'SELECT * FROM construction_records WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND construction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND construction_date <= ?';
      params.push(endDate);
    }
    if (clientCompany) {
      query += ' AND client_company = ?';
      params.push(clientCompany);
    }
    if (team) {
      query += ' AND team = ?';
      params.push(team);
    }

    query += ' ORDER BY construction_date DESC';

    const records = db.prepare(query).all(...params);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 시공내역 단건 조회
app.get('/api/records/:id', (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM construction_records WHERE id = ?').get(req.params.id);
    
    if (!record) {
      return res.status(404).json({ error: '시공내역을 찾을 수 없습니다.' });
    }

    // 부가작업도 함께 조회
    const additionalWorks = db.prepare('SELECT * FROM additional_works WHERE record_id = ?').all(req.params.id);
    
    res.json({ ...record, additionalWorks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 시공내역 생성
app.post('/api/records', (req, res) => {
  try {
    const data = req.body;
    
    const insert = db.prepare(`
      INSERT INTO construction_records (
        construction_date, client_company, customer_name, customer_phone, special_notes,
        is_resident, site_address, address_detail, building_unit, frame_count, team, settlement_status,
        standard_cost, protection_cost, demolition_qty, demolition_cost,
        equipment_desc, equipment_cost, equipment_provider, demolition_team, measurement_cost,
        has_railing, has_security_window, has_roll_screen, has_louver,
        has_molding, has_tile, has_molding_tile, needs_fabrication,
        outsource_total_cost, actual_settlement, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      data.construction_date,
      data.client_company,
      data.customer_name,
      data.customer_phone,
      data.special_notes,
      data.is_resident,
      data.site_address,
      data.address_detail,
      data.building_unit,
      data.frame_count || 0,
      data.team,
      data.settlement_status || '',
      data.standard_cost || 0,
      data.protection_cost || 0,
      data.demolition_qty || 0,
      data.demolition_cost || 0,
      data.equipment_desc,
      data.equipment_cost || 0,
      data.equipment_provider || '직영',
      data.demolition_team || '시공팀',
      data.measurement_cost || 0,
      data.has_railing ? 1 : 0,
      data.has_security_window ? 1 : 0,
      data.has_roll_screen ? 1 : 0,
      data.has_louver ? 1 : 0,
      data.has_molding ? 1 : 0,
      data.has_tile ? 1 : 0,
      data.has_molding_tile ? 1 : 0,
      data.needs_fabrication ? 1 : 0,
      data.outsource_total_cost || 0,
      data.actual_settlement || 0,
      data.remarks
    );

    // 부가작업 저장
    if (data.additionalWorks && data.additionalWorks.length > 0) {
      const insertWork = db.prepare(`
        INSERT INTO additional_works (record_id, work_type, is_required, cost, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      data.additionalWorks.forEach(work => {
        insertWork.run(result.lastInsertRowid, work.work_type, work.is_required ? 1 : 0, work.cost || 0, work.notes);
      });
    }

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('❌ 시공내역 등록 에러:', error);
    console.error('❌ 받은 데이터:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ error: error.message });
  }
});

// 시공내역 수정
app.put('/api/records/:id', (req, res) => {
  try {
    const data = req.body;
    
    const update = db.prepare(`
      UPDATE construction_records SET
        construction_date = ?, client_company = ?, customer_name = ?, customer_phone = ?,
        special_notes = ?, is_resident = ?, site_address = ?, address_detail = ?,
        building_unit = ?, frame_count = ?, team = ?, settlement_status = ?,
        standard_cost = ?, protection_cost = ?, demolition_qty = ?,
        demolition_cost = ?, equipment_desc = ?, equipment_cost = ?,
        equipment_provider = ?, demolition_team = ?, measurement_cost = ?,
        has_railing = ?, has_security_window = ?, has_roll_screen = ?, has_louver = ?,
        has_molding = ?, has_tile = ?, has_molding_tile = ?, needs_fabrication = ?,
        outsource_total_cost = ?, actual_settlement = ?,
        remarks = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    update.run(
      data.construction_date,
      data.client_company,
      data.customer_name,
      data.customer_phone,
      data.special_notes,
      data.is_resident,
      data.site_address,
      data.address_detail,
      data.building_unit,
      data.frame_count || 0,
      data.team,
      data.settlement_status,
      data.standard_cost || 0,
      data.protection_cost || 0,
      data.demolition_qty || 0,
      data.demolition_cost || 0,
      data.equipment_desc,
      data.equipment_cost || 0,
      data.equipment_provider || '직영',
      data.demolition_team || '시공팀',
      data.measurement_cost || 0,
      data.has_railing ? 1 : 0,
      data.has_security_window ? 1 : 0,
      data.has_roll_screen ? 1 : 0,
      data.has_louver ? 1 : 0,
      data.has_molding ? 1 : 0,
      data.has_tile ? 1 : 0,
      data.has_molding_tile ? 1 : 0,
      data.needs_fabrication ? 1 : 0,
      data.outsource_total_cost || 0,
      data.actual_settlement || 0,
      data.remarks,
      req.params.id
    );

    // 부가작업 업데이트 (기존 삭제 후 재생성)
    db.prepare('DELETE FROM additional_works WHERE record_id = ?').run(req.params.id);
    
    if (data.additionalWorks && data.additionalWorks.length > 0) {
      const insertWork = db.prepare(`
        INSERT INTO additional_works (record_id, work_type, is_required, cost, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      data.additionalWorks.forEach(work => {
        insertWork.run(req.params.id, work.work_type, work.is_required ? 1 : 0, work.cost || 0, work.notes);
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 시공내역 삭제
app.delete('/api/records/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM construction_records WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. 스케줄 관련 API
// 월별 스케줄 조회
app.get('/api/schedule/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const records = db.prepare(`
      SELECT r.*
      FROM construction_records r
      WHERE r.construction_date >= ? AND r.construction_date <= ?
      ORDER BY r.construction_date
    `).all(startDate, endDate);

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 달력 노트 API (휴가자, 일당, 쉬는 팀)
// 월별 노트 조회
app.get('/api/calendar-notes/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const notes = db.prepare(`
      SELECT * FROM calendar_notes
      WHERE note_date >= ? AND note_date <= ?
      ORDER BY note_date
    `).all(startDate, endDate);

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 특정 날짜 노트 조회
app.get('/api/calendar-notes/date/:date', (req, res) => {
  try {
    const { date } = req.params;
    const note = db.prepare(`
      SELECT * FROM calendar_notes WHERE note_date = ?
    `).get(date);

    res.json(note || { note_date: date, vacation_members: '', daily_workers: '', off_teams: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 노트 저장/수정
app.post('/api/calendar-notes', (req, res) => {
  try {
    const { note_date, vacation_members, daily_workers, off_teams } = req.body;

    // 기존 노트 확인
    const existing = db.prepare('SELECT id FROM calendar_notes WHERE note_date = ?').get(note_date);

    if (existing) {
      // 업데이트
      db.prepare(`
        UPDATE calendar_notes 
        SET vacation_members = ?, daily_workers = ?, off_teams = ?
        WHERE note_date = ?
      `).run(vacation_members, daily_workers, off_teams, note_date);
    } else {
      // 신규 삽입
      db.prepare(`
        INSERT INTO calendar_notes (note_date, vacation_members, daily_workers, off_teams)
        VALUES (?, ?, ?, ?)
      `).run(note_date, vacation_members, daily_workers, off_teams);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. 정산 관련 API
// 업체별 정산 금액 계산
app.get('/api/settlements/calculate', (req, res) => {
  try {
    const { clientCompany, startDate, endDate } = req.query;

    if (!clientCompany || !startDate || !endDate) {
      return res.status(400).json({ error: '업체명과 기간을 지정해주세요.' });
    }

    const records = db.prepare(`
      SELECT 
        SUM(standard_cost + protection_cost + demolition_cost + equipment_cost + measurement_cost) as total_billing,
        SUM(outsource_total_cost) as total_payment,
        COUNT(*) as record_count
      FROM construction_records
      WHERE client_company = ?
        AND construction_date >= ?
        AND construction_date <= ?
    `).get(clientCompany, startDate, endDate);

    res.json({
      clientCompany,
      period: { start: startDate, end: endDate },
      totalBilling: records.total_billing || 0,
      totalPayment: records.total_payment || 0,
      profitMargin: (records.total_billing || 0) - (records.total_payment || 0),
      recordCount: records.record_count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. 설정 관련 API
// 업체 목록 조회
app.get('/api/settings/companies', (req, res) => {
  try {
    const companies = db.prepare('SELECT * FROM company_settings WHERE is_active = 1').all();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 시공팀 목록 조회
app.get('/api/settings/teams', (req, res) => {
  try {
    const teams = db.prepare('SELECT * FROM team_settings WHERE is_active = 1').all();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. 대시보드 통계 API
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const stats = {
      thisMonth: db.prepare(`
        SELECT COUNT(*) as count, 
               SUM(standard_cost + protection_cost + demolition_cost + equipment_cost) as revenue
        FROM construction_records
        WHERE strftime('%Y-%m', construction_date) = ?
      `).get(currentMonth),
      
      pending: db.prepare(`
        SELECT COUNT(*) as count
        FROM construction_records
        WHERE settlement_status = '' OR settlement_status IS NULL
      `).get(),
      
      byCompany: db.prepare(`
        SELECT client_company, COUNT(*) as count
        FROM construction_records
        WHERE strftime('%Y-%m', construction_date) = ?
        GROUP BY client_company
      `).all(currentMonth)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. 실측 관리 API
// 실측 요청 전체 조회
app.get('/api/measurements', (req, res) => {
  try {
    const { status, manager, priority, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM measurement_requests WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (manager) {
      query += ' AND assigned_manager = ?';
      params.push(manager);
    }
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    if (startDate) {
      query += ' AND request_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND request_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY request_date DESC, priority DESC';

    const measurements = db.prepare(query).all(...params);
    res.json(measurements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 실측 요청 단건 조회
app.get('/api/measurements/:id', (req, res) => {
  try {
    const measurement = db.prepare('SELECT * FROM measurement_requests WHERE id = ?').get(req.params.id);
    
    if (!measurement) {
      return res.status(404).json({ error: '실측 요청을 찾을 수 없습니다.' });
    }

    res.json(measurement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 실측 요청 생성
app.post('/api/measurements', (req, res) => {
  try {
    const data = req.body;
    
    const insert = db.prepare(`
      INSERT INTO measurement_requests (
        client_company, customer_name, customer_phone, site_address, address_detail,
        request_date, scheduled_measurement_date, scheduled_measurement_time, assigned_manager,
        priority, status, desired_construction_date, confirmed_construction_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      data.client_company,
      data.customer_name,
      data.customer_phone || '',
      data.site_address,
      data.address_detail || '',
      data.request_date,
      data.scheduled_measurement_date || null,
      data.scheduled_measurement_time || '',
      data.assigned_manager || '',
      data.priority || 'normal',
      data.status || 'pending',
      data.desired_construction_date || null,
      data.confirmed_construction_date || null,
      data.notes || ''
    );

    const measurementId = result.lastInsertRowid;

    // 시공일이 확정된 경우 자동으로 시공 스케줄에 추가
    if (data.confirmed_construction_date) {
      // 이미 시공 등록이 있는지 확인
      const existingRecord = db.prepare(
        'SELECT id FROM construction_records WHERE customer_name = ? AND construction_date = ?'
      ).get(data.customer_name, data.confirmed_construction_date);

      if (!existingRecord) {
        // 시공 스케줄에 자동 추가 (기본 정보만)
        const insertConstruction = db.prepare(`
          INSERT INTO construction_records (
            construction_date, client_company, customer_name, customer_phone,
            site_address, address_detail, special_notes, settlement_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertConstruction.run(
          data.confirmed_construction_date,
          data.client_company,
          data.customer_name,
          data.customer_phone || '',
          data.site_address,
          data.address_detail || '',
          `실측에서 자동 등록 (실측ID: ${measurementId})`,
          '시공 예정'
        );

        console.log(`✅ 시공일 ${data.confirmed_construction_date} 자동 등록 완료 (고객: ${data.customer_name})`);
      } else {
        console.log(`ℹ️ 시공일 ${data.confirmed_construction_date} 이미 등록됨 (고객: ${data.customer_name})`);
      }
    }

    res.json({ success: true, id: measurementId });
  } catch (error) {
    console.error('❌ 실측 요청 등록 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 실측 요청 수정
app.put('/api/measurements/:id', (req, res) => {
  try {
    const data = req.body;
    
    const update = db.prepare(`
      UPDATE measurement_requests SET
        client_company = ?, customer_name = ?, customer_phone = ?,
        site_address = ?, address_detail = ?, request_date = ?,
        scheduled_measurement_date = ?, actual_measurement_date = ?,
        scheduled_measurement_time = ?, assigned_manager = ?,
        priority = ?, status = ?, desired_construction_date = ?,
        confirmed_construction_date = ?, notes = ?, measurement_photo_url = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    update.run(
      data.client_company,
      data.customer_name,
      data.customer_phone || '',
      data.site_address,
      data.address_detail || '',
      data.request_date,
      data.scheduled_measurement_date || null,
      data.actual_measurement_date || null,
      data.scheduled_measurement_time || '',
      data.assigned_manager || '',
      data.priority || 'normal',
      data.status || 'pending',
      data.desired_construction_date || null,
      data.confirmed_construction_date || null,
      data.notes || '',
      data.measurement_photo_url || '',
      req.params.id
    );

    // 시공일이 확정된 경우 자동으로 시공 스케줄에 추가
    if (data.confirmed_construction_date) {
      // 이미 시공 등록이 있는지 확인
      const existingRecord = db.prepare(
        'SELECT id FROM construction_records WHERE customer_name = ? AND construction_date = ?'
      ).get(data.customer_name, data.confirmed_construction_date);

      if (!existingRecord) {
        // 시공 스케줄에 자동 추가 (기본 정보만)
        const insertConstruction = db.prepare(`
          INSERT INTO construction_records (
            construction_date, client_company, customer_name, customer_phone,
            site_address, address_detail, special_notes, settlement_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertConstruction.run(
          data.confirmed_construction_date,
          data.client_company,
          data.customer_name,
          data.customer_phone || '',
          data.site_address,
          data.address_detail || '',
          `실측에서 자동 등록 (실측ID: ${req.params.id})`,
          '시공 예정'
        );

        console.log(`✅ 시공일 ${data.confirmed_construction_date} 자동 등록 완료 (고객: ${data.customer_name})`);
      } else {
        console.log(`ℹ️ 시공일 ${data.confirmed_construction_date} 이미 등록됨 (고객: ${data.customer_name})`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ 실측 요청 수정 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 실측 요청 삭제
app.delete('/api/measurements/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM measurement_requests WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 실측 완료 처리 (매니저 본인만 가능)
app.put('/api/measurements/:id/complete', (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 실측 정보 조회
    const measurement = db.prepare('SELECT * FROM measurement_requests WHERE id = ?').get(req.params.id);
    
    if (!measurement) {
      return res.status(404).json({ error: '실측 요청을 찾을 수 없습니다.' });
    }

    // 사용자 정보 조회
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 관리자는 모든 실측 완료 가능, 매니저는 본인 담당만 가능
    if (user.role !== 'admin' && measurement.assigned_manager !== user.display_name) {
      return res.status(403).json({ 
        error: '본인이 담당한 실측만 완료 처리할 수 있습니다.',
        assigned: measurement.assigned_manager,
        current: user.display_name
      });
    }

    // 실측 완료 처리
    const update = db.prepare(`
      UPDATE measurement_requests SET
        measurement_completed = 1,
        measurement_completed_at = datetime('now', 'localtime'),
        measurement_completed_by = ?,
        status = 'measured',
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    update.run(user.display_name, req.params.id);

    res.json({ 
      success: true,
      message: '실측 완료 처리되었습니다.',
      completed_by: user.display_name
    });
  } catch (error) {
    console.error('❌ 실측 완료 처리 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 실측 완료 취소
app.put('/api/measurements/:id/uncomplete', (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 실측 정보 조회
    const measurement = db.prepare('SELECT * FROM measurement_requests WHERE id = ?').get(req.params.id);
    
    if (!measurement) {
      return res.status(404).json({ error: '실측 요청을 찾을 수 없습니다.' });
    }

    // 사용자 정보 조회
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 관리자는 모든 실측 완료 취소 가능, 매니저는 본인 담당만 가능
    if (user.role !== 'admin' && measurement.assigned_manager !== user.display_name) {
      return res.status(403).json({ 
        error: '본인이 담당한 실측만 완료 취소할 수 있습니다.'
      });
    }

    // 실측 완료 취소
    const update = db.prepare(`
      UPDATE measurement_requests SET
        measurement_completed = 0,
        measurement_completed_at = NULL,
        measurement_completed_by = NULL,
        status = 'pending',
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    update.run(req.params.id);

    res.json({ 
      success: true,
      message: '실측 완료가 취소되었습니다.'
    });
  } catch (error) {
    console.error('❌ 실측 완료 취소 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 실측 상태 변경 (매니저 본인 담당 건만 가능)
app.put('/api/measurements/:id/status', (req, res) => {
  try {
    const { username, status } = req.body;
    
    if (!username) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    if (!status) {
      return res.status(400).json({ error: '상태 값이 필요합니다.' });
    }

    // 실측 정보 조회
    const measurement = db.prepare('SELECT * FROM measurement_requests WHERE id = ?').get(req.params.id);
    
    if (!measurement) {
      return res.status(404).json({ error: '실측 요청을 찾을 수 없습니다.' });
    }

    // 사용자 정보 조회
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 관리자는 모든 실측 상태 변경 가능, 매니저는 본인 담당만 가능
    if (user.role !== 'admin' && measurement.assigned_manager !== user.display_name) {
      return res.status(403).json({ 
        error: '본인이 담당한 실측만 상태 변경할 수 있습니다.',
        assigned: measurement.assigned_manager,
        current: user.display_name
      });
    }

    // 실측 상태 변경
    const update = db.prepare(`
      UPDATE measurement_requests SET
        status = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    update.run(status, req.params.id);

    // 상태가 'measured'로 변경되면 실측 완료 처리도 함께
    if (status === 'measured') {
      const updateComplete = db.prepare(`
        UPDATE measurement_requests SET
          measurement_completed = 1,
          measurement_completed_at = datetime('now', 'localtime'),
          measurement_completed_by = ?
        WHERE id = ?
      `);
      updateComplete.run(user.display_name, req.params.id);
    }

    res.json({ 
      success: true,
      message: '상태가 변경되었습니다.',
      status: status
    });
  } catch (error) {
    console.error('❌ 실측 상태 변경 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 월별 실측 스케줄 조회
app.get('/api/measurements/schedule/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const measurements = db.prepare(`
      SELECT *
      FROM measurement_requests
      WHERE (scheduled_measurement_date >= ? AND scheduled_measurement_date <= ?)
         OR (actual_measurement_date >= ? AND actual_measurement_date <= ?)
         OR (request_date >= ? AND request_date <= ?)
      ORDER BY scheduled_measurement_date, request_date
    `).all(startDate, endDate, startDate, endDate, startDate, endDate);

    res.json(measurements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 정산 관리 API ====================

// 정산 목록 조회
app.get('/api/settlements', (req, res) => {
  try {
    const { year, month, client_company, status, period } = req.query;
    
    let query = 'SELECT * FROM settlements WHERE 1=1';
    const params = [];
    
    if (year && month) {
      query += ` AND strftime('%Y', construction_date) = ? AND strftime('%m', construction_date) = ?`;
      params.push(year, month.padStart(2, '0'));
    }
    
    if (client_company) {
      query += ` AND client_company = ?`;
      params.push(client_company);
    }
    
    if (status) {
      query += ` AND settlement_status = ?`;
      params.push(status);
    }
    
    if (period) {
      query += ` AND settlement_period = ?`;
      params.push(period);
    }
    
    query += ` ORDER BY construction_date DESC, created_at DESC`;
    
    const settlements = db.prepare(query).all(...params);
    res.json(settlements);
  } catch (error) {
    console.error('❌ 정산 목록 조회 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 업체별 인임결재 집계 조회
app.get('/api/settlements/vendor-stats', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM settlements WHERE 1=1';
    const params = [];
    
    if (startDate) {
      query += ` AND construction_date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND construction_date <= ?`;
      params.push(endDate);
    }
    
    query += ` ORDER BY construction_date DESC`;
    
    const settlements = db.prepare(query).all(...params);
    
    // 업체별 집계
    const vendorStats = {};
    
    settlements.forEach(settlement => {
      try {
        const customOrders = JSON.parse(settlement.custom_order_items || '[]');
        
        customOrders.forEach(order => {
          if (order.vendor && order.amount && Number(order.amount) > 0) {
            const vendor = order.vendor.trim();
            
            if (!vendorStats[vendor]) {
              vendorStats[vendor] = {
                vendor: vendor,
                count: 0,
                totalAmount: 0,
                items: []
              };
            }
            
            vendorStats[vendor].count += 1;
            vendorStats[vendor].totalAmount += Number(order.amount);
            vendorStats[vendor].items.push({
              settlementId: settlement.id,
              construction_date: settlement.construction_date,
              client_company: settlement.client_company,
              customer_name: settlement.customer_name,
              site_address: settlement.site_address,
              item_name: order.name,
              amount: Number(order.amount)
            });
          }
        });
      } catch (err) {
        console.error('JSON 파싱 에러:', err);
      }
    });
    
    // 배열로 변환하고 총액 기준으로 정렬
    const vendorList = Object.values(vendorStats)
      .sort((a, b) => b.totalAmount - a.totalAmount);
    
    res.json({
      vendors: vendorList,
      summary: {
        totalVendors: vendorList.length,
        totalAmount: vendorList.reduce((sum, v) => sum + v.totalAmount, 0),
        totalCount: vendorList.reduce((sum, v) => sum + v.count, 0)
      }
    });
  } catch (error) {
    console.error('❌ 업체별 집계 조회 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정산 상세 조회
app.get('/api/settlements/:id', (req, res) => {
  try {
    const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
    
    if (!settlement) {
      return res.status(404).json({ error: '정산 정보를 찾을 수 없습니다.' });
    }
    
    res.json(settlement);
  } catch (error) {
    console.error('❌ 정산 상세 조회 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정산 생성
app.post('/api/settlements', (req, res) => {
  try {
    const data = req.body;
    
    const insert = db.prepare(`
      INSERT INTO settlements (
        construction_record_id, construction_date, client_company,
        customer_name, site_address, address_detail, team,
        billing_standard_cost, billing_frame_count, billing_protection_cost,
        billing_demolition_qty, billing_demolition_unit_price, billing_demolition_cost,
        billing_equipment_desc, billing_equipment_cost, billing_molding_cost,
        billing_tile_cost, billing_other_cost, billing_measurement_cost,
        billing_total_amount, billing_additional_items,
        payment_standard_cost, payment_protection_cost,
        payment_demolition_qty, payment_demolition_unit_price, payment_demolition_cost,
        payment_equipment_cost, payment_molding_cost, payment_tile_cost,
        payment_other_cost, payment_measurement_cost, payment_total_amount,
        payment_additional_items,
        profit_amount, profit_rate,
        custom_order_company, custom_order_desc, custom_order_amount, custom_order_items,
        customer_direct_items,
        customer_extra_charge_desc, customer_extra_charge_amount,
        is_cash_payment, cash_payment, cash_amount,
        settlement_period, settlement_date, settlement_status,
        billing_notes, payment_notes, payment_diff_notes,
        customer_notes, site_notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);
    
    const result = insert.run(
      data.construction_record_id || null,
      data.construction_date,
      data.client_company,
      data.customer_name || '',
      data.site_address || '',
      data.address_detail || '',
      data.team || '',
      data.billing_standard_cost || 0,
      data.billing_frame_count || 0,
      data.billing_protection_cost || 0,
      data.billing_demolition_qty || 0,
      data.billing_demolition_unit_price || 40000,
      data.billing_demolition_cost || 0,
      data.billing_equipment_desc || '',
      data.billing_equipment_cost || 0,
      data.billing_molding_cost || 0,
      data.billing_tile_cost || 0,
      data.billing_other_cost || 0,
      data.billing_measurement_cost || 0,
      data.billing_total_amount || 0,
      data.billing_additional_items || '[]',
      data.payment_standard_cost || 0,
      data.payment_protection_cost || 0,
      data.payment_demolition_qty || 0,
      data.payment_demolition_unit_price || 40000,
      data.payment_demolition_cost || 0,
      data.payment_equipment_cost || 0,
      data.payment_molding_cost || 0,
      data.payment_tile_cost || 0,
      data.payment_other_cost || 0,
      data.payment_measurement_cost || 0,
      data.payment_total_amount || 0,
      data.payment_additional_items || '[]',
      data.profit_amount || 0,
      data.profit_rate || 0,
      data.custom_order_company || '',
      data.custom_order_desc || '',
      data.custom_order_amount || 0,
      data.custom_order_items || '[]',
      data.customer_direct_items || '[]',
      data.customer_extra_charge_desc || '',
      data.customer_extra_charge_amount || 0,
      data.is_cash_payment || 0,
      data.cash_payment || 0,
      data.cash_amount || 0,
      data.settlement_period || '',
      data.settlement_date || null,
      data.settlement_status || '미정산',
      data.billing_notes || '',
      data.payment_notes || '',
      data.payment_diff_notes || '',
      data.customer_notes || '',
      data.site_notes || ''
    );
    
    console.log(`✅ 정산 생성: ID ${result.lastInsertRowid}`);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('❌ 정산 생성 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정산 수정
app.put('/api/settlements/:id', (req, res) => {
  try {
    const data = req.body;
    
    const update = db.prepare(`
      UPDATE settlements SET
        construction_date = ?, client_company = ?, customer_name = ?,
        site_address = ?, address_detail = ?, team = ?,
        billing_standard_cost = ?, billing_frame_count = ?,
        billing_protection_cost = ?, billing_demolition_qty = ?,
        billing_demolition_unit_price = ?, billing_demolition_cost = ?,
        billing_equipment_desc = ?, billing_equipment_cost = ?,
        billing_molding_cost = ?, billing_tile_cost = ?,
        billing_other_cost = ?, billing_measurement_cost = ?,
        billing_total_amount = ?, billing_additional_items = ?,
        payment_standard_cost = ?, payment_protection_cost = ?,
        payment_demolition_qty = ?, payment_demolition_unit_price = ?,
        payment_demolition_cost = ?, payment_equipment_cost = ?,
        payment_molding_cost = ?, payment_tile_cost = ?,
        payment_other_cost = ?, payment_measurement_cost = ?,
        payment_total_amount = ?, payment_additional_items = ?,
        profit_amount = ?, profit_rate = ?,
        custom_order_company = ?, custom_order_desc = ?,
        custom_order_amount = ?, custom_order_items = ?,
        customer_direct_items = ?,
        customer_extra_charge_desc = ?,
        customer_extra_charge_amount = ?,
        is_cash_payment = ?, cash_payment = ?,
        cash_amount = ?, settlement_period = ?, settlement_date = ?,
        settlement_status = ?,
        billing_notes = ?, payment_notes = ?, payment_diff_notes = ?,
        customer_notes = ?, site_notes = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);
    
    update.run(
      data.construction_date,
      data.client_company,
      data.customer_name || '',
      data.site_address || '',
      data.address_detail || '',
      data.team || '',
      data.billing_standard_cost || 0,
      data.billing_frame_count || 0,
      data.billing_protection_cost || 0,
      data.billing_demolition_qty || 0,
      data.billing_demolition_unit_price || 40000,
      data.billing_demolition_cost || 0,
      data.billing_equipment_desc || '',
      data.billing_equipment_cost || 0,
      data.billing_molding_cost || 0,
      data.billing_tile_cost || 0,
      data.billing_other_cost || 0,
      data.billing_measurement_cost || 0,
      data.billing_total_amount || 0,
      data.billing_additional_items || '[]',
      data.payment_standard_cost || 0,
      data.payment_protection_cost || 0,
      data.payment_demolition_qty || 0,
      data.payment_demolition_unit_price || 40000,
      data.payment_demolition_cost || 0,
      data.payment_equipment_cost || 0,
      data.payment_molding_cost || 0,
      data.payment_tile_cost || 0,
      data.payment_other_cost || 0,
      data.payment_measurement_cost || 0,
      data.payment_total_amount || 0,
      data.payment_additional_items || '[]',
      data.profit_amount || 0,
      data.profit_rate || 0,
      data.custom_order_company || '',
      data.custom_order_desc || '',
      data.custom_order_amount || 0,
      data.custom_order_items || '[]',
      data.customer_direct_items || '[]',
      data.customer_extra_charge_desc || '',
      data.customer_extra_charge_amount || 0,
      data.is_cash_payment || 0,
      data.cash_payment || 0,
      data.cash_amount || 0,
      data.settlement_period || '',
      data.settlement_date || null,
      data.settlement_status || '미정산',
      data.billing_notes || '',
      data.payment_notes || '',
      data.payment_diff_notes || '',
      data.customer_notes || '',
      data.site_notes || '',
      req.params.id
    );
    
    console.log(`✅ 정산 수정: ID ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 정산 수정 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정산 삭제
app.delete('/api/settlements/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM settlements WHERE id = ?').run(req.params.id);
    console.log(`✅ 정산 삭제: ID ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 정산 삭제 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 정산 상태 변경
app.put('/api/settlements/:id/status', (req, res) => {
  try {
    const { billing_status, outsource_payment_status, settlement_status } = req.body;
    const now = new Date().toISOString().split('T')[0];
    
    let query = 'UPDATE settlements SET ';
    const updates = [];
    const params = [];
    
    if (billing_status) {
      updates.push('billing_status = ?');
      params.push(billing_status);
      if (billing_status === '청구 완료') {
        updates.push('billing_date = ?');
        params.push(now);
      } else if (billing_status === '입금 완료') {
        updates.push('payment_received_date = ?');
        params.push(now);
      }
    }
    
    if (outsource_payment_status) {
      updates.push('outsource_payment_status = ?');
      params.push(outsource_payment_status);
      if (outsource_payment_status === '지급 완료') {
        updates.push('outsource_payment_date = ?');
        params.push(now);
      }
    }
    
    if (settlement_status) {
      updates.push('settlement_status = ?');
      params.push(settlement_status);
      if (settlement_status === '정산 완료') {
        updates.push('settlement_date = ?');
        params.push(now);
      }
    }
    
    updates.push("updated_at = datetime('now', 'localtime')");
    
    query += updates.join(', ');
    query += ' WHERE id = ?';
    params.push(req.params.id);
    
    db.prepare(query).run(...params);
    
    console.log(`✅ 정산 상태 변경: ID ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 정산 상태 변경 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 회사별 정산 설정 조회
app.get('/api/settlement-config', (req, res) => {
  try {
    const configs = db.prepare('SELECT * FROM client_settlement_config WHERE is_active = 1').all();
    res.json(configs);
  } catch (error) {
    console.error('❌ 정산 설정 조회 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// 외주팀 비율 조회
app.get('/api/outsource-rates', (req, res) => {
  try {
    const rates = db.prepare('SELECT * FROM outsource_rates WHERE is_active = 1').all();
    res.json(rates);
  } catch (error) {
    console.error('❌ 외주 비율 조회 에러:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 API: http://0.0.0.0:${PORT}/api`);
  console.log(`💚 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`🌍 Mode: ${isProduction ? 'Production' : 'Development'}\n`);
});
