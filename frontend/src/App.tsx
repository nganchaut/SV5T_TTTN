import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import AppRoutes from './routes/AppRoutes';
import { CriterionType, Evidence, StudentProfile, FeaturedFace, Post } from './types';
import { authService } from './services/authService';
import { adminService, publicService } from './services/adminService';
import { studentService } from './services/studentService';
import systemService from './services/systemService';
import { SystemConfig } from './types';

// Hooks
import { useStudentActions } from './hooks/useStudentActions';
import { useAdminActions } from './hooks/useAdminActions';
import { useContentActions } from './hooks/useContentActions';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userRole, setUserRole] = useState<'student' | 'admin' | 'guest'>('guest');
  const [faces, setFaces] = useState<FeaturedFace[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string>('');
  const [criteriaGroups, setCriteriaGroups] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemConfig | null>(null);
  
  const fallbackStudent: StudentProfile = {
    id: 'LOADING', fullName: 'Đang tải...', studentId: '', class: '', faculty: '',
    gpa: 0, peScore: 0, trainingPoints: 0, englishLevel: 'None', englishGpa: 0, isPartyMember: false, noViolation: false, status: 'Draft',
    evidences: { [CriterionType.ETHICS]: [], [CriterionType.ACADEMIC]: [], [CriterionType.PHYSICAL]: [], [CriterionType.VOLUNTEER]: [], [CriterionType.INTEGRATION]: [] },
    totalScore: 0,
    verifications: { gpa: { status: 'Pending' }, trainingPoints: { status: 'Pending' }, peScore: { status: 'Pending' }, english: { status: 'Pending' }, partyMember: { status: 'Pending' } }
  };

  const student = activeStudentId ? (students.find(s => s.id === activeStudentId) || fallbackStudent) : fallbackStudent;
  const [loading, setLoading] = useState(true);

  // Initialize Hooks
  const { 
    addEvidence, 
    removeEvidence, 
    handleSubmit, 
    handleUnsubmit, 
    handleResubmit, 
    updateProfile,
    handleUpdateEvidence,
    updateEvidenceExplanation,
    updateFieldExplanation
  } = useStudentActions(student, setStudents, userRole);

  const { 
    handleAdminUpdateStatus, 
    handleAdminUpdateEvidenceStatus,
    handleUpdateFieldVerification 
  } = useAdminActions(setStudents);

  const {
    handleAddFace,
    handleUpdateFace,
    handleDeleteFace,
    onAddPost,
    onUpdatePost,
    onDeletePost
  } = useContentActions(setFaces, setPosts);

  useEffect(() => {
    publicService.getFaces().then(setFaces).catch(console.error);
    publicService.getCriteria().then(setCriteriaGroups).catch(console.error);
    publicService.getPosts().then(setPosts).catch(console.error);
    systemService.getSettings().then(setSystemSettings).catch(console.error);
  }, []);

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
          const [profileData, postData] = await Promise.all([
            adminService.getProfiles(),
            adminService.getPosts()
          ]);
          setStudents(profileData);
          setPosts(postData);
        } else {
          setUserRole('student');
          const myProfile = await studentService.getProfile();
          setStudents([myProfile]);
          setActiveStudentId(myProfile.id);
        }
      } catch (err) {
        console.error("Lỗi khi fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

  // Auth & Navigation
  const handleLogin = (role: 'student' | 'admin') => {
    setUserRole(role);
    if (role === 'admin') navigate('/admin');
    else navigate('/profile');
  };

  const handleLogout = () => {
    authService.logout();
    setUserRole('guest');
    setActiveStudentId('');
    setStudents([]);
    navigate('/');
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
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Layout userType={userRole} onNavigate={navigate} onLogout={handleLogout}>
        <AppRoutes
          userRole={userRole}
          faces={faces}
          posts={posts}
          student={student}
          students={students}
          onLogin={handleLogin}
          onNavigate={navigate}
          addEvidence={addEvidence}
          removeEvidence={removeEvidence}
          updateEvidence={handleUpdateEvidence}
          updateProfile={updateProfile}
          updateEvidenceExplanation={updateEvidenceExplanation}
          updateFieldExplanation={updateFieldExplanation}
          onSubmit={handleSubmit}
          onResubmit={handleResubmit}
          onUnsubmit={handleUnsubmit}
          setActiveStudentId={setActiveStudentId}
          criteriaGroups={criteriaGroups}
          setCriteriaGroups={setCriteriaGroups}
          handleAdminUpdateStatus={(s, f) => handleAdminUpdateStatus(student.id, s, f)}
          handleAdminUpdateEvidenceStatus={(t, id, s, f) => handleAdminUpdateEvidenceStatus(student.id, id, t, s, f)}
          handleUpdateFieldVerification={handleUpdateFieldVerification}
          handleAddFace={handleAddFace}
          handleUpdateFace={handleUpdateFace}
          handleDeleteFace={handleDeleteFace}
          onAddPost={onAddPost}
          onUpdatePost={onUpdatePost}
          onDeletePost={onDeletePost}
          systemSettings={systemSettings}
          setSystemSettings={setSystemSettings}
        />
      </Layout>
    </>
  );
};

export default App;
