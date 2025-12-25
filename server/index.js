import express from 'express';
import cors from 'cors';
import db, { initDatabase } from './database.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

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
        construction_date, client_company, customer_name, special_notes,
        is_resident, site_address, building_unit, team, settlement_status,
        standard_cost, protection_cost, demolition_qty, demolition_cost,
        equipment_desc, equipment_cost, measurement_cost,
        outsource_total_cost, actual_settlement, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      data.construction_date,
      data.client_company,
      data.customer_name,
      data.special_notes,
      data.is_resident,
      data.site_address,
      data.building_unit,
      data.team,
      data.settlement_status || '',
      data.standard_cost || 0,
      data.protection_cost || 0,
      data.demolition_qty || 0,
      data.demolition_cost || 0,
      data.equipment_desc,
      data.equipment_cost || 0,
      data.measurement_cost || 0,
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
    res.status(500).json({ error: error.message });
  }
});

// 시공내역 수정
app.put('/api/records/:id', (req, res) => {
  try {
    const data = req.body;
    
    const update = db.prepare(`
      UPDATE construction_records SET
        construction_date = ?, client_company = ?, customer_name = ?,
        special_notes = ?, is_resident = ?, site_address = ?,
        building_unit = ?, team = ?, settlement_status = ?,
        standard_cost = ?, protection_cost = ?, demolition_qty = ?,
        demolition_cost = ?, equipment_desc = ?, equipment_cost = ?,
        measurement_cost = ?, outsource_total_cost = ?, actual_settlement = ?,
        remarks = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    update.run(
      data.construction_date,
      data.client_company,
      data.customer_name,
      data.special_notes,
      data.is_resident,
      data.site_address,
      data.building_unit,
      data.team,
      data.settlement_status,
      data.standard_cost || 0,
      data.protection_cost || 0,
      data.demolition_qty || 0,
      data.demolition_cost || 0,
      data.equipment_desc,
      data.equipment_cost || 0,
      data.measurement_cost || 0,
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
      SELECT r.*, 
        GROUP_CONCAT(a.work_type, ', ') as additional_work_types
      FROM construction_records r
      LEFT JOIN additional_works a ON r.id = a.record_id AND a.is_required = 1
      WHERE r.construction_date >= ? AND r.construction_date <= ?
      GROUP BY r.id
      ORDER BY r.construction_date
    `).all(startDate, endDate);

    res.json(records);
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 API: http://0.0.0.0:${PORT}/api`);
  console.log(`💚 Health: http://0.0.0.0:${PORT}/health\n`);
});
