import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const SuperAdminPage = ({ onNavigate }) => {
  const [departments, setDepartments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // 신규 학과 추가용 상태
  const [newDept, setNewDept] = useState({
    id: '',
    name: '',
    password: '0000',
    college: ''
  });

  // 학과 목록 불러오기
  useEffect(() => {
    const deptRef = collection(db, "departments");
    const unsubscribe = onSnapshot(deptRef, (snapshot) => {
      const deptList = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));
      deptList.sort((a, b) => (a.college || '').localeCompare(b.college || ''));
      setDepartments(deptList);
    });

    return () => unsubscribe();
  }, []);

  // 학과 추가
  const handleAddDepartment = async () => {
    if (!newDept.id.trim() || !newDept.name.trim()) {
      alert("학과 ID와 이름을 모두 입력해주세요!");
      return;
    }

    // ID 중복 체크
    const exists = departments.find(d => d.id === newDept.id);
    if (exists) {
      alert("이미 존재하는 학과 ID입니다!");
      return;
    }

    try {
      // departments 컬렉션에 학과 ID를 문서 ID로 사용
      await setDoc(doc(db, "departments", newDept.id), {
        id: newDept.id,
        name: newDept.name,
        password: newDept.password || '0000',
        college: newDept.college || '',
        createdAt: new Date()
      });

      alert(`${newDept.name} 학과가 추가되었습니다!`);
      setNewDept({ id: '', name: '', password: '0000', college: '' });
    } catch (e) {
      console.error(e);
      alert("학과 추가 중 오류가 발생했습니다.");
    }
  };

  // 학과 삭제
  const handleDeleteDepartment = async (deptId, deptName) => {
    const confirm = window.confirm(
      `⚠️ 경고: ${deptName} 학과를 삭제하시겠습니까?\n\n` +
      `이 학과에 속한 교수님과 강의 데이터는 삭제되지 않지만,\n` +
      `더 이상 이 학과로 필터링할 수 없게 됩니다.`
    );

    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "departments", deptId));
      alert("삭제되었습니다.");
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 수정 모드 시작
  const startEditing = (dept) => {
    setEditingId(dept.docId);
    setEditForm({
      id: dept.id,
      name: dept.name,
      password: dept.password || '0000',
      college: dept.college || ''
    });
  };

  // 수정 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 수정 저장
  const saveEdit = async (docId) => {
    if (!editForm.name.trim()) {
      alert("학과 이름을 입력해주세요!");
      return;
    }

    try {
      await updateDoc(doc(db, "departments", docId), {
        name: editForm.name,
        password: editForm.password || '0000',
        college: editForm.college || '',
        updatedAt: new Date()
      });
      alert("수정되었습니다.");
      setEditingId(null);
      setEditForm({});
    } catch (e) {
      console.error(e);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  // 단과대학별 그룹핑
  const groupedByCollege = departments.reduce((acc, dept) => {
    const college = dept.college || '기타';
    if (!acc[college]) acc[college] = [];
    acc[college].push(dept);
    return acc;
  }, {});

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <button 
        onClick={() => onNavigate('list')}
        style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer', border: '1px solid #ccc', background: '#fff', borderRadius: '5px' }}
      >
        ⬅️ 메인으로 돌아가기
      </button>

      <h1 style={{ color: '#d32f2f', borderBottom: '3px solid #d32f2f', paddingBottom: '15px' }}>
        🔐 수퍼관리자 - 학과 관리
      </h1>

      {/* 신규 학과 추가 섹션 */}
      <div style={{ backgroundColor: '#fff3e0', padding: '25px', borderRadius: '10px', marginBottom: '30px', border: '2px solid #ff9800' }}>
        <h3 style={{ marginTop: 0, color: '#e65100' }}>➕ 신규 학과 추가</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>학과 ID (영문)</label>
            <input
              type="text"
              placeholder="예: ai_business"
              value={newDept.id}
              onChange={(e) => setNewDept({ ...newDept, id: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <small style={{ color: '#666' }}>* 영문 소문자, 숫자, 언더스코어(_)만 사용</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>학과명 (한글)</label>
            <input
              type="text"
              placeholder="예: AI경영학과"
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>소속 단과대학</label>
            <input
              type="text"
              placeholder="예: 엔디컷국제대학"
              value={newDept.college}
              onChange={(e) => setNewDept({ ...newDept, college: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>비밀번호</label>
            <input
              type="text"
              placeholder="기본값: 0000"
              value={newDept.password}
              onChange={(e) => setNewDept({ ...newDept, password: e.target.value })}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <small style={{ color: '#666' }}>* 해당 학과 조교용 비밀번호</small>
          </div>
        </div>

        <button
          onClick={handleAddDepartment}
          style={{ width: '100%', padding: '15px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}
        >
          ✅ 학과 추가하기
        </button>
      </div>

      {/* 학과 목록 */}
      <div>
        <h3 style={{ marginBottom: '20px' }}>📚 등록된 학과 목록 (총 {departments.length}개)</h3>
        
        {Object.keys(groupedByCollege).sort().map(college => (
          <div key={college} style={{ marginBottom: '30px' }}>
            <h4 style={{ 
              backgroundColor: '#e3f2fd', 
              padding: '10px 15px', 
              borderRadius: '5px', 
              color: '#1565c0',
              marginBottom: '15px'
            }}>
              🏛️ {college} ({groupedByCollege[college].length}개 학과)
            </h4>

            <div style={{ display: 'grid', gap: '15px' }}>
              {groupedByCollege[college].map(dept => (
                <div key={dept.docId} style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
                  {editingId === dept.docId ? (
                    // 수정 모드
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '3px', color: '#666' }}>학과 ID</label>
                          <input
                            value={editForm.id}
                            disabled
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f5f5f5' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '3px', color: '#666' }}>학과명</label>
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '3px', color: '#666' }}>단과대학</label>
                          <input
                            value={editForm.college}
                            onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '3px', color: '#666' }}>비밀번호</label>
                          <input
                            value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => saveEdit(dept.docId)}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ 
                            backgroundColor: '#e0e0e0', 
                            padding: '4px 12px', 
                            borderRadius: '12px', 
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            color: '#424242'
                          }}>
                            {dept.id}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#212121' }}>
                            {dept.name}
                          </h4>
                          <span style={{ 
                            backgroundColor: '#fff9c4', 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '0.8rem',
                            color: '#f57f17'
                          }}>
                            🔑 {dept.password || '0000'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => startEditing(dept)}
                          style={{ padding: '8px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          ✏️ 수정
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.docId, dept.name)}
                          style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {departments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            아직 등록된 학과가 없습니다.
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h4 style={{ marginTop: 0, color: '#d32f2f' }}>⚠️ 주의사항</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
          <li>학과 ID는 한 번 생성하면 변경할 수 없습니다.</li>
          <li>학과 삭제 시 해당 학과의 교수/강의 데이터는 삭제되지 않습니다.</li>
          <li>departments.js 파일과 Firebase의 departments 컬렉션이 동기화되어야 합니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default SuperAdminPage;