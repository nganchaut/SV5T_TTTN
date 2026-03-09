import React, { useState } from 'react';
import { CriterionType, Evidence, StudentProfile, FeaturedFace, FieldVerification } from '../types';
import { SUB_CRITERIA } from '../constants';

const AdminDashboard: React.FC<{
  students: StudentProfile[],
  selectedStudent: StudentProfile,
  onSelectStudent: (id: string) => void,
  onUpdateStatus: (status: StudentProfile['status'], feedback?: string) => void,
  onUpdateEvidenceStatus: (cat: CriterionType, id: string, status: Evidence['status'], feedback?: string) => void,
  onUpdateFieldVerification: (field: keyof StudentProfile['verifications'], action: FieldVerification['status'], feedback?: string) => void,
  faces: FeaturedFace[],
  onUpdateFaces: (faces: FeaturedFace[]) => void
}> = ({ students, selectedStudent, onSelectStudent, onUpdateStatus, onUpdateEvidenceStatus, onUpdateFieldVerification, faces, onUpdateFaces }) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'criteria' | 'users' | 'posts' | 'stats' | 'faces'>('profiles');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isSelected = !!selectedStudent && (selectedStudent.status !== 'Draft');
  const [isReviewing, setIsReviewing] = useState(false);

  // State for CRUD
  const LEVELS = ['Cấp Khoa/CLB', 'Cấp Trường/Phường/Xã', 'Cấp ĐHĐN', 'Cấp Tỉnh/Thành phố', 'Cấp Trung ương'];
  const LEVEL_KEYS = ['khoa', 'truong', 'dhdn', 'tinh', 'tw'];
  type CriterionItem = { id: string; description: string; isHard: boolean; points?: number; levelPoints: Record<string, number>; hasDecisionNumber: boolean };
  const [managedCriteria, setManagedCriteria] = useState(() => {
    const init: Record<string, CriterionItem[]> = {};
    Object.entries(SUB_CRITERIA).forEach(([cat, subs]) => {
      init[cat] = subs.map(s => ({
        ...s,
        levelPoints: { khoa: 0.1, truong: 0.2, dhdn: 0.3, tinh: 0.4, tw: 0.5 },
        hasDecisionNumber: false
      }));
    });
    return init;
  });
  const [managedUsers, setManagedUsers] = useState([
    { id: '1', name: 'Admin Chính', role: 'Admin', email: 'admin@due.udn.vn' },
    { id: '2', name: 'Nguyễn Văn Ban', role: 'Thư ký', email: 'ban.nv@due.udn.vn' },
    { id: '3', name: 'Trần Thị Cẩm', role: 'Thẩm định viên', email: 'cam.tt@due.udn.vn' },
  ]);
  const [managedPosts, setManagedPosts] = useState([
    { id: '1', title: 'Thông báo đăng ký xét duyệt SV5T năm 2024', date: '15/03/2024', status: 'published' },
    { id: '2', title: 'Hướng dẫn nộp minh chứng hoạt động tình nguyện', date: '10/03/2024', status: 'published' },
    { id: '3', title: 'Kết quả xét duyệt đợt 1 năm 2024', date: '01/03/2024', status: 'draft' },
  ]);

  const handleAction = (status: StudentProfile['status']) => {
    const actionTxt = status === 'Approved' ? 'CÔNG NHẬN DANH HIỆU' : status === 'Processing' ? 'GỬI YÊU CẦU GIẢI TRÌNH' : 'TỪ CHỐI HỒ SƠ';
    if (!window.confirm(`Xác nhận thực hiện hành động: ${actionTxt}?`)) return;
    let fb = '';
    if (status === 'Rejected') { fb = window.prompt('Lý do hồ sơ KHÔNG ĐẠT:') || ''; if (!fb) return; }
    else if (status === 'Processing') { fb = window.prompt(`Nhập lời nhắn giải trình gửi đến SV ${selectedStudent.fullName}:`) || 'Vui lòng kiểm tra và giải trình các mục Admin đã đánh dấu.'; }
    onUpdateStatus(status, fb);
    if (status === 'Processing') window.alert(`✅ Đã gửi yêu cầu giải trình đến sinh viên ${selectedStudent.fullName} thành công!`);
    else if (status === 'Approved') window.alert(`🌟 Đã công nhận danh hiệu cho SV ${selectedStudent.fullName}.`);
    setIsReviewing(false);
  };

  const handleEvidenceAction = (cat: CriterionType, id: string, action: 'Approved' | 'Rejected' | 'NeedsExplanation') => {
    let feedback = '';
    if (action === 'Rejected' || action === 'NeedsExplanation') { feedback = window.prompt(action === 'Rejected' ? 'Lý do từ chối:' : 'Nội dung cần giải trình:') || ''; if (!feedback && action === 'Rejected') return; }
    onUpdateEvidenceStatus(cat, id, action, feedback);
  };

  const handleManualDataVerify = (action: 'Approved' | 'Rejected' | 'NeedsExplanation', fieldKey: keyof StudentProfile['verifications'], context: string) => {
    let feedback = '';
    if (action === 'Rejected' || action === 'NeedsExplanation') { feedback = window.prompt(`Lý do phản hồi cho [${context}]:`) || ''; if (!feedback && action === 'Rejected') return; }
    onUpdateFieldVerification(fieldKey, action, feedback);
  };

  // Featured Faces Management
  const [faceForm, setFaceForm] = useState<{ mode: 'add' | 'edit', id?: string, name: string, achievement: string, content: string, image: string } | null>(null);

  const handleSaveFace = () => {
    if (!faceForm) return;
    let newFaces = [...faces];
    if (faceForm.mode === 'add') {
      const newFace: FeaturedFace = {
        id: Date.now().toString(),
        name: faceForm.name,
        achievement: faceForm.achievement,
        content: faceForm.content,
        image: faceForm.image || `https://picsum.photos/seed/${Date.now()}/400/400`
      };
      newFaces.push(newFace);
    } else {
      newFaces = newFaces.map(f => f.id === faceForm.id ? { ...f, name: faceForm.name, achievement: faceForm.achievement, content: faceForm.content, image: faceForm.image } : f);
    }
    onUpdateFaces(newFaces);
    setFaceForm(null);
  };

  const handleDeleteFace = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa gương mặt này?')) {
      onUpdateFaces(faces.filter(f => f.id !== id));
    }
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">URL Hình ảnh</label>
              <div className="flex gap-4">
                <input type="text" value={faceForm.image} onChange={e => setFaceForm({ ...faceForm, image: e.target.value })} className="flex-1 px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-xs" placeholder="https://..." />
                {faceForm.image && <img src={faceForm.image} className="w-12 h-12 rounded object-cover border" alt="Preview" />}
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
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
              <img src={face.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={face.name} />
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
  const saveCriteriaForm = () => {
    if (!criteriaForm || !criteriaForm.description.trim()) return;
    if (criteriaForm.mode === 'add') {
      setManagedCriteria(prev => ({
        ...prev, [criteriaForm.cat]: [...(prev[criteriaForm.cat] || []), {
          id: `new_${Date.now()}`, description: criteriaForm.description, isHard: criteriaForm.isHard,
          levelPoints: criteriaForm.levelPoints, hasDecisionNumber: criteriaForm.hasDecisionNumber
        }]
      }));
    } else {
      setManagedCriteria(prev => ({ ...prev, [criteriaForm.cat]: prev[criteriaForm.cat].map(s => s.id === criteriaForm.id ? { ...s, description: criteriaForm.description, isHard: criteriaForm.isHard, hasDecisionNumber: criteriaForm.hasDecisionNumber, levelPoints: criteriaForm.levelPoints } : s) }));
    }
    setCriteriaForm(null);
  };
  const handleDeleteCriterion = (cat: string, id: string) => {
    if (!window.confirm('Xác nhận xóa tiêu chí này?')) return;
    setManagedCriteria(prev => ({ ...prev, [cat]: prev[cat].filter(s => s.id !== id) }));
  };
  const handleAddUser = () => {
    const name = window.prompt('Họ tên người dùng:'); if (!name) return;
    const email = window.prompt('Email:'); if (!email) return;
    const role = window.prompt('Vai trò (Admin / Thư ký / Thẩm định viên):') || 'Thẩm định viên';
    setManagedUsers(prev => [...prev, { id: `u_${Date.now()}`, name, email, role }]);
    window.alert('✅ Đã thêm người dùng!');
  };
  const handleDeleteUser = (id: string) => {
    if (!window.confirm('Xác nhận xóa người dùng này?')) return;
    setManagedUsers(prev => prev.filter(u => u.id !== id));
  };
  const handleAddPost = () => {
    const title = window.prompt('Tiêu đề bài viết:'); if (!title) return;
    const today = new Date().toLocaleDateString('vi-VN');
    setManagedPosts(prev => [...prev, { id: `p_${Date.now()}`, title, date: today, status: 'draft' }]);
    window.alert('✅ Đã thêm bài viết!');
  };
  const handleEditPost = (id: string) => {
    const post = managedPosts.find(p => p.id === id); if (!post) return;
    const title = window.prompt('Chỉnh sửa tiêu đề:', post.title); if (!title) return;
    setManagedPosts(prev => prev.map(p => p.id === id ? { ...p, title } : p));
    window.alert('✅ Đã cập nhật bài viết!');
  };
  const handleDeletePost = (id: string) => {
    if (!window.confirm('Xác nhận xóa bài viết này?')) return;
    setManagedPosts(prev => prev.filter(p => p.id !== id));
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
              <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status === 'published' ? 'Đã đăng' : 'Bản nháp'}</span>
              <button onClick={() => handleEditPost(p.id)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"><i className="fas fa-pen text-[10px]"></i></button>
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
    <div className="flex min-h-screen animate-fade-in font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#0a1628] flex-shrink-0 flex flex-col">
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm">A</div>
            <div>
              <p className="text-white font-black text-sm">Admin</p>
              <p className="text-blue-300/40 text-[9px] font-bold uppercase tracking-widest">Ban thư ký HSV DUE</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
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
      <div className="flex-1 bg-gray-50 flex flex-col min-h-screen">
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
        <div className="fixed inset-0 z-[1100] bg-white animate-fade-in overflow-y-auto">
          <div className="bg-white w-full min-h-full">
            <div className="px-8 py-5 bg-gradient-to-r from-[#002b5c] to-[#003d7a] flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white text-xl font-formal italic">{selectedStudent.fullName.charAt(0)}</div>
                <div>
                  <h3 className="text-xl font-black uppercase font-formal tracking-tight text-white">{selectedStudent.fullName}</h3>
                  <p className="text-[10px] font-bold text-blue-200/60 uppercase mt-0.5 tracking-widest">{selectedStudent.studentId} • {selectedStudent.class} • {selectedStudent.faculty}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-blue-200/50 uppercase">Điểm: <span className="text-orange-400 font-black text-sm">{selectedStudent.totalScore}</span></span>
                <button onClick={() => handleAction('Rejected')} className="px-4 py-2 border border-red-400/40 text-red-300 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-all">Từ chối</button>
                {getExplanationCount() > 0 && <button onClick={() => handleAction('Processing')} className="px-4 py-2 bg-orange-500/80 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-500 transition-all animate-pulse">Giải trình ({getExplanationCount()})</button>}
                <button onClick={() => handleAction('Approved')} className="px-5 py-2 bg-green-500 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-green-600 transition-all shadow-md">Duyệt</button>
                <button onClick={() => setIsReviewing(false)} className="w-10 h-10 rounded-lg bg-white/10 hover:bg-red-500/30 text-white/60 hover:text-white flex items-center justify-center transition-all ml-2"><i className="fas fa-times text-sm"></i></button>
              </div>
            </div>

            <div className="p-8 space-y-8 bg-gray-50">
              {Object.values(CriterionType).map((cat) => {
                const list = selectedStudent.evidences[cat] || [];
                // Inline checkHardMet logic instead of importing to keep component self-contained for now, or assume it's moved to a shared utils file.
                // Assuming it's imported from StudentDashboard or moved to utils
                let dataValue = "", contextName = "", fieldKey: keyof StudentProfile['verifications'] | null = null;
                if (cat === CriterionType.ETHICS) { dataValue = `${selectedStudent.trainingPoints}`; contextName = "Điểm rèn luyện"; fieldKey = "trainingPoints"; }
                if (cat === CriterionType.ACADEMIC) { dataValue = `${selectedStudent.gpa}`; contextName = "GPA"; fieldKey = "gpa"; }
                if (cat === CriterionType.PHYSICAL) { dataValue = `${selectedStudent.peScore}`; contextName = "Điểm Thể dục"; fieldKey = "peScore"; }
                if (cat === CriterionType.INTEGRATION) { dataValue = `${selectedStudent.englishLevel}`; contextName = "Ngoại ngữ"; fieldKey = "english"; }
                const verification = fieldKey ? selectedStudent.verifications[fieldKey] : { status: 'Pending' };

                return (
                  <div key={cat} className={`bg-white border rounded-lg shadow-sm overflow-hidden transition-all duration-300 ${verification?.status === 'NeedsExplanation' ? 'ring-2 ring-orange-500' : verification?.status === 'Rejected' ? 'ring-2 ring-red-500' : ''}`}>
                    <div className="bg-gray-50/50 p-6 border-b flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1">
                        <h4 className="text-lg font-black text-blue-900 uppercase font-formal mb-2">{cat}</h4>
                        {fieldKey && (
                          <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-gray-400 uppercase mb-1">{contextName}:</span>
                              <span className="text-3xl font-black text-orange-600 font-formal">{dataValue}</span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => fieldKey && handleManualDataVerify('Approved', fieldKey, contextName)} className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-2 rounded-lg ${verification?.status === 'Approved' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-600 hover:bg-green-50'}`}>Đạt</button>
                              <button onClick={() => fieldKey && handleManualDataVerify('NeedsExplanation', fieldKey, contextName)} className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-2 rounded-lg ${verification?.status === 'NeedsExplanation' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-500 border-orange-500 hover:bg-orange-50'}`}>Giải trình</button>
                              <button onClick={() => fieldKey && handleManualDataVerify('Rejected', fieldKey, contextName)} className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-2 rounded-lg ${verification?.status === 'Rejected' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-600 hover:bg-red-50'}`}>Không đạt</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      {list.map(ev => (
                        <div key={ev.id} className={`p-5 border flex flex-col md:flex-row gap-6 items-start md:items-center rounded-lg ${ev.status === 'Approved' ? 'bg-green-50 border-green-200' : ev.status === 'Rejected' ? 'bg-red-50 border-red-200' : ev.status === 'NeedsExplanation' ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}>
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                              <h5 className="text-sm font-black text-gray-900 uppercase">{ev.name}</h5>
                              <button onClick={() => window.open(ev.fileUrl, '_blank')} className="text-blue-600 hover:text-orange-600 transition-colors"><i className="fas fa-external-link-alt text-xs"></i></button>
                            </div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">{ev.level} • {ev.status}</p>
                            {ev.adminFeedback && <p className="text-[10px] italic text-orange-700 mt-2">Phản hồi: {ev.adminFeedback}</p>}
                            {ev.studentExplanation && <p className="text-[10px] italic text-blue-700 font-bold">Giải trình của SV: {ev.studentExplanation}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEvidenceAction(cat, ev.id, 'Approved')} className={`px-4 py-2.5 text-[8px] font-black uppercase tracking-widest border-2 rounded-lg ${ev.status === 'Approved' ? 'bg-green-600 text-white border-green-600' : 'text-green-600 border-green-600 hover:bg-green-50'}`}>Đạt</button>
                            <button onClick={() => handleEvidenceAction(cat, ev.id, 'NeedsExplanation')} className={`px-4 py-2.5 text-[8px] font-black uppercase tracking-widest border-2 rounded-lg ${ev.status === 'NeedsExplanation' ? 'bg-orange-500 text-white border-orange-500' : 'text-orange-500 border-orange-500 hover:bg-orange-50'}`}>Giải trình</button>
                            <button onClick={() => handleEvidenceAction(cat, ev.id, 'Rejected')} className={`px-4 py-2.5 text-[8px] font-black uppercase tracking-widest border-2 rounded-lg ${ev.status === 'Rejected' ? 'bg-red-600 text-white border-red-600' : 'text-red-600 border-red-600 hover:bg-red-50'}`}>Không đạt</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
