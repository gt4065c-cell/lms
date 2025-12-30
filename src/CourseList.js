import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { verifyDepartmentPassword } from './departments';

// props에 departmentId, departmentName 추가
const CourseList = ({ onNavigate, semesterId, departmentId, departmentName }) => {
  const [lectures, setLectures] = useState([]);
  const [myId, setMyId] = useState(""); 
  const [professors, setProfessors] = useState([]); 

  // 필터 및 UI 상태
  const [selectedLang, setSelectedLang] = useState("ALL"); 
  const [uiLang, setUiLang] = useState("KO"); 

  // 다국어 설정
  const t = {
    KO: { title: "강의 희망 신청", profName: "교수님 성함", selectPlace: "-- 선택하세요 --", filterLang: "강의 언어 필터", all: "전체", korean: "한국어", english: "영어", chinese: "중국어", grade: "학년", credit: "학점", est: "예상", students: "명", noDesc: "설명 없음", section: "분반", applicant: "신청자", cancel: "취소 X", apply: "+ 신청", noResult: "강의가 없습니다.", alertNoName: "교수님 성함을 먼저 선택해주세요!", unknown: "미정" },
    EN: { title: "Course Application", profName: "Professor Name", selectPlace: "-- Select Name --", filterLang: "Language", all: "All", korean: "Korean", english: "English", chinese: "Chinese", grade: "Year", credit: "Credits", est: "Est.", students: "students", noDesc: "No description.", section: "Sec", applicant: "Applicants", cancel: "Cancel X", apply: "+ Apply", noResult: "No courses found.", alertNoName: "Please select your name first!", unknown: "TBD" },
    CN: { title: "授课申请", profName: "教授姓名", selectPlace: "-- 请选择 --", filterLang: "授课语言", all: "全部", korean: "韩语", english: "英语", chinese: "中文", grade: "年级", credit: "学分", est: "预计", students: "人", noDesc: "暂无说明。", section: "分班", applicant: "申请人", cancel: "取消 X", apply: "+ 申请", noResult: "未找到课程。", alertNoName: "请先选择您的姓名！", unknown: "未定" }
  };
  const ui = t[uiLang]; 

  const handleAdminAccess = () => {
    const password = prompt("🔐 관리자 비밀번호:");
    if (password === null) return; // 취소 버튼
    
    // 학과별 비밀번호 검증
    if (verifyDepartmentPassword(departmentId, password)) {
      const choice = prompt("1. 관리자 모드\n2. 시수 현황 (통계)");
      if (choice === "1") onNavigate('admin');
      else if (choice === "2") onNavigate('summary');
    } else {
      alert("비밀번호가 틀렸습니다.\n\n💡 힌트:\n- 솔브릿지경영학부: 1230\n- 나머지 학과: 0000 (기본값)");
    }
  };

  useEffect(() => {
    // 학과별 필터링 쿼리 (departmentId를 department 필드로 저장)
    const coursesRef = collection(db, "semesters", semesterId, "courses");
    const q = query(coursesRef, where("departmentId", "==", departmentId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lectureData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        let gradeNum = 99;
        if (data.targetGrade) {
            const firstPart = data.targetGrade.split('-')[0]; 
            gradeNum = parseInt(firstPart, 10);
            if (isNaN(gradeNum)) gradeNum = 99;
        }

        return {
          id: doc.id,
          ...data,
          grade: gradeNum,
          department: data.department || departmentName, 
          languageMap: data.languageMap || {},
          applicants: data.applicants || {}
        };
      });

      lectureData.sort((a, b) => {
        if (a.grade !== b.grade) {
          return a.grade - b.grade;
        }
        return a.courseName.localeCompare(b.courseName);
      });

      setLectures(lectureData);
    });

    // 학과별 교수진 불러오기 (departmentId로 필터링)
    const profRef = collection(db, "professors");
    const qProf = query(profRef, where("departmentId", "==", departmentId));
    const unsubProf = onSnapshot(qProf, (snapshot) => {
        const profList = snapshot.docs.map(d => d.data().name);
        profList.sort();
        setProfessors(profList);
    });

    return () => {
      unsubscribe();
      unsubProf();
    };
  }, [semesterId, departmentId, departmentName]);

  const handleApply = async (lectureId, section) => {
    if (!myId) { alert(ui.alertNoName); return; }
    const lectureRef = doc(db, "semesters", semesterId, "courses", lectureId);
    await updateDoc(lectureRef, { [`applicants.${section}`]: arrayUnion(myId) });
  };

  const handleCancel = async (lectureId, section) => {
    if (!myId) return;
    const lectureRef = doc(db, "semesters", semesterId, "courses", lectureId);
    await updateDoc(lectureRef, { [`applicants.${section}`]: arrayRemove(myId) });
  };

  // 강의 필터링 (언어 필터는 나중에 분반 레벨에서 적용)
  const filteredLectures = lectures;

  const getGradeBadgeColor = (grade) => {
    switch(grade) {
      case 1: return '#4caf50';
      case 2: return '#2196f3';
      case 3: return '#9c27b0';
      case 4: return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <header style={{ borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap:'10px' }}>
          <div>
            <h1 style={{ color: '#1565c0', margin: 0, fontSize: '1.8rem' }}>
               {semesterId.replace('_', ' ').toUpperCase()} {ui.title}
            </h1>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
              📌 {departmentName}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setUiLang("KO")} style={{ opacity: uiLang==="KO"?1:0.5, border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer' }}>🇰🇷</button>
              <button onClick={() => setUiLang("EN")} style={{ opacity: uiLang==="EN"?1:0.5, border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer' }}>🇺🇸</button>
              <button onClick={() => setUiLang("CN")} style={{ opacity: uiLang==="CN"?1:0.5, border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer' }}>🇨🇳</button>
            </div>
            <button onClick={handleAdminAccess} style={{ border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer' }}>⚙️</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
          <span style={{ fontWeight:'bold' }}>{ui.profName}: </span>
          <select value={myId} onChange={(e) => setMyId(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="">{ui.selectPlace}</option>
            {professors.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      </header>

      <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontWeight: 'bold' }}>🌐 {ui.filterLang}: </span>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="ALL">{ui.all}</option>
            <option value="한국어">{ui.korean}</option>
            <option value="영어">{ui.english}</option>
            <option value="중국어">{ui.chinese}</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', color: '#666' }}>
          총 <strong>{filteredLectures.length}</strong>개 강의
        </div>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredLectures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '1.1rem' }}>
            {ui.noResult}
          </div>
        ) : (
          filteredLectures.map(lec => {
            // 언어 필터 적용 후 남은 분반들
            const visibleSections = Object.keys(lec.sectionInfo || {})
              .filter(k => k !== 'total')
              .filter(secNum => {
                if (selectedLang === "ALL") return true;
                const lang = lec.languageMap[secNum] || "";
                return lang === selectedLang;
              });
            
            // 보여줄 분반이 없으면 이 강의 자체를 숨김
            if (visibleSections.length === 0) return null;
            
            return (
            <div key={lec.id} style={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ 
                      backgroundColor: getGradeBadgeColor(lec.grade), 
                      color: 'white', 
                      padding: '3px 10px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold' 
                    }}>
                      {lec.grade === 99 ? ui.unknown : `${lec.grade}${ui.grade}`}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                      {lec.credits || '0'}{ui.credit}
                    </span>
                  </div>
                  <h3 style={{ margin: '5px 0', fontSize: '1.3rem', color: '#212121' }}>{lec.courseName}</h3>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                    {lec.description || ui.noDesc}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px', marginTop: '15px' }}>
                {visibleSections.sort().map(secNum => {
                  const lang = lec.languageMap[secNum] || ui.unknown;
                  const applicantList = lec.applicants[secNum] || [];
                  const isApplied = applicantList.includes(myId);

                  return (
                    <div key={secNum} style={{ 
                      border: '1px solid #ddd', 
                      borderRadius: '6px', 
                      padding: '10px', 
                      backgroundColor: isApplied ? '#e3f2fd' : '#fafafa' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                          {ui.section} {secNum}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>
                          🌐 {lang}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                        {ui.applicant}: <strong>{applicantList.length}</strong>{ui.students}
                        {applicantList.length > 0 && (
                          <div style={{ fontSize: '0.75rem', marginTop: '4px', maxHeight: '60px', overflowY: 'auto' }}>
                            {applicantList.join(', ')}
                          </div>
                        )}
                      </div>

                      {isApplied ? (
                        <button 
                          onClick={() => handleCancel(lec.id, secNum)}
                          style={{ 
                            width: '100%', 
                            padding: '6px', 
                            backgroundColor: '#f44336', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {ui.cancel}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleApply(lec.id, secNum)}
                          style={{ 
                            width: '100%', 
                            padding: '6px', 
                            backgroundColor: '#4caf50', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {ui.apply}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CourseList;
