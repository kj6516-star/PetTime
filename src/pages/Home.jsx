import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js'; // 💡 Supabase 클라이언트 연결

// 기능별 상세 홍보 데이터
const featureDetails = {
  profile: {
    title: "Pet Profile",
    subtitle: "안전한 다견 가정 프로필 관리",
    desc: "여러 마리의 반려동물 프로필과 고유 정보를 체계적이고 안전하게 분리하여 손쉽게 관리하세요.",
    link: "/profile",
    icon: "🐾",
    bgClass: "bg-sky-50 text-sky-600",
    borderHover: "border-sky-300 ring-sky-400",
    btnClass: "bg-sky-600 hover:bg-sky-700 text-white"
  },
  daily: {
    title: "Daily Log",
    subtitle: "스마트한 일상 기록 시스템",
    desc: "매일 급여한 사료량, 산책 코스와 시간, 특이사항까지 타임라인 형식으로 투명하게 기록하고 관리하세요.",
    link: "/daily",
    icon: "📅",
    bgClass: "bg-orange-50 text-orange-600",
    borderHover: "border-orange-300 ring-orange-400",
    btnClass: "bg-orange-600 hover:bg-orange-700 text-white"
  },
  health: {
    title: "Health Care",
    subtitle: "맞춤형 건강 관리 및 진단",
    desc: "품종, 나이, 체중에 따른 최적의 권장 사료량을 계산하고 건강 루틴 달성 현황을 완벽하게 진단합니다.",
    link: "/health",
    icon: "🩺",
    bgClass: "bg-emerald-50 text-emerald-600",
    borderHover: "border-emerald-300 ring-emerald-400",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white"
  },
  photo: {
    title: "Photo Gallery",
    subtitle: "소중한 순간을 담는 아카이브",
    desc: "반려견과 함께한 찬란한 날들의 사진을 모아보고 인스타 스타일 피드로 평생 추억을 간직하세요.",
    link: "/photo",
    icon: "📸",
    bgClass: "bg-pink-50 text-pink-600",
    borderHover: "border-pink-300 ring-pink-400",
    btnClass: "bg-pink-600 hover:bg-pink-700 text-white"
  }
};

