import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // 각 메뉴별 고유 색상 설정
  const navItems = [
    { 
      path: '/', 
      label: '홈', 
      activeColor: 'text-indigo-600', 
      bgColor: 'bg-indigo-600',
      hoverColor: 'hover:text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-500/30'
    },
    { 
      path: '/profile', 
      label: '반려견 프로필', 
      activeColor: 'text-rose-500', 
      bgColor: 'bg-rose-500',
      hoverColor: 'hover:text-rose-500',
      iconBg: 'bg-rose-50 border-rose-500/30'
    },
    { 
      path: '/daily', 
      label: '일상 기록', 
      activeColor: 'text-orange-500', 
      bgColor: 'bg-orange-500',
      hoverColor: 'hover:text-orange-500',
      iconBg: 'bg-orange-50 border-orange-500/30'
    },
    { 
      path: '/health', 
      label: '건강 수첩', 
      activeColor: 'text-emerald-600', 
      bgColor: 'bg-emerald-600',
      hoverColor: 'hover:text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-500/30'
    },
    { 
      path: '/photo', 
      label: '포토 갤러리', 
      activeColor: 'text-purple-600', 
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:text-purple-600',
      iconBg: 'bg-purple-50 border-purple-500/30'
    },
  ];

  const currentItem = navItems.find(item => item.path === location.pathname) || navItems[0];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-xs w-full">
      
      {/* 좌우 패딩을 모바일에서 px-4로 좁혀서 공간 확보 */}
      <div className="w-full px-4 sm:px-8 lg:px-16 h-20 sm:h-24 flex items-center justify-between">
        
        {/* 좌측: 로고와 타이틀 (모바일 화면 가로 폭에 맞춰 크기 최적화) */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-4 group">
          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center text-2xl sm:text-5xl group-hover:scale-105 transition shadow-sm shrink-0 ${currentItem.iconBg}`}>
            🐾
          </div>
          
          <div className="flex items-baseline gap-2">
            {/* 모바일에서는 text-lg, 태블릿 이상에서 text-2xl/4xl */}
            <span className="font-black text-lg sm:text-2xl lg:text-4xl text-neutral-900 tracking-tight">
              Pet Time
            </span>
            <span className="text-xs lg:text-xl text-neutral-400 font-bold tracking-wider uppercase hidden sm:inline">
              Pet Care Portal System
            </span>
          </div>
        </Link>

        {/* 우측 PC 메뉴바 */}
        <nav className="hidden md:flex items-center gap-12">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`font-extrabold text-2xl transition-all duration-200 relative py-2 cursor-pointer ${
                  isActive
                    ? item.activeColor
                    : `text-neutral-700 ${item.hoverColor}`
                }`}
              >
                {item.label}
                {isActive && (
                  <span className={`absolute bottom-0 left-0 w-full h-1 rounded-full ${item.bgColor}`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 모바일용 햄버거 메뉴 버튼 */}
        <div className="flex md:hidden items-center shrink-0">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-neutral-100 active:bg-neutral-200 rounded-xl text-neutral-800 transition cursor-pointer"
            aria-label="메뉴 열기/닫기"
          >
            <span>메뉴</span>
            <span className="text-base">{isOpen ? '✕' : '☰'}</span>
          </button>
        </div>

      </div>

      {/* 모바일용 슬라이드다운 사이드 메뉴 */}
      {isOpen && (
        <div className="fixed inset-0 top-[80px] sm:top-[96px] z-40 md:hidden flex flex-col">
          <div 
            className="flex-grow bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="bg-white border-t border-neutral-200 shadow-2xl px-6 py-8 space-y-4 rounded-b-3xl animate-in slide-in-from-top duration-300">
            <div className="text-xs font-extrabold text-neutral-400 tracking-wider uppercase mb-2">
              Navigation Menu
            </div>
            
            <div className="flex flex-col gap-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-lg transition ${
                      isActive 
                        ? `${item.bgColor} text-white shadow-md` 
                        : 'bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-sm opacity-80">&rarr;</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </header>
  );
}