// 로컬 개발 환경에서는 localhost:5000 사용
// 프로덕션 환경에서는 환경변수 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE_URL;
