import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'server', 'construction.db'));

console.log('🔄 사용자 관리 시스템 마이그레이션 시작...');

try {
  // 1. users 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      display_name TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  console.log('✅ users 테이블 생성 완료');

  // 2. 기존 사용자 확인
  const existingUsers = db.prepare('SELECT username FROM users').all();
  const existingUsernames = existingUsers.map(u => u.username);

  // 3. 초기 사용자 데이터 (비밀번호는 bcrypt로 해시화)
  const users = [
    {
      username: 'admin',
      password: 'admin1234',
      role: 'admin',
      display_name: '관리자'
    },
    {
      username: 'lee_sangmu',
      password: 'lee1234',
      role: 'manager',
      display_name: '이상무'
    },
    {
      username: 'jung_hogyu',
      password: 'jung1234',
      role: 'manager',
      display_name: '정호규'
    },
    {
      username: 'kim_namgun',
      password: 'kim1234',
      role: 'manager',
      display_name: '김남군'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, display_name)
    VALUES (?, ?, ?, ?)
  `);

  for (const user of users) {
    if (existingUsernames.includes(user.username)) {
      console.log(`⏭️  ${user.display_name} (${user.username}) - 이미 존재함`);
      continue;
    }

    // 비밀번호 해시화
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    
    insertUser.run(user.username, hashedPassword, user.role, user.display_name);
    console.log(`✅ ${user.display_name} (${user.username}) - 계정 생성 완료`);
  }

  // 4. measurement_requests 테이블에 실측 완료 필드 추가
  try {
    db.exec(`
      ALTER TABLE measurement_requests 
      ADD COLUMN measurement_completed BOOLEAN DEFAULT 0
    `);
    console.log('✅ measurement_requests 테이블에 measurement_completed 필드 추가');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⏭️  measurement_completed 필드가 이미 존재함');
    } else {
      throw error;
    }
  }

  try {
    db.exec(`
      ALTER TABLE measurement_requests 
      ADD COLUMN measurement_completed_at TEXT
    `);
    console.log('✅ measurement_requests 테이블에 measurement_completed_at 필드 추가');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⏭️  measurement_completed_at 필드가 이미 존재함');
    } else {
      throw error;
    }
  }

  try {
    db.exec(`
      ALTER TABLE measurement_requests 
      ADD COLUMN measurement_completed_by TEXT
    `);
    console.log('✅ measurement_requests 테이블에 measurement_completed_by 필드 추가');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⏭️  measurement_completed_by 필드가 이미 존재함');
    } else {
      throw error;
    }
  }

  // 5. 생성된 사용자 목록 출력
  console.log('\n📋 현재 등록된 사용자 목록:');
  const allUsers = db.prepare('SELECT username, role, display_name FROM users ORDER BY id').all();
  allUsers.forEach(user => {
    const roleIcon = user.role === 'admin' ? '👑' : '👨‍💼';
    console.log(`${roleIcon} ${user.display_name} (${user.username}) - ${user.role}`);
  });

  console.log('\n✨ 마이그레이션 완료!');
  console.log('\n🔐 로그인 계정 정보:');
  console.log('┌─────────────┬──────────────┬──────────┐');
  console.log('│ 사용자명     │ 아이디        │ 비밀번호  │');
  console.log('├─────────────┼──────────────┼──────────┤');
  console.log('│ 관리자       │ admin        │ admin1234│');
  console.log('│ 이상무       │ lee_sangmu   │ lee1234  │');
  console.log('│ 정호규       │ jung_hogyu   │ jung1234 │');
  console.log('│ 김남군       │ kim_namgun   │ kim1234  │');
  console.log('└─────────────┴──────────────┴──────────┘');

} catch (error) {
  console.error('❌ 마이그레이션 실패:', error);
  process.exit(1);
}

db.close();
