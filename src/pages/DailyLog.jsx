import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js'; // 본인의 Supabase 클라이언트 경로에 맞게 수정해주세요

// src/assets 폴더에 있는 이미지 불러오기
import item11 from '../assets/dailyitem_11.png';
import item22 from '../assets/dailyitem_22.png';
import item33 from '../assets/dailyitem_33.png';
import item55 from '../assets/dailyitem_44.png';
import item44 from '../assets/dailyitem_55.png';
import item66 from '../assets/dailyitem_66.png';
import item77 from '../assets/dailyitem_66.png';

const DailyLog = () => {
  // 1. 프로필 정보 상태 (Supabase에서 불러오기)
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const currentPet = pets.find(p => p.id === selectedPetId) || pets[0];

  // 2. 날짜 상태 (기본값: 오늘 날짜)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // 날짜를 "YYYY-MM-DD" 형태의 키로 변환
  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 특정 날짜가 속한 주의 월요일부터 일요일까지의 날짜 배열 생성
  const getWeekDays = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(d.setDate(diff));
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      weekDays.push(nextDay);
    }
    return weekDays;
  };

  const weekDays = getWeekDays(currentDate);

  // 주(Week) 단위 이동 함수
  const handlePrevWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const formatWeekRangeString = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, '0')}.${String(start.getDate()).padStart(2, '0')} ~ ${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, '0')}.${String(end.getDate()).padStart(2, '0')}`;
  };

  // 3. 일일 기록 상태
  const [logs, setLogs] = useState([]);

  // Supabase에서 반려견(pets) 목록 불러오기
  useEffect(() => {
    const fetchPets = async () => {
      const { data, error } = await supabase.from('pets').select('*');
      if (error) {
        console.error('반려견 목록 불러오기 실패:', error.message);
        return;
      }
      if (data && data.length > 0) {
        setPets(data);
        setSelectedPetId(data[0].id);
      }
    };
    fetchPets();
  }, []);

  // 선택된 펫 또는 날짜가 바뀔 때 Supabase에서 해당 일일 기록(daily_logs) 불러오기
  useEffect(() => {
    const fetchLogs = async () => {
      if (!currentPet?.id) return;
      const dateKey = getDateKey(currentDate);

      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('pet_id', currentPet.id)
        .eq('log_date', dateKey);

      if (error) {
        console.error('일일 기록 불러오기 실패:', error.message);
        setLogs([]);
        return;
      }

      if (data) {
        const sorted = data.sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time));
        setLogs(sorted);
      }
    };

    fetchLogs();
  }, [currentPet?.id, currentDate]);

  // 4. 모달 및 입력 폼 상태
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedType, setSelectedType] = useState('사료');
  const [time, setTime] = useState('');
  const [detail, setDetail] = useState('');
  const [memo, setMemo] = useState('');

  // 7가지 관리 항목 정의
  const categories = [
    { name: '사료', image: item11, color: 'bg-[#D4A373]' },
    { name: '간식', image: item44, color: 'bg-[#E07A5F]' },
    { name: '산책', image: item33, color: 'bg-[#52796F]' },
    { name: '목욕', image: item22, color: 'bg-[#457B9D]' },
    { name: '병원', image: item55, color: 'bg-[#D6688B]' },
    { name: '배변', image: item66, color: 'bg-[#8D99AE]' },
    { name: '수면', image: item77, color: 'bg-[#6D6875]' }
  ];

  // 시간 포맷 변환 함수들
  const formatTimeToAmPm = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes('오전') || timeStr.includes('오후')) return timeStr;

    const [hourStr, minuteStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr || '00';

    if (isNaN(hour)) return timeStr;

    let period = '오전';
    if (hour >= 12) {
      period = '오후';
      if (hour > 12) hour -= 12;
    }
    if (hour === 0) hour = 12;

    const formattedHour = String(hour).padStart(2, '0');
    return `${period} ${formattedHour}:${minute}`;
  };

  const convertTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    let hours = 0;
    let minutes = 0;

    if (timeStr.includes('오전') || timeStr.includes('오후')) {
      const parts = timeStr.split(' ');
      const period = parts[0];
      const timeParts = (parts[1] || '00:00').split(':');
      hours = parseInt(timeParts[0], 10) || 0;
      minutes = parseInt(timeParts[1], 10) || 0;

      if (period === '오후' && hours !== 12) hours += 12;
      else if (period === '오전' && hours === 12) hours = 0;
    } else {
      const timeParts = timeStr.split(':');
      hours = parseInt(timeParts[0], 10) || 0;
      minutes = parseInt(timeParts[1], 10) || 0;
    }

    return hours * 60 + minutes;
  };

  const renderCategoryIcon = (type, sizeClass = "w-12 h-12 sm:w-16 sm:h-16") => {
    const found = categories.find(c => type && type.includes(c.name)) || categories[0];
    if (found.image) {
      return (
        <img src={found.image} alt={found.name} className={`${sizeClass} rounded-full object-cover shadow-md flex-shrink-0`} />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full ${found.color} flex items-center justify-center text-2xl sm:text-3xl shadow-md text-white flex-shrink-0`}>
        🐾
      </div>
    );
  };

  const getDetailConfig = (type) => {
    if (!type) return { label: '상세 내용', placeholder: '내용을 입력하세요', unit: '' };
    if (type.includes('사료') || type.includes('간식')) return { label: '급여량 (선택)', placeholder: '예: 30 (숫자만 입력)', unit: 'g' };
    if (type.includes('산책')) return { label: '산책 시간 (선택)', placeholder: '예: 30 (숫자만 입력)', unit: '분' };
    if (type.includes('수면')) return { label: '수면 시간 (선택)', placeholder: '예: 2 (숫자만 입력)', unit: '시간' };
    if (type.includes('목욕')) return { label: '특이사항 (선택)', placeholder: '예: 샴푸 변경 등', unit: '' };
    if (type.includes('병원')) return { label: '진료 항목 (선택)', placeholder: '예: 예방접종', unit: '' };
    if (type.includes('배변')) return { label: '배변 상태 (선택)', placeholder: '예: 양호', unit: '' };
    return { label: '상세 내용 (선택)', placeholder: '내용을 입력하세요', unit: '' };
  };

  const handleOpenCreateModal = (type) => {
    setSelectedType(type);
    setEditingId(null);
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setDetail('');
    setMemo('');
    setIsOpenModal(true);
  };

  const handleOpenEditModal = (log) => {
    setEditingId(log.id);
    const matchedCategory = categories.find(c => log.type && log.type.includes(c.name));
    setSelectedType(matchedCategory ? matchedCategory.name : log.type);
    
    let rawTime = log.time || '';
    if (rawTime.includes('오전') || rawTime.includes('오후')) {
      const parts = rawTime.split(' ');
      const period = parts[0];
      const timeParts = (parts[1] || '00:00').split(':');
      let h = parseInt(timeParts[0], 10) || 0;
      const m = timeParts[1] || '00';

      if (period === '오후' && h !== 12) h += 12;
      if (period === '오전' && h === 12) h = 0;
      rawTime = `${String(h).padStart(2, '0')}:${m}`;
    }

    setTime(rawTime);
    setDetail(log.detail || '');
    setMemo(log.memo || '');
    setIsOpenModal(true);
  };

  // 데이터 저장 (Supabase Insert / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!time) {
      alert('시간을 입력해주세요!');
      return;
    }

    const finalDetail = detail.trim();
    const formattedTime = formatTimeToAmPm(time);
    const dateKey = getDateKey(currentDate);

    if (editingId) {
      const { error } = await supabase
        .from('daily_logs')
        .update({
          type: selectedType,
          time: formattedTime,
          detail: finalDetail,
          memo: memo.trim()
        })
        .eq('id', editingId);

      if (error) {
        alert('수정 실패: ' + error.message);
        return;
      }

      setLogs(prev => 
        prev.map(log => log.id === editingId ? { ...log, type: selectedType, time: formattedTime, detail: finalDetail, memo: memo.trim() } : log)
            .sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time))
      );
    } else {
      const newLogPayload = {
        pet_id: currentPet.id,
        log_date: dateKey,
        type: selectedType,
        time: formattedTime,
        detail: finalDetail,
        memo: memo.trim()
      };

      const { data, error } = await supabase
        .from('daily_logs')
        .insert([newLogPayload])
        .select();

      if (error) {
        alert('저장 실패: ' + error.message);
        return;
      }

      if (data) {
        setLogs(prev => [...prev, data[0]].sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time)));
      }
    }

    setIsOpenModal(false);
  };

  // 데이터 삭제 (Supabase Delete)
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('정말 이 기록을 삭제하시겠습니까?')) {
      const { error } = await supabase
        .from('daily_logs')
        .delete()
        .eq('id', id);

      if (error) {
        alert('삭제 실패: ' + error.message);
        return;
      }

      setLogs(logs.filter(log => log.id !== id));
    }
  };

  const detailConfig = getDetailConfig(selectedType);
  const koreanDays = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 bg-[#FFFDF9] min-h-screen">
      
      {/* 🐶 상단 프로필 선택 탭 */}
      {pets.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          {pets.map((pet) => {
            const isSelected = pet.id === selectedPetId;
            return (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition cursor-pointer font-bold text-base sm:text-xl ${
                  isSelected 
                    ? 'bg-neutral-900 text-white shadow-md scale-105' 
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-neutral-200 flex items-center justify-center">
                  {pet.avatar ? (
                    <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm sm:text-xl">🐶</span>
                  )}
                </div>
                <span>{pet.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 상단 타이틀 */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-800 flex items-center justify-center gap-2 sm:gap-3">
          <span className="text-pink-500 text-lg sm:text-2xl">❤️</span>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-neutral-200 flex items-center justify-center shadow-md border-2 border-pink-200">
              {currentPet?.avatar ? (
                <img src={currentPet.avatar} alt={currentPet.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">🐶</span>
              )}
            </div>
            <span>{currentPet ? currentPet.name : '우리 강아지'}</span>
          </div>
          <span className="text-pink-500 text-lg sm:text-2xl">❤️</span>
        </h1>
      </div>

      {/* 상단 7가지 퀵 아이콘 메뉴 */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-4 mb-8 sm:mb-10 max-w-3xl mx-auto">
        {categories.map((cat) => (
          <div 
            key={cat.name}
            onClick={() => handleOpenCreateModal(cat.name)}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="group-hover:scale-105 transition">
              {renderCategoryIcon(cat.name)}
            </div>
            <span className="font-bold text-neutral-800 mt-1.5 sm:mt-2 text-sm sm:text-lg">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* 주(Week) 단위 네비게이션 및 요일별 탭 바 */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-3 sm:p-4 mb-6 sm:mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1 sm:px-2">
          <button 
            onClick={handlePrevWeek}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold text-lg sm:text-xl transition cursor-pointer"
          >
            &lt;
          </button>
          <span className="font-bold text-neutral-800 text-base sm:text-2xl">{formatWeekRangeString()}</span>
          <button 
            onClick={handleNextWeek}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold text-lg sm:text-xl transition cursor-pointer"
          >
            &gt;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((dayDate, index) => {
            const isSelected = getDateKey(dayDate) === getDateKey(currentDate);
            const isToday = getDateKey(dayDate) === getDateKey(new Date());

            let dayColorClass = isSelected ? 'text-orange-700' : 'text-neutral-500';
            let dateColorClass = isSelected ? 'text-orange-900' : 'text-neutral-800';

            if (index === 5) {
              dayColorClass = isSelected ? 'text-blue-600' : 'text-blue-500';
              dateColorClass = isSelected ? 'text-blue-700' : 'text-blue-600';
            } else if (index === 6) {
              dayColorClass = isSelected ? 'text-red-600' : 'text-red-500';
              dateColorClass = isSelected ? 'text-red-700' : 'text-red-600';
            }

            return (
              <button
                key={index}
                onClick={() => setCurrentDate(new Date(dayDate))}
                className={`flex flex-col items-center justify-center py-2.5 sm:py-3.5 rounded-xl transition cursor-pointer ${
                isSelected 
                  ? 'bg-orange-100 border border-orange-300 shadow-sm' 
                  : isToday 
                  ? 'bg-orange-50 border border-orange-200' 
                  : 'bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                <span className={`text-xs sm:text-xl font-semibold mb-0.5 sm:mb-1 ${dayColorClass}`}>
                  {koreanDays[index]}
                </span>
                <span className={`text-sm sm:text-xl font-bold ${dateColorClass}`}>
                  {dayDate.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 타임라인 기록 리스트 섹션 */}
      <div className="space-y-3 sm:space-y-4">
        {logs.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-12 text-center text-neutral-500 text-base sm:text-xl">
            등록된 기록이 없습니다. 상단 아이콘을 눌러 새로운 기록을 추가해보세요!
          </div>
        ) : (
          logs.map((log) => {
            const matchedCatConfig = categories.find(c => log.type && log.type.includes(c.name));
            let unitText = '';
            if (matchedCatConfig) {
              const cfg = getDetailConfig(matchedCatConfig.name);
              unitText = cfg.unit;
            }

            return (
              <div 
                key={log.id} 
                onClick={() => handleOpenEditModal(log)}
                className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 flex items-center justify-between shadow-sm hover:shadow-md hover:border-neutral-300 transition cursor-pointer gap-2"
              >
                <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
                  <span className="text-sm sm:text-xl text-neutral-600 font-bold min-w-[65px] sm:min-w-[85px] shrink-0">
                    {log.time}
                  </span>
                  {renderCategoryIcon(log.type, "w-12 h-12 sm:w-16 sm:h-16")}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-bold text-neutral-800 text-lg sm:text-2xl">{log.type}</span>
                      {log.detail && (
                        <span className="text-xs sm:text-lg bg-orange-100 text-orange-800 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-md font-semibold">
                          {log.detail}{unitText}
                        </span>
                      )}
                    </div>
                    {log.memo && <p className="text-neutral-600 text-xs sm:text-lg mt-1 truncate">{log.memo}</p>}
                  </div>
                </div>
                <div className="flex items-center shrink-0">
                  <button
                    onClick={(e) => handleDelete(log.id, e)}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm sm:text-xl font-bold rounded-xl transition cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 작성/수정 모달 팝업 */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-800 flex items-center gap-2">
                <span>🐾</span> [{selectedType}] {editingId ? '기록 수정' : '기록 작성'}
              </h3>
              <button 
                onClick={() => setIsOpenModal(false)}
                className="text-neutral-400 hover:text-neutral-600 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-base sm:text-lg font-medium text-neutral-700 mb-1.5">
                  시간 선택 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-800 bg-white text-base sm:text-xl"
                />
              </div>

              <div>
                <label className="block text-base sm:text-lg font-medium text-neutral-700 mb-1.5">
                  {detailConfig.label}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder={detailConfig.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-800 pr-12 text-base sm:text-xl"
                  />
                  {detailConfig.unit && (
                    <span className="absolute right-4 text-neutral-400 text-sm sm:text-base font-semibold">
                      {detailConfig.unit}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base sm:text-lg font-medium text-neutral-700 mb-1.5">메모 및 특이사항 (선택)</label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="특이사항이나 상태를 입력하세요"
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-800 text-sm sm:text-base"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-600 hover:bg-neutral-100 transition font-medium text-base sm:text-xl cursor-pointer"
                >
                  취소하기
                </button>
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white transition font-medium text-base sm:text-xl cursor-pointer shadow-sm"
                >
                  {editingId ? '수정완료' : '작성완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLog;