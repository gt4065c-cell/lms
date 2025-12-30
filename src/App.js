// src/App.js
import React, { useState } from 'react';
import CourseList from './CourseList';
import AdminPage from './AdminPage';     // (기존 유지)
import SummaryPage from './SummaryPage';
import { DEPARTMENTS } from './departments';

function App() {
  const [currentPage, setCurrentPage] = useState('list');

  // 1. 년도/학기 선택 상태 (기본값: 2026년 1학기)
  const [year, setYear] = useState("2026");
  const [term, setTerm] = useState("spring");
  
  // 2. 학과 선택 상태 (기본값: AI경영학과)
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0].id);

  // DB 컬렉션 이름 조합 (예: 2026_spring)
  const semesterId = `${year}_${term}`;
  
  // 현재 선택된 학과 정보
  const currentDept = DEPARTMENTS.find(d => d.id === selectedDept);

  // 화면 전환 함수
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      
      {/* 상단 통합 컨트롤 바 (년도/학기/학과 선택) */}
      <div style={{ 
        backgroundColor: '#333', color: 'white', padding: '15px 20px', 
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        {/* 첫 번째 줄: 학기 설정 */}
        <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:'1.2rem', fontWeight:'bold' }}>📅 학기:</span>
          
          {/* 년도 선택 */}
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            style={{ padding:'5px', borderRadius:'4px', fontWeight:'bold' }}
          >
            <option value="2025">2025년</option>
            <option value="2026">2026년</option>
            <option value="2027">2027년</option>
            <option value="2028">2028년</option>
          </select>

          {/* 학기 선택 */}
          <select 
            value={term} 
            onChange={(e) => setTerm(e.target.value)}
            style={{ padding:'5px', borderRadius:'4px', fontWeight:'bold' }}
          >
            <option value="spring">1학기 (Spring)</option>
            <option value="summer">여름학기 (Summer)</option>
            <option value="fall">2학기 (Fall)</option>
            <option value="winter">겨울학기 (Winter)</option>
          </select>
        </div>

        {/* 두 번째 줄: 학과 선택 */}
        <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:'1.2rem', fontWeight:'bold' }}>🏫 학과:</span>
          
          {/* 학과 선택 */}
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding:'5px', borderRadius:'4px', fontWeight:'bold', minWidth:'300px' }}
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <span style={{ marginLeft:'10px', color:'#aaa', fontSize:'0.85rem' }}>
            현재: {year}년 {term === 'spring' ? '1학기' : term === 'summer' ? '여름학기' : term === 'fall' ? '2학기' : '겨울학기'} / {currentDept?.name}
          </span>
        </div>
      </div>

      {/* 메인 화면 영역 */}
      <div style={{ padding: '0' }}>
        {currentPage === 'list' && (
          <CourseList 
            onNavigate={handleNavigate} 
            semesterId={semesterId}
            departmentId={selectedDept}
            departmentName={currentDept?.name}
          />
        )}
        
        {currentPage === 'admin' && (
          <div style={{ padding: '20px' }}>
             <button 
              onClick={() => setCurrentPage('list')}
              style={{ marginBottom:'20px', padding:'10px', cursor:'pointer', border:'1px solid #ccc', background:'#fff', borderRadius:'5px' }}
            >
              ⬅️ 메인으로 돌아가기
            </button>
            <AdminPage 
              semesterId={semesterId}
              departmentId={selectedDept}
              departmentName={currentDept?.name}
            />
          </div>
        )}

        {currentPage === 'summary' && (
          <SummaryPage 
            onNavigate={handleNavigate} 
            semesterId={semesterId}
            departmentId={selectedDept}
            departmentName={currentDept?.name}
          />
        )}
      </div>
    </div>
  );
}

export default App;