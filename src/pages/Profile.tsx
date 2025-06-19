import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProfileImageUpload from '../components/features/profile/ProfileImageUpload';
// import { User } from 'firebase/auth';

interface UserProfile {
  displayName: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  photoURL?: string;
  createdAt: Date;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setProfile(userData);
          setCurrentPhotoURL(userData.photoURL || user.photoURL || null);
          setFormData({
            displayName: userData.displayName || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || ''
          });
        } else {
          // Firestore 문서가 없는 경우 현재 유저의 photoURL 사용
          setCurrentPhotoURL(user.photoURL || null);
        }
      } catch (err) {
        setError('프로필을 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleImageUpdate = (photoURL: string | null) => {
    setCurrentPhotoURL(photoURL);
    // 프로필 상태도 업데이트
    if (profile) {
      setProfile({ ...profile, photoURL: photoURL || undefined });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: new Date()
      });

      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
    } catch (err) {
      setError('프로필 업데이트에 실패했습니다.');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">로딩중...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">프로필</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isEditing ? '취소' : '수정'}
          </button>
        </div>

        {/* 프로필 이미지 섹션 */}
        <div className="flex flex-col items-center mb-8">
          <ProfileImageUpload
            currentPhotoURL={currentPhotoURL || undefined}
            onImageUpdate={handleImageUpdate}
            size="lg"
          />
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">이름</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">소개</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">위치</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">웹사이트</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              저장
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">이름</h2>
              <p className="text-gray-600">{profile?.displayName || '설정되지 않음'}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">이메일</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">소개</h2>
              <p className="text-gray-600">{profile?.bio || '설정되지 않음'}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">위치</h2>
              <p className="text-gray-600">{profile?.location || '설정되지 않음'}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">웹사이트</h2>
              <p className="text-gray-600">
                {profile?.website ? (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {profile.website}
                  </a>
                ) : (
                  '설정되지 않음'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">가입일</h2>
              <p className="text-gray-600">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '알 수 없음'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 