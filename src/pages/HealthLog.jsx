import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js'; // 프로젝트의 supabase client 경로에 맞게 수정해주세요

// 품종별 맞춤 가이드 및 주의사항 정적 DB (권장 산책 시간을 1시간(60분) 기준으로 조정)
const BREED_TIPS = {
  "말티즈": {
    caution: "슬개골 탈구 및 눈물자국, 심장 질환에 주의해야 합니다.",
    exercise: 60, // 권장 산책 시간 (분) - 1시간
    baseFoodPerKg: 25
  },
  "푸들": {
    caution: "슬개골 탈구, 귀 속 염증(외이염), 당뇨에 주의해야 합니다.",
    exercise: 60, // 1시간
    baseFoodPerKg: 30
  },
  "포메라니안": {
    caution: "기관지 협착증, 슬개골 탈구, 피부 탈모(A모색증)에 유의하세요.",
    exercise: 60, // 1시간
    baseFoodPerKg: 22
  },
  "비숑 프리제": {
    caution: "방광결석, 피부 알레르기, 슬개골 탈구에 주의하세요.",
    exercise: 60, // 1시간
    baseFoodPerKg: 30
  },
  "치와와": {
    caution: "저혈당, 심장 질환, 기관지 협착증, 치주 질환에 주의하세요.",
    exercise: 60, // 1시간
    baseFoodPerKg: 20
  },
  "기타": {
    caution: "정기적인 건강검진과 균형 잡힌 식단이 가장 중요합니다.",
    exercise: 60, // 1시간
    baseFoodPerKg: 25
  }
};

