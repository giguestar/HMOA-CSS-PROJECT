import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'server', 'construction.db'));

console.log('🔄 데이터베이스 마이그레이션 시작...');

try {
  // 새 컬럼 추가
  const columnsToAdd = [
    'ALTER TABLE construction_records ADD COLUMN equipment_provider TEXT DEFAULT "직영"',
    'ALTER TABLE construction_records ADD COLUMN demolition_team TEXT DEFAULT "시공팀"',
    'ALTER TABLE construction_records ADD COLUMN has_railing BOOLEAN DEFAULT 0',
    'ALTER TABLE construction_records ADD COLUMN has_security_window BOOLEAN DEFAULT 0',
    'ALTER TABLE construction_records ADD COLUMN has_roll_screen BOOLEAN DEFAULT 0',
    'ALTER TABLE construction_records ADD COLUMN has_louver BOOLEAN DEFAULT 0',
    'ALTER TABLE construction_records ADD COLUMN has_molding BOOLEAN DEFAULT 0',
    'ALTER TABLE construction_records ADD COLUMN has_tile BOOLEAN DEFAULT 0',
    'ALTER TABLE construction_records ADD COLUMN has_molding_tile BOOLEAN DEFAULT 0',
    'ALTER TABLE construction_records ADD COLUMN frame_count INTEGER DEFAULT 0',
    'ALTER TABLE construction_records ADD COLUMN needs_fabrication BOOLEAN DEFAULT 0',
    'ALTER TABLE construction_records ADD COLUMN customer_phone TEXT',
    'ALTER TABLE construction_records ADD COLUMN address_detail TEXT'
  ];

  for (const sql of columnsToAdd) {
    try {
      db.exec(sql);
      console.log('✅', sql.split('ADD COLUMN ')[1].split(' ')[0], '컬럼 추가 성공');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('⏭️ ', sql.split('ADD COLUMN ')[1].split(' ')[0], '컬럼 이미 존재');
      } else {
        throw err;
      }
    }
  }

  // 업체 색상 업데이트
  console.log('\n🎨 업체 색상 업데이트...');
  const colorUpdates = [
    { name: 'LX', color: '#8B1538' },
    { name: '케스코', color: '#8B4513' },
    { name: '청암', color: '#1E3A8A' },
    { name: '한샘', color: '#16A34A' },
    { name: '홈CC', color: '#F97316' },
    { name: '해모아', color: '#6B7280' }
  ];

  const updateColor = db.prepare('UPDATE company_settings SET color_code = ? WHERE company_name = ?');
  for (const { name, color } of colorUpdates) {
    updateColor.run(color, name);
    console.log('✅', name, '색상 업데이트:', color);
  }

  console.log('\n🎉 마이그레이션 완료!');
} catch (error) {
  console.error('❌ 마이그레이션 실패:', error);
  process.exit(1);
}

db.close();
