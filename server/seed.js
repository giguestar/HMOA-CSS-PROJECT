import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'construction.db'));

// 샘플 데이터 삽입
const sampleRecords = [
  {
    construction_date: '2025-12-23',
    client_company: 'LX',
    customer_name: '로얄대리점',
    is_resident: '거주',
    site_address: '울산 남구',
    building_unit: '옥동 서광 101동 1608호',
    team: '백X',
    standard_cost: 1401990,
    protection_cost: 50000,
    demolition_cost: 30000,
    equipment_cost: 0,
    measurement_cost: 65000,
    settlement_status: 'o',
    remarks: '난간대, 방범창 필요'
  },
  {
    construction_date: '2025-12-24',
    client_company: '케스코',
    customer_name: '4160',
    is_resident: '거주',
    site_address: '울주군 온양읍 원동2길 19-1',
    building_unit: '온양읍 회야리버아트 104동 1512호',
    team: '직영1',
    standard_cost: 619000,
    protection_cost: 30000,
    demolition_cost: 0,
    equipment_cost: 50000,
    measurement_cost: 0,
    settlement_status: '',
    remarks: ''
  },
  {
    construction_date: '2025-12-25',
    client_company: '청암',
    customer_name: '김민환',
    is_resident: '비거주',
    site_address: '울산 중구 성안동 함월6길 41-9',
    building_unit: '강산파란들 302호',
    team: '손팀',
    standard_cost: 1285150,
    protection_cost: 0,
    demolition_cost: 50000,
    equipment_cost: 30000,
    measurement_cost: 0,
    settlement_status: '',
    remarks: '몰딩, 타일 작업 필요'
  },
  {
    construction_date: '2025-12-26',
    client_company: '한샘',
    customer_name: '한샘/고웅',
    is_resident: '비거주',
    site_address: '대구 수성구',
    building_unit: '범물동 송정타운 102동 1206호',
    team: '백X',
    standard_cost: 1420467,
    protection_cost: 0,
    demolition_cost: 30000,
    equipment_cost: 70000,
    measurement_cost: 0,
    settlement_status: '',
    remarks: ''
  },
  {
    construction_date: '2025-12-27',
    client_company: 'LX',
    customer_name: '워커',
    is_resident: '비거주',
    site_address: '울산',
    building_unit: '남외푸르지오 209동 901호',
    team: '직영1',
    standard_cost: 1716772,
    protection_cost: 0,
    demolition_cost: 0,
    equipment_cost: 0,
    measurement_cost: 0,
    settlement_status: '',
    remarks: ''
  }
];

console.log('샘플 데이터 삽입 중...');

const insertStmt = db.prepare(`
  INSERT INTO construction_records (
    construction_date, client_company, customer_name, is_resident,
    site_address, building_unit, team, standard_cost, protection_cost,
    demolition_cost, equipment_cost, measurement_cost, settlement_status, remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let count = 0;
for (const record of sampleRecords) {
  try {
    insertStmt.run(
      record.construction_date,
      record.client_company,
      record.customer_name,
      record.is_resident,
      record.site_address,
      record.building_unit,
      record.team,
      record.standard_cost,
      record.protection_cost,
      record.demolition_cost,
      record.equipment_cost,
      record.measurement_cost,
      record.settlement_status,
      record.remarks
    );
    count++;
    console.log(`✓ ${record.customer_name} (${record.construction_date})`);
  } catch (error) {
    console.error(`✗ ${record.customer_name} 실패:`, error.message);
  }
}

console.log(`\n✅ ${count}개의 샘플 데이터가 추가되었습니다!`);
db.close();
