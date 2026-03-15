import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AppRoutes from './routes/AppRoutes';
import { CriterionType, Evidence, StudentProfile, FeaturedFace, FieldVerification, Post } from './types';
import { checkHardMet } from './pages/StudentDashboard';
import { authService } from './services/authService';
import { studentService } from './services/studentService';
import { adminService, publicService } from './services/adminService';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userRole, setUserRole] = useState<'student' | 'admin' | 'guest'>('guest');
  const [faces, setFaces] = useState<FeaturedFace[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string>('');
  const [criteriaGroups, setCriteriaGroups] = useState<any[]>([]);
  
  // To avoid crash if data is loading
  const fallbackStudent: StudentProfile = {
    id: 'LOADING', fullName: 'Đang tải...', studentId: '', class: '', faculty: '',
    gpa: 0, peScore: 0, trainingPoints: 0, englishLevel: 'None', englishGpa: 0, isPartyMember: false, noViolation: false, status: 'Draft',
    evidences: { [CriterionType.ETHICS]: [], [CriterionType.ACADEMIC]: [], [CriterionType.PHYSICAL]: [], [CriterionType.VOLUNTEER]: [], [CriterionType.INTEGRATION]: [] },
    totalScore: 0,
    verifications: { gpa: { status: 'Pending' }, trainingPoints: { status: 'Pending' }, peScore: { status: 'Pending' }, english: { status: 'Pending' }, partyMember: { status: 'Pending' } }
  };

  const student = activeStudentId ? (students.find(s => s.id === activeStudentId) || fallbackStudent) : fallbackStudent;

  const [loading, setLoading] = useState(true);

  // Initial load: Faces and Criteria are public
  useEffect(() => {
    publicService.getFaces().then(setFaces).catch(console.error);
    publicService.getCriteria().then(setCriteriaGroups).catch(console.error);
    publicService.getPosts().then(setPosts).catch(console.error);
  }, []);

  // Sync state on mount and route changes if necessary
  useEffect(() => {
    // Only fetch auth state if we don't know it, or we rely on the other effect to do it.
    // The main data fetching effect already pulls the current user!
    // We just don't want to force userRole to guest when browsing home.
  }, [location.pathname]);

  // Auth & Data Fetching Effect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setUserRole('guest');
        setLoading(false);
        return;
      }

      try {
        if (currentUser.role === 'admin') {
          setUserRole('admin');
          const data = await adminService.getProfiles();
          setStudents(data);
        } else {
          setUserRole('student');
          const myProfile = await studentService.getProfile();
          setStudents([myProfile]);
          setActiveStudentId(myProfile.id);
        }
      } catch (err) {
        console.error("Lỗi khi fetch API giả lập:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

  // Handle auto score update (Frontend projection before save)
  useEffect(() => {
    if (!student || student.id === 'LOADING') return;

    let score = 0;
    (Object.values(student.evidences) as Evidence[][]).forEach(list => {
      list.forEach(ev => {
        if (ev.status === 'Approved' || (student.status === 'Draft' || student.status === 'Submitted' || student.status === 'Processing')) {
          score += ev.points;
        }
      });
    });
    if (student.isPartyMember) score += 0.4;
    if (student.gpa >= 3.4) score += 0.1;
    if (student.trainingPoints >= 90) score += 0.1;

    const newTotal = Number(score.toFixed(1));
    if (student.totalScore !== newTotal && userRole === 'student') {
      // In a real app we might debounce this PUT request, 
      // but here we just optimistically update the state and fire the API when user actually presses save or via useEffect
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, totalScore: newTotal } : s));
    }
  }, [student?.evidences, student?.isPartyMember, student?.gpa, student?.trainingPoints, student?.status, userRole]);


  // ================= STUDENT ACTIONS =================

  const addEvidence = async (type: CriterionType, ev: Evidence) => {
    const currentUser = authService.getCurrentUser();
    // Optimistic UI: add evidence immediately so checkHardMet sees it right away
    setStudents(prev => prev.map(s => s.id === student.id ? {
      ...s,
      evidences: {
        ...s.evidences,
        [type]: [...(s.evidences[type] || []), ev]
      }
    } : s));
    try {
      const updatedProfile = await studentService.addEvidence(type, ev);
      setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
    } catch (err) {
      console.error('addEvidence failed:', err);
      // Rollback on failure
      setStudents(prev => prev.map(s => s.id === student.id ? {
        ...s,
        evidences: {
          ...s.evidences,
          [type]: (s.evidences[type] || []).filter(e => e.id !== ev.id)
        }
      } : s));
    }
  };

  const handleUpdateEvidence = async (type: CriterionType, id: string, updatedEv: Evidence) => {
    const currentUser = authService.getCurrentUser();
    const originalStudent = students.find(s => s.id === student.id);
    const originalEvidences = originalStudent?.evidences[type] || [];
    const originalEvidence = originalEvidences.find(e => e.id === id);

    // Optimistic UI: update evidence immediately
    setStudents(prev => prev.map(s => s.id === student.id ? {
      ...s,
      evidences: {
        ...s.evidences,
        [type]: (s.evidences[type] || []).map(e => e.id === id ? updatedEv : e)
      }
    } : s));

    try {
      const updatedProfile = await studentService.updateEvidence(type, id, updatedEv);
      setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
    } catch (err) {
      console.error('updateEvidence failed:', err);
      // Rollback on failure
      setStudents(prev => prev.map(s => s.id === student.id ? {
        ...s,
        evidences: {
          ...s.evidences,
          [type]: originalEvidences
        }
      } : s));
    }
  };

  const removeEvidence = async (type: CriterionType, id: string) => {
    const currentUser = authService.getCurrentUser();
    // Optimistic UI: remove evidence immediately
    setStudents(prev => prev.map(s => s.id === student.id ? {
      ...s,
      evidences: {
        ...s.evidences,
        [type]: (s.evidences[type] || []).filter(e => e.id !== id)
      }
    } : s));
    try {
      const updatedProfile = await studentService.removeEvidence(type, id);
      setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
    } catch (err) {
      console.error('removeEvidence failed:', err);
    }
  };

  const updateProfile = async (data: Partial<StudentProfile>) => {
    const currentUser = authService.getCurrentUser();
    // Optimistic UI update (update exactly the active student in the list)
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, ...data } : s));
    // Real API Call (don't block UI input, just let it sync in background)
    studentService.updateProfile(data).then(updatedProfile => {
       setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
    }).catch(console.error);
  };

  const updateEvidenceExplanation = async (type: CriterionType, id: string, explanation: string, file?: File) => {
    const currentUser = authService.getCurrentUser();
    const updatedProfile = await studentService.explainEvidence(type, id, explanation, file);
    setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
  };

  const updateFieldExplanation = async (field: keyof StudentProfile['verifications'], explanation: string, file?: File) => {
    const currentUser = authService.getCurrentUser();
    const updatedProfile = await studentService.explainField(field, explanation, file);
    setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
  };

  const handleResubmitExplanation = async () => {
    const currentUser = authService.getCurrentUser();
    const updatedProfile = await studentService.submitProfile();
    setStudents([updatedProfile]);
  };

  const handleSubmit = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const updatedProfile = await studentService.submitProfile();
      setStudents([updatedProfile]);
      alert('Hồ sơ của bạn đã được nộp thành công!');
    } catch (err: any) {
      console.error("Submit Error:", err);
      const msg = err.response?.data?.detail || "Bạn chưa đạt đủ các chuẩn cứng cơ bản để nộp hồ sơ.";
      alert(msg);
    }
  };

  const handleUnsubmit = async () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy nộp hồ sơ để chỉnh sửa lại không?")) {
      const currentUser = authService.getCurrentUser();
      const updatedProfile = await studentService.unsubmitProfile();
      setStudents([updatedProfile]);
      alert("Đã hủy nộp hồ sơ! Bạn có thể chỉnh sửa ngay bây giờ.");
    }
  };

  // ================= ADMIN ACTIONS =================
  const updateStudentInAdminList = (updated: StudentProfile) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleAdminUpdateStatus = async (status: StudentProfile['status'], feedback?: string) => {
    try {
      const updated = await adminService.updateProfileStatus(student.id, status, feedback);
      updateStudentInAdminList(updated);
    } catch (err: any) {
      alert("Lỗi cập nhật trạng thái hồ sơ: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAdminUpdateEvidenceStatus = async (type: CriterionType, id: string, status: Evidence['status'], feedback?: string) => {
    try {
      const updated = await adminService.updateEvidenceStatus(student.id, id, type, status, feedback);
      updateStudentInAdminList(updated);
    } catch (err: any) {
      alert("Lỗi cập nhật trạng thái minh chứng: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateFieldVerification = async (field: keyof StudentProfile['verifications'], status: FieldVerification['status'], feedback?: string) => {
    try {
      const updated = await adminService.updateFieldStatus(student.id, field, status, feedback);
      updateStudentInAdminList(updated);
    } catch (err: any) {
      alert("Lỗi cập nhật trạng thái trường xác minh: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAddFace = async (face: Omit<FeaturedFace, 'id'>) => {
    const newFace = await adminService.addFace(face);
    setFaces(prev => [...prev, newFace]);
  };

  const handleUpdateFace = async (id: string, face: Partial<FeaturedFace>) => {
    const updatedFace = await adminService.updateFace(id, face);
    setFaces(prev => prev.map(f => f.id === id ? updatedFace : f));
  };

  const handleDeleteFace = async (id: string) => {
    await adminService.deleteFace(id);
    setFaces(prev => prev.filter(f => f.id !== id));
  };

  const handleAddPost = async (post: { title: string, content: string, status: string, imageFile?: File }) => {
    const newPost = await adminService.addPost(post);
    setPosts(prev => [newPost, ...prev]);
  };

  const handleUpdatePost = async (id: string, post: { title?: string, content?: string, status?: string, imageFile?: File }) => {
    const updatedPost = await adminService.updatePost(id, post);
    setPosts(prev => prev.map(p => p.id === id ? updatedPost : p));
  };

  const handleDeletePost = async (id: string) => {
    await adminService.deletePost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };


  // ================= NAVIGATION & AUTH =================

  const handleLogin = (role: 'student' | 'admin', studentId?: string, isInitialLoad?: boolean) => {
    setUserRole(role);
    if (!isInitialLoad) {
      if (role === 'admin') navigate('/admin');
      else navigate('/profile');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUserRole('guest');
    setActiveStudentId('');
    setStudents([]);
    navigate('/');
  };

  const handleNavigate = (page: string) => {
    if (page === 'home') navigate('/');
    else if (page === 'login') navigate('/login');
    else if (page === 'profile') navigate('/profile');
    else if (page === 'admin') navigate('/admin');
    else navigate(page);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col gap-4">
        <i className="fas fa-circle-notch fa-spin text-4xl text-blue-900"></i>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <Layout userType={userRole} onNavigate={handleNavigate} onLogout={handleLogout}>
      <AppRoutes
        userRole={userRole}
        faces={faces}
        posts={posts}
        student={student}
        students={students}
        onLogin={handleLogin}
        onNavigate={handleNavigate}
        addEvidence={addEvidence}
        removeEvidence={removeEvidence}
        updateEvidence={handleUpdateEvidence}
        updateProfile={updateProfile}
        updateEvidenceExplanation={updateEvidenceExplanation}
        updateFieldExplanation={updateFieldExplanation}
        onSubmit={handleSubmit}
        onResubmit={handleResubmitExplanation}
        onUnsubmit={handleUnsubmit}
        setActiveStudentId={setActiveStudentId}
        criteriaGroups={criteriaGroups}
        setCriteriaGroups={setCriteriaGroups}
        handleAdminUpdateStatus={handleAdminUpdateStatus}
        handleAdminUpdateEvidenceStatus={handleAdminUpdateEvidenceStatus}
        handleUpdateFieldVerification={handleUpdateFieldVerification}
        handleAddFace={handleAddFace}
        handleUpdateFace={handleUpdateFace}
        handleDeleteFace={handleDeleteFace}
        onAddPost={handleAddPost}
        onUpdatePost={handleUpdatePost}
        onDeletePost={handleDeletePost}
      />
    </Layout>
  );
};

export default App;
