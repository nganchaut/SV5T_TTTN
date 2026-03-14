import React, { useState, useEffect } from 'react';
import { CriterionType, Evidence, StudentProfile, FeaturedFace, FieldVerification } from '../types';
import { adminService } from '../services/adminService';
import { useNavigate, useParams } from 'react-router-dom';
import { useUI } from '../context/UIContext';

const AdminDashboard: React.FC<{
  students: StudentProfile[],
  selectedStudent: StudentProfile,
  onSelectStudent: (id: string) => void,
  onUpdateStatus: (status: StudentProfile['status'], feedback?: string) => void,
  onUpdateEvidenceStatus: (cat: CriterionType, id: string, status: Evidence['status'], feedback?: string) => void,
  onUpdateFieldVerification: (field: keyof StudentProfile['verifications'], action: FieldVerification['status'], feedback?: string) => void,
  faces: FeaturedFace[],
  onAddFace: (face: Omit<FeaturedFace, 'id'>) => void,
  onUpdateFace: (id: string, face: Partial<FeaturedFace>) => void,
  onDeleteFace: (id: string) => void,
  allCriteriaProps?: any[]
}> = ({ students, selectedStudent, onSelectStudent, onUpdateStatus, onUpdateEvidenceStatus, onUpdateFieldVerification, faces, onAddFace, onUpdateFace, onDeleteFace, allCriteriaProps }) => {
  const navigate = useNavigate();
  const { activeTab: urlTab } = useParams<{ activeTab: string }>();
  const activeTab = urlTab || 'profiles';
  const { toast, confirm, prompt } = useUI();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isSelected = !!selectedStudent && (selectedStudent.status !== 'Draft');
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState<CriterionType>(CriterionType.ETHICS);

  // Lock body scroll for dashboard
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // State for CRUD
  const LEVELS = ['Cấp Khoa/CLB', 'Cấp Trường/Phường/Xã', 'Cấp ĐHĐN', 'Cấp Tỉnh/Thành phố', 'Cấp Trung ương'];
  const LEVEL_KEYS = ['khoa', 'truong', 'dhdn', 'tinh', 'tw'];
  type CriterionItem = { id: string; description: string; isHard: boolean; points?: number; levelPoints: Record<string, number>; hasDecisionNumber: boolean; nhomId?: number };

  const mapPropsToCriteria = (props?: any[]) => {
    const init: Record<string, CriterionItem[]> = {};
    if (!props || props.length === 0) return init;

    props.forEach((nhom: any) => {
      if (!nhom) return;
      const key = nhom.TenNhom || nhom.name || "Nhóm khác";
      init[key] = (nhom.tieu_chi || nhom.subs || []).map((s: any) => {
        if (!s) return null;
        const lp: Record<string, number> = { khoa: 0.1, truong: 0.2, dhdn: 0.3, tinh: 0.4, tw: 0.5 };
        (s.diem_cap_do || []).forEach((d: any) => {
          if (!d) return;
          const capText = String(d.CapDo);
          if (capText.includes('Khoa')) lp.khoa = d.Diem;
          else if (capText.includes('Trường')) lp.truong = d.Diem;
          else if (capText.includes('ĐHĐN')) lp.dhdn = d.Diem;
          else if (capText.includes('Tỉnh')) lp.tinh = d.Diem;
          else if (capText.includes('Trung ương')) lp.tw = d.Diem;
        });
        return {
          id: String(s.id),
          code: s.MaTieuChi || '',
          description: s.MoTa || s.TenTieuChi || s.description || '',
          isHard: s.is_tieu_chi_cung || (s.LoaiTieuChi === 'Cung') || s.isHard || false,
          levelPoints: lp,
          hasDecisionNumber: s.CoSoQuyetDinh || s.hasDecisionNumber || false,
          nhomId: nhom.id
        };
      }).filter(Boolean) as CriterionItem[];
    });

    return init;
  };

  const [managedCriteria, setManagedCriteria] = useState<Record<string, CriterionItem[]>>(() => {
    const initial = mapPropsToCriteria(allCriteriaProps);
    console.log("ManagedCriteria Initialized:", initial);
    return initial;
  });
  const [managedUsers, setManagedUsers] = useState<any[]>([]);
  const [managedPosts, setManagedPosts] = useState<any[]>([]);
  const [userForm, setUserForm] = useState<{ mode: 'add' | 'edit', id?: string, username: string, password?: string, role: string } | null>(null);

  // Import mock mapper for initialization
  // (We'll make sure it's available in this scope)

  // Sync criteria from props (backend)
  useEffect(() => {
    if (allCriteriaProps && allCriteriaProps.length > 0) {
      setManagedCriteria(mapPropsToCriteria(allCriteriaProps));
    }
  }, [allCriteriaProps]);

  useEffect(() => {
    if (activeTab === 'posts') {
      adminService.getPosts().then(setManagedPosts).catch(console.error);
    } else if (activeTab === 'users') {
      adminService.getUsers().then(setManagedUsers).catch(console.error);
    }
  }, [activeTab]);

  const handleAction = async (status: StudentProfile['status']) => {
    const actionTxt = status === 'Approved' ? 'CÔNG NHẬN DANH HIỆU' : status === 'Processing' ? 'GỬI YÊU CẦU GIẢI TRÌNH' : 'TỪ CHỐI HỒ SƠ';
    const ok = await confirm({ title: 'Xác nhận hành động', message: `Xác nhận thực hiện: ${actionTxt}?`, variant: status === 'Rejected' ? 'danger' : 'default' });
    if (!ok) return;
    let fb = '';
    if (status === 'Rejected') {
      const reason = await prompt({ title: 'Lý do từ chối', message: 'Nhập lý do hồ sơ KHÔNG ĐẠT:', placeholder: 'VD: Điểm GPA chưa đạt yêu cầu...', variant: 'danger' });
      if (!reason) return;
      fb = reason;
    } else if (status === 'Processing') {
      const msg = await prompt({ title: 'Yêu cầu giải trình', message: `Nhập lời nhắn gửi đến SV ${selectedStudent.fullName}:`, placeholder: 'VD: Vui lòng bổ sung minh chứng...' });
      fb = msg || 'Vui lòng kiểm tra và giải trình các mục Admin đã đánh dấu.';
    }
    onUpdateStatus(status, fb);
    if (status === 'Processing') toast(`✅ Đã gửi yêu cầu giải trình đến ${selectedStudent.fullName}`);
    else if (status === 'Approved') toast(`🌟 Đã công nhận danh hiệu cho SV ${selectedStudent.fullName}`);
    setIsReviewing(false);
  };

  const handleEvidenceAction = async (cat: CriterionType, id: string, action: 'Approved' | 'Rejected' | 'NeedsExplanation') => {
    let feedback = '';
    if (action === 'Rejected' || action === 'NeedsExplanation') {
      const msg = await prompt({
        title: action === 'Rejected' ? 'Từ chối minh chứng' : 'Yêu cầu giải trình',
        message: action === 'Rejected' ? 'Nhập lý do từ chối minh chứng:' : 'Nhập nội dung cần sinh viên giải trình:',
        placeholder: action === 'Rejected' ? 'VD: File không hợp lệ...' : 'VD: Vui lòng bổ sung thêm...',
        variant: action === 'Rejected' ? 'danger' : 'default',
      });
      if (msg === null && action === 'Rejected') return;
      feedback = msg || '';
    }
    onUpdateEvidenceStatus(cat, id, action, feedback);
    toast(action === 'Approved' ? '✅ Đã duyệt minh chứng' : action === 'Rejected' ? '🚫 Đã từ chối minh chứng' : '📝 Đã gửi yêu cầu giải trình');
  };

  const handleManualDataVerify = async (action: 'Approved' | 'Rejected' | 'NeedsExplanation', fieldKey: keyof StudentProfile['verifications'], context: string) => {
    let feedback = '';
    if (action === 'Rejected' || action === 'NeedsExplanation') {
      const msg = await prompt({
        title: `Phản hồi: ${context}`,
        message: `Nhập lý do phản hồi cho [${context}]:`,
        placeholder: 'Nhập nội dung...',
        variant: action === 'Rejected' ? 'danger' : 'default',
      });
      if (msg === null && action === 'Rejected') return;
      feedback = msg || '';
    }
    onUpdateFieldVerification(fieldKey, action, feedback);
    toast(action === 'Approved' ? `✅ Đã xác minh [${context}]` : `📝 Đã gửi phản hồi [${context}]`);
  };

  // Featured Faces Management
  const [faceForm, setFaceForm] = useState<{ mode: 'add' | 'edit', id?: string, name: string, achievement: string, content: string, image: string, imageFile?: File } | null>(null);

  const handleSaveFace = () => {
    if (!faceForm) return;
    if (faceForm.mode === 'add') {
      const newFace: Omit<FeaturedFace, 'id'> & { imageFile?: File } = {
        name: faceForm.name,
        achievement: faceForm.achievement,
        content: faceForm.content,
        image: faceForm.image,
        imageFile: faceForm.imageFile
      };
      onAddFace(newFace);
    } else if (faceForm.id) {
      onUpdateFace(faceForm.id, {
        name: faceForm.name,
        achievement: faceForm.achievement,
        content: faceForm.content,
        image: faceForm.image,
        imageFile: faceForm.imageFile
      });
    }
    setFaceForm(null);
  };

  const handleDeleteFace = async (id: string) => {
    const ok = await confirm({ title: 'Xóa gương mặt', message: 'Bạn có chắc chắn muốn xóa gương mặt tiêu biểu này?', variant: 'danger', confirmText: 'Xóa' });
    if (ok) onDeleteFace(id);
  };

  const openAddFace = () => setFaceForm({ mode: 'add', name: '', achievement: '', content: '', image: '' });
  const openEditFace = (face: FeaturedFace) => setFaceForm({ mode: 'edit', id: face.id, name: face.name, achievement: face.achievement, content: face.content, image: face.image });

  const renderFaces = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-blue-900 uppercase">Quản lý Gương mặt tiêu biểu</h2>
        <button onClick={openAddFace} className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all shadow-md">
          <i className="fas fa-plus mr-2"></i>Thêm gương mặt
        </button>
      </div>

      {faceForm && (
        <div className="bg-white border-2 border-blue-900/10 rounded-xl p-8 shadow-xl animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><i className="fas fa-user-edit"></i></div>
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">{faceForm.mode === 'add' ? 'Thêm gương mặt mới' : 'Chỉnh sửa thông tin'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên sinh viên</label>
              <input type="text" value={faceForm.name} onChange={e => setFaceForm({ ...faceForm, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-bold" placeholder="VD: Nguyễn Văn A" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thành tích nổi bật</label>
              <input type="text" value={faceForm.achievement} onChange={e => setFaceForm({ ...faceForm, achievement: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-bold" placeholder="VD: Giải Nhất NCKH Cấp Quốc gia" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiêu đề / Trích dẫn</label>
              <textarea value={faceForm.content} onChange={e => setFaceForm({ ...faceForm, content: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-medium h-24" placeholder="VD: Gương mặt sinh viên xuất sắc tiêu biểu của nhà trường." />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hình ảnh</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFaceForm({ ...faceForm, imageFile: file, image: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  className="flex-1 px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
                {faceForm.image && <img src={faceForm.image} className="w-16 h-16 rounded object-cover border shadow-sm" alt="Preview" />}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button onClick={() => setFaceForm(null)} className="px-6 py-3 border text-gray-400 font-bold text-[9px] uppercase tracking-widest rounded-lg hover:bg-gray-50">Hủy bỏ</button>
            <button onClick={handleSaveFace} disabled={!faceForm.name || !faceForm.achievement} className="px-8 py-3 bg-blue-900 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-600 shadow-md disabled:opacity-50">Lưu thông tin</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faces.map(face => (
          <div key={face.id} className="bg-white border rounded-xl overflow-hidden group hover:shadow-xl transition-all relative">
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative flex items-center justify-center">
              {face.image ? (
                <img 
                  src={face.image} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                  alt={face.name} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <i className="fas fa-user-circle text-5xl mb-2"></i>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Chưa có ảnh</span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openEditFace(face)} className="w-8 h-8 bg-white/90 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-lg"><i className="fas fa-pen text-[10px]"></i></button>
                <button onClick={() => handleDeleteFace(face.id)} className="w-8 h-8 bg-white/90 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-lg"><i className="fas fa-trash text-[10px]"></i></button>
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-sm font-black text-blue-900 uppercase mb-1 font-formal">{face.name}</h4>
              <p className="text-orange-600 font-black text-[9px] uppercase tracking-widest mb-3">{face.achievement}</p>
              <p className="text-xs text-gray-400 italic line-clamp-2">"{face.content}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const getExplanationCount = () => {
    let count = 0;
    if (!selectedStudent) return 0;
    (Object.values(selectedStudent.verifications) as FieldVerification[]).forEach(v => { if (v.status === 'NeedsExplanation') count++; });
    (Object.values(selectedStudent.evidences) as Evidence[][]).forEach(list => list.forEach(e => { if (e.status === 'NeedsExplanation') count++; }));
    return count;
  };

  const SIDEBAR_ITEMS: { key: typeof activeTab, icon: string, label: string }[] = [
    { key: 'profiles', icon: 'fa-folder-open', label: 'Quản lý hồ sơ' },
    { key: 'stats', icon: 'fa-chart-bar', label: 'Thống kê' },
    { key: 'criteria', icon: 'fa-list-check', label: 'Quản lý tiêu chí' },
    { key: 'users', icon: 'fa-users', label: 'Quản lý người dùng' },
    { key: 'posts', icon: 'fa-newspaper', label: 'Quản lý bài viết' },
    { key: 'faces', icon: 'fa-award', label: 'Vinh danh' },
  ];

  // ====== RENDER CONTENT AREAS ======
  const renderProfiles = () => {
    const filtered = students.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentId.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
            <input type="text" placeholder="Tìm kiếm theo tên hoặc mã SV..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-lg text-sm font-medium focus:border-blue-500 outline-none transition-all" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-3 border-2 border-gray-100 rounded-lg text-xs font-bold uppercase tracking-widest focus:border-blue-500 outline-none">
            <option value="all">Tất cả trạng thái</option>
            <option value="Submitted">Chờ thẩm định</option>
            <option value="Processing">Đang giải trình</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Từ chối</option>
          </select>
        </div>
        {/* Table */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
              <tr><th className="px-6 py-4">Sinh viên</th><th className="px-6 py-4">Lớp</th><th className="px-6 py-4 text-center">Trạng thái</th><th className="px-6 py-4 text-center">Điểm</th><th className="px-6 py-4"></th></tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <span className="block font-black text-blue-900 uppercase text-sm">{s.fullName}</span>
                    <span className="block text-[9px] text-gray-400 font-bold uppercase mt-0.5">{s.studentId}</span>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-gray-500">{s.class}</td>
                  <td className="px-6 py-5 text-center">
                    <div className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest inline-block rounded-full ${s.status === 'Approved' ? 'bg-green-100 text-green-700' : s.status === 'Rejected' ? 'bg-red-100 text-red-600' : s.status === 'Processing' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {s.status === 'Submitted' ? 'Chờ thẩm định' : s.status === 'Processing' ? 'Đang giải trình' : s.status === 'Approved' ? 'Đã duyệt' : s.status === 'Rejected' ? 'Từ chối' : s.status}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center text-xl font-black text-blue-900 font-formal">{s.totalScore}</td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => { onSelectStudent(s.id); setIsReviewing(true); }} className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all shadow-sm">
                      <i className="fas fa-eye mr-1.5"></i>Thẩm định
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Không tìm thấy hồ sơ nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const total = students.length;
    const approved = students.filter(s => s.status === 'Approved').length;
    const processing = students.filter(s => s.status === 'Processing').length;
    const rejected = students.filter(s => s.status === 'Rejected').length;

    // Faculty breakdown
    const faculties = Array.from(new Set(students.map(s => s.faculty)));
    const facultyStats = faculties.map(f => {
      const sInF = students.filter(s => s.faculty === f);
      const appInF = sInF.filter(s => s.status === 'Approved').length;
      return { name: f, total: sInF.length, approved: appInF };
    });

    // Top students
    const topStudents = [...students].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Tổng hồ sơ', val: total, icon: 'fa-file-alt', color: 'bg-blue-500', bg: 'bg-blue-50' },
            { label: 'Đã duyệt', val: approved, icon: 'fa-check-circle', color: 'bg-green-500', bg: 'bg-green-50' },
            { label: 'Cần giải trình', val: processing, icon: 'fa-clock', color: 'bg-orange-500', bg: 'bg-orange-50' },
            { label: 'Từ chối', val: rejected, icon: 'fa-times-circle', color: 'bg-red-500', bg: 'bg-red-50' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} p-6 rounded-xl border flex items-center gap-5`}>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white text-lg shadow-md`}><i className={`fas ${stat.icon}`}></i></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-blue-900 font-formal">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-[0.2em]">Thống kê theo đơn vị</h3>
              <i className="fas fa-university text-gray-300"></i>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b text-[8px] font-black uppercase text-gray-400 tracking-widest">
                  <tr><th className="px-6 py-4">Khoa/Đơn vị</th><th className="px-6 py-4 text-center">Hồ sơ</th><th className="px-6 py-4 text-center">Đã duyệt</th><th className="px-6 py-4 text-center">Tỷ lệ</th></tr>
                </thead>
                <tbody className="divide-y">
                  {facultyStats.map((f, i) => (
                    <tr key={i} className="hover:bg-blue-50/30">
                      <td className="px-6 py-4 text-[10px] font-black text-blue-900 uppercase">{f.name}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-500">{f.total}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-green-600">{f.approved}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-blue-900">{Math.round((f.approved / f.total) * 100)}%</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                            <div className="h-full bg-blue-500" style={{ width: `${(f.approved / f.total) * 100}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-blue-900 uppercase tracking-[0.2em]">Top hồ sơ xuất sắc</h3>
              <i className="fas fa-trophy text-orange-400"></i>
            </div>
            <div className="p-0">
              {topStudents.map((s, i) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-orange-50/30 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</span>
                    <div>
                      <p className="text-[10px] font-black text-blue-900 uppercase">{s.fullName}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{s.class}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-blue-900 font-formal">{s.totalScore}</p>
                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Điểm xét duyệt</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-8 space-y-6">
          <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Tiến độ xét duyệt chung</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Hoàn tất', val: approved, total: total, color: 'bg-green-500' },
              { label: 'Chờ xử lý', val: total - approved - rejected, total: total, color: 'bg-blue-500' },
              { label: 'Từ chối', val: rejected, total: total, color: 'bg-red-500' },
              { label: 'Mục tiêu', val: total, total: total, color: 'bg-orange-500' },
            ].map((circle, i) => (
              <div key={i} className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - circle.val / circle.total)} className={`${circle.color.replace('bg-', 'text-')} transition-all duration-1000`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-blue-900">{Math.round((circle.val / circle.total) * 100)}%</span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{circle.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Criteria form modal state
  const [criteriaForm, setCriteriaForm] = useState<{ mode: 'add' | 'edit'; cat: string; id?: string; description: string; isHard: boolean; hasDecisionNumber: boolean; levelPoints: Record<string, number> } | null>(null);

  const openAddCriterion = (cat: string) => {
    setCriteriaForm({ mode: 'add', cat, description: '', isHard: false, hasDecisionNumber: false, levelPoints: { khoa: 0.1, truong: 0.2, dhdn: 0.3, tinh: 0.4, tw: 0.5 } });
  };
  const openEditCriterion = (cat: string, id: string) => {
    const sub = managedCriteria[cat]?.find(s => s.id === id);
    if (!sub) return;
    setCriteriaForm({ mode: 'edit', cat, id, description: sub.description, isHard: sub.isHard, hasDecisionNumber: sub.hasDecisionNumber, levelPoints: { ...sub.levelPoints } });
  };
  const saveCriteriaForm = async () => {
    if (!criteriaForm || !criteriaForm.description.trim()) return;
    try {
      if (criteriaForm.mode === 'add') {
        const nhom = allCriteriaProps?.find(n => n.TenNhom === criteriaForm.cat);
        if (!nhom) {
          await confirm({ title: 'Chưa thể thêm tiêu chí', message: `Nhóm "${criteriaForm.cat}" chưa tồn tại trên Backend. Vui lòng nhấn nút "Đồng bộ tiêu chí mẫu" để khởi tạo trước.`, confirmText: 'Đã hiểu', cancelText: undefined as any });
          return;
        }
        await adminService.addCriterion({ ...criteriaForm, nhomId: nhom.id });
      } else if (criteriaForm.id) {
        await adminService.updateCriterion(criteriaForm.id, criteriaForm);
      }
      toast('✅ Lưu tiêu chí thành công! Đang tải lại dữ liệu...');
      window.location.reload();
    } catch (e) {
      toast('❌ Lỗi khi lưu tiêu chí!', 'error');
    }
    setCriteriaForm(null);
  };
  const handleDeleteCriterion = async (cat: string, id: string) => {
    const ok = await confirm({ title: 'Xóa tiêu chí', message: 'Xác nhận xóa tiêu chí này? Hành động không thể hoàn tác.', variant: 'danger', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      await adminService.deleteCriterion(id);
      setManagedCriteria(prev => ({ ...prev, [cat]: prev[cat].filter(s => s.id !== id) }));
      toast('✅ Đã xóa tiêu chí!');
    } catch (e) { toast('❌ Xóa thất bại!', 'error'); }
  };
  const handleAddUser = () => setUserForm({ mode: 'add', username: '', password: '123456', role: 'SinhVien' });
  
  const handleSaveUser = async () => {
    if (!userForm || !userForm.username) return;
    try {
      await adminService.addUser({ username: userForm.username, password: userForm.password, role: userForm.role });
      const updatedUsers = await adminService.getUsers();
      setManagedUsers(updatedUsers);
      toast('✅ Đã thêm người dùng thành công!');
      setUserForm(null);
    } catch (e) { toast('❌ Thêm người dùng thất bại!', 'error'); }
  };

  const handleDeleteUser = async (id: string) => {
    const ok = await confirm({ title: 'Vô hiệu hóa tài khoản', message: 'Xác nhận vô hiệu hóa người dùng này? Họ sẽ không thể đăng nhập.', variant: 'danger', confirmText: 'Vô hiệu hóa' });
    if (!ok) return;
    try {
      await adminService.deleteUser(id);
      const updatedUsers = await adminService.getUsers();
      setManagedUsers(updatedUsers);
      toast('✅ Đã vô hiệu hóa tài khoản!');
    } catch (e) { toast('❌ Thất bại!', 'error'); }
  };

  const handleInitCriteria = async () => {
    const ok = await confirm({ title: 'Đồng bộ tiêu chí mẫu', message: 'Hệ thống sẽ đồng bộ 5 nhóm tiêu chí chuẩn lên Backend. Các nhóm đã tồn tại sẽ được giữ nguyên. Tiếp tục?', confirmText: 'Đồng bộ ngay' });
    if (!ok) return;
    try {
      const defaultGroups = [
        { name: CriterionType.ETHICS, order: 1 },
        { name: CriterionType.ACADEMIC, order: 2 },
        { name: CriterionType.PHYSICAL, order: 3 },
        { name: CriterionType.VOLUNTEER, order: 4 },
        { name: CriterionType.INTEGRATION, order: 5 },
      ];
      for (const group of defaultGroups) {
        await adminService.addCategory(group.name, group.order);
      }
      toast('✅ Đồng bộ tiêu chí thành công! Đang tải lại...');
      window.location.reload();
    } catch (e: any) {
      toast(`❌ Lỗi: ${e.response?.data?.detail || e.message}`, 'error');
    }
  };

  const handleAddPost = async () => {
    const title = await prompt({ title: 'Thêm bài viết mới', message: 'Nhập tiêu đề bài viết:', placeholder: 'VD: Thông báo xét duyệt SV5T năm học 2024-2025' });
    if (!title) return;
    try {
      const newPost = await adminService.addPost({ title, status: 'draft' });
      setManagedPosts(prev => [newPost, ...prev]);
      toast('✅ Đã thêm bài viết!');
    } catch (e) {
      toast('❌ Thêm thất bại!', 'error');
    }
  };
  const handleEditPost = async (id: string, currentStatus: string) => {
    const post = managedPosts.find(p => p.id === id); if (!post) return;
    const title = await prompt({ title: 'Chỉnh sửa bài viết', message: 'Nhập tiêu đề mới:', placeholder: post.title, defaultValue: post.title });
    if (!title) return;
    try {
      const updated = await adminService.updatePost(id, { title, status: currentStatus });
      setManagedPosts(prev => prev.map(p => p.id === id ? updated : p));
      toast('✅ Đã cập nhật bài viết!');
    } catch (e) {
      toast('❌ Cập nhật thất bại!', 'error');
    }
  };
  const handleTogglePostStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
      const updated = await adminService.updatePost(id, { status: newStatus });
      setManagedPosts(prev => prev.map(p => p.id === id ? updated : p));
    } catch (e) {
      alert("Đổi trạng thái thất bại!");
    }
  };
  const handleDeletePost = async (id: string) => {
    const ok = await confirm({ title: 'Xóa bài viết', message: 'Xác nhận xóa bài viết này?', variant: 'danger', confirmText: 'Xóa' });
    if (!ok) return;
    try {
      await adminService.deletePost(id);
      setManagedPosts(prev => prev.filter(p => p.id !== id));
      toast('🗑 Đã xóa bài viết!');
    } catch(e) { toast('❌ Xóa thất bại!', 'error'); }
  };

  const renderCriteriaInlineForm = () => {
    if (!criteriaForm) return null;
    return (
      <div className="bg-blue-50/50 border-2 border-blue-200 rounded-xl p-5 space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{criteriaForm.mode === 'add' ? 'Thêm tiêu chí mới' : 'Chỉnh sửa tiêu chí'}</span>
          <button onClick={() => setCriteriaForm(null)} className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all"><i className="fas fa-times text-[10px]"></i></button>
        </div>
        <textarea value={criteriaForm.description} onChange={e => setCriteriaForm({ ...criteriaForm, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 resize-none" placeholder="Mô tả tiêu chí..." />
        <div className="flex gap-3 flex-wrap">
          <div className="flex gap-1.5">
            <button onClick={() => setCriteriaForm({ ...criteriaForm, isHard: true })} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border-2 transition-all ${criteriaForm.isHard ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-200'}`}>Cứng</button>
            <button onClick={() => setCriteriaForm({ ...criteriaForm, isHard: false })} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border-2 transition-all ${!criteriaForm.isHard ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-400 border-gray-200'}`}>Cộng</button>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setCriteriaForm({ ...criteriaForm, hasDecisionNumber: false })} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border-2 transition-all ${!criteriaForm.hasDecisionNumber ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-400 border-gray-200'}`}>Không Sqđ</button>
            <button onClick={() => setCriteriaForm({ ...criteriaForm, hasDecisionNumber: true })} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border-2 transition-all ${criteriaForm.hasDecisionNumber ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-400 border-gray-200'}`}>Có Sqđ</button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {LEVELS.map((lvl, i) => (
            <div key={lvl} className="flex items-center gap-1 bg-white border rounded-md px-2 py-1">
              <span className="text-[7px] font-bold text-gray-400 w-16 truncate">{lvl}</span>
              <input type="number" step="0.1" min="0" value={criteriaForm.levelPoints[LEVEL_KEYS[i]] || 0} onChange={e => setCriteriaForm({ ...criteriaForm, levelPoints: { ...criteriaForm.levelPoints, [LEVEL_KEYS[i]]: parseFloat(e.target.value) || 0 } })} className="w-12 text-center text-[10px] font-black text-orange-600 bg-white border border-orange-200 rounded outline-none focus:border-orange-500 py-0.5" />
              <span className="text-[7px] text-gray-300">đ</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setCriteriaForm(null)} className="px-4 py-2 border border-gray-200 text-gray-400 text-[9px] font-black uppercase rounded-lg hover:bg-gray-100 transition-all">Hủy</button>
          <button onClick={saveCriteriaForm} disabled={!criteriaForm.description.trim()} className={`px-5 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${criteriaForm.description.trim() ? 'bg-blue-900 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{criteriaForm.mode === 'add' ? 'Thêm' : 'Lưu'}</button>
        </div>
      </div>
    );
  };

  const renderCriteria = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-blue-900 uppercase">Danh sách tiêu chí</h2>
        {(!allCriteriaProps || allCriteriaProps.length === 0) && (
          <button onClick={handleInitCriteria} className="px-5 py-2.5 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-900 transition-all shadow-lg animate-pulse">
            <i className="fas fa-magic mr-1.5"></i>Khởi tạo hệ thống (Đồng bộ tiêu chí mẫu lên Backend)
          </button>
        )}
      </div>
      {(Object.entries(managedCriteria) as [string, CriterionItem[]][]).map(([cat, subs]) => (
        <div key={cat} className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-black text-blue-900 uppercase">{cat}</h3>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold text-gray-400">{subs.length} tiêu chí</span>
              <button onClick={() => openAddCriterion(cat)} className="px-3 py-1.5 bg-blue-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all"><i className="fas fa-plus mr-1"></i>Thêm</button>
            </div>
          </div>
          {/* Inline form when adding to this category */}
          {criteriaForm && criteriaForm.mode === 'add' && criteriaForm.cat === cat && (
            <div className="px-6 py-4 border-b">{renderCriteriaInlineForm()}</div>
          )}
          <div className="divide-y">
            {subs.map(sub => (
              <div key={sub.id}>
                {/* Show inline form if editing this criterion */}
                {criteriaForm && criteriaForm.mode === 'edit' && criteriaForm.id === sub.id ? (
                  <div className="px-6 py-4">{renderCriteriaInlineForm()}</div>
                ) : (
                  <div className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-[7px] font-black uppercase px-2 py-0.5 text-white rounded flex-shrink-0 ${(sub as any).code ? 'bg-indigo-600' : 'bg-pink-500'}`}>{(sub as any).code ? 'Hệ thống' : 'Thủ công'}</span>
                        <span className={`text-[7px] font-black uppercase px-2 py-0.5 text-white rounded flex-shrink-0 ${sub.isHard ? 'bg-blue-600' : 'bg-orange-500'}`}>{sub.isHard ? 'Cứng' : 'Cộng'}</span>
                        <span className="text-xs font-medium text-gray-700">{sub.description}</span>
                        <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded flex-shrink-0 ${sub.hasDecisionNumber ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{sub.hasDecisionNumber ? 'Có Sqđ' : 'Không Sqđ'}</span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => openEditCriterion(cat, sub.id)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"><i className="fas fa-pen text-[10px]"></i></button>
                        <button onClick={() => handleDeleteCriterion(cat, sub.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"><i className="fas fa-trash text-[10px]"></i></button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {LEVELS.map((lvl, i) => (
                        <div key={lvl} className="flex items-center gap-1 bg-gray-50 border rounded-md px-2 py-1">
                          <span className="text-[7px] font-bold text-gray-400 w-16 truncate">{lvl}</span>
                          <input type="number" step="0.1" min="0" value={sub.levelPoints[LEVEL_KEYS[i]] || 0} onChange={e => { const val = parseFloat(e.target.value) || 0; setManagedCriteria(prev => ({ ...prev, [cat]: prev[cat].map(s => s.id === sub.id ? { ...s, levelPoints: { ...s.levelPoints, [LEVEL_KEYS[i]]: val } } : s) })); }} className="w-12 text-center text-[10px] font-black text-orange-600 bg-white border border-orange-200 rounded outline-none focus:border-orange-500 py-0.5" />
                          <span className="text-[7px] text-gray-300">đ</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-blue-900 uppercase">Quản lý người dùng</h2>
        <button onClick={handleAddUser} className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all shadow-sm">
          <i className="fas fa-user-plus mr-1.5"></i>Thêm người dùng
        </button>
      </div>

      {userForm && (
        <div className="bg-white border-2 border-blue-900/10 rounded-xl p-8 shadow-xl animate-fade-in mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><i className="fas fa-user-plus"></i></div>
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">Thêm tài khoản mới</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên đăng nhập (Mã SV)</label>
              <input type="text" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-bold" placeholder="20111XXX" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mật khẩu</label>
              <input type="text" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-bold" placeholder="123456" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vai trò</label>
              <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-bold uppercase tracking-widest">
                <option value="SinhVien">Sinh Viên</option>
                <option value="Admin">Admin</option>
                <option value="ThuKy">Thư ký</option>
                <option value="ThamDinh">Thẩm định</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button onClick={() => setUserForm(null)} className="px-6 py-3 border text-gray-400 font-bold text-[9px] uppercase tracking-widest rounded-lg hover:bg-gray-50">Hủy bỏ</button>
            <button onClick={handleSaveUser} disabled={!userForm.username} className="px-8 py-3 bg-blue-900 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-600 shadow-md disabled:opacity-50">Tạo tài khoản</button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] border-b">
            <tr><th className="px-6 py-4">Họ tên</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Vai trò</th><th className="px-6 py-4"></th></tr>
          </thead>
          <tbody className="divide-y">
            {managedUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">{u.name.charAt(0)}</div>
                    <span className="text-sm font-bold text-gray-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{u.email}</td>
                <td className="px-6 py-4"><span className="text-[9px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full uppercase">{u.role}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDeleteUser(u.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all ml-auto"><i className="fas fa-trash text-[10px]"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPosts = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-blue-900 uppercase">Quản lý bài viết</h2>
        <button onClick={handleAddPost} className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all shadow-sm">
          <i className="fas fa-plus mr-1.5"></i>Thêm bài viết
        </button>
      </div>
      <div className="space-y-4">
        {managedPosts.map(p => (
          <div key={p.id} className="bg-white border rounded-lg p-5 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center"><i className="fas fa-file-alt text-blue-500"></i></div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">{p.title}</h4>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5"><i className="far fa-calendar mr-1"></i>{p.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleTogglePostStatus(p.id, p.status)} 
                className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-all ${p.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
              >
                {p.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
              </button>
              <button onClick={() => handleEditPost(p.id, p.status)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"><i className="fas fa-pen text-[10px]"></i></button>
              <button onClick={() => handleDeletePost(p.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"><i className="fas fa-trash text-[10px]"></i></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profiles': return renderProfiles();
      case 'stats': return renderStats();
      case 'criteria': return renderCriteria();
      case 'users': return renderUsers();
      case 'posts': return renderPosts();
      case 'faces': return renderFaces();
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden animate-fade-in font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#0a1628] flex-shrink-0 flex flex-col h-full border-r border-white/5">
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm">A</div>
            <div>
              <p className="text-white font-black text-sm">Admin</p>
              <p className="text-blue-300/40 text-[9px] font-bold uppercase tracking-widest">Ban thư ký HSV DUE</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(`/admin/${item.key}`)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all text-[11px] font-bold
                ${activeTab === item.key
                  ? 'bg-blue-600/20 text-white shadow-sm'
                  : 'text-blue-200/50 hover:bg-white/5 hover:text-blue-200'
                }`}
            >
              <i className={`fas ${item.icon} w-5 text-center text-xs ${activeTab === item.key ? 'text-orange-400' : ''}`}></i>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-white/5">
          <p className="text-blue-300/30 text-[8px] font-bold uppercase tracking-widest">SV5T System v2.0</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-y-auto">
        {/* Top bar */}
        <div className="bg-white px-8 py-5 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-blue-900 uppercase tracking-tight">{SIDEBAR_ITEMS.find(i => i.key === activeTab)?.label}</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Hệ thống Xét duyệt Sinh viên 5 Tốt</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center transition-all"><i className="fas fa-bell text-sm"></i></button>
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-sm">A</div>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 p-8">{renderContent()}</div>
      </div>

      {/* Profile Review Modal - Full screen */}
      {isReviewing && selectedStudent && (
        <div className="fixed inset-0 z-[1100] bg-[#0a1628]/95 backdrop-blur-md animate-fade-in flex flex-col">
          {/* Header Area */}
          <div className="px-8 py-4 bg-[#0a1628] flex justify-between items-center border-b border-white/5 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white text-lg font-black">{selectedStudent.fullName.charAt(0)}</div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white">{selectedStudent.fullName}</h3>
                <p className="text-[9px] font-bold text-blue-300/40 uppercase mt-0.5 tracking-widest">{selectedStudent.studentId} • {selectedStudent.class}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mr-6 bg-white/5 px-4 py-2 rounded-xl">
                <span className="text-[9px] font-bold text-blue-300/40 uppercase">Tổng điểm:</span>
                <span className="text-orange-400 font-black text-sm">{selectedStudent.totalScore}</span>
              </div>
              {selectedStudent.status !== 'Draft' ? (
                <>
                  <button onClick={() => handleAction('Rejected')} className="px-4 py-2 border border-red-400/20 text-red-400 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-all">Từ chối</button>
                  {getExplanationCount() > 0 && <button onClick={() => handleAction('Processing')} className="px-4 py-2 bg-orange-500/80 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-500 transition-all">YC Giải trình ({getExplanationCount()})</button>}
                  <button onClick={() => handleAction('Approved')} className="px-5 py-2 bg-green-500 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-green-600 transition-all shadow-lg">Duyệt hồ sơ</button>
                </>
              ) : (
                <div className="px-4 py-2 bg-gray-500/20 text-gray-400 font-black text-[9px] uppercase tracking-widest rounded-lg border border-gray-400/20">
                  Hồ sơ nháp (Chưa nộp)
                </div>
              )}
              <button onClick={() => setIsReviewing(false)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/30 text-white/40 hover:text-white flex items-center justify-center transition-all ml-2"><i className="fas fa-times text-sm"></i></button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Split Sidebar */}
            <div className="w-80 border-r border-white/5 p-6 space-y-2 overflow-y-auto">
              <div className="mb-6">
                <p className="text-[9px] font-black text-blue-300/30 uppercase tracking-[0.2em] mb-4">Danh mục tiêu chí</p>
                {Object.values(CriterionType).map((cat) => {
                  const evs = selectedStudent.evidences[cat] || [];
                  const pendingCount = evs.filter(e => e.status === 'Pending').length;
                  const rejectCount = evs.filter(e => e.status === 'Rejected').length;
                  const explainCount = evs.filter(e => e.status === 'NeedsExplanation').length;
                  
                  const icons: Record<string, string> = {
                    [CriterionType.ETHICS]: 'fa-heart',
                    [CriterionType.ACADEMIC]: 'fa-book-open',
                    [CriterionType.PHYSICAL]: 'fa-running',
                    [CriterionType.VOLUNTEER]: 'fa-hands-helping',
                    [CriterionType.INTEGRATION]: 'fa-globe-asia',
                  };

                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveReviewTab(cat)}
                      className={`w-full group flex items-center justify-between p-4 rounded-xl transition-all mb-2
                        ${activeReviewTab === cat 
                          ? 'bg-blue-600/20 ring-1 ring-blue-500/20' 
                          : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-colors
                          ${activeReviewTab === cat ? 'bg-blue-500 text-white' : 'bg-white/5 text-blue-300/40 group-hover:text-blue-200'}`}>
                          <i className={`fas ${icons[cat]}`}></i>
                        </div>
                        <span className={`text-[11px] font-bold text-left transition-colors
                          ${activeReviewTab === cat ? 'text-white' : 'text-blue-300/40 group-hover:text-blue-200'}`}>
                          {cat}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {pendingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>}
                        {explainCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>}
                        {rejectCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>}
                        {evs.length > 0 && pendingCount === 0 && explainCount === 0 && rejectCount === 0 && <i className="fas fa-check-circle text-green-500 text-[10px]"></i>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Content */}
            <div className="flex-1 bg-gray-50 overflow-y-auto p-12">
              <div className="max-w-4xl mx-auto space-y-12">
                {(() => {
                  const cat = activeReviewTab;
                  const list = selectedStudent.evidences[cat] || [];
                  let dataValue = "", contextName = "", fieldKey: keyof StudentProfile['verifications'] | null = null;
                  if (cat === CriterionType.ETHICS) { dataValue = `${selectedStudent.trainingPoints}`; contextName = "Điểm rèn luyện"; fieldKey = "trainingPoints"; }
                  if (cat === CriterionType.ACADEMIC) { dataValue = `${selectedStudent.gpa}`; contextName = "GPA"; fieldKey = "gpa"; }
                  if (cat === CriterionType.PHYSICAL) { dataValue = `${selectedStudent.peScore}`; contextName = "Điểm Thể dục"; fieldKey = "peScore"; }
                  if (cat === CriterionType.INTEGRATION) { dataValue = `${selectedStudent.englishLevel}`; contextName = "Ngoại ngữ"; fieldKey = "english"; }
                  const verification = fieldKey ? selectedStudent.verifications[fieldKey] : { status: 'Pending' };

                  return (
                    <div className="animate-fade-up">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h4 className="text-2xl font-black text-blue-900 uppercase font-formal tracking-tight">{cat}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Xác thực thông tin và minh chứng bổ sung</p>
                        </div>
                        {fieldKey && (
                          <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border-2 transition-all ${verification?.status === 'Approved' ? 'bg-green-50 border-green-200' : verification?.status === 'NeedsExplanation' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                            <span className="text-[9px] font-black text-gray-400 uppercase">{contextName}: <span className="text-orange-600 text-sm ml-2">{dataValue}</span></span>
                            {selectedStudent.status !== 'Draft' && (
                              <>
                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                <div className="flex gap-1">
                                  <button onClick={() => fieldKey && handleManualDataVerify('Approved', fieldKey, contextName)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${verification?.status === 'Approved' ? 'bg-green-600 text-white' : 'hover:bg-green-100 text-green-600'}`}><i className="fas fa-check text-[10px]"></i></button>
                                  <button onClick={() => fieldKey && handleManualDataVerify('NeedsExplanation', fieldKey, contextName)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${verification?.status === 'NeedsExplanation' ? 'bg-orange-500 text-white' : 'hover:bg-orange-100 text-orange-500'}`}><i className="fas fa-comment-dots text-[10px]"></i></button>
                                  <button onClick={() => fieldKey && handleManualDataVerify('Rejected', fieldKey, contextName)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${verification?.status === 'Rejected' ? 'bg-red-600 text-white' : 'hover:bg-red-100 text-red-600'}`}><i className="fas fa-times text-[10px]"></i></button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {verification?.studentExplanation && (
                        <div className="mb-8 p-6 bg-blue-900/5 rounded-2xl border border-blue-900/10 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <i className="fas fa-comment-dots"></i>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Giải trình từ Sinh viên:</p>
                            <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{verification.studentExplanation}"</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {list.length > 0 ? list.map(ev => (
                          <div key={ev.id} className={`group bg-white p-5 border-2 rounded-2xl flex gap-6 items-center transition-all hover:border-blue-500/30 ${ev.status === 'Approved' ? 'border-green-500/20 bg-green-50/20' : ev.status === 'Rejected' ? 'border-red-500/20 bg-red-50/20' : ev.status === 'NeedsExplanation' ? 'border-orange-500/30 bg-orange-50/30' : 'border-gray-100'}`}>
                            {/* Image Preview */}
                            {ev.fileUrl && (ev.fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) || ev.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) ? (
                              <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden border shadow-inner">
                                <img src={ev.fileUrl} alt={ev.name} className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(ev.fileUrl, '_blank')} />
                              </div>
                            ) : (
                              <div className="w-20 h-20 flex-shrink-0 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shadow-inner text-blue-400">
                                <i className="fas fa-file-pdf text-2xl"></i>
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start mb-1">
                                <h5 className="text-[13px] font-black text-gray-900 uppercase truncate">{ev.name}</h5>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${ev.status === 'Approved' ? 'bg-green-500 text-white' : ev.status === 'Rejected' ? 'bg-red-500 text-white' : ev.status === 'NeedsExplanation' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{ev.status}</span>
                               </div>
                               <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                 <span>{ev.level}</span>
                                 <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                 <button onClick={() => window.open(ev.fileUrl, '_blank')} className="text-blue-500 hover:text-orange-500 transition-colors flex items-center gap-1"><i className="fas fa-eye"></i> Xem file</button>
                               </div>
                               {ev.studentExplanation && (
                                 <div className="mt-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                                   <p className="text-[10px] font-medium text-blue-700 leading-relaxed"><i className="fas fa-comment-dots mr-2"></i>{ev.studentExplanation}</p>
                                 </div>
                               )}
                               {ev.adminFeedback && <p className="text-[10px] italic text-orange-700 mt-2 font-medium">Lưu ý: {ev.adminFeedback}</p>}
                            </div>

                            {selectedStudent.status !== 'Draft' && (
                              <div className="flex flex-col gap-1">
                                <button onClick={() => handleEvidenceAction(cat, ev.id, 'Approved')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${ev.status === 'Approved' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-gray-50 text-green-600 hover:bg-green-100'}`} title="Đạt"><i className="fas fa-check text-[10px]"></i></button>
                                <button onClick={() => handleEvidenceAction(cat, ev.id, 'NeedsExplanation')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${ev.status === 'NeedsExplanation' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-50 text-orange-500 hover:bg-orange-100'}`} title="Yêu cầu giải trình"><i className="fas fa-comment-dots text-[10px]"></i></button>
                                <button onClick={() => handleEvidenceAction(cat, ev.id, 'Rejected')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${ev.status === 'Rejected' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-gray-50 text-red-600 hover:bg-red-100'}`} title="Không đạt"><i className="fas fa-times text-[10px]"></i></button>
                              </div>
                            )}
                          </div>
                        )) : (
                          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200 text-2xl"><i className="fas fa-folder-open"></i></div>
                             <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Không có minh chứng bổ sung</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
