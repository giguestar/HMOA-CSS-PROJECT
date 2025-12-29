const Database = require('better-sqlite3');
const db = new Database('./server/construction.db');

console.log('=== 사용자 목록 ===');
const users = db.prepare('SELECT username, password, role, display_name FROM users').all();
console.log(JSON.stringify(users, null, 2));

console.log('\n=== 테이블 목록 ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name).join(', '));

db.close();
