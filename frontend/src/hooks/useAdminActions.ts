import React, { useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../services/adminService';
import { StudentProfile, Evidence, CriterionType, FieldVerification } from '../types';

export const useAdminActions = (
  setStudents: React.Dispatch<React.SetStateAction<StudentProfile[]>>
) => {
  const handleAdminUpdateStatus = useCallback(async (studentId: string, status: StudentProfile['status'], feedback?: string) => {
    try {
      const updated = await adminService.updateProfileStatus(studentId, status, feedback);
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
      
      const statusLabels: Record<string, string> = {
        'Approved': 'Đã DUYỆT hồ sơ thành công!',
        'Rejected': 'Đã TỪ CHỐI hồ sơ.',
        'Processing': 'Đã gửi yêu cầu GIẢI TRÌNH/BỔ SUNG.'
      };
      toast.success(statusLabels[status] || 'Đã cập nhật trạng thái hồ sơ');
    } catch (err: any) {
      toast.error("Lỗi cập nhật: " + (err.response?.data?.detail || err.message));
    }
  }, [setStudents]);

  const handleAdminUpdateEvidenceStatus = useCallback(async (studentId: string, id: string, type: CriterionType, status: Evidence['status'], feedback?: string) => {
    try {
      const updated = await adminService.updateEvidenceStatus(studentId, id, type, status, feedback);
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
      toast.success('Đã cập nhật minh chứng');
    } catch (err: any) {
      toast.error("Lỗi cập nhật minh chứng");
    }
  }, [setStudents]);

  const handleUpdateFieldVerification = useCallback(async (studentId: string, field: keyof StudentProfile['verifications'], status: FieldVerification['status'], feedback?: string) => {
    try {
      const updated = await adminService.updateFieldStatus(studentId, field, status, feedback);
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
      toast.success('Đã cập nhật trạng thái trường xác minh');
    } catch (err: any) {
      toast.error("Lỗi cập nhật: " + (err.response?.data?.detail || err.message));
    }
  }, [setStudents]);

  return { handleAdminUpdateStatus, handleAdminUpdateEvidenceStatus, handleUpdateFieldVerification };
};
