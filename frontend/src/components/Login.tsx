
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (role: 'student' | 'admin') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Giả lập quá trình đăng nhập
    setTimeout(() => {
      onLogin(role);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Side: Brand & Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 relative overflow-hidden flex-col justify-between p-20 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
               <span className="text-blue-900 font-black text-xl">D</span>
            </div>
            <span className="text-sm font-black uppercase tracking-[0.3em]">DUE - University of Economics</span>
          </div>
          
          <h1 className="text-7xl font-black uppercase leading-[0.9] tracking-tighter mb-8 font-formal">
            Hành trình <br />
            <span className="text-orange-500">Tỏa sáng</span>
          </h1>
          
          <p className="text-blue-100 text-lg font-medium max-w-md leading-relaxed opacity-80">
            Hệ thống quản lý và xét duyệt danh hiệu "Sinh viên 5 Tốt" - Nơi ghi nhận những nỗ lực và thành tích xuất sắc của sinh viên DUE.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
            <div className="flex flex-col gap-2">
              <span className="text-white">5 Tiêu chí</span>
              <span>Đạo đức - Học tập - Thể lực - Tình nguyện - Hội nhập</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-800 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-orange-600 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-20 bg-[#fcfcfc]">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-blue-900 uppercase tracking-tight font-formal">Đăng nhập</h2>
            <p className="text-gray-400 text-sm font-medium">Vui lòng chọn vai trò và nhập thông tin tài khoản của bạn.</p>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-sm">
            <button 
              onClick={() => setRole('student')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${role === 'student' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Sinh viên
            </button>
            <button 
              onClick={() => setRole('admin')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Ban Thư ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tài khoản</label>
              <input 
                type="text" 
                required
                placeholder={role === 'student' ? "Mã số sinh viên" : "Tên đăng nhập"}
                className="w-full px-6 py-4 bg-white border-2 border-gray-100 focus:border-blue-900 outline-none transition-all font-bold text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mật khẩu</label>
                <a href="#" className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:underline">Quên mật khẩu?</a>
              </div>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-white border-2 border-gray-100 focus:border-blue-900 outline-none transition-all font-bold text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-blue-900 text-white font-black text-[10px] uppercase tracking-[0.4em] hover:bg-orange-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
              </button>
            </div>
          </form>

          <div className="pt-10 border-t border-gray-100 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Chưa có tài khoản? <a href="#" className="text-blue-900 hover:text-orange-600 transition-colors">Đăng ký ngay</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
