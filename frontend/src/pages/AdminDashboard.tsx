import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CriterionType, Evidence, StudentProfile, FeaturedFace, FieldVerification, Post, EvidenceType } from '../types';
import { SUB_CRITERIA } from '../constants';
import { adminService } from '../services/adminService';
import systemService from '../services/systemService';
import { useNavigate, useParams } from 'react-router-dom';
import { formatUrl } from '../utils/mapper';
import { SystemConfig } from '../types';

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
  criteriaGroups: any[],
  setCriteriaGroups: React.Dispatch<React.SetStateAction<any[]>>,
  posts: Post[],
  onAddPost: (post: { title: string, content: string, status: string, imageFile?: File }) => void,
  onUpdatePost: (id: string, post: { title?: string, content?: string, status?: string, imageFile?: File }) => void,
  onDeletePost: (id: string) => void,
  systemSettings: SystemConfig | null,
  setSystemSettings: React.Dispatch<React.SetStateAction<SystemConfig | null>>
}> = ({ students, selectedStudent, onSelectStudent, onUpdateStatus, onUpdateEvidenceStatus, onUpdateFieldVerification, faces, onAddFace, onUpdateFace, onDeleteFace, criteriaGroups, setCriteriaGroups, posts, onAddPost, onUpdatePost, onDeletePost, systemSettings, setSystemSettings }) => {
  const navigate = useNavigate();
  const { activeTab: urlTab } = useParams<{ activeTab: string }>();
  const activeTab = urlTab || 'profiles';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isSelected = !!selectedStudent && (selectedStudent.status !== 'Draft');
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeReviewTab, setActiveReviewTab] = useState<CriterionType>(CriterionType.ETHICS);
  const [isTopExpanded, setIsTopExpanded] = useState(false);

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
  type CriterionItem = { id: string; description: string; isHard: boolean; points?: number; levelPoints: Record<string, number>; hasDecisionNumber: boolean; minQty?: number };
  const [managedCriteria, setManagedCriteria] = useState<Record<string, CriterionItem[]>>({});

  useEffect(() => {
    const init: Record<string, CriterionItem[]> = {};
    criteriaGroups.forEach(group => {
      init[group.TenNhom] = group.tieu_chi.map((tc: any) => {
        const lp: Record<string, number> = {};
        if (tc.diem_cap_do && tc.diem_cap_do.length > 0) {
          tc.diem_cap_do.forEach((d: any) => {
            const levelKey = d.CapDo === 'Cấp Khoa/CLB' ? 'khoa' :
                             d.CapDo === 'Cấp Trường/Phường/Xã' ? 'truong' :
                             d.CapDo === 'Cấp ĐHĐN' ? 'dhdn' :
                             d.CapDo === 'Cấp Tỉnh/Thành phố' ? 'tinh' :
                             d.CapDo === 'Cấp Trung ương' ? 'tw' : null;
            if (levelKey) lp[levelKey] = Number(d.Diem);
          });
        }

        return {
          id: String(tc.id),
          description: tc.MoTa,
          isHard: tc.LoaiTieuChi === 'Cung',
          points: Number(tc.Diem || 0),
          levelPoints: lp,
          hasDecisionNumber: tc.CoSoQuyetDinh,
          minQty: tc.SoLuongToiThieu
        };
      });
    });
    setManagedCriteria(init);
  }, [criteriaGroups]);

  const [managedUsers, setManagedUsers] = useState<any[]>([]);
  const [articleForm, setArticleForm] = useState<{ mode: 'add' | 'edit', id?: string, title: string, content: string, status: string, image: string, imageFile?: File } | null>(null);

  const [feedbackModal, setFeedbackModal] = useState<{
    show: boolean;
    type: 'Approved' | 'Rejected' | 'NeedsExplanation';
    title: string;
    message: string;
    requireFeedback: boolean;
    onSubmit: (feedback?: string) => void;
  }>({
    show: false,
    type: 'Approved',
    title: '',
    message: '',
    requireFeedback: false,
    onSubmit: () => {}
  });

  const [modalFeedback, setModalFeedback] = useState('');

  const [userForm, setUserForm] = useState<{
    show: boolean;
    data: {
      TenDangNhap: string;
      MatKhau: string;
      HoTen: string;
      VaiTro: string;
      Email: string;
      Lop: string;
      Khoa: string;
    }
  }>({
    show: false,
    data: { TenDangNhap: '', MatKhau: '', HoTen: '', VaiTro: 'SinhVien', Email: '', Lop: '', Khoa: '' }
  });

  const isSettingsLoading = !systemSettings;

  const handleSaveSettings = async (data: Partial<SystemConfig>) => {
    try {
      const updated = await systemService.updateSettings(data);
      setSystemSettings(updated);
      toast.success("Đã lưu cài đặt hệ thống!");
    } catch (error) {
      toast.error("Lỗi khi lưu cài đặt!");
    }
  };

  const refreshUsers = () => {
    adminService.getUsers().then(setManagedUsers).catch(console.error);
  };

  useEffect(() => {
    if (activeTab === 'users') {
      refreshUsers();
    }
  }, [activeTab]);

  const handleAction = (status: StudentProfile['status']) => {
    const actionTxt = status === 'Approved' ? 'CÔNG NHẬN DANH HIỆU' : status === 'Processing' ? 'GỬI YÊU CẦU GIẢI TRÌNH' : 'TỪ CHỐI HỒ SƠ';
    
    setModalFeedback(status === 'Processing' ? 'Vui lòng kiểm tra và giải trình các mục Admin đã đánh dấu.' : '');
    setFeedbackModal({
      show: true,
      type: status as any,
      title: actionTxt,
      message: `Bạn đang thực hiện hành động: ${actionTxt} cho sinh viên ${selectedStudent.fullName}.`,
      requireFeedback: status === 'Rejected' || status === 'Processing',
      onSubmit: (feedback) => {
        if (status === 'Approved' && (hasRejectedHardCriteria() || hasPendingEvidences())) {
          const message = hasPendingEvidences() 
            ? "Vui lòng thẩm định tất cả các minh chứng trước khi duyệt hồ sơ."
            : "Không thể duyệt hồ sơ vì có tiêu chí cứng bị từ chối.";
          toast.error(message);
          return;
        }
        const needsExplanationCount = getExplanationCount();
        if (status === 'Processing' && needsExplanationCount === 0) {
          toast.error("Vui lòng đánh dấu ít nhất một mục cần giải trình trước khi gửi yêu cầu.");
          return;
        }
        onUpdateStatus(status, feedback);
        setIsReviewing(false);
        setFeedbackModal(prev => ({ ...prev, show: false }));
        
        if (status === 'Processing') {
          toast.success(`Hồ sơ ${selectedStudent.fullName} đã chuyển sang mục [Đang giải trình]`, { duration: 5000 });
        }
      }
    });
  };

  const handleEvidenceAction = (cat: CriterionType, id: string, action: 'Approved' | 'Rejected' | 'NeedsExplanation') => {
    // Check current status for toggle
    const currentEv = (selectedStudent.evidences[cat] || []).find(e => e.id === id);
    if (currentEv && currentEv.status === action) {
      onUpdateEvidenceStatus(cat, id, 'Pending');
      return;
    }

    // Fast actions without modal
    if (action === 'Approved' || action === 'Rejected') {
      onUpdateEvidenceStatus(cat, id, action);
      return;
    }

    const actionTxt = action === 'Approved' ? 'DUYỆT MINH CHỨNG' : action === 'Rejected' ? 'TỪ CHỐI MINH CHỨNG' : 'YÊU CẦU GIẢI TRÌNH';
    
    setModalFeedback('');
    setFeedbackModal({
      show: true,
      type: action,
      title: actionTxt,
      message: `Bạn đang thực hiện hành động: ${actionTxt}.`,
      requireFeedback: action === 'Rejected' || action === 'NeedsExplanation',
      onSubmit: (feedback) => {
        onUpdateEvidenceStatus(cat, id, action, feedback);
        setFeedbackModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleManualDataVerify = (action: 'Approved' | 'Rejected' | 'NeedsExplanation', fieldKey: keyof StudentProfile['verifications'], context: string) => {
    // Check current status for toggle
    const currentStatus = selectedStudent.verifications[fieldKey]?.status;
    if (currentStatus === action) {
      onUpdateFieldVerification(fieldKey, 'Pending');
      return;
    }

    // Fast actions without modal
    if (action === 'Approved' || action === 'Rejected') {
      onUpdateFieldVerification(fieldKey, action);
      return;
    }

    const actionTxt = action === 'Approved' ? 'XÁC NHẬN ĐẠT' : action === 'Rejected' ? 'XÁC NHẬN KHÔNG ĐẠT' : 'YÊU CẦU GIẢI TRÌNH';
    
    setModalFeedback('');
    setFeedbackModal({
      show: true,
      type: action,
      title: actionTxt,
      message: `Cập nhật trạng thái xác minh cho mục [${context}].`,
      requireFeedback: action === 'Rejected' || action === 'NeedsExplanation',
      onSubmit: (feedback) => {
        onUpdateFieldVerification(fieldKey, action, feedback);
        setFeedbackModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  // Featured Faces Management
  const [faceForm, setFaceForm] = useState<{ mode: 'add' | 'edit', id?: string, name: string, achievement: string, content: string, image: string, imageFile?: File } | null>(null);

  const handleSaveFace = () => {
    if (!faceForm) return;
    const faceData = {
      name: faceForm.name,
      achievement: faceForm.achievement,
      content: faceForm.content,
      image: faceForm.image,
      imageFile: faceForm.imageFile
    };

    if (faceForm.mode === 'add') {
      onAddFace(faceData);
    } else if (faceForm.id) {
      onUpdateFace(faceForm.id, faceData);
    }
    setFaceForm(null);
  };

  const handleDeleteFace = (id: string) => {
    setFeedbackModal({
      show: true,
      type: 'Rejected',
      title: 'XÓA GƯƠNG MẶT',
      message: 'Bạn có chắc chắn muốn xóa gương mặt này? Hành động này không thể hoàn tác.',
      requireFeedback: false,
      onSubmit: () => {
        onDeleteFace(id);
        setFeedbackModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const openAddFace = () => setFaceForm({ mode: 'add', name: '', achievement: '', content: '', image: '' });
  const openEditFace = (face: FeaturedFace) => setFaceForm({ mode: 'edit', id: face.id, name: face.name, achievement: face.achievement, content: face.content, image: face.image });

  const renderFeedbackModal = () => {
    if (!feedbackModal.show) return null;

    return (
      <div className="fixed inset-0 z-[2000] bg-blue-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-md border border-gray-100 overflow-hidden animate-fade-up">
          <div className={`px-8 py-6 text-white flex justify-between items-center ${feedbackModal.type === 'Approved' ? 'bg-green-600' : feedbackModal.type === 'Rejected' ? 'bg-red-600' : 'bg-orange-500'}`}>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">{feedbackModal.title}</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Xác nhận hành động quản trị</p>
            </div>
            <button onClick={() => setFeedbackModal(prev => ({ ...prev, show: false }))} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
          </div>

          <div className="p-8 space-y-6">
            <p className="text-sm font-medium text-gray-600 leading-relaxed">{feedbackModal.message}</p>
            
            {feedbackModal.requireFeedback && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lý do / Nội dung phản hồi</label>
                <textarea 
                  autoFocus
                  value={modalFeedback}
                  onChange={e => setModalFeedback(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:border-blue-900 outline-none transition-all h-32"
                  placeholder="Nhập nội dung tại đây..."
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                onClick={() => setFeedbackModal(prev => ({ ...prev, show: false }))}
                className="px-6 py-3 text-gray-400 font-black text-[9px] uppercase tracking-widest hover:text-gray-600 transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => feedbackModal.onSubmit(modalFeedback)}
                className={`px-10 py-3 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all ${feedbackModal.type === 'Approved' ? 'bg-green-600 hover:bg-green-700' : feedbackModal.type === 'Rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFaces = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-blue-900 uppercase">Quản lý Gương mặt tiêu biểu</h2>
        <button onClick={openAddFace} className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all border border-blue-950">
          <i className="fas fa-plus mr-2"></i>Thêm gương mặt
        </button>
      </div>

      {faceForm && (
        <div className="bg-white border-2 border-blue-900/10 rounded-xl p-8 animate-fade-in">
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hình ảnh vinh danh</label>
              <div className="flex gap-4 items-center">
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl hover:border-blue-900 hover:bg-white transition-all flex items-center justify-center gap-3">
                    <i className="fas fa-cloud-upload-alt text-gray-400"></i>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{faceForm.imageFile ? faceForm.imageFile.name : 'Chọn ảnh từ máy tính'}</span>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFaceForm({ ...faceForm, image: reader.result as string, imageFile: file });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </label>
                {(faceForm.image || faceForm.imageFile) && (
                  <div className="relative group w-14 h-14 bg-gray-100 rounded-xl border-2 border-blue-900/10 overflow-hidden">
                    <img src={faceForm.image} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button onClick={() => setFaceForm(null)} className="px-6 py-3 border text-gray-400 font-bold text-[9px] uppercase tracking-widest rounded-lg hover:bg-gray-50">Hủy bỏ</button>
            <button onClick={handleSaveFace} disabled={!faceForm.name || !faceForm.achievement} className="px-8 py-3 bg-blue-900 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all border border-blue-950">Lưu thông tin</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faces.map(face => (
          <div key={face.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden group transition-all relative">
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
              <img src={face.image} className="w-full h-full object-cover" alt={face.name} />
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                <button onClick={() => openEditFace(face)} className="w-8 h-8 bg-white/90 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border border-gray-100"><i className="fas fa-pen text-[10px]"></i></button>
                <button onClick={() => handleDeleteFace(face.id)} className="w-8 h-8 bg-white/90 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all border border-gray-100"><i className="fas fa-trash text-[10px]"></i></button>
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

  const hasRejectedHardCriteria = () => {
    if (!selectedStudent) return false;
    
    // Check general verifications (all are hard/mandatory)
    const rejectedVerifications = (Object.values(selectedStudent.verifications) as FieldVerification[]).some(v => v.status === 'Rejected');
    if (rejectedVerifications) return true;

    // Check evidences for hard criteria
    const rejectedHardEvidences = (Object.values(selectedStudent.evidences) as Evidence[][]).flat().some(e => e.isHardCriterion && e.status === 'Rejected');
    return rejectedHardEvidences;
  };

  const hasPendingEvidences = () => {
    if (!selectedStudent) return false;
    
    // Only check for actual evidences (certificates, files)
    const pendingEvidences = (Object.values(selectedStudent.evidences) as Evidence[][]).flat().some(e => e.status === 'Pending');
    return pendingEvidences;
  };

  const renderSettings = () => {
    if (isSettingsLoading) return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đang tải cài đặt hệ thống...</p>
      </div>
    );
    if (!systemSettings) return null;

    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-8 border border-gray-200 rounded-2xl space-y-6 transition-all hover:bg-gray-50/50">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600"><i className="fas fa-calendar-alt"></i></div>
                 <div>
                    <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Khung thời gian nộp</h4>
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Thời gian tự động áp dụng</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày bắt đầu</label>
                    <input 
                       type="datetime-local" 
                       value={systemSettings.ThoiGianBatDau ? systemSettings.ThoiGianBatDau.substring(0, 16) : ''} 
                       onChange={e => setSystemSettings({ ...systemSettings, ThoiGianBatDau: e.target.value })}
                       onBlur={() => handleSaveSettings({ ThoiGianBatDau: systemSettings.ThoiGianBatDau })}
                       className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-blue-500 transition-all outline-none"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày kết thúc</label>
                    <input 
                       type="datetime-local" 
                       value={systemSettings.ThoiGianKetThuc ? systemSettings.ThoiGianKetThuc.substring(0, 16) : ''} 
                       onChange={e => setSystemSettings({ ...systemSettings, ThoiGianKetThuc: e.target.value })}
                       onBlur={() => handleSaveSettings({ ThoiGianKetThuc: systemSettings.ThoiGianKetThuc })}
                       className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-blue-500 transition-all outline-none"
                    />
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 border border-gray-200 rounded-2xl space-y-6 transition-all hover:bg-gray-50/50">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600"><i className="fas fa-power-off"></i></div>
                 <div>
                    <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Trạng thái cổng</h4>
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Bật/tắt thủ công ngay lập tức</p>
                 </div>
              </div>

              <div className={`p-6 rounded-2xl flex items-center justify-between border-2 transition-all ${systemSettings.TrangThaiMo ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                 <div>
                    <p className={`text-[13px] font-black uppercase tracking-tight ${systemSettings.TrangThaiMo ? 'text-green-600' : 'text-red-500'}`}>
                       {systemSettings.TrangThaiMo ? 'Cổng đang MỞ' : 'Cổng đang ĐÓNG'}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ghi đè tất cả cài đặt thời gian</p>
                 </div>
                 <button 
                   onClick={() => handleSaveSettings({ TrangThaiMo: !systemSettings.TrangThaiMo })}
                   className={`w-14 h-8 rounded-full p-1 transition-all duration-500 group ${systemSettings.TrangThaiMo ? 'bg-green-500' : 'bg-gray-300'}`}
                 >
                    <div className={`w-6 h-6 bg-white rounded-full transition-all duration-500 transform border border-gray-200 ${systemSettings.TrangThaiMo ? 'translate-x-6 rotate-180' : 'translate-x-0'}`}></div>
                 </button>
              </div>

              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 italic text-[11px] font-bold text-blue-800/60 leading-relaxed flex gap-3">
                 <i className="fas fa-info-circle mt-1"></i>
                 <span>Lưu ý: Ngay cả khi cổng đóng, các hồ sơ đang trong trạng thái <span className="text-orange-600 uppercase tracking-tighter">[Đang giải trình]</span> vẫn có thể chỉnh sửa.</span>
              </div>
           </div>
        </div>

        <div className="bg-white p-10 border border-gray-200 rounded-3xl space-y-8 relative overflow-hidden group transition-all">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform"></div>
           <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
              <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center text-white"><i className="fas fa-bullhorn animate-bounce"></i></div>
              <div>
                 <h4 className="text-sm font-black text-blue-900 uppercase tracking-[0.2em]">Thông tin thông báo</h4>
                 <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Nội dung sẽ hiển thị trên Dashboard sinh viên</p>
              </div>
           </div>

           <div className="space-y-8">
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Thông báo khi cổng mở</label>
                    <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[8px] font-black uppercase rounded">Mặc định</span>
                 </div>
                 <textarea 
                    value={systemSettings.ThongBaoHieuLuc} 
                    onChange={e => setSystemSettings({ ...systemSettings, ThongBaoHieuLuc: e.target.value })}
                    onBlur={() => handleSaveSettings({ ThongBaoHieuLuc: systemSettings.ThongBaoHieuLuc })}
                    className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:border-blue-600 transition-all outline-none min-h-[120px]" 
                    placeholder="VD: Cổng nộp hồ sơ đang mở. Hạn chót đến 23:59 ngày..."
                 />
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Thông báo khi cổng đóng</label>
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded">Mặc định</span>
                 </div>
                 <textarea 
                    value={systemSettings.ThongBaoHetHan} 
                    onChange={e => setSystemSettings({ ...systemSettings, ThongBaoHetHan: e.target.value })}
                    onBlur={() => handleSaveSettings({ ThongBaoHetHan: systemSettings.ThongBaoHetHan })}
                    className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:border-red-500 transition-all outline-none min-h-[120px]" 
                    placeholder="VD: Cổng nộp hồ sơ hiện đã đóng. Vui lòng liên hệ Admin nếu có thắc mắc."
                 />
              </div>
           </div>
        </div>
      </div>
    );
  };

  const SIDEBAR_ITEMS: { key: typeof activeTab, icon: string, label: string }[] = [
    { key: 'profiles', icon: 'fa-folder-open', label: 'Quản lý hồ sơ' },
    { key: 'stats', icon: 'fa-chart-bar', label: 'Thống kê' },
    { key: 'criteria', icon: 'fa-list-check', label: 'Quản lý tiêu chí' },
    { key: 'users', icon: 'fa-users', label: 'Quản lý người dùng' },
    { key: 'posts', icon: 'fa-newspaper', label: 'Quản lý bài viết' },
    { key: 'faces', icon: 'fa-award', label: 'Vinh danh' },
    { key: 'settings', icon: 'fa-cog', label: 'Cấu hình hệ thống' },
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
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b">
              <tr><th className="px-6 py-4">Sinh viên</th><th className="px-6 py-4">Lớp</th><th className="px-6 py-4 text-center">Trạng thái</th><th className="px-6 py-4 text-center">Điểm</th><th className="px-6 py-4"></th></tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => { onSelectStudent(s.id); setIsReviewing(true); }}>
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
                  <td className="px-6 py-5 text-right flex items-center justify-end gap-3">
                    {(s.status === 'Submitted' || s.status === 'Processing') && (Object.values(s.verifications).some((v: any) => v.explanation) || Object.values(s.evidences).flat().some((e: any) => e.studentExplanation)) ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded flex items-center gap-1">
                        <i className="fas fa-comment-dots"></i> Đã giải trình
                      </span>
                    ) : null}
                    <button onClick={() => { onSelectStudent(s.id); setIsReviewing(true); }} className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all border border-blue-950">
                      <i className="fas fa-eye mr-1.5"></i>Thẩm định
                    </button>
                    {s.status === 'Rejected' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Xóa vĩnh viễn hồ sơ của ${s.fullName}? Hành động này không thể hoàn tác.`)) return;
                          try {
                            await adminService.deleteStudent(s.id);
                            toast.success(`Đã xóa hồ sơ ${s.fullName}`);
                            window.location.reload();
                          } catch { toast.error('Xóa thất bại'); }
                        }}
                        className="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-200"
                        title="Xóa hồ sơ bị từ chối"
                      >
                        <i className="fas fa-trash text-[10px]"></i>
                      </button>
                    )}
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

    // Top students: Only show fully APPROVED profiles
    const topStudents = [...students]
      .filter(s => s.status === 'Approved')
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

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
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white text-lg border border-white/20`}><i className={`fas ${stat.icon}`}></i></div>
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
              <button 
                onClick={() => setIsTopExpanded(true)}
                className="text-[9px] font-black text-blue-600 uppercase hover:text-orange-600 transition-colors flex items-center gap-1.5"
              >
                Xem tất cả <i className="fas fa-external-link-alt text-[8px]"></i>
              </button>
            </div>
            <div className="p-0">
              {topStudents.map((s, i) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-orange-50/30 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-black ${i === 0 ? 'text-orange-500' : 'text-gray-400'}`}>{i + 1}.</span>
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
      const group = criteriaGroups.find(g => g.TenNhom === criteriaForm.cat);
      if (!group) throw new Error("Category not found on backend");

      const payload = {
        NhomTieuChi: group.id,
        MoTa: criteriaForm.description,
        LoaiTieuChi: criteriaForm.isHard ? 'Cung' : 'Cong',
        Diem: 0, // Points are usually per level, but model has a base Diem
        CoSoQuyetDinh: criteriaForm.hasDecisionNumber,
        SoLuongToiThieu: 1,
        ThuTu: 1
      };

      if (criteriaForm.mode === 'add') {
        const newTc = await adminService.addTieuChi(payload);
        // Also update scores
        for (const [key, val] of Object.entries(criteriaForm.levelPoints)) {
          const capDo = key === 'khoa' ? 'Cấp Khoa/CLB' :
                        key === 'truong' ? 'Cấp Trường/Phường/Xã' :
                        key === 'dhdn' ? 'Cấp ĐHĐN' :
                        key === 'tinh' ? 'Cấp Tỉnh/Thành phố' : 'Cấp Trung ương';
          await adminService.updateTieuChiScore(newTc.id, { CapDo: capDo, Diem: val as number });
        }
      } else if (criteriaForm.id) {
        await adminService.updateTieuChi(Number(criteriaForm.id), payload);
        for (const [key, val] of Object.entries(criteriaForm.levelPoints)) {
          const capDo = key === 'khoa' ? 'Cấp Khoa/CLB' :
                        key === 'truong' ? 'Cấp Trường/Phường/Xã' :
                        key === 'dhdn' ? 'Cấp ĐHĐN' :
                        key === 'tinh' ? 'Cấp Tỉnh/Thành phố' : 'Cấp Trung ương';
          await adminService.updateTieuChiScore(Number(criteriaForm.id), { CapDo: capDo, Diem: val as number });
        }
      }

      // Refresh global criteria
      const updatedGroups = await adminService.getCriteriaGroups();
      setCriteriaGroups(updatedGroups);
      setCriteriaForm(null);
      toast.success('Đã cập nhật tiêu chí thành công!');
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi cập nhật tiêu chí!');
    }
  };

  const handleDeleteCriterion = async (cat: string, id: string) => {
    setFeedbackModal({
      show: true,
      type: 'Rejected',
      title: 'XÓA TIÊU CHÍ',
      message: 'Bạn có chắc chắn muốn xóa tiêu chí này?',
      requireFeedback: false,
      onSubmit: async () => {
        try {
          await adminService.deleteTieuChi(Number(id));
          const updatedGroups = await adminService.getCriteriaGroups();
          setCriteriaGroups(updatedGroups);
          toast.success('Đã xóa tiêu chí!');
          setFeedbackModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          toast.error('Lỗi khi xóa tiêu chí!');
        }
      }
    });
  };

  const handleAddUser = () => {
    setUserForm({
      show: true,
      data: { TenDangNhap: '', MatKhau: '', HoTen: '', VaiTro: 'SinhVien', Email: '', Lop: '', Khoa: '' }
    });
  };

  const handleSaveUser = async () => {
    const { data } = userForm;
    if (!data.TenDangNhap || !data.MatKhau || !data.HoTen) {
      toast.error("Vui lòng nhập đầy đủ Tên đăng nhập, Mật khẩu và Họ tên.");
      return;
    }

    try {
      await adminService.addUser(data);
      setUserForm({ ...userForm, show: false });
      refreshUsers();
      toast.success('Đã thêm người dùng thành công');
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.detail || "Lỗi không xác định";
      toast.error("Lỗi khi thêm người dùng: " + msg);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setFeedbackModal({
      show: true,
      type: 'Rejected',
      title: 'XÓA NGƯỜI DÙNG',
      message: 'Bạn có chắc chắn muốn xóa người dùng này? Tài khoản và dữ liệu liên quan sẽ bị gỡ bỏ.',
      requireFeedback: false,
      onSubmit: async () => {
        try {
          await adminService.deleteUser(id);
          toast.success('Đã xóa người dùng!');
          refreshUsers();
          setFeedbackModal(prev => ({ ...prev, show: false }));
        } catch (e: any) {
          toast.error("Lỗi khi xóa người dùng!");
        }
      }
    });
  };

  const handleAddPost = () => {
    setArticleForm({ mode: 'add', title: '', content: '', status: 'published', image: '' });
  };

  const handleEditPost = (post: any) => {
    setArticleForm({ mode: 'edit', id: post.id, title: post.title, content: post.content, status: post.status, image: post.image || '' });
  };

  const handleSaveArticle = async () => {
    if (!articleForm) return;
    try {
      if (articleForm.mode === 'add') {
        await onAddPost({ title: articleForm.title, content: articleForm.content, status: articleForm.status, imageFile: articleForm.imageFile });
      } else if (articleForm.id) {
        await onUpdatePost(articleForm.id, { title: articleForm.title, content: articleForm.content, status: articleForm.status, imageFile: articleForm.imageFile });
      }
      setArticleForm(null);
    } catch (e) {
      // Errors handled by hook toasts
    }
  };

  const handleTogglePostStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
      await onUpdatePost(id, { status: newStatus });
    } catch (e) {
      toast.error("Đổi trạng thái thất bại!");
    }
  };

  const handleDeletePost = async (id: string) => {
    setFeedbackModal({
      show: true,
      type: 'Rejected',
      title: 'XÓA BÀI VIẾT',
      message: 'Bạn có chắc chắn muốn xóa bài viết này?',
      requireFeedback: false,
      onSubmit: async () => {
        try {
          await onDeletePost(id);
          setFeedbackModal(prev => ({ ...prev, show: false }));
        } catch(e) {}
      }
    });
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
        <button onClick={handleAddUser} className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all border border-blue-950">
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
                    <div>
                      <span className="block text-sm font-bold text-gray-800">{u.name}</span>
                      <span className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider">{u.username}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{u.email || 'N/A'}</td>
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
        <button onClick={handleAddPost} className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all border border-blue-950">
          <i className="fas fa-plus mr-1.5"></i>Thêm bài viết
        </button>
      </div>

      {articleForm && (
        <div className="bg-white border-2 border-blue-900/10 rounded-xl p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><i className="fas fa-file-edit"></i></div>
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">{articleForm.mode === 'add' ? 'Thêm bài viết mới' : 'Chỉnh sửa bài viết'}</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiêu đề bài viết</label>
              <input type="text" value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-bold" placeholder="Nhập tiêu đề..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nội dung bài viết</label>
              <textarea value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-medium h-48" placeholder="Nhập nội dung chi tiết..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hình ảnh bài viết</label>
              <div className="flex gap-4 items-center">
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-900 hover:bg-white transition-all flex items-center justify-center gap-3">
                    <i className="fas fa-cloud-upload-alt text-gray-400"></i>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{articleForm.imageFile ? articleForm.imageFile.name : 'Chọn ảnh bài viết'}</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setArticleForm({ ...articleForm, image: reader.result as string, imageFile: file });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
                {(articleForm.image || articleForm.imageFile) && (
                  <div className="relative group w-20 h-20 bg-gray-100 rounded-xl border-2 border-blue-900/10 overflow-hidden">
                    <img src={articleForm.image} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</label>
              <select value={articleForm.status} onChange={e => setArticleForm({ ...articleForm, status: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-bold">
                <option value="draft">Bản nháp</option>
                <option value="published">Đã đăng</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button onClick={() => setArticleForm(null)} className="px-6 py-3 border text-gray-400 font-bold text-[9px] uppercase tracking-widest rounded-lg hover:bg-gray-50">Hủy bỏ</button>
            <button onClick={handleSaveArticle} disabled={!articleForm.title} className="px-8 py-3 bg-blue-900 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all border border-blue-950">Lưu bài viết</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {posts.map(p => (
          <div key={p.id} className="bg-white border border-gray-100 rounded-lg p-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <i className="fas fa-file-alt text-blue-500"></i>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{p.title}</h4>
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
              <button onClick={() => handleEditPost(p)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"><i className="fas fa-pen text-[10px]"></i></button>
              <button onClick={() => handleDeletePost(p.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all"><i className="fas fa-trash text-[10px]"></i></button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-lg">Chưa có bài viết nào</div>
        )}
      </div>
    </div>
  );

  const renderTopExpandedModal = () => {
    if (!isTopExpanded) return null;
    const topStudentsFull = [...students]
      .filter(s => s.status !== 'Rejected')
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 100);

    return (
      <div className="fixed inset-0 z-[1200] bg-blue-900/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-4xl border border-gray-100 overflow-hidden animate-fade-up flex flex-col max-h-[90vh]">
          <div className="px-8 py-6 bg-blue-900 text-white flex justify-between items-center flex-shrink-0">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Top 100 Hồ sơ xuất sắc</h3>
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Sắp xếp theo tổng điểm xét duyệt cao nhất</p>
            </div>
            <button onClick={() => setIsTopExpanded(false)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4 w-16">Hạng</th>
                  <th className="px-6 py-4">Sinh viên</th>
                  <th className="px-6 py-4 text-center">Lớp</th>
                  <th className="px-6 py-4 text-center">Tổng điểm</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topStudentsFull.map((s, i) => (
                  <tr key={s.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <span className={`text-sm font-black ${i < 3 ? 'text-orange-500' : 'text-gray-400'}`}>{i + 1}.</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="block font-black text-blue-900 uppercase text-xs">{s.fullName}</span>
                      <span className="block text-[9px] text-gray-400 font-bold uppercase mt-0.5">{s.studentId}</span>
                    </td>
                    <td className="px-6 py-5 text-center text-[11px] font-bold text-gray-500 uppercase">{s.class}</td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-lg font-black text-blue-900 font-formal">{s.totalScore}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => { onSelectStudent(s.id); setIsReviewing(true); setIsTopExpanded(false); }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-100 group-hover:border-blue-200"
                      >
                        <i className="fas fa-eye mr-1.5"></i>Xem hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-gray-50 border-t flex justify-end flex-shrink-0">
             <button onClick={() => setIsTopExpanded(false)} className="px-10 py-3 bg-blue-900 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all">Đóng</button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profiles': return renderProfiles();
      case 'stats': return renderStats();
      case 'criteria': return renderCriteria();
      case 'users': return renderUsers();
      case 'posts': return renderPosts();
      case 'faces': return renderFaces();
      case 'settings': return renderSettings();
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
                  ? 'bg-blue-600/20 text-white border border-blue-500/20'
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
          <div className="px-8 py-4 bg-[#0a1628] flex justify-between items-center border-b border-white/5">
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
              <button onClick={() => handleAction('Rejected')} className="px-4 py-2 border border-red-400/20 text-red-400 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-all">Từ chối</button>
              {getExplanationCount() > 0 && <button onClick={() => handleAction('Processing')} className="px-4 py-2 bg-orange-500/80 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-500 transition-all">YC Giải trình ({getExplanationCount()})</button>}
               <button 
                onClick={() => handleAction('Approved')} 
                disabled={hasRejectedHardCriteria() || hasPendingEvidences()}
                title={hasRejectedHardCriteria() ? "Không thể duyệt hồ sơ vì có tiêu chí cứng bị từ chối" : hasPendingEvidences() ? "Vui lòng thẩm định tất cả các minh chứng" : "Phê duyệt hồ sơ"}
                className={`px-5 py-2 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all ${hasRejectedHardCriteria() || hasPendingEvidences() ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                Duyệt hồ sơ
              </button>
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
                        <div className="flex gap-1 items-center">
                        {(() => {
                          const hasEvidenceExplanation = evs.some(e => e.studentExplanation);
                          let hasFieldExplanation = false;
                          if (cat === CriterionType.ETHICS) {
                            hasFieldExplanation = !!(selectedStudent.verifications.trainingPoints?.explanation || selectedStudent.verifications.partyMember?.explanation);
                          } else if (cat === CriterionType.ACADEMIC) {
                            hasFieldExplanation = !!selectedStudent.verifications.gpa?.explanation;
                          } else if (cat === CriterionType.PHYSICAL) {
                            hasFieldExplanation = !!selectedStudent.verifications.peScore?.explanation;
                          } else if (cat === CriterionType.INTEGRATION) {
                            hasFieldExplanation = !!selectedStudent.verifications.english?.explanation;
                          }
                          
                          if (hasEvidenceExplanation || hasFieldExplanation) {
                            return <i className="fas fa-comment-dots text-blue-500 text-[10px] animate-pulse mr-1"></i>;
                          }
                          return null;
                        })()}
                        {pendingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 border border-blue-400/50"></span>}
                        {explainCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 border border-orange-400/50"></span>}
                        {rejectCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 border border-red-400/50"></span>}
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
                  if (cat === CriterionType.INTEGRATION) { 
                    dataValue = selectedStudent.englishLevel !== 'None' 
                      ? `${selectedStudent.englishLevel}${selectedStudent.englishGpa > 0 ? ` (GPA: ${selectedStudent.englishGpa})` : ''}`
                      : (selectedStudent.englishGpa > 0 ? `GPA: ${selectedStudent.englishGpa}` : 'None');
                    contextName = "Ngoại ngữ"; 
                    fieldKey = "english"; 
                  }
                  
                  const verification = fieldKey ? selectedStudent.verifications[fieldKey] : { status: 'Pending' };

                  return (
                    <div className="animate-fade-up">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h4 className="text-2xl font-black text-blue-900 uppercase font-formal tracking-tight">{cat}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Xác thực thông tin và minh chứng bổ sung</p>
                            <div className="flex gap-3 bg-white/50 px-3 py-1 rounded-lg border border-gray-100 text-[7px] font-black uppercase tracking-tighter">
                               <div className="flex items-center gap-1.5 text-red-500"><i className="fas fa-exclamation-triangle"></i> Cứng: Phải đạt</div>
                               <div className="flex items-center gap-1.5 text-blue-500"><i className="fas fa-plus-circle"></i> Cộng: Thêm điểm</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 items-center">
                          {fieldKey && (
                            <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border-2 transition-all ${verification?.status === 'Approved' ? 'bg-green-50 border-green-200' : verification?.status === 'NeedsExplanation' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                              <span className="text-[9px] font-black text-gray-400 uppercase">{contextName}: <span className="text-orange-600 text-sm ml-2">{dataValue}</span></span>
                            </div>
                          )}
                          {cat === CriterionType.ETHICS && selectedStudent.isPartyMember && (
                            <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border-2 transition-all ${selectedStudent.verifications.partyMember?.status === 'Approved' ? 'bg-green-50 border-green-200' : selectedStudent.verifications.partyMember?.status === 'NeedsExplanation' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                              <span className="text-[9px] font-black text-gray-400 uppercase">Đối tượng: <span className="text-blue-600 text-[10px] ml-2 font-black">ĐẢNG VIÊN</span></span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display Explanations for General Fields */}
                      {(() => {
                        const renderFieldExplanation = (fKey: keyof StudentProfile['verifications'], cName: string, dVal: string, ver: any) => {
                          if (!ver?.explanation && !ver?.fileUrl) return null;
                          return (
                            <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl animate-fade-in relative overflow-hidden">
                              <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[7px] font-black uppercase rounded-bl-xl">Giải trình của SV</div>
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{cName} ({dVal})</p>
                                    <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[6px] font-black uppercase rounded border border-red-100 shrink-0">Bắt buộc</span>
                                  </div>
                                  <p className="text-sm text-gray-700 font-bold leading-relaxed italic">"{ver.explanation || '(Không có nội dung văn bản)'}"</p>
                                  {ver.explanationDate && (
                                    <p className="text-[9px] font-black text-blue-500 uppercase mt-2">
                                      <i className="far fa-clock mr-1.5"></i>
                                      Giải trình lúc: {new Date(ver.explanationDate).toLocaleString('vi-VN')}
                                    </p>
                                  )}
                                </div>
                                {ver.fileUrl && (
                                  <button 
                                    onClick={() => window.open(formatUrl(ver.fileUrl), '_blank')}
                                    className="px-4 py-2 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all border border-blue-950 flex items-center gap-2"
                                  >
                                    <i className="fas fa-file-download"></i> Xem file
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-2 justify-end border-t border-blue-100 pt-4">
                                 <button onClick={() => handleManualDataVerify('Approved', fKey, cName)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ver?.status === 'Approved' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'}`}>Đạt</button>
                                 <button onClick={() => handleManualDataVerify('NeedsExplanation', fKey, cName)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ver?.status === 'NeedsExplanation' ? 'bg-orange-500 text-white' : 'bg-white text-orange-500 border border-orange-200 hover:bg-orange-50'}`}>Cần giải trình</button>
                                 <button onClick={() => handleManualDataVerify('Rejected', fKey, cName)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ver?.status === 'Rejected' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}>Không đạt</button>
                              </div>
                            </div>
                          );
                        };
                        return (
                          <>
                            {fieldKey && renderFieldExplanation(fieldKey, contextName, dataValue, verification)}
                            {cat === CriterionType.ETHICS && selectedStudent.isPartyMember && 
                              renderFieldExplanation('partyMember', 'Xác nhận Đảng viên', 'Hồ sơ Đảng', selectedStudent.verifications.partyMember)
                            }
                          </>
                        );
                      })()}

                      <div className="space-y-4">
                        {list.length > 0 ? (
                          list.map(ev => {
                          const criterion = managedCriteria[cat]?.find(c => c.id === ev.subCriterionId);
                          const isSimpleEvidence = ['eth_hard_1', 'aca_hard_1', 'int_hard_1', 'eth_point_1', 'phy_hard_1', 'aca_point_2', 'int_hard_2'].includes(ev.subCriterionId);
                          const hasLevelPoints = criterion && Object.keys(criterion.levelPoints).length > 0;
                          
                          // Hide level for simple point-based criteria. Show it if explicitly it has points or user provided a decision
                          const showLevel = !isSimpleEvidence && (hasLevelPoints || (ev.type && ev.type !== EvidenceType.NO_DECISION));
                          const showDecisionNumber = !!ev.decisionNumber;
                           // Only show quantity if it's explicitly more than 1 OR if it's a criterion that REQUIRES quantity input (like volunteer days)
                           const showQty = (ev.qty !== undefined && ev.qty > 1) || (criterion?.minQty !== undefined && criterion.minQty > 0) || ev.subCriterionId === 'vol_hard_2';

                          return (
                            <div key={ev.id} className={`group bg-white p-5 border rounded-2xl flex gap-6 items-center transition-all ${ev.status === 'Approved' ? 'border-green-500/30 bg-green-50/20' : ev.status === 'Rejected' ? 'border-red-500/30 bg-red-50/20' : ev.status === 'NeedsExplanation' ? 'border-orange-500/40 bg-orange-50/30' : 'border-gray-200'}`}>
                              {/* Image Preview */}
                              {ev.fileUrl && (ev.fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) || ev.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) ? (
                                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden border cursor-pointer">
                                  <img src={ev.fileUrl} alt={ev.name} className="w-full h-full object-cover hover:scale-105 transition-transform" onClick={() => window.open(ev.fileUrl, '_blank')} />
                                </div>
                              ) : (
                                <div className="w-20 h-20 flex-shrink-0 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 text-blue-400">
                                  <i className="fas fa-file-pdf text-2xl"></i>
                                </div>
                              )}

                               <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-1">
                                   <div className="max-w-[70%]">
                                     <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                       <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest truncate">{ev.subCriterionName}</p>
                                       {ev.isHardCriterion ? (
                                         <span className="px-1 py-0.5 bg-red-100 text-red-600 text-[6px] font-black uppercase rounded border border-red-200 flex items-center gap-1 shrink-0" title="Bắt buộc đạt">
                                           <i className="fas fa-exclamation-triangle"></i> Cứng
                                         </span>
                                       ) : (
                                         <span className="px-1 py-0.5 bg-blue-100 text-blue-600 text-[6px] font-black uppercase rounded border border-blue-200 flex items-center gap-1 shrink-0" title="Cộng điểm">
                                           <i className="fas fa-plus-circle"></i> Cộng
                                         </span>
                                       )}
                                     </div>
                                     <h5 className="text-[13px] font-black text-gray-900 uppercase truncate" title={ev.name}>{ev.name}</h5>
                                   </div>
                                   <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest shrink-0 ${ev.status === 'Approved' ? 'bg-green-500 text-white' : ev.status === 'Rejected' ? 'bg-red-500 text-white' : ev.status === 'NeedsExplanation' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{ev.status}</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                   {showDecisionNumber && (
                                     <>
                                       <span title="Số quyết định" className="text-gray-500">
                                         <i className="fas fa-hashtag mr-1"></i>
                                         SQĐ: {ev.decisionNumber}
                                       </span>
                                       <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                     </>
                                   )}
                                   {showQty && (
                                     <>
                                       <span title="Số lượng / Ngày tình nguyện / Lần" className="text-green-600">
                                         <i className="fas fa-layer-group mr-1"></i>
                                         SL: {ev.qty}
                                       </span>
                                       <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                     </>
                                   )}
                                   {showLevel && (
                                     <>
                                       <span>{ev.level}</span>
                                       <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                     </>
                                   )}
                                   <button onClick={() => window.open(ev.fileUrl, '_blank')} className="text-blue-500 hover:text-orange-500 transition-colors flex items-center gap-1"><i className="fas fa-eye"></i> Xem file</button>
                                 </div>
                               {ev.studentExplanation && (
                                 <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl relative overflow-hidden animate-fade-in ">
                                   <div className="absolute top-0 right-0 px-2 py-0.5 bg-blue-600 text-white text-[6px] font-black uppercase rounded-bl-lg">Giải trình SV</div>
                                   <p className="text-[11px] font-bold text-gray-800 leading-relaxed italic"><i className="fas fa-comment-dots mr-2 text-blue-500"></i>"{ev.studentExplanation}"</p>
                                 </div>
                               )}
                               {ev.adminFeedback && <p className="text-[10px] italic text-orange-700 mt-2 font-medium">Lưu ý: {ev.adminFeedback}</p>}
                            </div>

                            <div className="flex flex-col gap-1">
                              <button onClick={() => handleEvidenceAction(cat, ev.id, 'Approved')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${ev.status === 'Approved' ? 'bg-green-600 text-white border border-green-500' : 'bg-gray-50 text-green-600 hover:bg-green-100'}`} title="Đạt"><i className="fas fa-check text-[10px]"></i></button>
                              <button onClick={() => handleEvidenceAction(cat, ev.id, 'NeedsExplanation')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${ev.status === 'NeedsExplanation' ? 'bg-orange-500 text-white border border-orange-400' : 'bg-gray-50 text-orange-500 hover:bg-orange-100'}`} title="Yêu cầu giải trình"><i className="fas fa-comment-dots text-[10px]"></i></button>
                              <button onClick={() => handleEvidenceAction(cat, ev.id, 'Rejected')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${ev.status === 'Rejected' ? 'bg-red-600 text-white border border-red-500' : 'bg-gray-50 text-red-600 hover:bg-red-100'}`} title="Không đạt"><i className="fas fa-times text-[10px]"></i></button>
                            </div>
                          </div>
                        );
                      })) : (
                          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-200">
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
      {/* User Management Modal */}
      {userForm.show && (
        <div className="fixed inset-0 z-[1200] bg-blue-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl border border-gray-100 overflow-hidden animate-fade-up">
            <div className="px-8 py-6 bg-blue-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Thêm người dùng mới</h3>
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Khởi tạo tài khoản và hồ sơ</p>
              </div>
              <button onClick={() => setUserForm({ ...userForm, show: false })} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Role Selection */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                {[
                  { key: 'SinhVien', label: 'Sinh viên' },
                  { key: 'Admin', label: 'Admin' }
                ].map(r => (
                  <button
                    key={r.key}
                    onClick={() => setUserForm({ ...userForm, data: { ...userForm.data, VaiTro: r.key } })}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${userForm.data.VaiTro === r.key ? 'bg-white text-blue-900 border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên đăng nhập {userForm.data.VaiTro === 'SinhVien' ? '(Mã SV)' : ''}</label>
                  <input
                    type="text"
                    value={userForm.data.TenDangNhap}
                    onChange={e => setUserForm({ ...userForm, data: { ...userForm.data, TenDangNhap: e.target.value } })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:border-blue-600 outline-none transition-all"
                    placeholder="VD: 20123456"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu khởi tạo</label>
                  <input
                    type="password"
                    value={userForm.data.MatKhau}
                    onChange={e => setUserForm({ ...userForm, data: { ...userForm.data, MatKhau: e.target.value } })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:border-blue-600 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <input
                  type="text"
                  value={userForm.data.HoTen}
                  onChange={e => setUserForm({ ...userForm, data: { ...userForm.data, HoTen: e.target.value } })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-blue-900 outline-none transition-all uppercase"
                  placeholder="VD: NGUYỄN VĂN A"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <input
                  type="email"
                  value={userForm.data.Email}
                  onChange={e => setUserForm({ ...userForm, data: { ...userForm.data, Email: e.target.value } })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:border-blue-900 outline-none transition-all"
                  placeholder={userForm.data.VaiTro === 'SinhVien' ? 'Để trống nếu dùng email mặc định' : 'VD: admin@due.udn.vn'}
                />
              </div>

              {userForm.data.VaiTro === 'SinhVien' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lớp sinh hoạt</label>
                    <input
                      type="text"
                      value={userForm.data.Lop}
                      onChange={e => setUserForm({ ...userForm, data: { ...userForm.data, Lop: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:border-blue-600 outline-none transition-all"
                      placeholder="VD: 47K12.1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Khoa / Đơn vị</label>
                    <input
                      type="text"
                      value={userForm.data.Khoa}
                      onChange={e => setUserForm({ ...userForm, data: { ...userForm.data, Khoa: e.target.value } })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:border-blue-600 outline-none transition-all"
                      placeholder="VD: Khoa Công nghệ thông tin"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 flex justify-end gap-3 border-t">
              <button 
                onClick={() => setUserForm({ ...userForm, show: false })}
                className="px-6 py-3 text-gray-400 font-black text-[9px] uppercase tracking-widest hover:text-gray-600 transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveUser}
                className="px-10 py-3 bg-blue-900 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all"
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
      {renderFeedbackModal()}
      {renderTopExpandedModal()}
    </div>
  );
};

export default AdminDashboard;
