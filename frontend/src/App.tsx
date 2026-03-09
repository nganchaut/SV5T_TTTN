import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AppRoutes from './routes/AppRoutes';
import { CriterionType, Evidence, StudentProfile, FeaturedFace, FieldVerification } from './types';
import { checkHardMet } from './pages/StudentDashboard';
import { authService } from './services/authService';
import { studentService } from './services/studentService';
import { adminService, publicService } from './services/adminService';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
          // Fake getting student Id from currentUser
          const sId = currentUser.studentId || 'SV001';
          const myProfile = await studentService.getProfile(sId);
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
      const updatedProfile = await studentService.addEvidence(type, ev, currentUser?.studentId);
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
      const updatedProfile = await studentService.removeEvidence(type, id, currentUser?.studentId);
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
    studentService.updateProfile(data, currentUser?.studentId).then(updatedProfile => {
       setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
    }).catch(console.error);
  };

  const updateEvidenceExplanation = async (type: CriterionType, id: string, explanation: string) => {
    const currentUser = authService.getCurrentUser();
    const updatedProfile = await studentService.explainEvidence(type, id, explanation, currentUser?.studentId);
    setStudents([updatedProfile]);
  };

  const updateFieldExplanation = async (field: keyof StudentProfile['verifications'], explanation: string) => {
    const currentUser = authService.getCurrentUser();
    const updatedProfile = await studentService.explainField(field, explanation, currentUser?.studentId);
    setStudents([updatedProfile]);
  };

  const handleResubmitExplanation = async () => {
    if (window.confirm("Bạn xác nhận gửi phản hồi giải trình?")) {
      const currentUser = authService.getCurrentUser();
      const updatedProfile = await studentService.submitProfile(currentUser?.studentId);
      setStudents([updatedProfile]);
      alert("Đã gửi phản hồi giải trình thành công!");
    }
  };

  const handleSubmit = async () => {
    if (Object.values(CriterionType).every(cat => checkHardMet(cat, student))) {
      const currentUser = authService.getCurrentUser();
      const updatedProfile = await studentService.submitProfile(currentUser?.studentId);
      setStudents([updatedProfile]);
      alert('Hồ sơ đã gửi thành công!');
    } else {
      alert('Bạn chưa đạt đủ các chuẩn cứng cơ bản.');
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

  const handleSetFaces = async (newFaces: FeaturedFace[]) => {
    const updated = await adminService.updateFaces(newFaces);
    setFaces(updated);
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
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu từ MSW...</p>
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
        setActiveStudentId={setActiveStudentId}
        handleAdminUpdateStatus={handleAdminUpdateStatus}
        handleAdminUpdateEvidenceStatus={handleAdminUpdateEvidenceStatus}
        handleUpdateFieldVerification={handleUpdateFieldVerification}
        setFaces={handleSetFaces}
      />
    </Layout>
  );
};

export default App;
