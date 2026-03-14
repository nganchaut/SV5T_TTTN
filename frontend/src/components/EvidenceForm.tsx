
import React, { useState, useMemo, useEffect } from 'react';
import { CriterionType, EvidenceLevel, EvidenceType, Evidence } from '../types';
import { SUB_CRITERIA } from '../constants';
import { analyzeEvidence } from '../services/geminiService';

interface EvidenceFormProps {
  criterionType: CriterionType;
  isHard: boolean;
  subCriterionName: string; 
  subCriterionId?: string; // Bổ sung ID để binding chính xác
  initialData?: Evidence;
  criteriaGroups: any[];
  onAdd: (evidence: Evidence) => void;
  onCancel: () => void;
}

const EvidenceForm: React.FC<EvidenceFormProps> = ({ criterionType, isHard, subCriterionName, subCriterionId: propsSubId, initialData, criteriaGroups, onAdd, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [subCriterionId, setSubCriterionId] = useState(initialData?.subCriterionId || propsSubId || '');
  const [level, setLevel] = useState<EvidenceLevel>(initialData?.level || EvidenceLevel.KHOA);
  const [type, setType] = useState<EvidenceType>(initialData?.type || EvidenceType.NO_DECISION);
  const [decisionNumber, setDecisionNumber] = useState(initialData?.decisionNumber || '');
  const [qty, setQty] = useState<number | ''>(initialData?.qty || '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ isSuitable: boolean; suggestedScore: number; reasoning: string } | null>(null);

  const availableSubCriteria = useMemo(() => {
    const profileBasedSlugs = [
      'eth_hard_1', 'eth_hard_2', 'eth_point_1', 'eth_point_5', 
      'aca_hard_1', 'aca_point_7', 
      'phy_hard_1',
      'int_hard_1', 'int_hard_2'
    ];

    const group = criteriaGroups.find(g => {
      const catMap: Record<string, CriterionType> = {
        'Đạo đức tốt': CriterionType.ETHICS,
        'Học tập tốt': CriterionType.ACADEMIC,
        'Thể lực tốt': CriterionType.PHYSICAL,
        'Tình nguyện tốt': CriterionType.VOLUNTEER,
        'Hội nhập tốt': CriterionType.INTEGRATION
      };
      return catMap[g.TenNhom] === criterionType;
    });

    if (!group) return [];

    return group.tieu_chi
      .filter((tc: any) => {
        // Luôn hiển thị nếu là tiêu chí đang được chọn rõ ràng bằng propsSubId
        if (propsSubId && tc.MaTieuChi === propsSubId) return true;
        
        // Nếu không, lọc theo loại cứng/cộng và loại trừ các tiêu chí profile mặc định
        return (tc.LoaiTieuChi === 'Cung') === isHard && !profileBasedSlugs.includes(tc.MaTieuChi);
      })
      .map((tc: any) => ({
        id: tc.MaTieuChi,
        description: tc.MoTa,
        isHard: tc.LoaiTieuChi === 'Cung',
        minQty: tc.SoLuongToiThieu
      }));
  }, [criterionType, isHard, criteriaGroups, propsSubId, subCriterionName]);

  // Tắt hẳn logic tìm ID theo tên (subCriterionName) vì dễ sinh lỗi lệch chuỗi
  // Giữ nguyên subCriterionId được truyền từ component cha (propsSubId)
  useEffect(() => {
    if (initialData) return;
    if (propsSubId) {
      setSubCriterionId(propsSubId);
    } else if (availableSubCriteria.length > 0 && !subCriterionId) {
      setSubCriterionId(availableSubCriteria[0].id);
    }
  }, [propsSubId, availableSubCriteria, initialData]);

  const selectedSubCriterion = useMemo(() => availableSubCriteria.find(sc => sc.id === subCriterionId), [availableSubCriteria, subCriterionId]);
  const showQtyInput = selectedSubCriterion?.minQty !== undefined;

  const showDecisionInput = type !== EvidenceType.NO_DECISION;

  const handleSmartAnalysis = async () => {
    if (!file || !name) {
      setError('Vui lòng nhập tên và chọn tệp trước khi phân tích.');
      return;
    }
    setIsAnalyzing(true);
    setError('');
    const result = await analyzeEvidence(file.name, name);
    if (result) {
      setAnalysisResult(result);
    } else {
      setError('Không thể phân tích minh chứng lúc này. Vui lòng thử lại.');
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!subCriterionId && !propsSubId) { setError('Vui lòng chọn tiêu chí cụ thể.'); return; }
    if (!name.trim()) { setError('Vui lòng nhập tên hoạt động hoặc tên chứng chỉ.'); return; }
    if (showDecisionInput && !decisionNumber.trim()) { setError('Vui lòng nhập số hiệu quyết định hoặc mã số chứng chỉ.'); return; }
    if (showQtyInput && (qty === '' || qty <= 0)) { setError('Vui lòng nhập số lượng (số ngày/mức độ) hợp lệ.'); return; }
    if (!file && !initialData) { setError('Vui lòng đính kèm tập tin minh chứng (PDF hoặc Ảnh).'); return; }

    const newEvidence: Evidence = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      subCriterionId: subCriterionId || propsSubId || '',
      name: name.trim(),
      level,
      type,
      decisionNumber: showDecisionInput ? decisionNumber.trim() : undefined,
      qty: showQtyInput && typeof qty === 'number' ? qty : undefined,
      fileUrl: file ? URL.createObjectURL(file) : (initialData?.fileUrl || ''),
      file: file || undefined,
      fileName: file ? file.name : (initialData?.fileName || ''),
      date: initialData?.date || new Date().toISOString().split('T')[0],
      points: initialData?.points || 0, 
      isHardCriterion: isHard,
      status: initialData?.status || 'Pending'
    };

    onAdd(newEvidence);
  };

  return (
    <div className="bg-white p-12 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto w-full max-w-xl font-sans border border-blue-100">
      <div className="mb-8 border-b-2 border-orange-500 pb-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Cập nhật minh chứng cho:</p>
        <h3 className="text-xl font-bold text-blue-900 uppercase tracking-tight leading-tight">
          {subCriterionName}
        </h3>
      </div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-4 animate-fade-in">
          <i className="fas fa-exclamation-triangle text-red-600"></i>
          <p className="text-xs font-bold text-red-600 uppercase tracking-tight">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="hidden">
           {/* Giữ nguyên logic chọn nhưng ẩn đi vì đã truyền từ ngoài vào */}
          <select value={subCriterionId} onChange={(e) => setSubCriterionId(e.target.value)}>
            {availableSubCriteria.map(sc => <option key={sc.id} value={sc.id}>{sc.description}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Tên hoạt động / Chứng chỉ</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="flex-1 px-5 py-4 border-2 border-gray-100 font-bold outline-none focus:border-blue-900 text-xs bg-white text-gray-900 shadow-sm" 
              placeholder="VD: GCN Hiến máu lần 2..." 
            />
            <button 
              type="button"
              onClick={handleSmartAnalysis}
              disabled={isAnalyzing || !file || !name}
              className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${isAnalyzing ? 'bg-gray-100 text-gray-400 border-gray-100' : 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'}`}
            >
              {isAnalyzing ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-magic mr-2"></i>AI Check</>}
            </button>
          </div>
        </div>

        {analysisResult && (
          <div className={`p-5 border-l-4 animate-fade-in ${analysisResult.isSuitable ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[9px] font-black uppercase tracking-widest ${analysisResult.isSuitable ? 'text-green-700' : 'text-orange-700'}`}>
                {analysisResult.isSuitable ? 'Phù hợp' : 'Cần xem xét lại'}
              </span>
              <span className="text-[9px] font-black text-blue-900 uppercase">Gợi ý: +{analysisResult.suggestedScore}đ</span>
            </div>
            <p className="text-[10px] text-gray-600 italic leading-relaxed">"{analysisResult.reasoning}"</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Cấp ban hành</label>
            <select 
              value={level} 
              onChange={(e) => setLevel(e.target.value as EvidenceLevel)} 
              className="w-full px-5 py-4 border-2 border-gray-100 font-bold bg-white text-xs outline-none text-gray-900 shadow-sm"
            >
              {Object.values(EvidenceLevel).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Hình thức</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as EvidenceType)} 
              className="w-full px-5 py-4 border-2 border-gray-100 font-bold bg-white text-xs outline-none text-gray-900 shadow-sm"
            >
              {Object.values(EvidenceType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {showDecisionInput && (
          <div className="animate-fade-in">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Số hiệu quyết định / Mã chứng chỉ</label>
            <input 
              type="text" 
              value={decisionNumber} 
              onChange={(e) => setDecisionNumber(e.target.value)} 
              className="w-full px-5 py-4 border-2 border-gray-100 font-bold outline-none focus:border-blue-900 bg-white text-xs text-gray-900 shadow-sm" 
              placeholder="VD: 123/QĐ-ĐHKT" 
            />
          </div>
        )}

        {showQtyInput && (
          <div className="animate-fade-in">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">
              Số lượng (VD: Số ngày tình nguyện, số lần hiến máu) <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              min="1"
              value={qty} 
              onChange={(e) => setQty(e.target.value ? parseInt(e.target.value, 10) : '')} 
              className="w-full px-5 py-4 border-2 border-gray-100 font-bold outline-none focus:border-blue-900 bg-white text-xs text-gray-900 shadow-sm" 
              placeholder={`Yêu cầu tối thiểu: ${selectedSubCriterion?.minQty}`} 
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Đính kèm tập tin (PDF/Ảnh)</label>
          <div className="border-2 border-dashed border-gray-100 p-10 text-center hover:border-blue-900 hover:bg-blue-50/30 transition-all relative bg-gray-50/50 group">
            <i className="fas fa-cloud-upload-alt text-gray-300 group-hover:text-blue-900 text-2xl mb-4"></i>
            <div className="block">
              {file ? (
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-tight">{file.name}</span>
              ) : (
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chọn tệp tin từ thiết bị</span>
              )}
            </div>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        <div className="flex justify-end space-x-8 pt-10 border-t border-gray-100">
          <button 
            type="button" 
            onClick={onCancel} 
            className="font-bold text-[10px] uppercase text-gray-400 hover:text-red-500 transition-all tracking-widest"
          >
            Hủy bỏ
          </button>
          <button 
            type="submit" 
            className="px-12 py-5 bg-[#0054a6] text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-[#f26522] transition-all shadow-xl active:scale-95"
          >
            Lưu minh chứng
          </button>
        </div>
      </form>
    </div>
  );
};

export default EvidenceForm;
