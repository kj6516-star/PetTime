import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js'; // 프로젝트의 supabase client 경로에 맞게 수정해주세요

export default function PhotoGallery() {
  const [pets, setPets] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('all');
  
  // 모달 및 입력 폼 상태
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null); // 실제 파일 객체
  const [imagePreview, setImagePreview] = useState('');
  const [targetPetId, setTargetPetId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Supabase에서 펫 목록 및 사진 데이터 불러오기
  useEffect(() => {
    fetchPetsAndPhotos();
  }, []);

  const fetchPetsAndPhotos = async () => {
    try {
      // 펫 목록 불러오기
      const { data: petData, error: petError } = await supabase.from('pets').select('*');
      if (petError) throw petError;
      
      setPets(petData || []);
      if (petData && petData.length > 0) {
        setTargetPetId(petData[0].id);
      }

      // 사진 게시물 불러오기 (최신순 정렬)
      const { data: photoData, error: photoError } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (photoError) throw photoError;
      setPhotos(photoData || []);

    } catch (error) {
      console.error('데이터를 불러오는 중 오류 발생:', error.message);
    }
  };

  // 2. 이미지 파일 선택 및 미리보기 핸들러
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 3. Supabase Storage에 이미지 업로드 및 DB Insert
  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert('업로드할 사진을 선택해주세요!');
      return;
    }

    setIsLoading(true);

    try {
      const fileExt = imageFile?.name?.includes('.') 
        ? imageFile.name.split('.').pop() 
        : 'jpg';
      
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Supabase Storage에 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from('pet-photos') 
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 업로드된 파일의 Public URL 가져오기
      const { data: publicUrlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // Supabase 'photos' 테이블에 데이터 저장
      const todayStr = new Date().toISOString().split('T')[0];
      const newPhotoPayload = {
        pet_id: targetPetId,
        image_url: imageUrl,
        caption: caption || '소중한 추억 🐾',
        date: todayStr,
        likes: 0
      };

      const { data, error: insertError } = await supabase
        .from('photos')
        .insert([newPhotoPayload])
        .select();

      if (insertError) throw insertError;

      if (data) {
        setPhotos([data[0], ...photos]);
      }

      setImageFile(null);
      setImagePreview('');
      setCaption('');
      setIsModalOpen(false);
      alert('게시물이 성공적으로 등록되었습니다! ✨');

    } catch (error) {
      console.error('게시물 등록 실패:', error.message);
      alert('게시물 등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Supabase에서 게시물 삭제
  const handleDeletePhoto = async (id) => {
    if (window.confirm('이 게시물을 삭제하시겠습니까?')) {
      try {
        const { error } = await supabase
          .from('photos')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setPhotos(photos.filter(p => p.id !== id));
        setActivePhoto(null);
        alert('삭제되었습니다.');
      } catch (error) {
        console.error('삭제 실패:', error.message);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const filteredPhotos = selectedPetId === 'all' 
    ? photos 
    : photos.filter(p => String(p.pet_id) === String(selectedPetId));

  const activePet = pets.find(p => String(p.id) === String(selectedPetId));

  const profileImageSrc = selectedPetId === 'all'
    ? (photos[0]?.image_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop")
    : (activePet?.avatar || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop");

  return (
    <div className="bg-[#FFFDF9] min-h-screen pb-20 text-neutral-800 font-sans">
      
      {/* 🌟 상단 인스타 프로필 영역 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-6 sm:pb-8 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
          
          {/* 프로필 이미지 */}
          <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shrink-0 shadow-sm">
            <div className="w-full h-full rounded-full bg-[#FFFDF9] p-[2px] overflow-hidden">
              <img 
                src={profileImageSrc} 
                alt="프로필" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

          {/* 프로필 상세 정보 */}
          <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 truncate max-w-[260px]">
                {selectedPetId === 'all' ? 'pet_stagram_official' : `${activePet?.name.toLowerCase()}_pet`}
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition shadow-sm cursor-pointer"
              >
                사진 추가하기
              </button>
            </div>

            <div className="flex justify-center sm:justify-start gap-6 sm:gap-8 text-sm sm:text-base text-neutral-700">
              <div><span className="font-bold text-neutral-900">{photos.length}</span> 게시물</div>
              <div><span className="font-bold text-neutral-900">128</span> 팔로워</div>
              <div><span className="font-bold text-neutral-900">102</span> 팔로잉</div>
            </div>

            <div>
              <p className="font-bold text-base sm:text-lg text-neutral-900">
                {selectedPetId === 'all' ? '🐾 우리 집 귀염둥이들 일상 아카이브' : `${activePet?.name} (${activePet?.breed})`}
              </p>
            </div>
          </div>
        </div>

        {/* 펫 필터 스토리 탭 */}
        <div className="flex gap-4 sm:gap-6 mt-6 sm:mt-8 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
          <button
            onClick={() => setSelectedPetId('all')}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
          >
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] ${selectedPetId === 'all' ? 'bg-neutral-900' : 'bg-neutral-300'}`}>
              <div className="w-full h-full rounded-full bg-white p-[2px] overflow-hidden">
                <img 
                  src={photos[0]?.image_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop"} 
                  alt="전체" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-800">전체보기</span>
          </button>

          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetId(pet.id)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] ${String(selectedPetId) === String(pet.id) ? 'bg-neutral-900' : 'bg-neutral-300'}`}>
                <div className="w-full h-full rounded-full bg-white p-[2px] overflow-hidden">
                  <img src={pet.avatar || "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=200&auto=format&fit=crop"} alt={pet.name} className="w-full h-full object-cover rounded-full" />
                </div>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-neutral-800">{pet.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 게시물 탭 헤더 */}
      <div className="max-w-4xl mx-auto flex justify-center border-t border-neutral-200">
        <div className="flex items-center gap-2 py-3 sm:py-4 border-t-2 border-neutral-900 -mt-[1px] text-sm sm:text-base font-bold tracking-widest text-neutral-900">
          <span>❖</span> 게시물 ({filteredPhotos.length})
        </div>
      </div>

      {/* 🌟 3열 그리드 */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-16 sm:py-20 text-neutral-400">
            <p className="text-3xl sm:text-4xl mb-2">📷</p>
            <p className="text-sm font-medium">게시된 사진이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-3">
            {filteredPhotos.map(photo => {
              const pet = pets.find(p => String(p.id) === String(photo.pet_id));
              return (
                <div 
                  key={photo.id} 
                  onClick={() => setActivePhoto({ ...photo, petName: pet?.name || '반려견', image: photo.image_url })}
                  className="relative aspect-square bg-neutral-100 overflow-hidden group cursor-pointer rounded-sm"
                >
                  <img 
                    src={photo.image_url} 
                    alt="포토" 
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
                  />
                  
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 text-white font-bold text-sm sm:text-base">
                    <span>❤️</span> 
                    <span>{photo.likes || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 새 게시물 작성 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold">새 게시물 만들기</span>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-900 font-bold text-base">✕</button>
            </div>

            <form onSubmit={handleAddPhoto} className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col items-center justify-center">
                <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-xl bg-neutral-50 border-2 border-dashed border-neutral-200 overflow-hidden flex items-center justify-center relative mb-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs sm:text-sm text-neutral-400 text-center p-4">업로드할 사진을 선택해주세요</span>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm sm:text-base font-bold rounded-xl transition shadow-sm">
                  📁 사진 파일 선택
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-neutral-700 mb-1">반려견</label>
                  <select
                    value={targetPetId}
                    onChange={(e) => setTargetPetId(e.target.value)}
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm sm:text-base bg-neutral-50 outline-none"
                  >
                    {pets.map(pet => (
                      <option key={pet.id} value={pet.id}>{pet.name} ({pet.breed})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-neutral-700 mb-1">문구 입력</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="문구를 입력하세요..."
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm sm:text-base bg-neutral-50 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm sm:text-base font-bold text-neutral-500 hover:bg-neutral-100 rounded-xl">취소</button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-neutral-900 text-white text-sm sm:text-base font-bold rounded-xl hover:bg-neutral-800 transition disabled:opacity-50"
                >
                  {isLoading ? '업로드 중...' : '사진 추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 사진 상세 보기 팝업 */}
      {activePhoto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-2xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="relative bg-black flex items-center justify-center aspect-square">
              <img src={activePhoto.image} alt="상세" className="w-full h-full object-contain" />
              <button 
                onClick={() => setActivePhoto(null)} 
                className="absolute top-3 right-3 bg-black/60 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold hover:bg-black transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full">{activePhoto.petName}</span>
                <span className="text-xs sm:text-sm text-neutral-400">{activePhoto.date}</span>
              </div>
              <p className="text-sm sm:text-base text-neutral-800 font-medium leading-relaxed">{activePhoto.caption}</p>
              
              <div className="pt-3 border-t border-neutral-100 flex justify-between items-center">
                <button 
                  onClick={() => handleDeletePhoto(activePhoto.id)}
                  className="text-xs sm:text-sm text-red-500 font-bold hover:underline"
                >
                  게시물 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}