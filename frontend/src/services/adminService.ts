import { apiClient } from './apiClient';
import { StudentProfile, CriterionType, Evidence, FieldVerification, FeaturedFace } from '../types';
import { mapBackendStudentToFrontend, formatUrl } from '../utils/mapper';

export const adminService = {
  getProfiles: async (): Promise<StudentProfile[]> => {
    const response = await apiClient.get('/api/admin/students/');
    return response.data.map(mapBackendStudentToFrontend);
  },

  updateProfileStatus: async (studentId: string, status: StudentProfile['status'], feedback?: string): Promise<StudentProfile> => {
    let action = '';
    if (status === 'Approved') action = 'approve/';
    else if (status === 'Rejected') action = 'reject/';
    else if (status === 'Processing') action = 'feedback/';
    else throw new Error("Invalid status update");
    
    const response = await apiClient.post(`/api/admin/students/${studentId}/${action}`, { phanHoi: feedback });
    
    // Refresh student data completely to get new status & total score from backend
    const returnResponse = await apiClient.get(`/api/admin/students/${studentId}/`);
    return mapBackendStudentToFrontend(returnResponse.data);
  },

  updateEvidenceStatus: async (studentId: string, evidenceId: string, type: CriterionType, status: Evidence['status'], feedback?: string): Promise<StudentProfile> => {
    let action = '';
    if (status === 'Approved') action = 'approve';
    else if (status === 'Rejected') action = 'reject';
    else if (status === 'NeedsExplanation') action = 'request-explain';
    else if (status === 'Pending') action = 'pending';
    else throw new Error("Invalid evidence status update");

    await apiClient.post(`/api/admin/evidences/${evidenceId}/${action}/`, { PhanHoiAdmin: feedback });
    
    const returnResponse = await apiClient.get(`/api/admin/students/${studentId}/`);
    return mapBackendStudentToFrontend(returnResponse.data);
  },

  updateFieldStatus: async (studentId: string, fieldId: keyof StudentProfile['verifications'], status: FieldVerification['status'], feedback?: string): Promise<StudentProfile> => {
    await apiClient.put(`/api/admin/students/${studentId}/verifications/${fieldId}/`, { TrangThai: status, PhanHoi: feedback });
    
    const returnResponse = await apiClient.get(`/api/admin/students/${studentId}/`);
    return mapBackendStudentToFrontend(returnResponse.data);
  },

  deleteStudent: async (studentId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/students/${studentId}/delete/`);
  },

  addFace: async (face: Omit<FeaturedFace, 'id'>): Promise<FeaturedFace> => {
    const formData = new FormData();
    formData.append('TenSinhVien', face.name);
    formData.append('ThanhTich', face.achievement);
    formData.append('NoiDung', face.content);
    if (face.imageFile) {
      formData.append('HinhAnh', face.imageFile);
    }

    const response = await apiClient.post('/api/featured/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const d = response.data;
    return { id: String(d.id), name: d.TenSinhVien, achievement: d.ThanhTich, content: d.NoiDung, image: d.HinhAnh || '' };
  },

  updateFace: async (id: string, face: Partial<FeaturedFace>): Promise<FeaturedFace> => {
    const formData = new FormData();
    if (face.name) formData.append('TenSinhVien', face.name);
    if (face.achievement) formData.append('ThanhTich', face.achievement);
    if (face.content) formData.append('NoiDung', face.content);
    if (face.imageFile) formData.append('HinhAnh', face.imageFile);

    const response = await apiClient.put(`/api/featured/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const d = response.data;
    return { id: String(d.id), name: d.TenSinhVien, achievement: d.ThanhTich, content: d.NoiDung, image: d.HinhAnh || '' };
  },

  deleteFace: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/featured/${id}/`);
  },

  getPosts: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/admin/posts/');
    return response.data.map((p: any) => ({
      id: String(p.id),
      title: p.TieuDe,
      content: p.NoiDung,
      date: p.NgayDang,
      status: p.TrangThai,
      image: formatUrl(p.HinhAnh)
    }));
  },

  addPost: async (post: { title: string, content: string, status: string, imageFile?: File }): Promise<any> => {
    const formData = new FormData();
    formData.append('TieuDe', post.title);
    formData.append('NoiDung', post.content || '');
    formData.append('TrangThai', post.status);
    if (post.imageFile) {
      formData.append('HinhAnh', post.imageFile);
    }

    const response = await apiClient.post('/api/posts/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const p = response.data;
    return { ...p, id: String(p.id), title: p.TieuDe, content: p.NoiDung, date: p.NgayDang, status: p.TrangThai, image: formatUrl(p.HinhAnh) };
  },

  updatePost: async (id: string, post: { title?: string, content?: string, status?: string, imageFile?: File }): Promise<any> => {
    const formData = new FormData();
    if (post.title) formData.append('TieuDe', post.title);
    if (post.content !== undefined) formData.append('NoiDung', post.content);
    if (post.status) formData.append('TrangThai', post.status);
    if (post.imageFile) formData.append('HinhAnh', post.imageFile);

    const response = await apiClient.put(`/api/posts/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const p = response.data;
    return { ...p, id: String(p.id), title: p.TieuDe, content: p.NoiDung, date: p.NgayDang, status: p.TrangThai, image: formatUrl(p.HinhAnh) };
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
            u.VaiTro === 'ThuKy' ? 'THƯ KÝ' : 'THẨM ĐỊNH VIÊN',
      rawRole: u.VaiTro,
      username: u.TenDangNhap
    }));
  },

  addUser: async (payload: any): Promise<any> => {
    const response = await apiClient.post('/api/auth/accounts/', payload);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/auth/accounts/${id}/`);
  },

  // Criteria Management
  getCriteriaGroups: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/criteria/');
    return response.data;
  },

  addCriteriaGroup: async (data: { TenNhom: string, MoTa?: string, ThuTu?: number }): Promise<any> => {
    const response = await apiClient.post('/api/criteria/', data);
    return response.data;
  },

  addTieuChi: async (data: { NhomTieuChi: number, MoTa: string, LoaiTieuChi: string, Diem?: number, CoSoQuyetDinh?: boolean, SoLuongToiThieu?: number, ThuTu?: number }): Promise<any> => {
    const response = await apiClient.post('/api/admin/criteria/tieuchi/', data);
    return response.data;
  },

  updateTieuChi: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/api/admin/criteria/tieuchi/${id}/`, data);
    return response.data;
  },

  deleteTieuChi: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/criteria/tieuchi/${id}/`);
  },

  updateTieuChiScore: async (tc_pk: number, data: { CapDo: string, Diem: number }): Promise<any> => {
    const response = await apiClient.post(`/api/admin/criteria/tieuchi/${tc_pk}/scores/`, data);
    return response.data;
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
  },

  getCriteria: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/criteria/');
    return response.data;
  },

  getPosts: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/posts/');
    return response.data.map((p: any) => ({
      id: String(p.id),
      title: p.TieuDe,
      content: p.NoiDung,
      date: p.NgayDang,
      status: p.TrangThai,
      image: formatUrl(p.HinhAnh)
    }));
  }
};
