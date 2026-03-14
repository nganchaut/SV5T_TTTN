import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PostDetailView: React.FC<{ posts: any[] }> = ({ posts }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    const found = posts.find(p => String(p.id) === id);
    if (found) {
      setPost(found);
    }
  }, [id, posts]);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <i className="fas fa-circle-notch fa-spin text-4xl text-blue-900"></i>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tìm bài viết...</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-[#002b5c] text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-orange-600 transition-colors"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero section for post */}
      <div className="relative h-[40vh] md:h-[60vh] overflow-hidden">
        {post.HinhAnh ? (
          <img 
            src={post.HinhAnh} 
            className="w-full h-full object-cover" 
            alt={post.TieuDe} 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a1628] to-[#002b5c] flex items-center justify-center">
            <i className="fas fa-image text-8xl text-white/10"></i>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => navigate('/')}
              className="mb-8 flex items-center gap-2 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              <i className="fas fa-arrow-left text-[8px]"></i> Quay lại
            </button>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-full">Tin tức</span>
              <span className="text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <i className="far fa-calendar"></i> {post.NgayDang}
              </span>
            </div>
            <h1 className="text-3xl md:text-6xl font-black text-white uppercase leading-tight font-formal tracking-tight">
              {post.TieuDe}
            </h1>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="prose prose-lg max-w-none prose-slate">
          {post.NoiDung.split('\n').map((para: string, idx: number) => (
            para.trim() && (
              <p key={idx} className="text-gray-700 leading-relaxed mb-6 font-medium text-lg">
                {para}
              </p>
            )
          ))}
        </div>

        {/* Share/Footer */}
        <div className="mt-20 pt-12 border-t flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Chia sẻ bài viết</span>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-blue-900 hover:bg-[#002b5c] hover:text-white transition-all">
                <i className="fab fa-facebook-f"></i>
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-blue-900 hover:bg-[#002b5c] hover:text-white transition-all">
                <i className="fab fa-twitter"></i>
              </button>
              <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-blue-900 hover:bg-[#002b5c] hover:text-white transition-all">
                <i className="fas fa-link"></i>
              </button>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gray-50 text-[#002b5c] text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 hover:text-white transition-all"
          >
            Xem các tin tức khác
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDetailView;
