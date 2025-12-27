import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'server', 'construction.db'));

console.log('🔄 데이터베이스 마이그레이션 시작...');

try {
  // 실측 요청 테이블 생성
  console.log('\n📏 실측 요청 테이블 생성...');
  try {
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
    console.log('✅ measurement_requests 테이블 생성 완료');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('⏭️  measurement_requests 테이블 이미 존재');
    } else {
      throw err;
    }
  }

  console.log('\n🎉 마이그레이션 완료!');
} catch (error) {
  console.error('❌ 마이그레이션 실패:', error);
  process.exit(1);
}

db.close();
