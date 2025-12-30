import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

// 학과 목록 (필요시 추가/수정하세요)
const DEPARTMENTS = [
  "AI경영학과",
  "Global Convergence Management",
  "융합경영학부 경영학전공",
  "융합경영학부 회계세무전공",
  "융합경영학부 글로벌비즈니스전공",
  "AI소프트웨어학과",
  "교양/공통"
];

const AdminPage = ({ semesterId }) => {
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);

  // --- 1. 신규 강의 개설용 상태 (입력 폼) ---
  const [newCourseName, setNewCourseName] = useState("");
  const [newDept, setNewDept] = useState(DEPARTMENTS[0]); // 기본값 첫번째 학과
  const [newGrade, setNewGrade] = useState("1-1");
  const [newCredits, setNewCredits] = useState("3");
  const [newSections, setNewSections] = useState("1"); // 기본 분반 수

  // --- 2. 수정 모드 상태 ---
  const [editingId, setEditingId] = useState(null); // 현재 수정 중인 강의 ID
  const [editForm, setEditForm] = useState({}); // 수정 중인 데이터 임시 저장

  // 데이터 불러오기
  useEffect(() => {
    // 강의 목록 리스너
    const q = query(collection(db, "semesters", semesterId, "courses"), orderBy("department"), orderBy("courseName"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCourses(list);
    });

    // 교수진 목록 리스너 (교수 관리용)
    const profRef = collection(db, "professors");
    const unsubProf = onSnapshot(query(profRef, orderBy("name")), (snap) => {
      setProfessors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub(); unsubProf(); };
  }, [semesterId]);


  // --- 기능 1: 신규 강의 개설 (필수 입력사항 반영) ---
  const handleAddCourse = async () => {
    if (!newCourseName.trim()) {
      alert("과목명을 입력해주세요!");
      return;
    }

    // 초기 분반 설정 (기본값: 영어)
    const initialLangMap = {};
    const initialApplicants = {};
    const count = parseInt(newSections);
    
    for(let i=1; i<=count; i++) {
        initialLangMap[i] = "영어"; // 기본 언어
        initialApplicants[i] = [];
    }

    const newDoc = {
      courseName: newCourseName,
      department: newDept,
      targetGrade: newGrade,
      credits: newCredits,
      sectionInfo: { total: count },
      languageMap: initialLangMap,
      applicants: initialApplicants,
      description: "", // 설명은 나중에 수정
      createdAt: new Date()
    };

    try {
      await addDoc(collection(db, "semesters", semesterId, "courses"), newDoc);
      alert(`[${newCourseName}] 과목이 개설되었습니다.`);
      setNewCourseName(""); // 입력창 초기화
    } catch (e) {
      console.error(e);
      alert("개설 중 오류가 발생했습니다.");
    }
  };


  // --- 기능 2: 기존 강의 수정 (Edit Mode) ---
  
  // (1) 수정 버튼 클릭 시 -> 해당 줄을 입력창으로 변환
  const startEditing = (course) => {
    setEditingId(course.id);
    setEditForm({
      courseName: course.courseName,
      department: course.department,
      targetGrade: course.targetGrade,
      credits: course.credits
    });
  };

  // (2) 저장 버튼 클릭 시 -> DB 업데이트
  const saveEditing = async (id) => {
    try {
      await updateDoc(doc(db, "semesters", semesterId, "courses", id), {
        courseName: editForm.courseName,
        department: editForm.department,
        targetGrade: editForm.targetGrade,
        credits: editForm.credits
      });
      setEditingId(null); // 수정 모드 종료
    } catch (e) {
      alert("수정 실패: " + e.message);
    }
  };

  // (3) 삭제 기능
  const handleDeleteCourse = async (id) => {
    if(window.confirm("정말 이 강의를 삭제하시겠습니까? (신청 데이터도 모두 삭제됩니다)")) {
      await deleteDoc(doc(db, "semesters", semesterId, "courses", id));
    }
  };

  // --- 기능 3: 분반/언어 설정 변경 (기존 기능 유지) ---
  const updateSectionCount = async (id, currentTotal, change) => {
    const newTotal = currentTotal + change;
    if (newTotal < 1) return;
    await updateDoc(doc(db, "semesters", semesterId, "courses", id), {
      "sectionInfo.total": newTotal
    });
  };

  const updateLanguage = async (course, section, newLang) => {
    const key = `languageMap.${section}`;
    await updateDoc(doc(db, "semesters", semesterId, "courses", course.id), {
      [key]: newLang
    });
  };

  // --- 교수진 추가/삭제 (상단 영역) ---
  const [newProfName, setNewProfName] = useState("");
  const addProfessor = async () => {
    if(!newProfName.trim()) return;
    await addDoc(collection(db, "professors"), { name: newProfName, responsibility: 9 });
    setNewProfName("");
  };
  const deleteProfessor = async (id) => {
    if(window.confirm("교수님을 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "professors", id));
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', minHeight:'100vh' }}>
      
      {/* 1. 상단: 교수진 관리 */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#d35400', borderBottom:'2px solid #eee', paddingBottom:'10px' }}>👥 교수진 관리</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input 
            value={newProfName}
            onChange={(e) => setNewProfName(e.target.value)}
            placeholder="교수님 성함 입력"
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button onClick={addProfessor} style={{ backgroundColor: '#333', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>추가</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {professors.map(p => (
            <span key={p.id} style={{ backgroundColor: '#eee', padding: '5px 10px', borderRadius: '15px', fontSize: '0.9rem' }}>
              {p.name} 
              <span onClick={() => deleteProfessor(p.id)} style={{ marginLeft: '8px', cursor: 'pointer', color: 'red', fontWeight: 'bold' }}>x</span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. 중단: 신규 강의 개설 (입력 폼 강화) */}
      <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffe0b2' }}>
        <h3 style={{ color: '#e65100', marginTop: 0 }}>🆕 신규 강의 개설 (직접 입력)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'end' }}>
          
          <div style={{ display:'flex', flexDirection:'column' }}>
            <label style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'5px'}}>학과 선택</label>
            <select 
              value={newDept} 
              onChange={(e)=>setNewDept(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ display:'flex', flexDirection:'column' }}>
            <label style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'5px'}}>학년</label>
            <select 
              value={newGrade} 
              onChange={(e)=>setNewGrade(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option>1-1</option><option>1-2</option>
              <option>2-1</option><option>2-2</option>
              <option>3-1</option><option>3-2</option>
              <option>4-1</option><option>4-2</option>
            </select>
          </div>

          <div style={{ display:'flex', flexDirection:'column', flex: 1, minWidth:'200px' }}>
            <label style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'5px'}}>과목명</label>
            <input 
              value={newCourseName}
              onChange={(e)=>setNewCourseName(e.target.value)}
              placeholder="예: 경영학원론"
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display:'flex', flexDirection:'column' }}>
            <label style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'5px'}}>학점</label>
            <input 
              type="number"
              value={newCredits}
              onChange={(e)=>setNewCredits(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width:'60px' }}
            />
          </div>

          <div style={{ display:'flex', flexDirection:'column' }}>
            <label style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'5px'}}>분반 수</label>
            <input 
              type="number"
              min="1"
              value={newSections}
              onChange={(e)=>setNewSections(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width:'60px' }}
            />
          </div>

          <button 
            onClick={handleAddCourse}
            style={{ padding: '10px 20px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight:'bold', height:'40px' }}
          >
            + 강의 생성
          </button>
        </div>
      </div>

      {/* 3. 하단: 강의 목록 (수정 기능 추가) */}
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd', color: '#555' }}>
              <th style={{ padding: '15px', width:'60px' }}>관리</th>
              <th style={{ padding: '15px' }}>학년</th>
              <th style={{ padding: '15px' }}>학과</th>
              <th style={{ padding: '15px' }}>과목명</th>
              <th style={{ padding: '15px' }}>학점</th>
              <th style={{ padding: '15px' }}>분반 설정</th>
              <th style={{ padding: '15px' }}>언어 설정</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => {
              const isEditing = editingId === course.id;
              
              return (
                <tr key={course.id} style={{ borderBottom: '1px solid #eee' }}>
                  
                  {/* (1) 관리 버튼 (수정/삭제) */}
                  <td style={{ padding: '10px' }}>
                    {isEditing ? (
                      <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                         <button onClick={() => saveEditing(course.id)} style={{fontSize:'0.8rem', background:'#4caf50', color:'white', border:'none', padding:'4px', borderRadius:'3px', cursor:'pointer'}}>저장</button>
                         <button onClick={() => setEditingId(null)} style={{fontSize:'0.8rem', background:'#9e9e9e', color:'white', border:'none', padding:'4px', borderRadius:'3px', cursor:'pointer'}}>취소</button>
                      </div>
                    ) : (
                      <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                        <button onClick={() => startEditing(course)} style={{fontSize:'0.8rem', background:'#2196f3', color:'white', border:'none', padding:'4px', borderRadius:'3px', cursor:'pointer'}}>수정</button>
                        <button onClick={() => handleDeleteCourse(course.id)} style={{fontSize:'0.8rem', background:'#ff5722', color:'white', border:'none', padding:'4px', borderRadius:'3px', cursor:'pointer'}}>삭제</button>
                      </div>
                    )}
                  </td>

                  {/* (2) 학년, 학과, 과목명, 학점 (수정 모드 시 Input으로 변신) */}
                  <td>
                    {isEditing ? 
                      <input value={editForm.targetGrade} onChange={(e)=>setEditForm({...editForm, targetGrade:e.target.value})} style={{width:'40px', padding:'5px'}} /> : 
                      course.targetGrade}
                  </td>
                  <td>
                    {isEditing ? 
                      <select value={editForm.department} onChange={(e)=>setEditForm({...editForm, department:e.target.value})} style={{width:'100%', padding:'5px'}}>
                         {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                      </select> : 
                      <span style={{fontSize:'0.9rem', color:'#666'}}>{course.department}</span>}
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#333' }}>
                    {isEditing ? 
                      <input value={editForm.courseName} onChange={(e)=>setEditForm({...editForm, courseName:e.target.value})} style={{width:'100%', padding:'5px'}} /> : 
                      course.courseName}
                  </td>
                  <td>
                    {isEditing ? 
                      <input type="number" value={editForm.credits} onChange={(e)=>setEditForm({...editForm, credits:e.target.value})} style={{width:'40px', padding:'5px'}} /> : 
                      course.credits}
                  </td>

                  {/* (3) 분반 수 조절 (기존 로직 유지) */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <button onClick={() => updateSectionCount(course.id, course.sectionInfo?.total || 1, -1)} style={{ cursor: 'pointer' }}>-</button>
                      <span style={{ fontWeight: 'bold' }}>{course.sectionInfo?.total || 1}</span>
                      <button onClick={() => updateSectionCount(course.id, course.sectionInfo?.total || 1, 1)} style={{ cursor: 'pointer' }}>+</button>
                    </div>
                  </td>

                  {/* (4) 언어 설정 (기존 로직 유지) */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                      {Array.from({ length: course.sectionInfo?.total || 1 }, (_, i) => i + 1).map(sec => (
                        <select 
                          key={sec}
                          value={course.languageMap?.[sec] || "영어"}
                          onChange={(e) => updateLanguage(course, sec, e.target.value)}
                          style={{ fontSize: '0.8rem', padding: '2px', border: '1px solid #ccc', borderRadius: '3px' }}
                        >
                          <option>한국어</option>
                          <option>영어</option>
                          <option>중국어</option>
                        </select>
                      ))}
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;