import React, { useCallback } from 'react';
import toast from 'react-hot-toast';
import { studentService } from '../services/studentService';
import { StudentProfile, Evidence, CriterionType } from '../types';

export const useStudentActions = (
  student: StudentProfile,
  setStudents: React.Dispatch<React.SetStateAction<StudentProfile[]>>,
  userRole: string
) => {
  const addEvidence = useCallback(async (type: CriterionType, ev: Evidence) => {
    const files = ev.files || [];
    try {
      if (files.length > 1) {
        toast.loading(`Đang tải lên ${files.length} minh chứng...`, { id: 'upload-multi' });
        let latestProfile = student;
        for (const file of files) {
          const singleEv = { ...ev, files: [file], fileName: file.name };
          latestProfile = await studentService.addEvidence(type, singleEv);
        }
        setStudents(prev => prev.map(s => s.id === latestProfile.id ? latestProfile : s));
        toast.success(`Đã tải lên ${files.length} minh chứng thành công!`, { id: 'upload-multi' });
      } else {
        const updatedProfile = await studentService.addEvidence(type, ev);
        setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
        toast.success(`Đã thêm minh chứng: ${ev.name}`);
      }
    } catch (err: any) {
      console.error("Add Evidence Error:", err);
      const errorMsg = err.response?.data?.detail || 'Lỗi khi thêm minh chứng';
      toast.error(errorMsg, { id: 'upload-multi' });
    }
  }, [student, setStudents]);

  const removeEvidence = useCallback(async (type: CriterionType, id: string) => {
    try {
      const updatedProfile = await studentService.removeEvidence(type, id);
      setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
      toast.success('Đã xóa minh chứng');
    } catch (err) {
      toast.error('Lỗi khi xóa minh chứng');
    }
  }, [setStudents]);

  const handleSubmit = useCallback(async () => {
    try {
      const updatedProfile = await studentService.submitProfile();
      setStudents([updatedProfile]);
      toast.success('Hồ sơ của bạn đã được nộp thành công!', { duration: 5000 });
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Bạn chưa đạt đủ các chuẩn cứng cơ bản để nộp hồ sơ.";
      toast.error(msg, { duration: 6000 });
    }
  }, [setStudents]);

  const handleUnsubmit = useCallback(async () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy nộp hồ sơ để chỉnh sửa lại không?")) {
      try {
        const updatedProfile = await studentService.unsubmitProfile();
        setStudents([updatedProfile]);
        toast.success("Đã hủy nộp hồ sơ!");
      } catch (err) {
        toast.error("Lỗi khi hủy nộp hồ sơ");
      }
    }
  }, [setStudents]);

  const handleResubmit = useCallback(async () => {
    try {
      const updatedProfile = await studentService.submitProfile();
      setStudents([updatedProfile]);
      toast.success("Đã nộp lại giải trình!");
    } catch (err) {
      toast.error("Lỗi khi nộp lại");
    }
  }, [setStudents]);

  const updateProfile = useCallback(async (data: Partial<StudentProfile>) => {
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, ...data } : s));
    try {
      const updatedProfile = await studentService.updateProfile(data);
      setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
      toast.success("Đã cập nhật thông tin");
    } catch (err) {
      toast.error("Lỗi khi cập nhật thông tin");
    }
  }, [student.id, setStudents]);

  const handleUpdateEvidence = useCallback(async (type: CriterionType, id: string, updatedEv: Evidence) => {
    const files = updatedEv.files || [];
    try {
      if (files.length > 1) {
        toast.loading(`Đang tải lên thêm ${files.length - 1} minh chứng...`, { id: 'update-multi' });
        
        // 1. Update the current record with ONLY the first file
        const firstFileEv = { ...updatedEv, files: [files[0]], fileName: files[0].name };
        let latestProfile = await studentService.updateEvidence(type, id, firstFileEv);
        
        // 2. Add the rest as NEW records
        for (let i = 1; i < files.length; i++) {
          const extraEv = { ...updatedEv, files: [files[i]], fileName: files[i].name };
          latestProfile = await studentService.addEvidence(type, extraEv);
        }
        
        setStudents(prev => prev.map(s => s.id === latestProfile.id ? latestProfile : s));
        toast.success(`Đã cập nhật và thêm ${files.length - 1} minh chứng mới!`, { id: 'update-multi' });
      } else {
        const updatedProfile = await studentService.updateEvidence(type, id, updatedEv);
        setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
        toast.success("Đã cập nhật minh chứng");
      }
    } catch (err: any) {
      console.error("Update Evidence Error:", err);
      const errorMsg = err.response?.data?.detail || 'Lỗi khi cập nhật minh chứng';
      toast.error(errorMsg, { id: 'update-multi' });
    }
  }, [setStudents]);

  const updateEvidenceExplanation = useCallback(async (type: CriterionType, id: string, explanation: string, file?: File) => {
    try {
      const updatedProfile = await studentService.explainEvidence(type, id, explanation, file);
      setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
      toast.success("Đã gửi giải trình minh chứng");
    } catch (err) {
      toast.error("Lỗi khi gửi giải trình");
    }
  }, [setStudents]);

  const updateFieldExplanation = useCallback(async (field: keyof StudentProfile['verifications'], explanation: string, file?: File) => {
    try {
      const updatedProfile = await studentService.explainField(field, explanation, file);
      setStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
      toast.success("Đã gửi giải trình chuẩn");
    } catch (err) {
      toast.error("Lỗi khi gửi giải trình chuẩn");
    }
  }, [setStudents]);

  return { 
    addEvidence, removeEvidence, handleSubmit, handleUnsubmit, handleResubmit, 
    updateProfile, handleUpdateEvidence, updateEvidenceExplanation, updateFieldExplanation 
  };
};
