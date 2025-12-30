import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, where, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const AdminPage = ({ semesterId, departmentId, departmentName }) => {
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);

  // 신규 강의 개설용 상태
  const [newCourseName, setNewCourseName] = useState("");
  const [newGrade, setNewGrade] = useState("1-1");
  const [newCredits, setNewCredits] = useState("3");
  const [newSections, setNewSections] = useState("1");
  const [newDescription, setNewDescription] = useState("");

  // 교수 관리 상태
  const [newProfName, setNewProfName] = useState("");

  // 수정 모드 상태
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // 데이터 불러오기
  useEffect(() => {
    // 현재 학과의 강의 목록만 불러오기
    const coursesRef = collection(db, "semesters", semesterId, "courses");
    const q = query(coursesRef, where("departmentId", "==", departmentId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.courseName.localeCompare(b.courseName));
      setCourses(list);
    });

    // 현재 학과의 교수진만 불러오기
    const profRef = collection(db, "professors");
    const qProf = query(profRef, where("departmentId", "==", departmentId));
    const unsubProf = onSnapshot(qProf, (snap) => {
      const profList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      profList.sort((a, b) => a.name.localeCompare(b.name));
      setProfessors(profList);
    });

    return () => { unsub(); unsubProf(); };
  }, [semesterId, departmentId]);

  // 신규 강의 개설
  const handleAddCourse = async () => {
    if (!newCourseName.trim()) {
      alert("과목명을 입력해주세요!");
      return;
    }

    const initialLangMap = {};
    const initialApplicants = {};
    const initialSectionInfo = {};
    const count = parseInt(newSections);
    
    for(let i=1; i<=count; i++) {
        initialLangMap[i] = "영어";
        initialApplicants[i] = [];
        initialSectionInfo[i] = true; // 각 분반 존재 표시
    }
    initialSectionInfo.total = count; // 전체 분반 수

    const newDoc = {
      courseName: newCourseName,
      department: departmentName,
      departmentId: departmentId, // 학과 ID 저장
      targetGrade: newGrade,
      credits: newCredits,
      sectionInfo: initialSectionInfo,
      languageMap: initialLangMap,
      applicants: initialApplicants,
      description: newDescription,
      createdAt: new Date()
    };

    try {
      await addDoc(collection(db, "semesters", semesterId, "courses"), newDoc);
      alert(`[${newCourseName}] 과목이 개설되었습니다.`);
      setNewCourseName("");
      setNewDescription("");
    } catch (e) {
      console.error(e);
      alert("개설 중 오류가 발생했습니다.");
    }
  };

  // 교수 추가
  const handleAddProfessor = async () => {
    if (!newProfName.trim()) {
      alert("교수님 성함을 입력해주세요!");
      return;
    }

    try {
      await addDoc(collection(db, "professors"), {
        name: newProfName,
        departmentId: departmentId,
        departmentName: departmentName,
        createdAt: new Date()
      });
      alert(`${newProfName} 교수님이 추가되었습니다.`);
      setNewProfName("");
    } catch (e) {
      console.error(e);
      alert("교수 추가 중 오류가 발생했습니다.");
    }
  };

  // 교수 삭제
  const handleDeleteProfessor = async (profId, profName) => {
    if (window.confirm(`${profName} 교수님을 삭제하시겠습니까?`)) {
      try {
        await deleteDoc(doc(db, "professors", profId));
        alert("삭제되었습니다.");
      } catch (e) {
        console.error(e);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // 강의 삭제
  const handleDeleteCourse = async (courseId, courseName) => {
    if (window.confirm(`[${courseName}] 강의를 삭제하시겠습니까?`)) {
      try {
        await deleteDoc(doc(db, "semesters", semesterId, "courses", courseId));
        alert("삭제되었습니다.");
      } catch (e) {
        console.error(e);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // 수정 모드 시작
  const startEditing = (course) => {
    setEditingId(course.id);
    setEditForm({
      courseName: course.courseName,
      targetGrade: course.targetGrade,
      credits: course.credits,
      description: course.description || "",
      languageMap: { ...course.languageMap }
    });
  };

  // 수정 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 수정 저장
  const saveEdit = async (courseId) => {
    try {
      await updateDoc(doc(db, "semesters", semesterId, "courses", courseId), {
        courseName: editForm.courseName,
        targetGrade: editForm.targetGrade,
        credits: editForm.credits,
        description: editForm.description,
        languageMap: editForm.languageMap
      });
      alert("수정되었습니다.");
      setEditingId(null);
      setEditForm({});
    } catch (e) {
      console.error(e);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ color: '#1565c0', borderBottom: '2px solid #1565c0', paddingBottom: '10px' }}>
        ⚙️ 관리자 모드 - {departmentName}
      </h2>

      {/* 교수진 관리 섹션 */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0 }}>👨‍🏫 교수진 관리</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="교수님 성함"
            value={newProfName}
            onChange={(e) => setNewProfName(e.target.value)}
            style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            onClick={handleAddProfessor}
            style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ➕ 교수 추가
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {professors.map(prof => (
            <div key={prof.id} style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{prof.name}</span>
              <button
                onClick={() => handleDeleteProfessor(prof.id, prof.name)}
                style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 신규 강의 개설 섹션 */}
      <div style={{ backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0 }}>➕ 신규 강의 개설</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="과목명"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          
          <select
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="1-1">1학년 1학기</option>
            <option value="1-2">1학년 2학기</option>
            <option value="2-1">2학년 1학기</option>
            <option value="2-2">2학년 2학기</option>
            <option value="3-1">3학년 1학기</option>
            <option value="3-2">3학년 2학기</option>
            <option value="4-1">4학년 1학기</option>
            <option value="4-2">4학년 2학기</option>
          </select>
          
          <select
            value={newCredits}
            onChange={(e) => setNewCredits(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="1">1학점</option>
            <option value="2">2학점</option>
            <option value="3">3학점</option>
            <option value="4">4학점</option>
            <option value="5">5학점</option>
          </select>
          
          <select
            value={newSections}
            onChange={(e) => setNewSections(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="1">1개 분반</option>
            <option value="2">2개 분반</option>
            <option value="3">3개 분반</option>
            <option value="4">4개 분반</option>
            <option value="5">5개 분반</option>
          </select>
        </div>

        <textarea
          placeholder="강의 설명 (선택사항)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px', marginBottom: '10px' }}
        />

        <button
          onClick={handleAddCourse}
          style={{ width: '100%', padding: '12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
        >
          ✅ 강의 개설하기
        </button>
      </div>

      {/* 강의 목록 */}
      <div>
        <h3>📚 개설된 강의 목록 ({courses.length}개)</h3>
        
        {courses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            아직 개설된 강의가 없습니다.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {courses.map(course => (
              <div key={course.id} style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                {editingId === course.id ? (
                  // 수정 모드
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input
                        value={editForm.courseName}
                        onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <select
                        value={editForm.targetGrade}
                        onChange={(e) => setEditForm({ ...editForm, targetGrade: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        <option value="1-1">1학년 1학기</option>
                        <option value="1-2">1학년 2학기</option>
                        <option value="2-1">2학년 1학기</option>
                        <option value="2-2">2학년 2학기</option>
                        <option value="3-1">3학년 1학기</option>
                        <option value="3-2">3학년 2학기</option>
                        <option value="4-1">4학년 1학기</option>
                        <option value="4-2">4학년 2학기</option>
                      </select>
                      <select
                        value={editForm.credits}
                        onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        <option value="1">1학점</option>
                        <option value="2">2학점</option>
                        <option value="3">3학점</option>
                        <option value="4">4학점</option>
                        <option value="5">5학점</option>
                      </select>
                    </div>

                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="강의 설명"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '50px', marginBottom: '10px' }}
                    />

                    {/* 분반별 언어 설정 */}
                    <div style={{ marginBottom: '10px' }}>
                      <strong>분반별 언어 설정:</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '5px', marginTop: '5px' }}>
                        {Object.keys(course.sectionInfo || {}).filter(k => k !== 'total').map(secNum => (
                          <div key={secNum} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem' }}>분반 {secNum}:</span>
                            <select
                              value={editForm.languageMap[secNum] || "영어"}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                languageMap: { ...editForm.languageMap, [secNum]: e.target.value }
                              })}
                              style={{ padding: '4px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                              <option value="한국어">한국어</option>
                              <option value="영어">영어</option>
                              <option value="중국어">중국어</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => saveEdit(course.id)}
                        style={{ flex: 1, padding: '10px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        💾 저장
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={{ flex: 1, padding: '10px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ❌ 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  // 일반 보기 모드
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{course.courseName}</h4>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {course.targetGrade} | {course.credits}학점 | {Object.keys(course.sectionInfo || {}).filter(k => k !== 'total').length}개 분반
                        </div>
                        {course.description && (
                          <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#555' }}>
                            {course.description}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => startEditing(course)}
                          style={{ padding: '8px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          ✏️ 수정
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.courseName)}
                          style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </div>

                    {/* 분반 정보 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '15px' }}>
                      {Object.keys(course.sectionInfo || {}).filter(k => k !== 'total').map(secNum => {
                        const lang = course.languageMap[secNum] || "미정";
                        const applicants = course.applicants[secNum] || [];
                        return (
                          <div key={secNum} style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>분반 {secNum}</div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                              언어: {lang}<br/>
                              신청: {applicants.length}명
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
