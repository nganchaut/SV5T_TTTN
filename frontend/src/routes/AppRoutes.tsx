import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomeView from '../pages/HomeView';
import LoginView from '../pages/LoginView';
import StudentDashboard from '../pages/StudentDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import PostDetailView from '../pages/PostDetailView';
import ProtectedRoute from '../components/ProtectedRoute';
import { StudentProfile, FeaturedFace, CriterionType, Evidence, FieldVerification } from '../types';

interface AppRoutesProps {
  userRole: 'student' | 'admin' | 'guest';
  faces: FeaturedFace[];
  posts: any[];
  student: StudentProfile;
  students: StudentProfile[];
  onLogin: (role: 'student' | 'admin', studentId?: string) => void;
  onNavigate: (page: string) => void;
  // Student Props
  addEvidence: (type: CriterionType, ev: Evidence) => void;
  removeEvidence: (type: CriterionType, id: string) => void;
  updateProfile: (data: Partial<StudentProfile>) => void;
  updateEvidenceExplanation: (cat: CriterionType, id: string, explanation: string) => void;
  updateFieldExplanation: (field: keyof StudentProfile['verifications'], explanation: string) => void;
  onSubmit: () => void;
  onResubmit: () => void;
  onUnsubmit: () => void;
  // Admin Props
  setActiveStudentId: (id: string) => void;
  criteriaGroups: any[];
  setCriteriaGroups: React.Dispatch<React.SetStateAction<any[]>>;
  handleAdminUpdateStatus: (status: StudentProfile['status'], feedback?: string) => void;
  handleAdminUpdateEvidenceStatus: (cat: CriterionType, id: string, status: Evidence['status'], feedback?: string) => void;
  handleUpdateFieldVerification: (field: keyof StudentProfile['verifications'], action: FieldVerification['status'], feedback?: string) => void;
  handleAddFace: (face: Omit<FeaturedFace, 'id'>) => void;
  handleUpdateFace: (id: string, face: Partial<FeaturedFace>) => void;
  handleDeleteFace: (id: string) => void;
  onAddPost: (post: { title: string, content: string, status: string, imageFile?: File }) => void;
  onUpdatePost: (id: string, post: { title?: string, content?: string, status?: string, imageFile?: File }) => void;
  onDeletePost: (id: string) => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  userRole,
  faces,
  posts,
  student,
  students,
  onLogin,
  onNavigate,
  addEvidence,
  removeEvidence,
  updateProfile,
  updateEvidenceExplanation,
  updateFieldExplanation,
  onSubmit,
  onResubmit,
  onUnsubmit,
  setActiveStudentId,
  criteriaGroups,
  setCriteriaGroups,
  handleAdminUpdateStatus,
  handleAdminUpdateEvidenceStatus,
  handleUpdateFieldVerification,
  handleAddFace,
  handleUpdateFace,
  handleDeleteFace,
  onAddPost,
  onUpdatePost,
  onDeletePost
}) => {
  return (
    <Routes>
      <Route path="/" element={<HomeView faces={faces} posts={posts} userRole={userRole} onNavigate={onNavigate} />} />
      <Route path="/posts/:id" element={<PostDetailView posts={posts} />} />
      <Route path="/login" element={<LoginView onLogin={onLogin} onNavigate={onNavigate} />} />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard
            student={student}
            addEvidence={addEvidence}
            removeEvidence={removeEvidence}
            updateProfile={updateProfile}
            updateEvidenceExplanation={updateEvidenceExplanation}
            updateFieldExplanation={updateFieldExplanation}
            onSubmit={onSubmit}
            onResubmit={onResubmit}
            onUnsubmit={onUnsubmit}
            criteriaGroups={criteriaGroups}
          />
        </ProtectedRoute>
      } />
      <Route path="/admin/:activeTab?" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard
            students={students}
            selectedStudent={student}
            onSelectStudent={setActiveStudentId}
            onUpdateStatus={handleAdminUpdateStatus}
            onUpdateEvidenceStatus={handleAdminUpdateEvidenceStatus}
            onUpdateFieldVerification={handleUpdateFieldVerification}
            faces={faces}
            onAddFace={handleAddFace}
            onUpdateFace={handleUpdateFace}
            onDeleteFace={handleDeleteFace}
            criteriaGroups={criteriaGroups}
            setCriteriaGroups={setCriteriaGroups}
            posts={posts}
            onAddPost={onAddPost}
            onUpdatePost={onUpdatePost}
            onDeletePost={onDeletePost}
          />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
