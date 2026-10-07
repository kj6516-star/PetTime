import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js'; // Supabase 클라이언트 불러오기

const PetProfile = () => {
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);

  const [mode, setMode] = useState('view'); 
  const [tempProfile, setTempProfile] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [breedMode, setBreedMode] = useState('select');
  const [directBreed, setDirectBreed] = useState('');

  const popularBreeds = [
    '말티즈',
    '푸들 (토이/미니어처)',
    '포메라니안',
    '치와와',
    '시츄',
    '비숑 프리제',
    '골든 리트리버',
    '웰시 코기',
    '진돗개',
    '시베리안 허스키',
    '믹스견 (기타)'
  ];

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    const { data, error } = await supabase.from('pets').select('*');
    if (error) {
      console.error('펫 목록 조회 실패:', error);
      return;
    }
    if (data && data.length > 0) {
      setPets(data);
      setSelectedPetId(prev => (prev && data.some(p => p.id === prev) ? prev : data[0].id));
    } else {
      setPets([]);
      setSelectedPetId(null);
    }
  };

  const currentPet = pets.find(p => p.id === selectedPetId) || pets[0];

  useEffect(() => {
    if (currentPet) {
      setTempProfile(currentPet);
      setImageFile(null);
      if (popularBreeds.includes(currentPet.breed)) {
        setBreedMode('select');
        setDirectBreed('');
      } else if (currentPet.breed) {
        setBreedMode('direct');
        setDirectBreed(currentPet.breed);
      } else {
        setBreedMode('select');
        setDirectBreed('');
      }
    }
  }, [selectedPetId, pets]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTempProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBreedSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'DIRECT_INPUT') {
      setBreedMode('direct');
      setDirectBreed('');
      setTempProfile(prev => ({ ...prev, breed: '' }));
    } else {
      setBreedMode('select');
      setTempProfile(prev => ({ ...prev, breed: val }));
    }
  };

  const handleDirectBreedChange = (e) => {
    const val = e.target.value;
    setDirectBreed(val);
    setTempProfile(prev => ({ ...prev, breed: val }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartCreate = () => {
    setTempProfile({
      name: '',
      birth: '',
      breed: '말티즈',
      gender: '수컷',
      isNeutered: false,
      weight: '',
      avatar: ''
    });
    setImageFile(null);
    setBreedMode('select');
    setDirectBreed('');
    setMode('create');
  };

  const handleStartEdit = () => {
    setTempProfile(currentPet);
    setImageFile(null);
    if (popularBreeds.includes(currentPet.breed)) {
      setBreedMode('select');
    } else {
      setBreedMode('direct');
      setDirectBreed(currentPet.breed);
    }
    setMode('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!tempProfile.name || !tempProfile.name.trim()) {
      alert('강아지 이름을 입력해주세요!');
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl = tempProfile.avatar;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `avatar_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('pet-photos')
          .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl;
      }

      const payload = {
        name: tempProfile.name.trim(),
        breed: tempProfile.breed || '믹스견',
        weight: tempProfile.weight ? parseFloat(tempProfile.weight) : null,
        avatar: avatarUrl || '',
        birth: tempProfile.birth || null,
        gender: tempProfile.gender || '수컷',
        isNeutered: tempProfile.isNeutered ?? false
      };

      if (mode === 'create') {
        const { data, error } = await supabase
          .from('pets')
          .insert([payload])
          .select();

        if (error) throw error;

        alert('새로운 반려견이 등록되었습니다! 🐾');
        await fetchPets();
        if (data && data[0]) {
          setSelectedPetId(data[0].id);
        }
      } else {
        const { error } = await supabase
          .from('pets')
          .update(payload)
          .eq('id', currentPet.id);

        if (error) throw error;

        alert('반려견 프로필이 수정되었습니다! 🐾');
        await fetchPets();
      }
      setMode('view');
    } catch (error) {
      console.error('반려견 정보 저장 실패:', error.message);
      alert('저장에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (pets.length <= 1) {
      alert('최소 한 마리의 반려견 프로필은 유지되어야 합니다.');
      return;
    }
    if (window.confirm('정말 이 반려견 프로필을 삭제하시겠습니까? (관련된 일일 기록도 함께 삭제될 수 있습니다)')) {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('반려견 삭제 실패:', error);
        alert('삭제에 실패했습니다.');
        return;
      }

      await fetchPets();
    }
  };

  const handleCancel = () => {
    setMode('view');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-[#FFFDF9] min-h-screen">
      
      {mode === 'view' && (
        <>
          {/* 상단 타이틀 */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              반려견 프로필을 선택하세요 🐾
            </h1>
            <p className="text-neutral-500 text-sm sm:text-base md:text-lg mt-2 sm:mt-3">
              관리할 반려동물을 선택하면 상세 정보와 기록을 확인할 수 있습니다.
            </p>
          </div>

          {/* 프로필 선택 그리드 */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 sm:mb-12">
            {pets.map((pet) => {
              const isSelected = selectedPetId === pet.id;
              return (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPetId(pet.id)}
                  className="group flex flex-col items-center gap-2 sm:gap-3 transition-all duration-300 cursor-pointer focus:outline-none"
                >
                  <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-md transition-all duration-300 flex items-center justify-center bg-neutral-200 ${
                    isSelected 
                      ? 'ring-4 ring-amber-400 scale-105 shadow-xl bg-orange-50' 
                      : 'group-hover:ring-4 group-hover:ring-neutral-300 group-hover:scale-102 opacity-80 group-hover:opacity-100'
                  }`}>
                    {pet.avatar ? (
                      <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl sm:text-5xl">🐶</span>
                    )}
                  </div>
                  <span className={`text-base sm:text-lg font-bold transition-colors ${
                    isSelected ? 'text-neutral-950 font-black' : 'text-neutral-500 group-hover:text-neutral-800'
                  }`}>
                    {pet.name}
                  </span>
                </button>
              );
            })}

            <button
              onClick={handleStartCreate}
              className="group flex flex-col items-center gap-2 sm:gap-3 transition-all duration-300 cursor-pointer focus:outline-none"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 group-hover:border-neutral-400 flex items-center justify-center shadow-sm transition-all group-hover:scale-102">
                <span className="text-2xl sm:text-3xl text-neutral-400 group-hover:text-neutral-600 transition-colors">➕</span>
              </div>
              <span className="text-base sm:text-lg font-semibold text-neutral-400 group-hover:text-neutral-700 transition-colors">
                프로필 추가
              </span>
            </button>
          </div>
        </>
      )}

      {/* 하단 상세 정보 카드 (또는 수정/추가 폼) */}
      <div className="bg-gradient-to-b from-white to-orange-50/30 border border-neutral-200/90 rounded-3xl p-5 sm:p-8 md:p-12 shadow-xl transition-all">
        {mode === 'view' && currentPet ? (
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* 아바타 영역 */}
            <div className="relative shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-neutral-100 border-4 border-orange-200 overflow-hidden shadow-md flex items-center justify-center">
                {currentPet.avatar ? (
                  <img src={currentPet.avatar} alt="반려견 사진" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl sm:text-6xl">🐾</span>
                )}
              </div>
            </div>

            {/* 정보 영역 */}
            <div className="flex-1 space-y-5 sm:space-y-6 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h2 className="text-3xl sm:text-4xl font-black text-neutral-950">{currentPet.name}</h2>
                  <span className="bg-orange-500 text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-base sm:text-xl font-black tracking-wide shadow-md">
                    🐾 {currentPet.breed || '품종 미등록'}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(currentPet.id)}
                  className="px-3 py-1.5 text-red-500 hover:bg-red-50 text-base sm:text-lg font-bold rounded-xl transition cursor-pointer self-center md:self-auto"
                >
                  프로필 삭제
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-orange-100/80 shadow-sm flex items-center gap-4">
                  <span className="text-2xl sm:text-3xl">🎂</span>
                  <div className="text-left overflow-hidden">
                    <span className="font-bold text-neutral-400 block text-xs sm:text-sm mb-0.5">생년월일</span>
                    <span className="font-black text-neutral-900 text-base sm:text-lg truncate block">{currentPet.birth || '미등록'}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-orange-100/80 shadow-sm flex items-center gap-4">
                  <span className="text-2xl sm:text-3xl">⚧️</span>
                  <div className="text-left overflow-hidden">
                    <span className="font-bold text-neutral-400 block text-xs sm:text-sm mb-0.5">성별</span>
                    <span className="font-black text-neutral-900 text-base sm:text-lg truncate block">
                      {currentPet.gender || '미등록'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-orange-100/80 shadow-sm flex items-center gap-4">
                  <span className="text-2xl sm:text-3xl">🩺</span>
                  <div className="text-left overflow-hidden">
                    <span className="font-bold text-neutral-400 block text-xs sm:text-sm mb-0.5">중성화 여부</span>
                    <span className="font-black text-neutral-900 text-base sm:text-lg truncate block">
                      {currentPet.isNeutered ? '완료됨 ✨' : '미완료'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-orange-100/80 shadow-sm flex items-center gap-4">
                  <span className="text-2xl sm:text-3xl">⚖️</span>
                  <div className="text-left overflow-hidden">
                    <span className="font-bold text-neutral-400 block text-xs sm:text-sm mb-0.5">체중</span>
                    <span className="font-black text-neutral-900 text-base sm:text-lg truncate block">
                      {currentPet.weight ? `${currentPet.weight} kg` : '미등록'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 sm:pt-5 flex justify-end items-center border-t border-orange-100/60">
                <button
                  onClick={handleStartEdit}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition cursor-pointer text-base sm:text-lg shadow-md"
                >
                  프로필 수정하기
                </button>
              </div>
            </div>
          </div>
        ) : mode === 'view' && !currentPet ? (
          <div className="text-center py-10 text-neutral-500 text-base sm:text-lg">
            등록된 반려견 프로필이 없습니다. 위쪽의 [프로필 추가] 버튼을 눌러 등록해주세요!
          </div>
        ) : (
          /* [추가 / 수정 모드 폼] */
          <form onSubmit={handleSave} className="space-y-6">
            <div className="text-center font-black text-2xl sm:text-3xl text-neutral-900 mb-6">
              {mode === 'create' ? '✨ 새로운 반려견 등록하기' : '✏️ 반려견 프로필 수정하기'}
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-neutral-100 border-4 border-orange-100 overflow-hidden flex items-center justify-center relative shadow-inner">
                {tempProfile.avatar ? (
                  <img src={tempProfile.avatar} alt="미리보기" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">🐾</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                <label className="cursor-pointer px-4 sm:px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm sm:text-base font-bold rounded-xl transition shadow-sm flex items-center gap-2">
                  📷 사진 촬영
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                </label>
                <label className="cursor-pointer px-4 sm:px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm sm:text-base font-bold rounded-xl transition flex items-center gap-2">
                  🖼️ 앨범 선택
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm sm:text-base font-bold text-neutral-800 mb-1.5">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={tempProfile.name || ''}
                  onChange={handleChange}
                  placeholder="예: 초코"
                  className="w-full px-4 py-3 text-base sm:text-lg rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-neutral-800 mb-1.5">품종</label>
                {breedMode === 'select' ? (
                  <div className="flex gap-2">
                    <select
                      value={popularBreeds.includes(tempProfile.breed) ? tempProfile.breed : ''}
                      onChange={handleBreedSelectChange}
                      className="w-full px-4 py-3 text-base rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    >
                      <option value="">품종을 선택하세요</option>
                      {popularBreeds.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="DIRECT_INPUT">➕ 직접 입력하기</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={directBreed}
                      onChange={handleDirectBreedChange}
                      placeholder="품종 직접 입력"
                      className="w-full px-4 py-3 text-base rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setBreedMode('select')}
                      className="px-3 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-bold rounded-xl whitespace-nowrap transition"
                    >
                      목록선택
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-neutral-800 mb-1.5">생년월일</label>
                <input
                  type="date"
                  name="birth"
                  value={tempProfile.birth || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base sm:text-lg rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-neutral-800 mb-1.5">몸무게 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={tempProfile.weight || ''}
                  onChange={handleChange}
                  placeholder="예: 3.5"
                  className="w-full px-4 py-3 text-base sm:text-lg rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-bold text-neutral-800 mb-1.5">성별</label>
                <select
                  name="gender"
                  value={tempProfile.gender || '수컷'}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base sm:text-lg rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                >
                  <option value="수컷">수컷</option>
                  <option value="암컷">암컷</option>
                </select>
              </div>

              <div className="flex items-center pt-2 sm:pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isNeutered"
                    checked={!!tempProfile.isNeutered}
                    onChange={handleChange}
                    className="w-5 h-5 sm:w-6 sm:h-6 accent-neutral-900 rounded cursor-pointer"
                  />
                  <span className="text-base sm:text-lg font-bold text-neutral-800">중성화 수술 완료</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-3 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition font-bold cursor-pointer text-base sm:text-lg"
              >
                취소하기
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white transition font-bold cursor-pointer text-base sm:text-lg shadow-md disabled:opacity-50"
              >
                {isLoading ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PetProfile;