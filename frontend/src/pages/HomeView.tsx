import React from 'react';
import { FeaturedFace } from '../types';

const HomeView: React.FC<{ faces: FeaturedFace[], posts: any[], userRole: 'student' | 'admin' | 'guest', onNavigate: (page: string) => void }> = ({ faces, posts, userRole, onNavigate }) => (
  <div className="space-y-24 pb-20 animate-fade-in font-sans">
    {/* Hero Section */}
    <div className="min-h-[85vh] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#002b5c] to-[#004b9e]">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 inset-0"></div>
      </div>
      <div className="text-center space-y-10 z-10 px-4 max-w-5xl mx-auto mt-12">
        <p className="text-orange-400 font-black text-xs md:text-sm tracking-[0.4em] uppercase font-sans animate-fade-in" style={{ animationDelay: '0.1s' }}>Hội Sinh viên Việt Nam trường Đại học Kinh tế, ĐHĐN</p>
        <div className="space-y-4">
          <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none font-formal">
            Sinh Viên<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">5 Tốt</span>
          </h1>
          <p className="text-blue-100/80 text-lg md:text-xl font-medium max-w-2xl mx-auto font-sans">Hệ thống xét duyệt và quản lý hồ sơ trực tuyến dành cho sinh viên trường Đại học Kinh tế (DUE).</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-6 pt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <button onClick={() => onNavigate(userRole === 'admin' ? 'admin' : userRole === 'student' ? 'profile' : 'login')} className="px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-full border border-orange-400/50 transition-all active:scale-95 shadow-none pb-5">
            {userRole === 'guest' ? 'Đăng nhập ngay' : 'Vào hệ thống quản lý'}
          </button>
          <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-full active:scale-95 transition-all cursor-pointer">
            Tìm hiểu thêm
          </button>
        </div>
      </div>
      {/* Decorative scroll indicator */}
      <div onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60 animate-bounce cursor-pointer group">
        <span className="text-[9px] font-bold text-white uppercase tracking-widest group-hover:text-orange-400 transition-colors">Cuộn xuống</span>
        <i className="fas fa-chevron-down text-white text-xs group-hover:text-orange-400 transition-colors"></i>
      </div>
    </div>

    {/* Meaning Section */}
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 relative">
          <div className="absolute -left-8 -top-8 text-9xl text-gray-100 font-black z-0 opacity-50 select-none">"</div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-[#002b5c] uppercase font-formal tracking-tight leading-tight">Danh hiệu cao quý nhất<br />của sinh viên Việt Nam</h2>
            <div className="w-20 h-1.5 bg-orange-500 mt-6 md:mt-8"></div>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed font-medium">"Sinh viên 5 tốt" là phong trào lớn lớn do Trung ương Hội Sinh viên Việt Nam phát động, nhằm hướng tới việc xây dựng hình ảnh sinh viên toàn diện với 5 tiêu chí: Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt và Hội nhập tốt.</p>
          <ul className="space-y-4 pt-4">
            {['Minh chứng cho sự nỗ lực, cố gắng không ngừng nghỉ.', 'Lợi thế cạnh tranh vượt trội trong mắt nhà tuyển dụng.', 'Cơ hội nhận các học bổng giá trị từ trường và doanh nghiệp.'].map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <i className="fas fa-check-circle text-orange-500 mt-1 text-lg"></i>
                <span className="text-gray-700 font-bold">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4 mt-12">
            <img src="/images/due_campus.png" alt="Students" className="rounded-2xl border-2 border-white/10 w-full object-cover h-64" />
            <img src="/images/sv5t_award.png" alt="Study" className="rounded-2xl border-2 border-white/10 w-full object-cover h-48" />
          </div>
          <div className="space-y-4">
            <img src="/images/sv5t_volunteering.png" alt="Team" className="rounded-2xl border-2 border-white/10 w-full object-cover h-48" />
            <img src="/images/sv5t_grad.png" alt="Success" className="rounded-2xl border-2 border-white/10 w-full object-cover h-64" />
          </div>
        </div>
      </div>
    </div>

    {/* Criteria Section */}
    <div className="bg-gray-50 py-24 border-y">
      <div className="max-w-7xl mx-auto px-4 space-y-16">
        <div className="text-center space-y-4">
          <p className="text-orange-500 font-black text-xs tracking-widest uppercase">Hệ thống tiêu chuẩn</p>
          <h2 className="text-3xl md:text-5xl font-black text-[#002b5c] uppercase font-formal tracking-tight">5 Tiêu chí cốt lõi</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { icon: 'fa-heart', title: 'Đạo đức tốt', color: 'rose', desc: 'Điểm rèn luyện xuất sắc, không vi phạm kỷ luật.' },
            { icon: 'fa-book-open', title: 'Học tập tốt', color: 'blue', desc: 'Thành tích học tập giỏi, tham gia NCKH hoặc thi Olympic.' },
            { icon: 'fa-running', title: 'Thể lực tốt', color: 'emerald', desc: 'Đạt danh hiệu "Thanh niên khỏe" hoặc tương đương.' },
            { icon: 'fa-hands-helping', title: 'Tình nguyện tốt', color: 'amber', desc: 'Tích cực tham gia các hoạt động vì cộng đồng.' },
            { icon: 'fa-globe-asia', title: 'Hội nhập tốt', color: 'violet', desc: 'Kỹ năng ngoại ngữ, tin học và phong trào hội nhập.' }
          ].map((c, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 group">
              <div className={`w-14 h-14 bg-${c.color}-50 rounded-2xl flex items-center justify-center mb-6 text-${c.color}-500 text-2xl`}>
                <i className={`fas ${c.icon}`}></i>
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mb-3">{c.title}</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Timeline Section */}
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center space-y-4 mb-16">
        <p className="text-orange-500 font-black text-xs tracking-widest uppercase">Quy trình xét duyệt</p>
        <h2 className="text-3xl md:text-4xl font-black text-[#002b5c] uppercase font-formal tracking-tight">Quy trình chuyên nghiệp</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
        <div className="hidden md:block absolute top-12 left-10 right-10 h-0.5 bg-gray-200 z-0"></div>
        {[
          { icon: 'fa-user-edit', title: '01. Đăng nhập & Nộp hồ sơ', desc: 'Sinh viên đăng nhập bằng tài khoản được cấp và nộp minh chứng.' },
          { icon: 'fa-search', title: '02. Thẩm định Cấp Khoa', desc: 'Ban thư ký Liên Chi Hội các khoa kiểm tra tính hợp lệ.' },
          { icon: 'fa-users-cog', title: '03. Xét duyệt Cấp Trường', desc: 'Hội đồng xét duyệt đánh giá tổng hợp mức độ đạt.' },
          { icon: 'fa-award', title: '04. Công nhận & Vinh danh', desc: 'Ban hành Quyết định và tổ chức Lễ tuyên dương.' }
        ].map((s, i) => (
          <div key={i} className="relative z-10 bg-white md:bg-transparent p-6 md:p-0 rounded-xl border md:border-0 text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-white border-4 border-[#002b5c] rounded-full flex items-center justify-center text-[#002b5c] text-3xl">
              <i className={`fas ${s.icon}`}></i>
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase mb-2">{s.title}</h3>
              <p className="text-gray-500 text-xs font-bold leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Featured Faces Carousel */}
    {faces.length > 0 && (
      <div className="bg-[#002b5c] py-24 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-orange-400 font-black text-xs tracking-widest uppercase mb-4">Gương mặt tiêu biểu</p>
              <h2 className="text-3xl md:text-5xl font-black uppercase font-formal tracking-tight text-white">Vinh danh sinh viên</h2>
            </div>
            <div className="hidden md:flex gap-4">
              <button 
                onClick={() => {
                  const container = document.getElementById('faces-carousel');
                  if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
                }}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                onClick={() => {
                  const container = document.getElementById('faces-carousel');
                  if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
                }}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <div 
            id="faces-carousel"
            className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {faces.map((f, i) => (
              <div 
                key={i} 
                className="min-w-full md:min-w-[45%] lg:min-w-[31%] snap-start bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group backdrop-blur-sm"
              >
                <div className="flex items-center gap-5 mb-6">
                  <img src={f.image || 'https://via.placeholder.com/300x400?text=Sinh+Vien+5+Tot'} className="w-20 h-20 rounded-xl object-cover" alt={f.name} />
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">{f.name}</h3>
                    <p className="text-orange-400 text-[9px] font-black uppercase tracking-widest mt-1">{f.achievement}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm italic leading-relaxed">"{f.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Latest Posts Section */}
    {posts.filter(p => p.status === 'published').length > 0 && (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <p className="text-orange-500 font-black text-xs tracking-widest uppercase mb-4">Tin tức & Thông báo</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase font-formal tracking-tight text-[#002b5c]">Bài viết mới nhất</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.filter(p => p.status === 'published').slice(0, 6).map((post, i) => (
            <div key={i} className="bg-white border rounded-2xl overflow-hidden transition-all group flex flex-col cursor-pointer hover:border-orange-500/50" onClick={() => onNavigate(`/posts/${post.id}`)}>
              <div className="aspect-video bg-gray-100 overflow-hidden relative">
                {post.image ? (
                  <img src={post.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={post.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <i className="fas fa-image text-4xl"></i>
                  </div>
                )}
                {/* Overlay gradient để badge luôn đọc được */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none"></div>
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-full shadow-md">Tin tức</span>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div className="cursor-pointer">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                    <i className="far fa-calendar"></i>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-lg font-black text-[#002b5c] uppercase leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 mb-4">{post.title}</h3>
                  <p className="text-gray-500 text-sm font-medium line-clamp-3 leading-relaxed mb-6">{post.content}</p>
                </div>
                <button 
                  onClick={() => onNavigate(`/posts/${post.id}`)}
                  className="flex items-center gap-2 text-blue-900 font-black text-[10px] uppercase tracking-widest hover:text-orange-600 transition-colors"
                >
                  Xem chi tiết <i className="fas fa-arrow-right text-[8px]"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* CTA */}
    <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
      <h2 className="text-3xl md:text-4xl font-black text-[#002b5c] uppercase font-formal tracking-tight">Bạn đã sẵn sàng?</h2>
      <p className="text-gray-500 font-medium">Bắt đầu hành trình chinh phục danh hiệu "Sinh viên 5 tốt" ngay hôm nay.</p>
      <button onClick={() => onNavigate(userRole === 'admin' ? 'admin' : userRole === 'student' ? 'profile' : 'login')} className="px-12 py-5 bg-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-full hover:bg-orange-700 transition-all transform  border border-orange-500">
        {userRole === 'guest' ? 'Đăng nhập ngay' : 'Vào hệ thống quản lý'}
      </button>
    </div>
  </div>
);

export default HomeView;