// 홈 화면용 포토 슬라이드 컴포넌트 (Supabase 연동)
function PhotoSlider() {
    const [photos, setPhotos] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchPhotosFromSupabase();
    }, []);

    const fetchPhotosFromSupabase = async () => {
        try {
            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                setPhotos(data);
            }
        } catch (e) {
            console.error("Supabase 사진 데이터 불러오기 에러:", e.message);
        }
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.75;
            scrollRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (photos.length === 0) {
        return null; 
    }

    return (
        <div className="mb-16">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <span className="text-orange-600 font-extrabold text-sm tracking-wider uppercase">
                        OUR MOMENTS
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
                        소중한 반려동물의 일상 순간들 📸
                    </h2>
                </div>
                <Link 
                    to="/photo" 
                    className="text-sm sm:text-base font-bold text-neutral-500 hover:text-orange-600 transition shrink-0 ml-2"
                >
                    전체보기 &rarr;
                </Link>
            </div>

            <div className="relative group">
                <button 
                    onClick={() => scroll('left')}
                    className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#FFFDF9] text-neutral-800 shadow-xl border border-neutral-200 items-center justify-center hover:bg-orange-600 hover:text-white transition-all cursor-pointer font-bold text-xl"
                    aria-label="왼쪽으로 이동"
                >
                    &larr;
                </button>

                <button 
                    onClick={() => scroll('right')}
                    className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#FFFDF9] text-neutral-800 shadow-xl border border-neutral-200 items-center justify-center hover:bg-orange-600 hover:text-white transition-all cursor-pointer font-bold text-xl"
                    aria-label="오른쪽으로 이동"
                >
                    &rarr;
                </button>

                <div 
                    ref={scrollRef}
                    className="w-full overflow-x-auto flex gap-4 sm:gap-6 scrollbar-none snap-x snap-mandatory pb-4 pt-2 px-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {photos.map((photo, index) => (
                        <div 
                            key={photo.id || index}
                            className="relative w-64 sm:w-72 lg:w-80 h-[360px] sm:h-[400px] rounded-3xl overflow-hidden group/card cursor-pointer shadow-md bg-neutral-100 shrink-0 snap-start border border-neutral-200"
                        >
                            <img 
                                src={photo.image_url} 
                                alt={photo.caption || '반려동물 사진'} 
                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/10 to-transparent opacity-80" />
                            <div className="absolute bottom-0 left-0 w-full p-5 sm:p-6 flex flex-col justify-end text-white">
                                <span className="text-xs font-bold text-orange-400 mb-1">
                                    ✨ 오늘의 추억
                                </span>
                                <h3 className="text-base sm:text-lg font-bold tracking-tight leading-snug">
                                    {photo.caption || '행복한 일상'}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const Home = () => {
    const [hoveredCard, setHoveredCard] = useState(null);

    return (
        <div className="bg-[#FFFDF9] min-h-screen pb-16 font-sans text-neutral-800">
            
            {/* 1. 웅장한 풀스크린 히어로 배너 */}
            <section className="relative w-full h-[420px] sm:h-[500px] bg-neutral-900 overflow-hidden flex items-center">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-60"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1600&auto=format&fit=crop')`
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent"></div>

                <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full text-white z-10">
                    <div className="max-w-xl space-y-4">
                        <span className="px-3 py-1 rounded-full bg-orange-500 text-xs font-semibold tracking-wider uppercase">
                            Pet Time Care System
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                            소중한 반려동물과의 일상을<br />
                            더 특별하게 기록합니다
                        </h1>
                        <p className="text-gray-300 text-sm sm:text-base font-light leading-relaxed">
                            체계적인 건강 관리부터 매일의 소중한 순간까지,<br />
                            반려동물 케어의 새로운 기준을 만나보세요.
                        </p>
                        <div className="pt-2 flex gap-3 sm:gap-4">
                            <Link to="/daily" className="px-5 sm:px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm sm:text-base font-medium transition shadow-lg">
                                기록 시작하기
                            </Link>
                            <Link to="/profile" className="px-5 sm:px-6 py-3 rounded-xl bg-white/25 hover:bg-white/35 backdrop-blur-md text-white text-sm sm:text-base font-medium transition">
                                프로필 관리
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 메인 컨테이너 */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12">
                
                {/* 2. 포토카드 슬라이드 영역 */}
                <PhotoSlider />

                {/* 3. 핵심 기능 소개 영역 */}
                <div className="text-center mb-10 sm:mb-12 space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950">PetTime만의 핵심 기능</h2>
                    <p className="text-neutral-600 text-base sm:text-xl">반려동물을 위한 스마트 케어 메뉴를 확인해보세요</p>
                </div>

                {/* 그리드 컨테이너: 모바일에서는 세로형 스택 카드, PC(md 이상)에서는 기존 호버 확장 구조 유지 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative">
                    {Object.keys(featureDetails).map((key) => {
                        const item = featureDetails[key];
                        const isHovered = hoveredCard === key;

                        return (
                            <div key={key} className="relative md:h-[240px]">
                                <div 
                                    onMouseEnter={() => setHoveredCard(key)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    className={`bg-[#FFFDF9] border-2 border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-md transition-all duration-300 ease-out flex flex-col md:flex-row md:items-center cursor-pointer hover:shadow-xl ${
                                        isHovered 
                                            ? `md:absolute md:top-0 md:left-0 md:z-50 md:w-[180%] md:h-[240px] ring-4 ${item.borderHover} shadow-2xl bg-[#FFFDF9]` 
                                            : 'w-full h-full'
                                    }`}
                                >
                                    {/* 상단/왼쪽 아이콘 및 타이틀 영역 */}
                                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-6xl font-bold shadow-md shrink-0 ${item.bgClass}`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">{item.title}</h3>
                                            {/* PC에서만 보이는 호버 유도 문구 */}
                                            {!isHovered && (
                                                <p className="hidden md:block text-sm font-semibold text-neutral-400 mt-1.5">마우스를 올려 상세정보 확인 &rarr;</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 모바일(md 미만): 항상 보이는 상세 설명 영역 / PC(md 이상): 호버 시 나타나는 영역 */}
                                    <div className={`mt-4 pt-4 border-t border-neutral-100 md:mt-0 md:pt-0 md:border-t-0 md:flex md:items-center md:justify-between md:flex-grow md:pl-10 transition-all duration-300 ${
                                        isHovered 
                                            ? 'md:opacity-100 md:visible md:translate-x-0' 
                                            : 'md:opacity-0 md:invisible md:translate-x-4 md:pointer-events-none'
                                    }`}>
                                        <div className="md:pr-6 space-y-1">
                                            <span className="text-sm sm:text-2xl font-extrabold text-orange-600 uppercase tracking-widest block">
                                                {item.subtitle}
                                            </span>
                                            <p className="text-sm sm:text-lg font-semibold text-neutral-700 leading-snug">
                                                {item.desc}
                                            </p>
                                        </div>
                                        
                                        <div className="mt-4 md:mt-0 flex justify-end">
                                            <Link 
                                                to={item.link} 
                                                className={`px-5 py-2.5 sm:px-6 sm:py-3.5 rounded-2xl text-sm sm:text-lg font-extrabold shadow-lg shrink-0 transition transform hover:scale-105 inline-block text-center ${item.btnClass}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                자세히 보기 &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default Home;