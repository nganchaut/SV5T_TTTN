
import React from 'react';
import { authService } from '../services/authService';

interface LayoutProps {
  children: React.ReactNode;
  userType: 'student' | 'admin' | 'guest';
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userType, onNavigate, onLogout }) => {
  const logoUrl = "https://tse3.mm.bing.net/th/id/OIP.Odk0Vk_H8Tfz70lpKj4FQAHaG8?pid=Api&P=0&h=180";

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Nâng z-index lên 1000 để luôn nằm trên cùng */}
      <nav className="bg-white border-b sticky top-0 z-[1000] shadow-md h-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
              <img 
                src={logoUrl} 
                alt="DUE Logo" 
                className="h-16 w-auto mr-6"
              />
              <div className="border-l border-gray-200 pl-6 hidden sm:block">
                <span className="text-xl font-bold block leading-none text-blue-900 tracking-tight">SINH VIÊN 5 TỐT - DUE</span>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-orange-600 mt-2 block">Hệ thống xét duyệt chính thức</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-12">
              <button onClick={() => onNavigate('home')} className="text-gray-400 hover:text-blue-900 font-bold text-[10px] uppercase tracking-widest transition-colors">Trang chủ</button>
              {userType === 'student' && (
                <button onClick={() => onNavigate('profile')} className="text-gray-400 hover:text-blue-900 font-bold text-[10px] uppercase tracking-widest transition-colors">Hồ sơ của tôi</button>
              )}
              {userType === 'admin' && (
                <button onClick={() => onNavigate('admin')} className="text-gray-400 hover:text-blue-900 font-bold text-[10px] uppercase tracking-widest transition-colors">Quản trị viên</button>
              )}
              <div className="h-8 w-px bg-gray-100"></div>
              <button className="text-blue-900 font-bold text-[10px] uppercase tracking-widest underline decoration-orange-500 decoration-2 underline-offset-8"
                onClick={() => {
                  if (userType === 'guest') {
                    onNavigate('login');
                  } else {
                    onLogout();
                  }
                }}
              >
                {userType === 'guest' ? 'Đăng nhập' : 'Đăng xuất'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow bg-[#fafafa]">
        {children}
      </main>

      {userType !== 'admin' && (
        <footer className="bg-blue-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
              <div className="col-span-1 md:col-span-1">
                <img src={logoUrl} alt="DUE Logo White" className="h-20 w-auto mb-10 brightness-0 invert" />
                <p className="text-gray-300 text-xs leading-relaxed font-medium">
                  Hệ thống xét duyệt danh hiệu dành cho sinh viên tiêu biểu Trường Đại học Kinh tế - Đại học Đà Nẵng.
                </p>
              </div>
              <div>
                <h3 className="text-[10px] font-bold mb-8 uppercase tracking-[0.2em] text-orange-500">Liên kết ngoài</h3>
                <ul className="space-y-4 text-gray-200 text-[10px] font-bold uppercase tracking-wider">
                  <li><a href="#" className="hover:text-orange-500 transition-colors">Trang chủ DUE</a></li>
                  <li><a href="#" className="hover:text-orange-500 transition-colors">Hội Sinh viên DUE</a></li>
                  <li><a href="#" className="hover:text-orange-500 transition-colors">Phòng Công tác SV</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] font-bold mb-8 uppercase tracking-[0.2em] text-orange-500">Hỗ trợ</h3>
                <ul className="space-y-4 text-gray-200 text-[10px] font-bold uppercase tracking-wider">
                  <li><a href="#" className="hover:text-orange-500 transition-colors">Hướng dẫn nộp hồ sơ</a></li>
                  <li><a href="#" className="hover:text-orange-500 transition-colors">Tiêu chí xét duyệt 2024</a></li>
                  <li><a href="#" className="hover:text-orange-500 transition-colors">Câu hỏi thường gặp</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-[10px] font-bold mb-8 uppercase tracking-[0.2em] text-orange-500">Liên hệ</h3>
                <div className="space-y-5 text-gray-200 text-xs font-medium">
                  <p>71 Ngũ Hành Sơn, Đà Nẵng</p>
                  <p>hoisinhvien@due.udn.vn</p>
                  <p>(0236) 3950110</p>
                </div>
              </div>
            </div>
            <div className="mt-20 pt-10 border-t border-white/10 text-center text-gray-400 text-[9px] font-bold uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} University of Economics - University of Da Nang
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
