import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, query } from 'firebase/firestore'; // orderBy 제거 (클라이언트 정렬 사용)
import { db } from './firebase';

// props에 semesterId 추가
const CourseList = ({ onNavigate, semesterId }) => {
  const [lectures, setLectures] = useState([]);
  const [myId, setMyId] = useState(""); 
  const [professors, setProfessors] = useState([]); 

  // 필터 및 UI 상태
  const [selectedLang, setSelectedLang] = useState("ALL"); 
  const [selectedDept, setSelectedDept] = useState("ALL"); 
  const [uiLang, setUiLang] = useState("KO"); 

  // 다국어 설정
  const t = {
    KO: { title: "강의 희망 신청", profName: "교수님 성함", selectPlace: "-- 선택하세요 --", filterDept: "학과 필터", filterLang: "강의 언어 필터", all: "전체", korean: "한국어", english: "영어", chinese: "중국어", grade: "학년", credit: "학점", est: "예상", students: "명", noDesc: "설명 없음", section: "분반", applicant: "신청자", cancel: "취소 X", apply: "+ 신청", noResult: "강의가 없습니다.", alertNoName: "교수님 성함을 먼저 선택해주세요!", unknown: "미정" },
    EN: { title: "Course Application", profName: "Professor Name", selectPlace: "-- Select Name --", filterDept: "Department Filter", filterLang: "Language", all: "All", korean: "Korean", english: "English", chinese: "Chinese", grade: "Year", credit: "Credits", est: "Est.", students: "students", noDesc: "No description.", section: "Sec", applicant: "Applicants", cancel: "Cancel X", apply: "+ Apply", noResult: "No courses found.", alertNoName: "Please select your name first!", unknown: "TBD" },
    CN: { title: "授课申请", profName: "教授姓名", selectPlace: "-- 请选择 --", filterDept: "学科筛选", filterLang: "授课语言", all: "全部", korean: "韩语", english: "英语", chinese: "中文", grade: "年级", credit: "学分", est: "预计", students: "人", noDesc: "暂无说明。", section: "分班", applicant: "申请人", cancel: "取消 X", apply: "+ 申请", noResult: "未找到课程。", alertNoName: "请先选择您的姓名！", unknown: "未定" }
  };
  const ui = t[uiLang]; 

  const handleAdminAccess = () => {
    const password = prompt("🔐 관리자 비밀번호:");
    if (password === "1230") {
      const choice = prompt("1. 관리자 모드\n2. 시수 현황 (통계)");
      if (choice === "1") onNavigate('admin');
      else if (choice === "2") onNavigate('summary');
    } else if (password !== null) alert("비밀번호 오류");
  };

  useEffect(() => {
    // DB 경로 설정
    const q = query(collection(db, "semesters", semesterId, "courses"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lectureData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // [핵심 수정] "1-1" 같은 문자열에서 앞의 "1"만 추출하여 숫자로 변환
        let gradeNum = 99; // 기본값 (학년 없음)
        if (data.targetGrade) {
            // "1-1" -> split('-') -> ["1", "1"] -> 첫번째 "1" 가져옴 -> 정수로 변환
            const firstPart = data.targetGrade.split('-')[0]; 
            gradeNum = parseInt(firstPart, 10);
            if (isNaN(gradeNum)) gradeNum = 99; // 숫자가 아니면 99 처리
        }

        return {
          id: doc.id,
          ...data,
          grade: gradeNum, // 이제 1, 2, 3, 4 숫자가 들어감
          department: data.department || "Etc", 
          languageMap: data.languageMap || {},
          applicants: data.applicants || {}
        };
      });

      // 정렬: 학년 오름차순 -> 과목명 오름차순
      lectureData.sort((a, b) => {
        if (a.grade !== b.grade) {
          return a.grade - b.grade;
        }
        return a.courseName.localeCompare(b.courseName);
      });

      setLectures(lectureData);
    });

    const profRef = collection(db, "professors");
    // const qProf = query(profRef, orderBy("name")); // orderBy 문제 생길 수 있으니 일단 제거 후 클라이언트 정렬 권장, 여기선 유지
    const unsubProf = onSnapshot(profRef, (snapshot) => {
        const profList = snapshot.docs.map(d => d.data().name);
        profList.sort(); // 이름 가나다순 정렬
        setProfessors(profList);
    });

    return () => {
      unsubscribe();
      unsubProf();
    };
  }, [semesterId]);

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

  const allDepartments = ["ALL", ...new Set(lectures.map(l => l.department))];
  const filteredLectures = lectures.filter(lecture => {
    const deptMatch = selectedDept === "ALL" || lecture.department === selectedDept;
    const sectionLangs = Object.values(lecture.languageMap);
    let langMatch = selectedLang === "ALL" ? true : sectionLangs.includes(selectedLang);
    return deptMatch && langMatch;
  });

  // 학년별 배지 색상
  const getGradeBadgeColor = (grade) => {
    switch(grade) {
      case 1: return '#4caf50'; // 초록 (1학년)
      case 2: return '#2196f3'; // 파랑 (2학년)
      case 3: return '#9c27b0'; // 보라 (3학년)
      case 4: return '#ff9800'; // 주황 (4학년)
      default: return '#9e9e9e'; // 회색 (기타)
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <header style={{ borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap:'10px' }}>
          <h1 style={{ color: '#1565c0', margin: 0, fontSize: '1.8rem' }}>
             {semesterId.replace('_', ' ').toUpperCase()} {ui.title}
          </h1>
          
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

      {/* 필터 영역 */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontWeight: 'bold' }}>🏫 {ui.filterDept}: </span>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}>
            {allDepartments.map(dept => <option key={dept} value={dept}>{dept==="ALL"?ui.all:dept}</option>)}
          </select>
        </div>
        <div>
           <span style={{ fontWeight: 'bold' }}>🗣️ {ui.filterLang}: </span>
           <button onClick={()=>setSelectedLang("ALL")} style={{margin:'0 5px', padding:'5px 10px', borderRadius:'4px', border: selectedLang==="ALL"?'1px solid #1565c0':'1px solid #ddd', background: selectedLang==="ALL"?'#e3f2fd':'white', color: selectedLang==="ALL"?'#1565c0':'black', cursor:'pointer'}}>All</button>
           <button onClick={()=>setSelectedLang("한국어")} style={{margin:'0 5px', padding:'5px 10px', borderRadius:'4px', border: selectedLang==="한국어"?'1px solid #1565c0':'1px solid #ddd', background: selectedLang==="한국어"?'#e3f2fd':'white', color: selectedLang==="한국어"?'#1565c0':'black', cursor:'pointer'}}>KR</button>
           <button onClick={()=>setSelectedLang("영어")} style={{margin:'0 5px', padding:'5px 10px', borderRadius:'4px', border: selectedLang==="영어"?'1px solid #1565c0':'1px solid #ddd', background: selectedLang==="영어"?'#e3f2fd':'white', color: selectedLang==="영어"?'#1565c0':'black', cursor:'pointer'}}>EN</button>
           <button onClick={()=>setSelectedLang("중국어")} style={{margin:'0 5px', padding:'5px 10px', borderRadius:'4px', border: selectedLang==="중국어"?'1px solid #1565c0':'1px solid #ddd', background: selectedLang==="중국어"?'#e3f2fd':'white', color: selectedLang==="중국어"?'#1565c0':'black', cursor:'pointer'}}>CN</button>
        </div>
      </div>

      {/* 강의 목록 Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
        gap: '15px' 
      }}>
        {filteredLectures.map(lecture => (
          <div key={lecture.id} style={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            padding: '12px',
            backgroundColor: 'white', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* 상단: 학과 + 학년 배지 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75em', color: '#666', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                    {lecture.department}
                </span>
                
                {/* 학년 배지 표시 (데이터 없어도 '미정'으로 표시 안 함, 있으면 표시) */}
                {lecture.grade && lecture.grade !== 99 && (
                    <span style={{ 
                        fontSize: '0.75em', 
                        color: 'white', 
                        background: getGradeBadgeColor(lecture.grade), 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontWeight: 'bold'
                    }}>
                        {lecture.grade}{ui.grade}
                    </span>
                )}
            </div>

            <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.1rem', lineHeight: '1.3', wordBreak: 'keep-all' }}>
                {lecture.courseName}
            </h3>
            
            <p style={{ color: '#666', fontSize: '0.85em', margin: '0 0 10px 0' }}>
                {lecture.credits}{ui.credit} | {ui.est} {lecture.estStudents}{ui.students}
            </p>
            
            <div style={{ height: '1px', background: '#eee', margin: '5px 0 10px 0' }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {Array.from({ length: lecture.sectionInfo?.total || 1 }, (_, i) => i + 1).map(sec => {
                const applicants = lecture.applicants?.[sec] || [];
                const isApplied = applicants.includes(myId);
                const lang = lecture.languageMap?.[sec] || ui.unknown;
                
                if (selectedLang !== "ALL" && lang !== selectedLang) return null;
                
                return (
                  <div key={sec} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px', 
                      background: '#f8f9fa', 
                      borderRadius: '6px', 
                      border: '1px solid #eee' 
                  }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{fontWeight:'bold', fontSize: '0.9em'}}>{sec}{ui.section}</span>
                            <span style={{
                                fontSize:'0.7em', 
                                marginLeft:'5px', 
                                padding: '1px 4px',
                                borderRadius: '3px',
                                border: '1px solid',
                                borderColor: lang==='영어'?'#a5d6a7':(lang==='중국어'?'#ffcc80':'#90caf9'),
                                color: lang==='영어'?'#2e7d32':(lang==='중국어'?'#ef6c00':'#1565c0'),
                                background: 'white'
                            }}>{lang}</span>
                        </div>
                        <div style={{fontSize:'0.75em', color:'#888', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                            {applicants.length > 0 ? applicants.join(", ") : "-"}
                        </div>
                      </div>
                      <button onClick={() => isApplied ? handleCancel(lecture.id, sec) : handleApply(lecture.id, sec)} 
                        style={{ 
                            background: isApplied?'#ffebee':'#1976d2', 
                            color: isApplied?'#c62828':'white', 
                            border: isApplied?'1px solid #ffcdd2':'none',
                            borderRadius:'4px', 
                            padding:'4px 8px', 
                            fontSize: '0.8em',
                            cursor:'pointer',
                            whiteSpace: 'nowrap'
                        }}>
                        {isApplied ? ui.cancel : ui.apply}
                      </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {filteredLectures.length === 0 && <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>{ui.noResult}</div>}
    </div>
  );
};

export default CourseList;