// Vite 프록시를 사용하기 위해 상대 경로 사용
// vite.config.js의 proxy 설정이 /api를 http://localhost:5000로 자동 프록시
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default API_BASE_URL;