export default function HealthLog() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);

  // 입력 폼 상태
  const [weight, setWeight] = useState('');
  const [bodyCondition, setBodyCondition] = useState('normal'); 
  const [activityLevel, setActivityLevel] = useState('normal'); 
  const [symptoms, setSymptoms] = useState([]);

  // 오늘 날짜 (YYYY-MM-DD 형식)
  const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalTodayStr();
  
  // 데일리 로그에서 가져온 오늘의 실제 급여량(g)과 산책 시간(분)
  const [todayActualFood, setTodayActualFood] = useState(0);
  const [todayActualWalk, setTodayActualWalk] = useState(0);

  // Supabase에서 펫 프로필 불러오기
  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const { data, error } = await supabase.from('pets').select('*');
      if (error) throw error;

      setPets(data || []);
      if (data && data.length > 0) {
        setSelectedPet(data[0]);
        setWeight(data[0].weight || '');
        fetchDailyLogs(data[0].id, todayStr);
      }
    } catch (error) {
      console.error('반려견 목록을 불러오는 중 오류 발생:', error.message);
    }
  };

  // Supabase에서 특정 펫의 오늘 데일리 로그 데이터를 가져와 사료량과 산책 시간 합산
  const fetchDailyLogs = async (petId, dateStr) => {
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('pet_id', petId)
        .eq('log_date', dateStr);

      if (error) throw error;

      let totalFood = 0;
      let totalWalk = 0;

      (data || []).forEach(log => {
        const detailStr = String(log.detail || '');
        const match = detailStr.match(/[\d.]+/);
        const numericValue = match ? parseFloat(match[0]) : 0;

        if (log.type === '사료' || log.type === '식사' || log.type === 'food') {
          if (!isNaN(numericValue)) totalFood += numericValue;
        }
        if (log.type === '산책' || log.type === 'walk') {
          if (!isNaN(numericValue)) totalWalk += numericValue;
        }
      });

      setTodayActualFood(totalFood);
      setTodayActualWalk(totalWalk);
    } catch (error) {
      console.error('데일리 로그를 불러오는 중 오류 발생:', error.message);
    }
  };

  // 펫 변경 핸들러
  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    setWeight(pet.weight || '');
    setSymptoms([]);
    fetchDailyLogs(pet.id, todayStr);
  };

  // 증상 체크박스 핸들러
  const handleSymptomChange = (e) => {
    const value = e.target.value;
    setSymptoms(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  // 권장 사료량 및 칼로리, 산책 시간 계산
  const calculateHealthData = () => {
    if (!weight || !selectedPet) return { kcal: 0, food: 0, walk: 60 };

    const w = parseFloat(weight);
    const breedInfo = BREED_TIPS[selectedPet.breed] || BREED_TIPS["기타"];
    
    let factor = 1.0;
    if (bodyCondition === 'slim') factor = 1.2; 
    if (bodyCondition === 'overweight') factor = 0.8; 
    if (activityLevel === 'high') factor += 0.2;
    if (activityLevel === 'low') factor -= 0.1;

    const estimatedFood = Math.round(w * breedInfo.baseFoodPerKg * factor);
    const estimatedKcal = Math.round(estimatedFood * 3.5); 
    
    const estimatedWalk = activityLevel === 'high' ? breedInfo.exercise + 15 : activityLevel === 'low' ? Math.max(20, breedInfo.exercise - 20) : breedInfo.exercise;

    return { kcal: estimatedKcal, food: estimatedFood, walk: estimatedWalk };
  };

  const result = calculateHealthData();
  const currentBreedInfo = selectedPet ? (BREED_TIPS[selectedPet.breed] || BREED_TIPS["기타"]) : BREED_TIPS["기타"];

  const foodPercentage = result.food > 0 ? Math.round((todayActualFood / result.food) * 100) : 0;
  const walkPercentage = result.walk > 0 ? Math.round((todayActualWalk / result.walk) * 100) : 0;

  if (pets.length === 0) {
    return (
      <div className="p-8 sm:p-10 text-center max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-neutral-100 mt-12 mx-4">
        <div className="text-4xl sm:text-5xl mb-3">🐾</div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 mb-2">등록된 반려견 프로필이 없습니다</h2>
        <p className="text-neutral-500 text-sm sm:text-base">먼저 프로필 페이지에서 반려견을 등록해 주세요!</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 bg-[#FAFAF7] min-h-screen font-sans">
      
      {/* 타이틀 영역 */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          🩺 반려견 건강 상태 및 루틴 리포트
        </h1>
        <p className="text-sm sm:text-base text-neutral-500">우리 아이의 오늘 컨디션을 체크하고 맞춤 케어 가이드를 확인하세요.</p>
      </div>

      {/* 1. 다견 탭 선택 */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {pets.map((pet) => (
          <button
            key={pet.id}
            onClick={() => handleSelectPet(pet)}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              selectedPet?.id === pet.id
                ? 'bg-neutral-900 text-white shadow-md shadow-neutral-900/10 scale-[1.02]'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <span className="text-base sm:text-lg">🐾</span>
            <span>{pet.name}</span>
            <span className={`text-xs sm:text-sm px-2 py-0.5 rounded-md ${selectedPet?.id === pet.id ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-500'}`}>
              {pet.breed || '기타'}
            </span>
          </button>
        ))}
      </div>

      {selectedPet && (
        <div className="space-y-6">
          
          {/* 2. 데일리 루틴 연동 비교 대시보드 */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-neutral-200/80 space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-base sm:text-xl font-bold text-neutral-900 flex items-center gap-2">
                <span>📊</span> 오늘 데일리 루틴 달성 현황
              </h2>
              <span className="text-xs sm:text-sm font-medium text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
                {todayStr} 기준
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              
              {/* 사료 급여량 비교 */}
              <div className="bg-neutral-50/70 p-4 sm:p-5 rounded-2xl border border-neutral-100 space-y-3">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="font-semibold text-neutral-700">🍚 사료 급여량</span>
                  <span className="font-bold text-neutral-900">
                    {todayActualFood}g <span className="text-xs sm:text-sm text-neutral-400 font-normal">/ 권장 {result.food}g</span>
                  </span>
                </div>
                <div className="w-full bg-neutral-200/80 h-3 sm:h-3.5 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      foodPercentage > 110 ? 'bg-amber-500' : 'bg-neutral-900'
                    }`}
                    style={{ width: `${Math.min(foodPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  {todayActualFood === 0 
                    ? '아직 오늘 사료 기록이 없어요!' 
                    : foodPercentage >= 90 && foodPercentage <= 110 
                    ? '✨ 권장량만큼 완벽하게 급여하셨네요!' 
                    : foodPercentage < 90 
                    ? '🥣 권장량보다 조금 적게 먹었어요.' 
                    : '⚠️ 권장량보다 많이 먹었어요! 간식 조절이 필요해요.'}
                </p>
              </div>

              {/* 산책 시간 비교 */}
              <div className="bg-neutral-50/70 p-4 sm:p-5 rounded-2xl border border-neutral-100 space-y-3">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="font-semibold text-neutral-700">🦮 산책 시간</span>
                  <span className="font-bold text-neutral-900">
                    {todayActualWalk}분 <span className="text-xs sm:text-sm text-neutral-400 font-normal">/ 권장 {result.walk}분</span>
                  </span>
                </div>
                <div className="w-full bg-neutral-200/80 h-3 sm:h-3.5 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(walkPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  {todayActualWalk === 0 
                    ? '오늘 아직 산책 기록이 없어요.' 
                    : walkPercentage >= 100 
                    ? '🎉 오늘 산책 목표를 달성했습니다!' 
                    : '💪 조금만 더 힘내서 산책해볼까요?'}
                </p>
              </div>

            </div>
          </div>

          {/* 3. 체크리스트 및 체형 설정 폼 */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-neutral-200/80 space-y-5 sm:space-y-6">
            <h2 className="text-base sm:text-xl font-bold text-neutral-900 flex items-center gap-2">
              <span>⚙️</span> 체크리스트 및 체형 설정
            </h2>

            {/* 현재 체중 입력 */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-700">현재 체중 (kg)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-neutral-50/50 border border-neutral-200 rounded-2xl px-4.5 py-3 sm:py-3.5 text-base sm:text-lg text-neutral-900 font-medium focus:bg-white focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                  placeholder="예: 3.5"
                />
                <span className="absolute right-4.5 top-1/2 -translate-y-1/2 text-sm sm:text-base font-medium text-neutral-400">kg</span>
              </div>
            </div>

            {/* 체형 상태 (모바일 1열, 태블릿 이상 3열) */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-700">현재 체형 상태 (눈바디)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  { id: 'slim', label: '🟢 마른 편/적정' },
                  { id: 'normal', label: '🟡 표준/보통' },
                  { id: 'overweight', label: '🔴 통통/과체중' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBodyCondition(item.id)}
                    className={`p-3 sm:p-3.5 rounded-2xl border text-sm sm:text-base font-bold transition-all cursor-pointer ${
                      bodyCondition === item.id
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md shadow-neutral-900/10 scale-[1.01]'
                        : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 평소 활동량 (모바일 1열, 태블릿 이상 3열) */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-700">평소 활동량</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  { id: 'low', label: '💤 적음 (집돌이)' },
                  { id: 'normal', label: '🚶 보통 (산책 즐김)' },
                  { id: 'high', label: '🏃 활발함 (에너자이저)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivityLevel(item.id)}
                    className={`p-3 sm:p-3.5 rounded-2xl border text-sm sm:text-base font-bold transition-all cursor-pointer ${
                      activityLevel === item.id
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md shadow-neutral-900/10 scale-[1.01]'
                        : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 특이 증상 체크박스 */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-700">
                최근 눈에 띄는 특이 증상 <span className="text-xs sm:text-sm font-normal text-neutral-400">(복수 선택)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-sm sm:text-base">
                {[
                  '눈곱이 자주 껴요', 
                  '귀를 자주 긁어요', 
                  '구토나 묽은 변을 봤어요', 
                  '기침을 가끔 해요', 
                  '사료를 잘 안 먹어요'
                ].map((sym, idx) => (
                  <label 
                    key={idx} 
                    className={`flex items-center gap-3 p-3.5 sm:p-4 border rounded-2xl cursor-pointer transition-all ${
                      symptoms.includes(sym) 
                        ? 'border-neutral-900 bg-neutral-900/[0.02]' 
                        : 'border-neutral-200 bg-neutral-50/30 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={sym}
                      checked={symptoms.includes(sym)}
                      onChange={handleSymptomChange}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-neutral-300 accent-neutral-900 cursor-pointer"
                    />
                    <span className="text-neutral-700 font-medium text-sm sm:text-base">{sym}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 4. 맞춤 가이드 및 피드백 리포트 */}
          <div className="bg-amber-50/70 p-5 sm:p-8 rounded-3xl shadow-sm border border-amber-200/60 space-y-4 sm:space-y-5">
            <h2 className="text-base sm:text-xl font-bold text-neutral-900 flex items-center gap-2">
              <span>💡</span> 품종({selectedPet.breed || '기타'}) 맞춤 케어 가이드
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-amber-100/60 space-y-1">
                <span className="text-xs sm:text-sm text-neutral-400 font-bold uppercase tracking-wider">오늘 권장 사료량</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{result.food} <span className="text-base sm:text-lg font-bold text-neutral-600">g</span></p>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-amber-100/60 space-y-1">
                <span className="text-xs sm:text-sm text-neutral-400 font-bold uppercase tracking-wider">오늘 권장 산책시간</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{result.walk} <span className="text-base sm:text-lg font-bold text-neutral-600">분</span></p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-amber-100/60 space-y-1">
              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                <strong className="text-neutral-900 font-bold">⚠️ 취약 질환 주의사항:</strong> {currentBreedInfo.caution}
              </p>
            </div>

            {symptoms.length > 0 && (
              <div className="bg-red-50 border border-red-200/80 p-4 sm:p-5 rounded-2xl space-y-2 animate-fadeIn">
                <h3 className="font-bold text-red-800 text-sm sm:text-base flex items-center gap-2">
                  <span>🚨</span> 체크하신 증상에 대한 수의사 조언
                </h3>
                <p className="text-sm sm:text-base text-red-700 leading-relaxed">
                  현재 <strong className="underline decoration-red-300 underline-offset-2">{symptoms.join(', ')}</strong> 증상이 체크되었습니다. 증상이 지속되거나 아이가 무기력해진다면 지체 말고 수의사 상담을 받아보세요.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}