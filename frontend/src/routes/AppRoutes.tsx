import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomeView from '../pages/HomeView';
import LoginView from '../pages/LoginView';
import StudentDashboard from '../pages/StudentDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ProtectedRoute from '../components/ProtectedRoute';
import { StudentProfile, FeaturedFace, CriterionType, Evidence, FieldVerification } from '../types';

interface AppRoutesProps {
  userRole: 'student' | 'admin' | 'guest';
  faces: FeaturedFace[];
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
  handleAdminUpdateStatus: (status: StudentProfile['status'], feedback?: string) => void;
  handleAdminUpdateEvidenceStatus: (cat: CriterionType, id: string, status: Evidence['status'], feedback?: string) => void;
  handleUpdateFieldVerification: (field: keyof StudentProfile['verifications'], action: FieldVerification['status'], feedback?: string) => void;
  handleAddFace: (face: Omit<FeaturedFace, 'id'>) => void;
  handleUpdateFace: (id: string, face: Partial<FeaturedFace>) => void;
  handleDeleteFace: (id: string) => void;
  allCriteria: any[];
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  userRole,
  faces,
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
  handleAdminUpdateStatus,
  handleAdminUpdateEvidenceStatus,
  handleUpdateFieldVerification,
  handleAddFace,
  handleUpdateFace,
  handleDeleteFace,
  allCriteria
}) => {
  return (
    <Routes>
      <Route path="/" element={<HomeView faces={faces} userRole={userRole} onNavigate={onNavigate} />} />
      <Route path="/login" element={<LoginView onLogin={onLogin} onNavigate={onNavigate} />} />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard
            student={student}
            allCriteria={allCriteria}
            addEvidence={addEvidence}
            removeEvidence={removeEvidence}
            updateProfile={updateProfile}
            updateEvidenceExplanation={updateEvidenceExplanation}
            updateFieldExplanation={updateFieldExplanation}
            onSubmit={onSubmit}
            onResubmit={onResubmit}
            onUnsubmit={onUnsubmit}
          />
        </ProtectedRoute>
      } />
      <Route path="/admin/:activeTab?" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard
            students={students}
            selectedStudent={student}
            allCriteriaProps={allCriteria}
            onSelectStudent={setActiveStudentId}
            onUpdateStatus={handleAdminUpdateStatus}
            onUpdateEvidenceStatus={handleAdminUpdateEvidenceStatus}
            onUpdateFieldVerification={handleUpdateFieldVerification}
            faces={faces}
            onAddFace={handleAddFace}
            onUpdateFace={handleUpdateFace}
            onDeleteFace={handleDeleteFace}
          />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
