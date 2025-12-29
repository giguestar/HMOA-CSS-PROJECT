const Database = require('better-sqlite3');
const db = new Database('./server/construction.db');

console.log('=== 데이터베이스 테이블 목록 ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name).join('\n'));

db.close();
