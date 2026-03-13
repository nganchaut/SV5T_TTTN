import React, { useState } from 'react';
import { authService } from '../services/authService';

const LoginView: React.FC<{ onLogin: (role: 'student' | 'admin', studentId?: string) => void, onNavigate: (page: string) => void }> = ({ onLogin, onNavigate }) => {
  const [isLoginState, setIsLoginState] = useState(true);
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isLoginState) {
        // Đăng nhập
        const { user } = await authService.login(studentId, password, role);
        onLogin(user.role as 'student' | 'admin', user.studentId);
      } else {
        // Đăng ký
        if (!fullName.trim() || !studentId.trim() || !password.trim()) {
          throw new Error('Vui lòng điền đầy đủ thông tin!');
        }
        if (password.length < 6) {
          throw new Error('Mật khẩu phải từ 6 ký tự trở lên!');
        }

        const { user } = await authService.register(studentId, password, fullName, role);
        alert('Đăng ký thành công!');
        onLogin(role, role === 'student' ? user.studentId : undefined);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginState(!isLoginState);
    setErrorMsg('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 py-12 px-4 animate-fade-in font-sans">
      <div className="max-w-md w-full">
        {/* Back button */}
        <button onClick={() => onNavigate('home')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-[#0054a6] transition-colors font-bold text-xs uppercase tracking-widest">
          <i className="fas fa-arrow-left"></i> Quay lại trang chủ
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border">
          <div className="text-center mb-8">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <img 
                src="https://tse3.mm.bing.net/th/id/OIP.Odk0Vk_H8Tfz70lpKj4FQAHaG8?pid=Api&P=0&h=180" 
                alt="DUE Logo" 
                className="w-full h-auto"
              />
            </div>
            <h2 className="text-2xl font-black text-[#002b5c] uppercase font-formal tracking-tight">
              {isLoginState ? 'Đăng nhập hệ thống' : 'Đăng ký tài khoản'}
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Cổng thông tin Sinh viên 5 Tốt</p>
          </div>

          <div className="flex gap-2 mb-6 bg-gray-50 p-1.5 rounded-xl border">
            <button
              type="button"
              onClick={() => { setRole('student'); setErrorMsg(''); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${role === 'student' ? 'bg-white text-blue-900 shadow-md' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              Sinh viên
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setErrorMsg(''); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${role === 'admin' ? 'bg-[#002b5c] text-white shadow-md' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              Cán bộ / Admin
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLoginState && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Họ và tên</label>
                <div className="relative">
                  <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                  <input
                    type="text"
                    required={!isLoginState}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-[#0054a6] outline-none transition-all placeholder:text-gray-300 placeholder:font-medium"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                <span>{role === 'student' ? 'Mã sinh viên / Email Edu' : 'Tên đăng nhập / Email Admin'}</span>
              </label>
              <div className="relative">
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-[#0054a6] outline-none transition-all placeholder:text-gray-300 placeholder:font-medium"
                  placeholder={role === 'student' ? 'VD: 201111000' : 'admin'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mật khẩu</label>
                {isLoginState && <a href="#" className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-orange-500 transition-colors">Quên mật khẩu?</a>}
              </div>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-[#0054a6] outline-none transition-all placeholder:text-gray-300 placeholder:font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 bg-[#002b5c] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-orange-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex justify-center items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading && <i className="fas fa-spinner fa-spin"></i>}
              {isLoginState ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
            </button>

            <div className="text-center pt-4 pb-1">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                <i className="fas fa-info-circle mr-1 text-blue-400"></i>
                Tài khoản được cấp bởi Ban thư ký — Liên hệ đơn vị quản lý nếu chưa có tài khoản.
              </p>
            </div>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hệ thống cấp Trường</p>
          <p className="text-xs font-black text-gray-500 uppercase mt-1">Đại học Kinh tế - ĐHĐN</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
