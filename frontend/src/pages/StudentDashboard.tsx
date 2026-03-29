import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CriterionType, Evidence, StudentProfile, EvidenceLevel, EvidenceType, FieldVerification, SystemConfig } from '../types';
import { SUB_CRITERIA, POINT_MATRIX } from '../constants';
import EvidenceForm from '../components/EvidenceForm';
import { formatUrl } from '../utils/mapper';

const STEPS = [
  CriterionType.ETHICS,
  CriterionType.ACADEMIC,
  CriterionType.PHYSICAL,
  CriterionType.VOLUNTEER,
  CriterionType.INTEGRATION,
  'SUBMIT' as const
];

const STEP_LABELS: Record<string, string> = {
  [CriterionType.ETHICS]: 'Đạo đức tốt',
  [CriterionType.ACADEMIC]: 'Học tập tốt',
  [CriterionType.PHYSICAL]: 'Thể lực tốt',
  [CriterionType.VOLUNTEER]: 'Tình nguyện tốt',
  [CriterionType.INTEGRATION]: 'Hội nhập tốt',
  'SUBMIT': 'Gửi hồ sơ',
};

export const checkHardMet = (cat: CriterionType, student: StudentProfile, criteriaGroups: any[]) => {
  const group = criteriaGroups.find(g => {
    const catMap: Record<string, CriterionType> = {
      'Đạo đức tốt': CriterionType.ETHICS,
      'Học tập tốt': CriterionType.ACADEMIC,
      'Thể lực tốt': CriterionType.PHYSICAL,
      'Tình nguyện tốt': CriterionType.VOLUNTEER,
      'Hội nhập tốt': CriterionType.INTEGRATION
    };
    return catMap[g.TenNhom] === cat;
  });

  if (!group) return false;

  const evs = student.evidences[cat] || [];
  const approvedEvs = evs.filter(e => e.status === 'Approved' || e.status === 'Pending');

  // All hard criteria from backend must be met
  const hardCriteria = group.tieu_chi.filter((tc: any) => tc.LoaiTieuChi === 'Cung');
  
  if (hardCriteria.length === 0) {
    // Fallback logic for basic requirements if no criteria are defined in backend
    // but usually there should be.
    if (cat === CriterionType.ETHICS) return student.trainingPoints >= 80 && student.noViolation;
    if (cat === CriterionType.ACADEMIC) return student.gpa >= 3.2 && student.gpa <= 4.0;
    return true;
  }

  const isVolunteer = cat === CriterionType.VOLUNTEER;
  const results = hardCriteria.map((tc: any) => {
    const slug = tc.MaTieuChi;
    
    // Profile-based checks + Evidence requirement
    if (slug === 'eth_hard_1') return student.trainingPoints >= 80 && approvedEvs.some(e => e.subCriterionId === slug);
    if (slug === 'eth_hard_2') return student.noViolation;
    if (slug === 'aca_hard_1') return student.gpa >= 3.2 && approvedEvs.some(e => e.subCriterionId === slug);
    if (slug === 'phy_hard_1') return student.peScore >= 7.0 && approvedEvs.some(e => e.subCriterionId === slug);
    
    // Education Level/English (Integration)
    if (slug === 'int_hard_1' || slug === 'int_hard_2') {
       const profileMet = (['B1', 'B2', 'C1', 'C2'].includes(student.englishLevel) || student.englishGpa >= 3.0);
       return profileMet && approvedEvs.some(e => e.subCriterionId === slug);
    }

    // Special logic for slug-based evidence (if any)
    if (slug === 'phy_hard_2') {
       return student.peScore >= 7.0 || approvedEvs.some(e => e.subCriterionId === tc.MaTieuChi);
    }
    
    // Quantity rules for Volunteer
    if (isVolunteer) {
      const matchingEvs = approvedEvs.filter(e => e.subCriterionId === slug);
      // BUG FIX: Sum up quantities instead of just counting records
      const totalQty = matchingEvs.reduce((sum, e) => sum + (e.qty || 1), 0);
      
      if (slug === 'vol_hard_1') return totalQty >= 1; // Chiến dịch: 1 GCN
      if (slug === 'vol_hard_2') return totalQty >= 3; // 3 ngày: 3 GCN
      if (slug === 'vol_hard_3') {
        const validGK = matchingEvs.filter(e => 
          e.type === EvidenceType.GK && 
          e.level !== EvidenceLevel.KHOA // Cấp trường trở lên
        );
        const gkQty = validGK.reduce((sum, e) => sum + (e.qty || 1), 0);
        return gkQty >= 1;
      }
      if (slug === 'vol_hard_4') {
        // Hiến máu: 2 GCN tại DUE (TRUONG) hoặc 3 GCN tổng cộng
        const atDueEvs = matchingEvs.filter(e => e.level === EvidenceLevel.TRUONG);
        const atDueQty = atDueEvs.reduce((sum, e) => sum + (e.qty || 1), 0);
        return atDueQty >= 2 || totalQty >= 3;
      }
      return totalQty >= 1;
    }

    // Default: Check if any approved evidence exists for this specific TC ID
    return approvedEvs.some(e => e.subCriterionId === tc.MaTieuChi);
  });

  // Ethics and Academic require ALL hard criteria to be met
  // Physical, Volunteer, and Integration only require ONE of the hard criteria to be met
  if (cat === CriterionType.ETHICS || cat === CriterionType.ACADEMIC) {
    return results.every(res => res === true);
  }
  return results.some(res => res === true);
};

const DeadlineClosedView = ({ message }: { message?: string }) => {
  return (
    <div className="fixed inset-0 z-[2000] bg-slate-50 flex items-center justify-center p-6 animate-fade-in overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="bg-white/70 backdrop-blur-2xl border border-white p-12 rounded-[40px] shadow-2xl shadow-blue-900/10 text-center space-y-8 animate-scale-up relative overflow-hidden">
          {/* Accent bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-orange-500 to-blue-600"></div>
          
          <div className="relative">
            <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-lg shadow-orange-200 rotate-12 transition-transform hover:rotate-0 duration-500">
              <i className="fas fa-hourglass-end"></i>
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-0 w-24 h-24 border-4 border-orange-500/20 rounded-3xl mx-auto scale-125 animate-ping opacity-20"></div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black text-blue-950 uppercase tracking-tighter leading-tight">
              Cổng nộp hồ sơ <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 italic">Hiện đang đóng</span>
            </h2>
            <div className="max-w-md mx-auto">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                  {message || "Hiện tại không còn nằm trong khung thời gian quy định hoặc Admin đã đóng hệ thống xét duyệt."}
                </p>
            </div>
          </div>

          <div className="pt-8 flex flex-col items-center gap-4">
            <a 
              href="/"
              className="px-10 py-5 bg-blue-950 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-200 transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 active:scale-95"
            >
              <i className="fas fa-home text-xs"></i> Quay lại trang chủ
            </a>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Gặp sự cố? Liên hệ Liên chi đoàn khoa của bạn
            </p>
          </div>
        </div>

        {/* Floating decor */}
        <div className="absolute -top-6 -right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-900 animate-bounce duration-3000 delay-500 border border-slate-100">
            <i className="fas fa-lock text-[10px]"></i>
        </div>
      </div>
    </div>
  );
};

