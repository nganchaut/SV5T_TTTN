import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AppRoutes from './routes/AppRoutes';
import { CriterionType, Evidence, StudentProfile, FeaturedFace, FieldVerification } from './types';
import { checkHardMet } from './pages/StudentDashboard';
import { authService } from './services/authService';
import { studentService } from './services/studentService';
import { adminService, publicService } from './services/adminService';
import { useUI } from './context/UIContext';
import { apiClient } from './services/apiClient';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, confirm } = useUI();

  const [userRole, setUserRole] = useState<'student' | 'admin' | 'guest'>('guest');
  const [faces, setFaces] = useState<FeaturedFace[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string>('');
  
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

  // Initial load: Faces are public
  useEffect(() => {
    publicService.getFaces().then(setFaces).catch(console.error);
  }, []);

  // Sync state on mount and route changes if necessary
  useEffect(() => {
    // Only fetch auth state if we don't know it, or we rely on the other effect to do it.
    // The main data fetching effect already pulls the current user!
    // We just don't want to force userRole to guest when browsing home.
  }, [location.pathname]);

  const [allCriteria, setAllCriteria] = useState<any[]>([]);

  // Auth & Data Fetching Effect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      
      const loadCriteria = async () => {
      try {
        const response = await apiClient.get('/api/criteria/');
        setAllCriteria(response.data);
      } catch (err) {
        console.error('Failed to load criteria:', err);
      }
    };
      await loadCriteria();

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
        console.error("Lỗi khi fetch API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

  // Handle auto score update (Frontend projection before save) - REMOVED to prevent input jumping cycles
  // Score should be calculated dynamically for display or updated only on save


  // ================= STUDENT ACTIONS =================

  const addEvidence = async (type: CriterionType, ev: Evidence) => {
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
    } catch (err: any) {
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

  const removeEvidence = async (type: CriterionType, id: string) => {
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
    if (!activeStudentId) return;
    
    // Optimistic UI update
    setStudents(prev => prev.map(s => s.id === activeStudentId ? { ...s, ...data } : s));
    
    // API Call
    try {
      const updatedProfile = await studentService.updateProfile(data);
      setStudents(prev => prev.map(s => s.id === updatedProfile.id ? { ...s, ...updatedProfile } : s));
    } catch (err) {
      console.error('updateProfile failed:', err);
    }
  };

  const updateEvidenceExplanation = async (type: CriterionType, id: string, explanation: string) => {
    const updatedProfile = await studentService.explainEvidence(type, id, explanation);
    setStudents([updatedProfile]);
  };

  const updateFieldExplanation = async (field: keyof StudentProfile['verifications'], explanation: string) => {
    const updatedProfile = await studentService.explainField(field, explanation);
    setStudents([updatedProfile]);
  };

  const handleResubmitExplanation = async () => {
    const ok = await confirm({ title: 'Xác nhận gửi phản hồi', message: 'Bạn xác nhận gửi phản hồi giải trình này cho cán bộ xét duyệt?' });
    if (ok) {
      const updatedProfile = await studentService.submitProfile();
      setStudents([updatedProfile]);
      toast("✅ Đã gửi phản hồi giải trình thành công!");
    }
  };

  const handleSubmit = async () => {
    if (Object.values(CriterionType).every(cat => checkHardMet(cat, student, allCriteria))) {
      const updatedProfile = await studentService.submitProfile();
      setStudents([updatedProfile]);
      toast('✅ Hồ sơ đã gửi thành công!');
    } else {
      toast('❌ Bạn chưa đạt đủ các chuẩn cứng cơ bản.', 'error');
    }
  };

  const handleUnsubmit = async () => {
    const ok = await confirm({ title: 'Rút hồ sơ', message: 'Bạn có chắc chắn muốn hủy nộp hồ sơ để chỉnh sửa lại không?', variant: 'danger', confirmText: 'Rút hồ sơ' });
    if (ok) {
      const updatedProfile = await studentService.unsubmitProfile();
      setStudents([updatedProfile]);
      toast("✅ Đã hủy nộp hồ sơ! Bạn có thể chỉnh sửa ngay bây giờ.");
    }
  };

  // ================= ADMIN ACTIONS =================
  const updateStudentInAdminList = (updated: StudentProfile) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleAdminUpdateStatus = async (status: StudentProfile['status'], feedback?: string) => {
    const updated = await adminService.updateProfileStatus(student.id, status, feedback);
    updateStudentInAdminList(updated);
  };

  const handleAdminUpdateEvidenceStatus = async (type: CriterionType, id: string, status: Evidence['status'], feedback?: string) => {
    const updated = await adminService.updateEvidenceStatus(student.id, id, type, status, feedback);
    updateStudentInAdminList(updated);
  };

  const handleUpdateFieldVerification = async (field: keyof StudentProfile['verifications'], status: FieldVerification['status'], feedback?: string) => {
    const updated = await adminService.updateFieldStatus(student.id, field, status, feedback);
    updateStudentInAdminList(updated);
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


  // ================= NAVIGATION & AUTH =================

  const handleLogin = (role: 'student' | 'admin', studentId?: string, isInitialLoad?: boolean) => {
    setUserRole(role);
    if (!isInitialLoad) {
      if (role === 'admin') navigate('/admin');
      else navigate('/profile');
    }
  };

  const handleNavigate = (page: string) => {
    if (page === 'home') navigate('/');
    else if (page === 'login') navigate('/login');
    else if (page === 'profile') navigate('/profile');
    else if (page === 'admin') navigate('/admin');
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
    <Layout userType={userRole} onNavigate={handleNavigate}>
      <AppRoutes
        userRole={userRole}
        faces={faces}
        student={student}
        students={students}
        onLogin={handleLogin}
        onNavigate={handleNavigate}
        addEvidence={addEvidence}
        removeEvidence={removeEvidence}
        updateProfile={updateProfile}
        updateEvidenceExplanation={updateEvidenceExplanation}
        updateFieldExplanation={updateFieldExplanation}
        onSubmit={handleSubmit}
        onResubmit={handleResubmitExplanation}
        onUnsubmit={handleUnsubmit}
        setActiveStudentId={setActiveStudentId}
        handleAdminUpdateStatus={handleAdminUpdateStatus}
        handleAdminUpdateEvidenceStatus={handleAdminUpdateEvidenceStatus}
        handleUpdateFieldVerification={handleUpdateFieldVerification}
        handleAddFace={handleAddFace}
        handleUpdateFace={handleUpdateFace}
        handleDeleteFace={handleDeleteFace}
        allCriteria={allCriteria}
      />
    </Layout>
  );
};

export default App;
