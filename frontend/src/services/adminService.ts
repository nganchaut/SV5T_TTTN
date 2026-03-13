import { apiClient } from './apiClient';
import { StudentProfile, CriterionType, Evidence, FieldVerification, FeaturedFace } from '../types';
import { mapBackendStudentToFrontend } from '../utils/mapper';

export const adminService = {
  getProfiles: async (): Promise<StudentProfile[]> => {
    const response = await apiClient.get('/api/admin/students/');
    return response.data.map(mapBackendStudentToFrontend);
  },

  updateProfileStatus: async (studentId: string, status: StudentProfile['status'], feedback?: string): Promise<StudentProfile> => {
    // Map status FE -> các endpoint backend hiện có
    let url: string | null = null;
    let payload: any = {};

    if (status === 'Approved') {
      url = `/api/admin/students/${studentId}/approve/`;
      payload = { phanHoi: feedback || '' };
    } else if (status === 'Rejected') {
      url = `/api/admin/students/${studentId}/reject/`;
      payload = { phanHoi: feedback || '' };
    } else if (status === 'Processing') {
      // Gửi yêu cầu giải trình
      url = `/api/admin/students/${studentId}/feedback/`;
      payload = { phanHoi: feedback || '' };
    } else {
      // Các trạng thái khác không có endpoint riêng, trả về hồ sơ hiện tại
      const detail = await apiClient.get(`/api/admin/students/${studentId}/`);
      return mapBackendStudentToFrontend(detail.data);
    }

    await apiClient.post(url, payload);
    const detail = await apiClient.get(`/api/admin/students/${studentId}/`);
    return mapBackendStudentToFrontend(detail.data);
  },

  updateEvidenceStatus: async (studentId: string, evidenceId: string, type: CriterionType, status: Evidence['status'], feedback?: string): Promise<StudentProfile> => {
    // Backend dùng endpoint /api/admin/evidences/<id>/<action>/
    let action: string;
    const payload: any = {};

    if (status === 'Approved') {
      action = 'approve';
      if (feedback) payload.PhanHoiAdmin = feedback;
      // Diem có thể gửi kèm nếu admin chỉnh tay, còn không backend tự tính
    } else if (status === 'Rejected') {
      action = 'reject';
      if (feedback) payload.PhanHoiAdmin = feedback;
    } else if (status === 'NeedsExplanation') {
      action = 'request-explain';
      if (feedback) payload.PhanHoiAdmin = feedback;
    } else {
      // Không hỗ trợ các trạng thái khác ở backend
      const detail = await apiClient.get(`/api/admin/students/${studentId}/`);
      return mapBackendStudentToFrontend(detail.data);
    }

    await apiClient.post(`/api/admin/evidences/${evidenceId}/${action}/`, payload);
    const detail = await apiClient.get(`/api/admin/students/${studentId}/`);
    return mapBackendStudentToFrontend(detail.data);
  },

  updateFieldStatus: async (studentId: string, fieldId: keyof StudentProfile['verifications'], status: FieldVerification['status'], feedback?: string): Promise<StudentProfile> => {
    // Đúng URL backend: /api/admin/students/<pk>/verifications/<field>/
    await apiClient.put(`/api/admin/students/${studentId}/verifications/${fieldId}/`, {
      TrangThai: status,
      PhanHoi: feedback || ''
    });
    const detail = await apiClient.get(`/api/admin/students/${studentId}/`);
    return mapBackendStudentToFrontend(detail.data);
  },

  addFace: async (face: Omit<FeaturedFace, 'id'>): Promise<FeaturedFace> => {
    const payload = {
      TenSinhVien: face.name,
      ThanhTich: face.achievement,
      NoiDung: face.content,
      // If we support actual image files, we would use FormData here
    };
    const response = await apiClient.post('/api/featured/', payload);
    const d = response.data;
    return { id: String(d.id), name: d.TenSinhVien, achievement: d.ThanhTich, content: d.NoiDung, image: d.HinhAnhUrl || d.HinhAnh || '' };
  },

  updateFace: async (id: string, face: Partial<FeaturedFace>): Promise<FeaturedFace> => {
    const payload: any = {};
    if (face.name) payload.TenSinhVien = face.name;
    if (face.achievement) payload.ThanhTich = face.achievement;
    if (face.content) payload.NoiDung = face.content;
    const response = await apiClient.put(`/api/featured/${id}/`, payload);
    const d = response.data;
    return { id: String(d.id), name: d.TenSinhVien, achievement: d.ThanhTich, content: d.NoiDung, image: d.HinhAnhUrl || d.HinhAnh || '' };
  },

  deleteFace: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/featured/${id}/`);
  },

  getPosts: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/admin/posts/');
    return response.data.map((p: any) => ({
      ...p,
      id: String(p.id),
      title: p.TieuDe,
      date: p.NgayDang,
      status: p.TrangThai
    }));
  },

  addPost: async (post: any): Promise<any> => {
    const response = await apiClient.post('/api/posts/', { TieuDe: post.title, NoiDung: post.content || '', TrangThai: post.status });
    const p = response.data;
    return { ...p, id: String(p.id), title: p.TieuDe, date: p.NgayDang, status: p.TrangThai };
  },

  updatePost: async (id: string, post: any): Promise<any> => {
    const payload: any = {};
    if (post.title) payload.TieuDe = post.title;
    if (post.status) payload.TrangThai = post.status;
    const response = await apiClient.put(`/api/posts/${id}/`, payload);
    const p = response.data;
    return { ...p, id: String(p.id), title: p.TieuDe, date: p.NgayDang, status: p.TrangThai };
  },

  deletePost: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/posts/${id}/`);
  },

  getUsers: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/auth/accounts/');
    return response.data.map((u: any) => ({
      id: String(u.id),
      name: u.HoTen || u.TenDangNhap,
      email: u.Email,
      role: u.VaiTro === 'SinhVien' ? 'SINH VIÊN' : 
            u.VaiTro === 'Admin' ? 'ADMIN' : 
            u.VaiTro === 'ThuKy' ? 'THƯ KÝ' : 'THẨM ĐỊNH VIÊN'
    }));
  },

  addUser: async (user: { username: string, password?: string, role: string }): Promise<any> => {
    const payload = {
      TenDangNhap: user.username,
      MatKhau: user.password || '123456',
      VaiTro: user.role
    };
    const response = await apiClient.post('/api/auth/accounts/', payload);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    // Backend doesn't have hard delete for accounts yet based on views.py (only patch status)
    // But we'll try if there's an endpoint or just set Inactive
    await apiClient.patch(`/api/auth/accounts/${id}/`, { TrangThai: 'Inactive' });
  },

  getCriteria: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/criteria/');
    return response.data;
  },

  addCategory: async (name: string, order: number): Promise<any> => {
    const response = await apiClient.post('/api/criteria/', { TenNhom: name, ThuTu: order });
    return response.data;
  },

  updateCategory: async (id: number, name: string, order: number): Promise<any> => {
    const response = await apiClient.put(`/api/criteria/${id}/`, { TenNhom: name, ThuTu: order });
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/criteria/${id}/`);
  },

  addCriterion: async (data: any): Promise<any> => {
    const payload = {
      NhomTieuChi: data.nhomId,
      MoTa: data.description,
      LoaiTieuChi: data.isHard ? 'Cung' : 'Cong',
      CoSoQuyetDinh: data.hasDecisionNumber,
      ThuTu: 0,
      diem_cap_do: [
        { CapDo: 'Cấp Khoa/CLB', Diem: data.levelPoints?.khoa || 0 },
        { CapDo: 'Cấp Trường/Phường/Xã', Diem: data.levelPoints?.truong || 0 },
        { CapDo: 'Cấp ĐHĐN', Diem: data.levelPoints?.dhdn || 0 },
        { CapDo: 'Cấp Tỉnh/Thành phố', Diem: data.levelPoints?.tinh || 0 },
        { CapDo: 'Cấp Trung ương', Diem: data.levelPoints?.tw || 0 },
      ]
    };
    const response = await apiClient.post('/api/admin/criteria/tieuchi/', payload);
    return response.data;
  },

  updateCriterion: async (id: string, data: any): Promise<any> => {
    const payload = {
      MoTa: data.description,
      LoaiTieuChi: data.isHard ? 'Cung' : 'Cong',
      CoSoQuyetDinh: data.hasDecisionNumber,
      diem_cap_do: [
        { CapDo: 'Cấp Khoa/CLB', Diem: data.levelPoints?.khoa || 0 },
        { CapDo: 'Cấp Trường/Phường/Xã', Diem: data.levelPoints?.truong || 0 },
        { CapDo: 'Cấp ĐHĐN', Diem: data.levelPoints?.dhdn || 0 },
        { CapDo: 'Cấp Tỉnh/Thành phố', Diem: data.levelPoints?.tinh || 0 },
        { CapDo: 'Cấp Trung ương', Diem: data.levelPoints?.tw || 0 },
      ]
    };
    const response = await apiClient.put(`/api/admin/criteria/tieuchi/${id}/`, payload);
    return response.data;
  },

  deleteCriterion: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/criteria/tieuchi/${id}/`);
  }
};

export const publicService = {
  getFaces: async (): Promise<FeaturedFace[]> => {
    const response = await apiClient.get('/api/featured/');
    return response.data.map((d: any) => ({
      id: String(d.id),
      name: d.TenSinhVien,
      achievement: d.ThanhTich,
      content: d.NoiDung,
      image: d.HinhAnh || ''
    }));
  }
};