const StudentDashboard: React.FC<{
  student: StudentProfile;
  addEvidence: (type: CriterionType, ev: Evidence) => void;
  removeEvidence: (type: CriterionType, id: string) => void;
  updateEvidence: (type: CriterionType, id: string, ev: Evidence) => void;
  updateProfile: (data: Partial<StudentProfile>) => void;
  updateEvidenceExplanation: (cat: CriterionType, id: string, explanation: string) => void;
  updateFieldExplanation: (field: keyof StudentProfile['verifications'], explanation: string) => void;
  onSubmit: () => void;
  onResubmit: () => void;
  onUnsubmit: () => void;
  criteriaGroups: any[];
  systemSettings: SystemConfig | null;
  isLoading?: boolean;
}> = ({ student, addEvidence, removeEvidence, updateEvidence, updateProfile, updateEvidenceExplanation, updateFieldExplanation, onSubmit, onResubmit, onUnsubmit, criteriaGroups, systemSettings, isLoading }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [addingTo, setAddingTo] = useState<{ type: CriterionType, isHard: boolean, subName: string, subId: string, editingEvidence?: Evidence } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [showUnsubmitModal, setShowUnsubmitModal] = useState(false);
  const [isUnsubmittingAction, setIsUnsubmittingAction] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest animate-pulse">Đang tải hồ sơ...</p>
      </div>
    );
  }

  // CHECK DEADLINE AND EDIT PERMISSION - ONLY SHOW IF EXPLICITLY FALSE
  if (student && student.can_edit_profile === false && student.status === 'Draft') {
    return <DeadlineClosedView message={student.submission_msg} />;
  }

  if (!student) return <div className="text-center py-20 font-black text-blue-900 uppercase tracking-widest">Không tìm thấy thông tin sinh viên</div>;

  const renderUnsubmitModal = () => {
    if (!showUnsubmitModal) return null;

    return (
      <div className="fixed inset-0 z-[2000] bg-blue-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-fade-up border border-gray-100">
          <div className="px-8 py-6 bg-orange-500 text-white flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Xác nhận hủy nộp</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Thay đổi trạng thái hồ sơ</p>
            </div>
            <button onClick={() => setShowUnsubmitModal(false)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
          </div>

          <div className="p-8 space-y-6">
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              Bạn có chắc chắn muốn hủy nộp hồ sơ để chỉnh sửa lại không? Sau khi xác nhận, hồ sơ sẽ quay về trạng thái nháp và bạn có thể thay đổi các minh chứng.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                onClick={() => setShowUnsubmitModal(false)}
                className="px-6 py-3 text-gray-400 font-black text-[9px] uppercase tracking-widest hover:text-gray-600 transition-all"
              >
                Quay lại
              </button>
              <button 
                disabled={isUnsubmittingAction}
                onClick={async () => {
                  setIsUnsubmittingAction(true);
                  try {
                    await onUnsubmit();
                    setShowUnsubmitModal(false);
                  } catch (e) {
                    // Error handled in hook
                  } finally {
                    setIsUnsubmittingAction(false);
                  }
                }}
                className={`px-10 py-3 bg-orange-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all ${isUnsubmittingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUnsubmittingAction ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleFinalSubmitExplanation = async () => {
    try {
      setIsResubmitting(true);
      
      // 1. Gửi giải trình cho các trường dữ liệu chung (CHỈ gửi khi có thay đổi)
      for (const [key, exp] of Object.entries(localFieldExplanations)) {
        const file = localFieldFiles[key];
        const originalExp = (student.verifications[key] as FieldVerification)?.explanation || '';
        if (exp !== originalExp || file) {
          await updateFieldExplanation(key as any, exp, file);
        }
      }

      // 2. Gửi giải trình cho các minh chứng (CHỈ gửi khi có thay đổi)
      for (const [id, exp] of Object.entries(localEvidenceExplanations)) {
        const file = localEvidenceFiles[id];
        
        // Tìm minh chứng gốc để so sánh
        let originalEv: Evidence | undefined;
        let category: CriterionType | null = null;
        for (const [cat, evs] of Object.entries(student.evidences)) {
          const found = (evs as Evidence[]).find(e => e.id === id);
          if (found) {
            originalEv = found;
            category = cat as CriterionType;
            break;
          }
        }

        const originalExp = originalEv?.studentExplanation || '';
        if (category && (exp !== originalExp || file)) {
          await updateEvidenceExplanation(category, id, exp, file);
        }
      }

      // 3. Cuối cùng mới thực hiện submit profile để chuyển trạng thái sang Submitted
      await onResubmit();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      console.error("Submit Error:", e);
      toast.error("Có lỗi xảy ra khi gửi giải trình. Vui lòng thử lại.");
    } finally {
      setIsResubmitting(false);
    }
  };

  // Local state for form inputs to prevent typing glitches
  const [localData, setLocalData] = useState({
    trainingPoints: student.trainingPoints || 0,
    gpa: student.gpa || 0,
    peScore: student.peScore || 0,
    englishGpa: student.englishGpa || 0,
    englishLevel: student.englishLevel || 'None',
    noViolation: student.noViolation || false,
    isPartyMember: student.isPartyMember || false,
  });

  // Local state for explanations to prevent lag
  const [localFieldExplanations, setLocalFieldExplanations] = useState<Record<string, string>>({});
  const [localEvidenceExplanations, setLocalEvidenceExplanations] = useState<Record<string, string>>({});
  const [localFieldFiles, setLocalFieldFiles] = useState<Record<string, File>>({});
  const [localEvidenceFiles, setLocalEvidenceFiles] = useState<Record<string, File>>({});

  // Initialize local explanations from current student data
  React.useEffect(() => {
    const fieldExps: Record<string, string> = {};
    Object.entries(student.verifications).forEach(([k, v]) => {
      const fieldVer = v as FieldVerification;
      if (fieldVer.explanation) fieldExps[k] = fieldVer.explanation;
    });
    setLocalFieldExplanations(fieldExps);

    const evExps: Record<string, string> = {};
    Object.values(student.evidences).flat().forEach(val => {
      const ev = val as Evidence;
      if (ev.studentExplanation) evExps[ev.id] = ev.studentExplanation;
    });
    setLocalEvidenceExplanations(evExps);
  }, [student.id]);

  // Remove the aggressive useEffect that overwrites localData on every keystroke/save 
  // Sync localData ONLY when student ID changes (e.g., initial load or user switch)
  React.useEffect(() => {
    setLocalData({
      trainingPoints: student.trainingPoints || 0,
      gpa: student.gpa || 0,
      peScore: student.peScore || 0,
      englishGpa: student.englishGpa || 0,
      englishLevel: student.englishLevel || 'None',
      noViolation: student.noViolation || false,
      isPartyMember: student.isPartyMember || false,
    });
  }, [student.id]);

  const handleLocalChange = (field: keyof typeof localData, value: any) => {
    // For booleans, the value comes straight from the onChange event 
    const finalValue = field === 'noViolation' && typeof value === 'string' ? value === 'true' : value;
    
    setLocalData(prev => ({ ...prev, [field]: finalValue }));
    if (typeof finalValue === 'boolean' || field === 'englishLevel') {
      // For booleans/selects, update immediately
      updateProfile({ [field]: finalValue });
    }
  };

  const handleBlur = (field: keyof typeof localData, isFloat = false, maxVal = 100) => {
    const valStr = String(localData[field]);
    if (valStr.trim() === '') {
       // Allow empty fields (represented as 0 or null depending on backend)
       setLocalData(prev => ({ ...prev, [field]: 0 }));
       updateProfile({ [field]: 0 });
       return;
    }

    let num = isFloat ? parseFloat(valStr) : parseInt(valStr, 10);
    if (isNaN(num)) num = 0;
    num = Math.min(maxVal, Math.max(0, num));
    
    // update local to formatted/capped value
    setLocalData(prev => ({ ...prev, [field]: num }));
    // trigger actual update
    updateProfile({ [field]: num });
  };

  const handleSaveEvidence = (ev: Evidence) => {
    if (addingTo?.editingEvidence) {
      updateEvidence(addingTo.type, addingTo.editingEvidence.id, ev);
    } else {
      addEvidence(addingTo!.type, ev);
    }
    setAddingTo(null);
  };

  const handleEditClick = (type: CriterionType, isHard: boolean, ev: Evidence) => {
    // Find sub-criterion name
    const group = criteriaGroups.find(g => {
      const catMap: Record<string, CriterionType> = {
        'Đạo đức tốt': CriterionType.ETHICS,
        'Học tập tốt': CriterionType.ACADEMIC,
        'Thể lực tốt': CriterionType.PHYSICAL,
        'Tình nguyện tốt': CriterionType.VOLUNTEER,
        'Hội nhập tốt': CriterionType.INTEGRATION
      };
      return catMap[g.TenNhom] === type;
    });
    const sub = group?.tieu_chi.find((tc: any) => String(tc.MaTieuChi) === ev.subCriterionId);
    
    setAddingTo({
      type,
      isHard,
      subName: sub?.MoTa || '',
      subId: ev.subCriterionId,
      editingEvidence: ev
    });
  };

  const isLocked = ['Submitted', 'Pending', 'Approved', 'Processing'].includes(student.status);
  const isProcessing = student.status === 'Processing';
  const isApproved = student.status === 'Approved';
  const isRejected = student.status === 'Rejected';

  // Submission Window Logic
  const isSubmissionOpen = React.useMemo(() => {
    if (!systemSettings) return true; // Default to open if no settings found
    if (!systemSettings.TrangThaiMo) return false;

    const now = new Date();
    const start = systemSettings.ThoiGianBatDau ? new Date(systemSettings.ThoiGianBatDau) : null;
    const end = systemSettings.ThoiGianKetThuc ? new Date(systemSettings.ThoiGianKetThuc) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;

    return true;
  }, [systemSettings]);

  // Student can edit if window is open OR they are in "Processing" state (for explanations)
  const canEdit = isSubmissionOpen || isProcessing;

  // Lấy danh sách các mục bị Admin bắt lỗi
  const flaggedEvidences: { cat: CriterionType, ev: Evidence }[] = [];
  Object.entries(student.evidences).forEach(([cat, list]) => {
    (list as Evidence[]).forEach(ev => {
      if (ev.status === 'NeedsExplanation') flaggedEvidences.push({ cat: cat as CriterionType, ev });
    });
  });

  const flaggedFields: { key: keyof StudentProfile['verifications'], label: string, val: any }[] = [];
  if (student.verifications.trainingPoints?.status === 'NeedsExplanation') flaggedFields.push({ key: 'trainingPoints', label: 'Điểm rèn luyện', val: student.trainingPoints });
  if (student.verifications.gpa?.status === 'NeedsExplanation') flaggedFields.push({ key: 'gpa', label: 'GPA Học tập', val: student.gpa });
  if (student.verifications.peScore?.status === 'NeedsExplanation') flaggedFields.push({ key: 'peScore', label: 'Điểm Thể dục', val: student.peScore });
  if (student.verifications.english?.status === 'NeedsExplanation') flaggedFields.push({ key: 'english', label: 'Ngoại ngữ', val: `${student.englishLevel}` });
  if (student.verifications.partyMember?.status === 'NeedsExplanation') flaggedFields.push({ key: 'partyMember', label: 'Đảng viên', val: student.isPartyMember ? 'Có' : 'Không' });



  // GIAO DIỆN KHI HỒ SƠ ĐANG CHỜ DUYỆT (LOCK)
  if (student.status === 'Submitted') {
    return (
      <>
        {/* Submission Window Banner */}
        {!isSubmissionOpen && !isApproved && !isRejected && (
          <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-4 animate-pulse-slow">
            <i className="fas fa-exclamation-triangle"></i>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {systemSettings?.ThongBaoHetHan || "Cổng nộp hồ sơ hiện đã đóng. Bạn không thể nộp hoặc chỉnh sửa hồ sơ mới."}
            </span>
            {!isProcessing && <div className="px-3 py-1 bg-white/20 rounded border border-white/30 text-[8px]">READ ONLY</div>}
          </div>
        )}
        {isSubmissionOpen && !isApproved && !isRejected && systemSettings?.ThongBaoHieuLuc && (
           <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-center gap-4 animate-fade-in text-[9px] font-bold uppercase tracking-widest">
              <i className="fas fa-bullhorn"></i>
              <span>{systemSettings.ThongBaoHieuLuc}</span>
           </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-10 text-white border border-white/10 rounded-lg">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
              <i className="fas fa-paper-plane animate-pulse"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight font-formal">Hồ sơ đã được nộp</h2>
              <p className="text-blue-100 font-bold uppercase text-[10px] tracking-widest mt-1">Trạng thái: Đang chờ thẩm định</p>
            </div>
          </div>
          <p className="text-sm font-medium leading-relaxed opacity-90 max-w-2xl">
            Hồ sơ của bạn đã được gửi lên hệ thống và đang chờ Ban thư ký Hội Sinh viên thẩm định. Trong thời gian này, các tính năng chỉnh sửa sẽ tạm khóa để đảm bảo tính toàn vẹn của dữ liệu.
          </p>
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-4">
            {flaggedEvidences.length === 0 && flaggedFields.length === 0 && canEdit && (
              <button 
                onClick={() => setShowUnsubmitModal(true)} 
                className="px-8 py-3 bg-white text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-orange-500 hover:text-white transition-all active:scale-95 border border-gray-100"
              >
                Hủy nộp để chỉnh sửa
              </button>
            )}
            {!canEdit && student.status === 'Submitted' && (
               <div className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-lock"></i> Hiện đã hết hạn chỉnh sửa
               </div>
            )}
            <button 
              onClick={() => window.print()}
              className="px-8 py-3 bg-blue-700/50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all border border-white/20"
            >
              Xem & In hồ sơ (PDF)
            </button>
          </div>
        </div>

        {/* Thông tin thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Tổng điểm tích lũy', val: student.totalScore, icon: 'fa-star', color: 'text-orange-500' },
            { label: 'Tiêu chí đạt', val: Object.values(CriterionType).filter(c => checkHardMet(c as CriterionType, student, criteriaGroups)).length + '/5', icon: 'fa-check-circle', color: 'text-green-500' },
            { label: 'Minh chứng đính kèm', val: Object.values(student.evidences).flat().length, icon: 'fa-file-alt', color: 'text-blue-500' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-lg ${item.color}`}><i className={`fas ${item.icon}`}></i></div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-xl font-black text-gray-900 font-formal">{item.val}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
        {renderUnsubmitModal()}
      </>
    );
  }

  // GIAO DIỆN KHI HỒ SƠ ĐÃ ĐƯỢC DUYỆT
  if (isApproved) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-10 text-white border border-white/10 rounded-lg">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl"><i className="fas fa-award"></i></div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Chúc mừng! Hồ sơ đã được duyệt</h2>
              <p className="text-green-100 text-sm font-medium mt-1">Bạn đã được công nhận danh hiệu "Sinh viên 5 Tốt"</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <i className="fas fa-check-circle text-green-600 text-4xl"></i>
          </div>
          <h3 className="text-xl font-black text-blue-900 uppercase">{student.fullName}</h3>
          <p className="text-gray-400 text-sm">Mã SV: {student.studentId} • {student.faculty}</p>
          <div className="bg-blue-50 rounded-lg p-6 inline-block">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng điểm tích lũy</p>
            <p className="text-5xl font-black text-blue-900 font-formal">{student.totalScore}</p>
          </div>
        </div>
      </div>
    );
  }

  // GIAO DIỆN KHI HỒ SƠ BỊ TỪ CHỐI
  if (isRejected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-10 text-white border border-white/10 rounded-lg">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl"><i className="fas fa-times-circle"></i></div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Hồ sơ không được duyệt</h2>
              <p className="text-red-100 text-sm font-medium mt-1">Rất tiếc, hồ sơ của bạn chưa đạt yêu cầu xét duyệt</p>
            </div>
          </div>
          {student.feedback && (
            <p className="text-sm font-medium border-l-4 border-white/40 pl-6 py-2 italic opacity-90 mt-4">
              Lý do: "{student.feedback}"
            </p>
          )}
        </div>
        <div className="bg-white border rounded-lg p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <i className="fas fa-file-excel text-red-500 text-4xl"></i>
          </div>
          <h3 className="text-xl font-black text-blue-900 uppercase">{student.fullName}</h3>
          <p className="text-gray-400 text-sm">Mã SV: {student.studentId} • {student.faculty}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 max-w-md mx-auto">
            <p className="text-xs text-amber-700 font-medium"><i className="fas fa-info-circle mr-2"></i>Vui lòng liên hệ Ban cán sự lớp hoặc Đoàn - Hội Sinh viên để được hướng dẫn thêm.</p>
          </div>
        </div>
      </div>
    );
  }


  // GIAO DIỆN CHỈ HIỂN THỊ KHI ĐANG GIẢI TRÌNH
  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
        <div className="bg-[#f26522] p-10 text-white rounded-sm relative overflow-hidden border border-orange-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl"><i className="fas fa-exclamation-triangle animate-bounce-slow"></i></div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Chế độ Giải trình Hồ sơ</h2>
                <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Hội đồng đang chờ phản hồi từ bạn</p>
              </div>
            </div>

          </div>
          
          <div className="mt-10 p-8 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-orange-100 italic">Ý kiến phản hồi từ Hội đồng:</h4>
            <p className="text-xl font-medium leading-relaxed font-formal italic">
              " {student.feedback || "Vui lòng phản hồi các nội dung sau để Hội đồng tiếp tục xét duyệt."} "
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.4em] border-b-2 border-blue-900 pb-2 inline-block">Danh sách mục cần phản hồi</h3>

          {/* Loop qua các trường thông tin chung bị lỗi */}
          {flaggedFields.map(field => (
            <div key={field.key} className="bg-white border border-orange-200 p-8 rounded-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h4 className="text-base font-black text-blue-900 uppercase">{field.label}: <span className="text-orange-600 font-formal text-xl">{field.val}</span></h4>
                <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-3 py-1 uppercase tracking-widest">Dữ liệu chung</span>
              </div>
              <div className="bg-orange-50/50 p-5 rounded border-l-4 border-orange-400">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Lý do từ Admin:</p>
                <p className="text-xs text-gray-700 font-medium italic">"{student.verifications[field.key]?.feedback}"</p>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Nội dung giải trình của bạn:</label>
                <textarea
                  className="w-full p-4 border-2 border-gray-100 focus:border-orange-500 outline-none text-sm min-h-[120px] transition-all bg-gray-50/30"
                  placeholder="Nhập giải trình tại đây..."
                  value={localFieldExplanations[field.key] || ''}
                  onChange={(e) => setLocalFieldExplanations(prev => ({ ...prev, [field.key]: e.target.value }))}
                />

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id={`field-file-upload-${field.key}`}
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLocalFieldFiles(prev => ({ ...prev, [field.key]: file }));
                          toast.success("Đã chọn file: " + file.name + ". File sẽ được gửi khi bạn bấm nút GỬI PHẢN HỒI.");
                        }
                      }}
                    />
                    <label htmlFor={`field-file-upload-${field.key}`} className={`px-4 py-2 border-2 border-dashed rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${localFieldFiles[field.key] ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600'}`}>
                      <i className={localFieldFiles[field.key] ? "fas fa-check-circle" : "fas fa-paperclip"}></i>
                      {localFieldFiles[field.key] ? `Đã chọn: ${localFieldFiles[field.key].name}` : "Tải lên file Hình ảnh/PDF mới"}
                    </label>
                    <span className="text-[10px] text-gray-400 italic">Chọn file minh chứng bổ sung cho {field.label.toLowerCase()}.</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loop qua các minh chứng bị lỗi */}
          {flaggedEvidences.map(({ cat, ev }) => (
            <div key={ev.id} className="bg-white border border-orange-200 p-8 rounded-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-[0.2em] mb-1 block">{cat}</span>
                  <h4 className="text-base font-black text-blue-900 uppercase">{ev.name}</h4>
                </div>
                <button 
                  onClick={() => {
                     if (!ev.fileUrl) {
                        toast.error('Không tìm thấy file đính kèm hợp lệ!');
                        return;
                     }
                     const url = formatUrl(ev.fileUrl);
                     window.open(url, '_blank');
                  }} 
                  className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all border border-blue-950"
                >
                   Mở Minh chứng
                </button>
              </div>
              <div className="bg-orange-50/50 p-5 rounded border-l-4 border-orange-400">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Lý do từ Admin:</p>
                <p className="text-xs text-gray-700 font-medium italic">"{ev.adminFeedback}"</p>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Nội dung giải trình của bạn:</label>
                <textarea
                  className="w-full p-4 border-2 border-gray-100 focus:border-orange-500 outline-none text-sm min-h-[120px] transition-all bg-gray-50/30"
                  placeholder="Giải trình lý do hoặc bổ sung thông tin..."
                  value={localEvidenceExplanations[ev.id] || ''}
                  onChange={(e) => setLocalEvidenceExplanations(prev => ({ ...prev, [ev.id]: e.target.value }))}
                />
                
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id={`file-upload-${ev.id}`}
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLocalEvidenceFiles(prev => ({ ...prev, [ev.id]: file }));
                          toast.success("Đã chọn file: " + file.name + ". File sẽ được gửi khi bạn bấm nút GỬI PHẢN HỒI.");
                        }
                      }}
                    />
                    <label htmlFor={`file-upload-${ev.id}`} className={`px-4 py-2 border-2 border-dashed rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${localEvidenceFiles[ev.id] ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600'}`}>
                      <i className={localEvidenceFiles[ev.id] ? "fas fa-check-circle" : "fas fa-paperclip"}></i>
                      {localEvidenceFiles[ev.id] ? `Đã chọn: ${localEvidenceFiles[ev.id].name}` : "Tải lên file Hình ảnh/PDF mới"}
                    </label>
                    <span className="text-[10px] text-gray-400 italic">Chọn file để thay thế hoặc bổ sung minh chứng.</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {flaggedFields.length === 0 && flaggedEvidences.length === 0 && (
            <div className="text-center py-24 bg-gray-100 border-2 border-dashed border-gray-200">
              <i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Mọi yêu cầu đã được phản hồi. Bạn có thể gửi đi!</p>
            </div>
          )}
        </div>

        <div className="py-16 text-center border-t border-gray-100">
          <button
            onClick={handleFinalSubmitExplanation}
            disabled={isResubmitting || !canEdit}
            className={`px-20 py-6 font-black text-xs uppercase tracking-[0.5em] transition-all border border-orange-500 active:scale-95 flex items-center gap-4 mx-auto
              ${(isResubmitting || !canEdit) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-[#f26522]'}`}
          >
            {isResubmitting && <i className="fas fa-spinner fa-spin"></i>}
            {canEdit ? 'GỬI PHẢN HỒI GIẢI TRÌNH' : 'HẾT HẠN GIẢI TRÌNH'}
          </button>
        </div>
      </div>
    );
  }



  // GIAO DIỆN NỘP MỚI (CHỈ HIỆN KHI LÀ DRAFT)
  const currentStep = STEPS[currentStepIdx];
  const isReviewStep = currentStep === 'SUBMIT';
  const isEvidenceStep = !isReviewStep;
  // Use currently typed data for instant Achieved UI feedback
  const currentStudentDataForCheck = {
    ...student,
    trainingPoints: localData.trainingPoints,
    gpa: localData.gpa,
    peScore: localData.peScore,
    englishGpa: localData.englishGpa,
    englishLevel: localData.englishLevel,
    noViolation: localData.noViolation,
    isPartyMember: localData.isPartyMember,
  };

  const catStatus = {
    [CriterionType.ETHICS]: checkHardMet(CriterionType.ETHICS, currentStudentDataForCheck, criteriaGroups),
    [CriterionType.ACADEMIC]: checkHardMet(CriterionType.ACADEMIC, currentStudentDataForCheck, criteriaGroups),
    [CriterionType.PHYSICAL]: checkHardMet(CriterionType.PHYSICAL, currentStudentDataForCheck, criteriaGroups),
    [CriterionType.VOLUNTEER]: checkHardMet(CriterionType.VOLUNTEER, currentStudentDataForCheck, criteriaGroups),
    [CriterionType.INTEGRATION]: checkHardMet(CriterionType.INTEGRATION, currentStudentDataForCheck, criteriaGroups),
  };

  const allHardMet = Object.values(catStatus).filter(v => v).length === 5;
  const metCount = Object.values(catStatus).filter(v => v).length;

  // ====== PHASE 1: TRANG TIÊU CHÍ CỨNG ======

  // ====== PHASE 2: TRANG MINH CHỨNG BỔ SUNG ======
  const renderEvidencePage = (cat: CriterionType) => {
    const isHardMet = catStatus[cat];

    const catIcons: Record<string, string> = {
      [CriterionType.ETHICS]: 'fa-heart',
      [CriterionType.ACADEMIC]: 'fa-book-open',
      [CriterionType.PHYSICAL]: 'fa-running',
      [CriterionType.VOLUNTEER]: 'fa-hands-helping',
      [CriterionType.INTEGRATION]: 'fa-globe-asia',
    };

    const groups: Record<string, any> = {};
    criteriaGroups.forEach(g => {
      const catMap: Record<string, CriterionType> = {
        'Đạo đức tốt': CriterionType.ETHICS,
        'Học tập tốt': CriterionType.ACADEMIC,
        'Thể lực tốt': CriterionType.PHYSICAL,
        'Tình nguyện tốt': CriterionType.VOLUNTEER,
        'Hội nhập tốt': CriterionType.INTEGRATION
      };
      groups[catMap[g.TenNhom]] = g;
    });

    const currentGroup = groups[cat];
    const hardSubsRaw = currentGroup?.tieu_chi?.filter((tc: any) => tc.LoaiTieuChi === 'Cung') || [];
    const softSubsRaw = currentGroup?.tieu_chi?.filter((tc: any) => tc.LoaiTieuChi === 'Cong') || [];

    // Tiêu chí hiển thị ô nhập liệu (bên trái)
    const profileInputSlugs = ['eth_hard_1', 'eth_hard_2', 'aca_hard_1', 'phy_hard_1', 'int_hard_1', 'int_hard_2'];
    
    // Tiêu chí KHÔNG cần nộp minh chứng (chỉ dựa trên profile)
    const noEvidenceSlugs = ['eth_hard_2', 'eth_point_5', 'aca_point_7'];
    
    const hardProfileSlugs = hardSubsRaw.filter((tc: any) => profileInputSlugs.includes(tc.MaTieuChi));
    const hardUploads = hardSubsRaw.filter((tc: any) => !noEvidenceSlugs.includes(tc.MaTieuChi));

    return (
      <div className="animate-fade-in space-y-8">
        {/* Category Header */}
        <div className="bg-white border-2 border-gray-100 rounded-lg p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className={`fas ${catIcons[cat]} text-blue-600 text-lg`}></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-blue-900 uppercase tracking-tight">{cat}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Tiêu chí {currentStepIdx + 1}/{STEPS.length - 1}</p>
            </div>
          </div>
          <span className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-full cursor-help ${isHardMet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {isHardMet ? '✓ Đạt tiêu chí cứng' : '✗ Chưa đạt tiêu chí cứng'}
          </span>
        </div>

        {/* Section 1: MANDATORY CRITERIA (Hard) */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] border-b-2 border-blue-900 pb-2 inline-block">
            <i className="fas fa-exclamation-circle mr-2"></i>Tiêu chí bắt buộc (Phải đạt)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hard Profile Fields */}
            {hardProfileSlugs.length > 0 && (
              <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-100 space-y-4">
                {cat === CriterionType.ETHICS && (
                  <>
                    {hardProfileSlugs.some((tc: any) => tc.MaTieuChi === 'eth_hard_1') && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Điểm rèn luyện <span className="text-red-400">*</span></label>
                        <input disabled={isLocked} type="number" max="100" value={localData.trainingPoints === 0 ? '' : localData.trainingPoints} onChange={(e) => handleLocalChange('trainingPoints', e.target.value)} onBlur={() => handleBlur('trainingPoints', false, 100)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg focus:border-blue-600 outline-none font-bold text-sm transition-all" />
                      </div>
                    )}
                    {hardProfileSlugs.some((tc: any) => tc.MaTieuChi === 'eth_hard_2') && (
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-all">
                        <input disabled={isLocked} type="checkbox" checked={!!localData.noViolation} onChange={(e) => handleLocalChange('noViolation', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                        <span className="text-[11px] font-bold text-gray-700">Cam kết không vi phạm nội quy</span>
                      </label>
                    )}
                  </>
                )}
                {cat === CriterionType.ACADEMIC && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">GPA Hệ 4.0 <span className="text-red-400">*</span></label>
                    <input disabled={isLocked} type="number" step="0.01" max="4.0" value={localData.gpa === 0 ? '' : localData.gpa} onChange={(e) => handleLocalChange('gpa', e.target.value)} onBlur={() => handleBlur('gpa', true, 4.0)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg focus:border-blue-600 outline-none font-bold text-sm transition-all" />
                  </div>
                )}
                {cat === CriterionType.PHYSICAL && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Điểm Thể dục <span className="text-red-400">*</span></label>
                    <input disabled={isLocked} type="number" step="0.1" max="10" value={localData.peScore === 0 ? '' : localData.peScore} onChange={(e) => handleLocalChange('peScore', e.target.value)} onBlur={() => handleBlur('peScore', true, 10.0)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg focus:border-blue-600 outline-none font-bold text-sm transition-all" />
                  </div>
                )}
                {cat === CriterionType.INTEGRATION && (
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ngoại ngữ <span className="text-red-400">*</span></label>
                       <select disabled={isLocked} value={localData.englishLevel} onChange={(e) => handleLocalChange('englishLevel', e.target.value)} className="w-full px-3 py-3 border-2 border-gray-100 rounded-lg font-bold text-[11px] transition-all focus:border-blue-600 outline-none">
                         <option value="None">Chưa có</option>
                         <option value="B1">B1</option>
                         <option value="B2">B2+</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">GPA NN <span className="text-red-400">*</span></label>
                       <input disabled={isLocked} type="number" step="0.01" max="4" value={localData.englishGpa === 0 ? '' : localData.englishGpa} onChange={(e) => handleLocalChange('englishGpa', e.target.value)} onBlur={() => handleBlur('englishGpa', true, 4.0)} className="w-full px-3 py-3 border-2 border-gray-100 rounded-lg font-bold text-sm transition-all focus:border-blue-600 outline-none" />
                     </div>
                   </div>
                )}
              </div>
            )}

            {/* Hard Evidence (Uploads) */}
            <div className={`space-y-4 ${hardProfileSlugs.length === 0 ? 'md:col-span-2' : ''}`}>
               {hardUploads.length === 0 && hardProfileSlugs.length === 0 && (
                 <div className="p-4 bg-gray-50 border border-dashed text-center rounded-lg">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Không có tiêu chí cứng bổ sung</p>
                 </div>
               )}
               {hardUploads.map((sub: any) => {
                  const subEvs = student.evidences[cat].filter(e => e.subCriterionId === sub.MaTieuChi);
                  return (
                    <div key={sub.MaTieuChi} className={`p-4 bg-white border rounded-lg transition-all ${subEvs.length > 0 ? 'border-blue-200 bg-blue-50/10' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 text-white bg-blue-600 rounded inline-block mb-1">Bắt buộc</span>
                          <p className="text-xs font-bold text-gray-800 leading-tight">{sub.MoTa}</p>
                        </div>
                        {!isLocked && canEdit && (
                          <button 
                            onClick={() => setAddingTo({ type: cat, isHard: true, subName: sub.MoTa, subId: sub.MaTieuChi })} 
                            className={`px-4 py-2 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${subEvs.length > 0 ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                          >
                            {subEvs.length > 0 ? <><i className="fas fa-check-circle mr-1"></i>Đã nộp</> : <><i className="fas fa-upload mr-1"></i>Tải lên</>}
                          </button>
                        )}
                        {!isLocked && !canEdit && (
                           <button 
                             disabled
                             className="px-4 py-2 bg-gray-200 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-not-allowed flex items-center gap-1.5"
                           >
                              <i className="fas fa-lock text-[8px]"></i> Khóa
                           </button>
                        )}
                      </div>
                      {subEvs.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {subEvs.map(ev => (
                            <div key={ev.id} className="p-3 bg-gray-50 border rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-900 truncate max-w-[200px]">{ev.name}</span>
                                <div className="flex items-center gap-2">
                                  {!isLocked && canEdit && ev.status !== 'Approved' && (
                                    <>
                                      <button onClick={() => setAddingTo({ type: cat, isHard: true, subName: sub.MoTa, subId: sub.MaTieuChi, editingEvidence: ev })} className="text-gray-400 hover:text-blue-500 transition-colors"><i className="fas fa-edit text-[9px]"></i></button>
                                      <button onClick={() => removeEvidence(cat, ev.id)} className="text-gray-400 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-[9px]"></i></button>
                                    </>
                                  )}
                                  
                                  {ev.status === 'Approved' && (
                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-700 bg-green-100 px-2 py-1 rounded-md border border-green-200 shadow-sm" title="Hồ sơ đã được thẩm định, không thể thay đổi">
                                      <i className="fas fa-lock"></i> Đã duyệt
                                    </span>
                                  )}
                                  {ev.status === 'NeedsExplanation' && (
                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-200 shadow-sm">
                                      <i className="fas fa-exclamation-triangle"></i> Cần giải trình
                                    </span>
                                  )}
                                  {ev.status === 'Rejected' && (
                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-200 shadow-sm">
                                      <i className="fas fa-times-circle"></i> Từ chối
                                    </span>
                                  )}
                                  
                                  {!isLocked && !canEdit && (
                                     <i className="fas fa-lock text-[10px] text-gray-300" title="Hết hạn chỉnh sửa"></i>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {ev.danh_sach_file && ev.danh_sach_file.length > 0 ? (
                                  ev.danh_sach_file.map((f, fIdx) => (
                                    <a key={fIdx} href={f.FileUrl} target="_blank" rel="noreferrer" className="text-[9px] text-blue-600 hover:underline flex items-center gap-1 bg-white px-2 py-1 border rounded">
                                      <i className="fas fa-file-image"></i> {f.TenFile.length > 15 ? f.TenFile.substring(0, 12) + '...' : f.TenFile}
                                    </a>
                                  ))
                                ) : (
                                  <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="text-[9px] text-blue-600 hover:underline flex items-center gap-1">
                                    <i className="fas fa-file-image"></i> {ev.fileName || 'Xem file'}
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
               })}
            </div>
          </div>
        </div>

        {/* Section 2: OPTIONAL CRITERIA (Soft/Points) */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] border-b-2 border-orange-400 pb-2 inline-block">
            <i className="fas fa-plus-circle mr-2"></i>Tiêu chí cộng điểm (Tùy chọn)
          </h3>
          
          {!isHardMet && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <i className="fas fa-exclamation-triangle text-amber-500 mt-0.5"></i>
              <p className="text-xs text-amber-700 font-medium italic">Bạn cần đạt các <span className="text-blue-600 font-black uppercase">Tiêu chí cứng</span> bên trên trước khi có thể nộp minh chứng cộng điểm cho mục này.</p>
            </div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!isHardMet ? 'opacity-40 pointer-events-none' : ''}`}>
            {softSubsRaw.length === 0 ? (
               <div className="md:col-span-2 text-center py-6 bg-gray-50 border-2 border-dashed border-gray-100 rounded-lg">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Không có tiêu chí cộng điểm nào</p>
               </div>
            ) : (
              softSubsRaw.filter((sub: any) => !['eth_point_5', 'aca_point_7'].includes(sub.MaTieuChi)).map((sub: any) => {
              const subEvs = (student.evidences[cat] || []).filter(e => e.subCriterionId === sub.MaTieuChi);
                return (
                  <div key={sub.MaTieuChi} className={`p-4 border transition-all bg-white rounded-lg ${subEvs.length > 0 ? 'border-orange-200 bg-orange-50/10' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 text-white bg-orange-500 rounded inline-block mb-1">Cộng</span>
                        <p className="text-[11px] font-bold text-gray-800 leading-snug">{sub.MoTa}</p>
                      </div>
                      {!isLocked && canEdit && (
                        <button 
                          onClick={() => setAddingTo({ type: cat, isHard: false, subName: sub.MoTa, subId: sub.MaTieuChi })} 
                          className={`px-3 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${subEvs.length > 0 ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                        >
                          {subEvs.length > 0 ? <><i className="fas fa-check-circle mr-1"></i>Đã nộp</> : <><i className="fas fa-upload mr-1"></i>Tải lên</>}
                        </button>
                      )}
                      {!isLocked && !canEdit && (
                         <div className="px-3 py-1.5 bg-gray-100 text-gray-400 text-[8px] font-black uppercase rounded text-center">
                            <i className="fas fa-lock"></i>
                         </div>
                      )}
                    </div>
                    {subEvs.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {subEvs.map(ev => (
                          <div key={ev.id} className="p-3 bg-gray-50 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col text-left">
                                <span className="text-[10px] font-bold text-gray-900">{ev.name} {ev.qty ? <span className="text-orange-600 font-black">({ev.qty})</span> : ''}</span>
                                <span className="text-[9px] font-black text-orange-600 mt-0.5">+{ev.points}đ</span>
                              </div>
                                <div className="flex items-center gap-2">
                                  {!isLocked && canEdit && ev.status !== 'Approved' && (
                                    <>
                                      <button onClick={() => setAddingTo({ type: cat, isHard: false, subName: sub.MoTa, subId: sub.MaTieuChi, editingEvidence: ev })} className="text-gray-300 hover:text-blue-500 transition-colors"><i className="fas fa-edit text-[9px]"></i></button>
                                      <button onClick={() => removeEvidence(cat, ev.id)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-[9px]"></i></button>
                                    </>
                                  )}
                                  
                                  {ev.status === 'Approved' && (
                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-700 bg-green-100 px-2 py-1 rounded-md border border-green-200 shadow-sm" title="Hồ sơ đã được thẩm định, không thể thay đổi">
                                      <i className="fas fa-lock"></i> Đã duyệt
                                    </span>
                                  )}
                                  {ev.status === 'NeedsExplanation' && (
                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-200 shadow-sm">
                                      <i className="fas fa-exclamation-triangle"></i> Cần giải trình
                                    </span>
                                  )}
                                  {ev.status === 'Rejected' && (
                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-200 shadow-sm">
                                      <i className="fas fa-times-circle"></i> Từ chối
                                    </span>
                                  )}

                                  {!isLocked && !canEdit && (
                                     <i className="fas fa-lock text-[10px] text-gray-200"></i>
                                  )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {ev.danh_sach_file && ev.danh_sach_file.length > 0 ? (
                                  ev.danh_sach_file.map((f, fIdx) => (
                                    <a key={fIdx} href={f.FileUrl} target="_blank" rel="noreferrer" className="text-[9px] text-blue-600 hover:underline flex items-center gap-1 bg-white px-2 py-1 border rounded">
                                      <i className="fas fa-file-image"></i> {f.TenFile.length > 15 ? f.TenFile.substring(0, 12) + '...' : f.TenFile}
                                    </a>
                                  ))
                                ) : (
                                  <a href={ev.fileUrl} target="_blank" rel="noreferrer" className="text-[9px] text-blue-600 hover:underline flex items-center gap-1">
                                    <i className="fas fa-file-image"></i> {ev.fileName || 'Xem file'}
                                  </a>
                                )}
                              </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // ====== PHASE 3: SUBMIT ======
  const renderSubmitStep = () => {
    return (
      <div className="animate-fade-in space-y-10 text-center py-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className={`w-20 h-20 mx-auto flex items-center justify-center rounded-full ring-4 transition-all ${allHardMet ? 'bg-green-100 ring-green-50' : 'bg-red-100 ring-red-50'}`}>
            <i className={`fas ${allHardMet ? 'fa-check text-green-600' : 'fa-times text-red-600'} text-3xl`}></i>
          </div>
          <h2 className="text-2xl font-black text-[#0054a6] uppercase font-formal">{allHardMet ? 'Sẵn sàng nộp hồ sơ' : 'Chưa đủ điều kiện'}</h2>
        </div>
        <div className="bg-[#002b5c] p-12 text-white border border-white/20 rounded-lg">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 text-orange-400">Tổng điểm tích lũy dự kiến</p>
          <h3 className="text-6xl font-bold mb-10 font-formal">{student.totalScore}</h3>

          <button disabled={isLocked || !allHardMet || !canEdit} onClick={onSubmit} className={`px-16 py-5 font-bold text-[10px] uppercase tracking-[0.3em] transition-all border-2 rounded-lg ${isLocked || !allHardMet || !canEdit ? 'border-gray-600 text-gray-600 cursor-not-allowed bg-transparent' : 'bg-orange-600 text-white hover:bg-white hover:text-blue-900 border-transparent active:scale-95'}`}>
            {isLocked ? 'HỒ SƠ ĐANG CHỜ DUYỆT' : (!canEdit ? 'HẾT HẠN NỘP HỒ SƠ' : 'GỬI XÉT DUYỆT CHÍNH THỨC')}
          </button>
        </div>
      </div>
    );
  };

  // ====== RENDER CHÍNH ======
  const renderCurrentStep = () => {
    if (isReviewStep) return renderSubmitStep();
    return renderEvidencePage(currentStep as CriterionType);
  };

  return (
    <div className="pb-24">
      <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b pb-8">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-[#0054a6] uppercase font-formal tracking-tighter">{student.fullName}</h1>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1 italic">Mã sinh viên: {student.studentId} • {student.faculty}</p>
            </div>
          </div>

          {/* Banner thông báo đóng cổng hệ thống */}
          {!student.is_submission_open && (
            <div className="mt-8 bg-orange-50 border border-orange-200 p-5 rounded-[24px] flex items-center gap-5 animate-fade-down shadow-sm">
              <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-200">
                <i className="fas fa-lock text-xl"></i>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">Thông báo hệ thống</p>
                <p className="text-base font-bold text-orange-950 leading-tight">
                  {student.submission_msg || "Cổng nộp hồ sơ hiện đang đóng. Bạn chỉ có thể xem hồ sơ ở chế độ đọc."}
                </p>
              </div>
            </div>
          )}

          {/* Step progress */}
          <div className="flex items-center gap-1.5 mt-6 overflow-x-auto pb-2 scrollbar-none">
            {STEPS.map((s, idx) => {
              const isCat = s !== 'SUBMIT';
              const isMet = isCat ? catStatus[s as CriterionType] : allHardMet;
              const isActive = idx === currentStepIdx;

              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap
                      ${isActive
                        ? (isMet ? 'bg-green-600 text-white' : 'bg-red-600 text-white')
                        : (isMet ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100')
                      }`}
                  >
                    {isMet ? <i className="fas fa-check-circle text-[8px]"></i> : <i className="fas fa-exclamation-circle text-[8px]"></i>}
                    <span className="hidden sm:inline">{STEP_LABELS[s] || s}</span>
                    <span className="sm:hidden">{idx + 1}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-3 h-0.5 ${isMet ? 'bg-green-300' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { if (currentStepIdx > 0) setCurrentStepIdx(currentStepIdx - 1); }}
            disabled={currentStepIdx === 0}
            className={`px-6 py-3 font-black text-[9px] uppercase tracking-widest border rounded-lg transition-all flex items-center gap-2 ${currentStepIdx === 0 ? 'border-gray-100 text-gray-200' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
          >
            <i className="fas fa-arrow-left text-[8px]"></i> Quay lại
          </button>
          <button
            onClick={() => { if (currentStepIdx < STEPS.length - 1) setCurrentStepIdx(currentStepIdx + 1); }}
            disabled={currentStepIdx === STEPS.length - 1}
            className={`px-6 py-3 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${currentStepIdx === STEPS.length - 1 ? 'bg-gray-100 text-gray-300' : 'bg-blue-900 text-white hover:bg-orange-600'}`}
          >
            Tiếp theo <i className="fas fa-arrow-right text-[8px]"></i>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">{renderCurrentStep()}</div>

      {/* Evidence Upload Modal */}
      {addingTo && !isLocked && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-blue-950/90 backdrop-blur-sm p-4 animate-fade-in">
          <EvidenceForm 
            criterionType={addingTo.type} 
            isHard={addingTo.isHard} 
            subCriterionName={addingTo.subName}
            subCriterionId={addingTo.subId}
            initialData={addingTo.editingEvidence}
            criteriaGroups={criteriaGroups}
            onAdd={handleSaveEvidence} 
            onCancel={() => setAddingTo(null)} 
          />
        </div>
      )}
      {/* Success Modal Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-blue-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-12 rounded-3xl border border-green-500/30 scale-110 animate-scale-up text-center space-y-6">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl">
              <i className="fas fa-check"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tight">GỬI THÀNH CÔNG!</h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Phản hồi của bạn đã được gửi đến Admin xử lý.</p>
            </div>
          </div>
        </div>
      )}
      {renderUnsubmitModal()}
    </div>
  </div>
);
};

export default StudentDashboard;
