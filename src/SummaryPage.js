import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import * as XLSX from 'xlsx';

// props로 semesterId 받기
const SummaryPage = ({ onNavigate, semesterId }) => {
  const [summaryData, setSummaryData] = useState([]);
  const DEFAULT_HOURS = 9; 

  useEffect(() => {
    // 1. 교수님 목록 (이름은 공통 DB에서 가져옴)
    const profRef = collection(db, "professors");
    const qProf = query(profRef, orderBy("name"));

    // 2. 강의 목록 (★선택된 semesterId의 강의만 가져옴★)
    const courseRef = collection(db, "semesters", semesterId, "courses");

    const unsubProf = onSnapshot(qProf, (profSnap) => {
      const professors = profSnap.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name,
        // (참고: 책임시수는 학기별로 다를 수 있으나, 일단 공통값 사용. 추후 고도화 가능)
        responsibility: doc.data().responsibility !== undefined ? doc.data().responsibility : DEFAULT_HOURS
      }));

      // 중복 제거: 이름 기준으로 유니크하게
      const uniqueProfessors = professors.reduce((acc, current) => {
        const exists = acc.find(item => item.name === current.name);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      onSnapshot(courseRef, (courseSnap) => {
        const courses = courseSnap.docs.map(doc => doc.data());

        const stats = uniqueProfessors.map(prof => {
          let totalHours = 0; 
          let courseList = []; 

          courses.forEach(course => {
            if (course.applicants) {
              Object.values(course.applicants).forEach(applicantList => {
                if (applicantList.includes(prof.name)) {
                  totalHours += Number(course.credits); 
                  courseList.push(course.courseName);
                }
              });
            }
          });

          return {
            id: prof.id,
            name: prof.name,
            responsibility: prof.responsibility,
            assigned: totalHours,
            balance: totalHours - prof.responsibility,
            courses: courseList.join(", ")
          };
        });

        setSummaryData(stats);
      });
    });

    return () => unsubProf();
  }, [semesterId]); // semesterId가 바뀌면 통계도 다시 계산

  // ... (책임시수 변경, 엑셀 다운로드 등 기존 로직 유지) ...
  // (편의상 코드를 줄였지만, 기존 함수 그대로 두시면 됩니다)
  const handleResponsibilityChange = async (profId, newVal) => {
    const numVal = Number(newVal);
    if (numVal < 0) return; 
    await updateDoc(doc(db, "professors", profId), { responsibility: numVal });
  };
  
  const downloadExcel = () => {
    /* ...기존 엑셀 다운로드 코드 유지... */
    alert("엑셀 다운로드 기능은 기존과 동일합니다.");
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => onNavigate('list')}
        style={{ marginBottom:'20px', padding:'10px', cursor:'pointer', border:'1px solid #ccc', background:'#fff', borderRadius:'5px' }}
      >
        ⬅️ 메인으로 돌아가기
      </button>

      <h1 style={{ color: '#2e7d32' }}>
        📊 {semesterId} 교수별 시수 현황
      </h1>
      
      {/* 테이블 렌더링 (기존과 동일) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop:'20px' }}>
        <thead>
          <tr style={{ background: '#e8f5e9', borderBottom: '2px solid #a5d6a7' }}>
            <th style={{padding:'10px'}}>교수명</th>
            <th>책임시수</th>
            <th>배정시수</th>
            <th>과부족</th>
            <th>과목</th>
          </tr>
        </thead>
        <tbody>
          {summaryData.map(row => (
            <tr key={row.id} style={{ borderBottom:'1px solid #eee', textAlign:'center', height:'50px' }}>
               <td>{row.name}</td>
               <td><input type="number" value={row.responsibility} onChange={(e)=>handleResponsibilityChange(row.id, e.target.value)} style={{width:'50px'}} /></td>
               <td style={{ fontWeight: 'bold', color: row.assigned >= row.responsibility ? 'blue' : 'red' }}>{row.assigned}</td>
               <td style={{ fontWeight: 'bold', color: row.balance >= 0 ? 'green' : 'red' }}>{row.balance}</td>
               <td style={{textAlign:'left', fontSize:'0.8em'}}>{row.courses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SummaryPage;