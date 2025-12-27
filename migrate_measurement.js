import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'server', 'construction.db'));

console.log('🔄 실측 관리 시스템 DB 마이그레이션 시작...');

try {
  // 1. measurement_requests 테이블 생성
  console.log('\n📋 실측 요청 테이블 생성...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS measurement_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_company TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      site_address TEXT NOT NULL,
      address_detail TEXT,
      request_date DATE NOT NULL,
      scheduled_measurement_date DATE,
      actual_measurement_date DATE,
      measurement_time TEXT,
      assigned_manager TEXT,
      measurement_assignee TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      desired_construction_date DATE,
      confirmed_construction_date DATE,
      notes TEXT,
      measurement_photo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ measurement_requests 테이블 생성 완료');

  // 2. 인덱스 생성 (성능 최적화)
  console.log('\n🔍 인덱스 생성...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_mr_status ON measurement_requests(status)',
    'CREATE INDEX IF NOT EXISTS idx_mr_manager ON measurement_requests(assigned_manager)',
    'CREATE INDEX IF NOT EXISTS idx_mr_request_date ON measurement_requests(request_date)',
    'CREATE INDEX IF NOT EXISTS idx_mr_measurement_date ON measurement_requests(scheduled_measurement_date)',
    'CREATE INDEX IF NOT EXISTS idx_mr_construction_date ON measurement_requests(confirmed_construction_date)',
    'CREATE INDEX IF NOT EXISTS idx_mr_priority ON measurement_requests(priority)'
  ];

  for (const sql of indexes) {
    db.exec(sql);
    const indexName = sql.match(/idx_\w+/)[0];
    console.log('✅', indexName, '인덱스 생성 완료');
  }

  // 3. 테스트 데이터 확인
  const count = db.prepare('SELECT COUNT(*) as count FROM measurement_requests').get();
  console.log(`\n📊 현재 실측 요청 건수: ${count.count}건`);

  console.log('\n🎉 실측 관리 시스템 마이그레이션 완료!');
  console.log('\n📋 생성된 테이블:');
  console.log('  ✅ measurement_requests - 실측 요청 관리');
  console.log('\n💡 다음 단계: npm run dev 로 서버 재시작');

} catch (error) {
  console.error('❌ 마이그레이션 실패:', error);
  process.exit(1);
}

db.close();
