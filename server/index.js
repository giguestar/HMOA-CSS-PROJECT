import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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
