import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';

interface ProfileAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showOnlineStatus?: boolean;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  size = 'md',
  className = '',
  showOnlineStatus = false
}) => {
  const { currentUser } = useAuth();
  const [profileImageURL, setProfileImageURL] = useState<string | null>(null);

  // 크기별 스타일
  const sizeStyles = {
    xs: {
      container: 'w-6 h-6',
      icon: 'w-3 h-3',
      status: 'w-2 h-2'
    },
    sm: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      status: 'w-3 h-3'
    },
    md: {
      container: 'w-10 h-10',
      icon: 'w-5 h-5',
      status: 'w-3 h-3'
    },
    lg: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      status: 'w-4 h-4'
    }
  };

  const styles = sizeStyles[size];

  // Firestore에서 사용자 프로필 이미지 실시간 구독
  useEffect(() => {
    if (!currentUser?.uid) {
      setProfileImageURL(null);
      return;
    }

    // 초기값 설정 (Firebase Auth에서)
    setProfileImageURL(currentUser.photoURL);

    // Firestore에서 실시간 업데이트 구독
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const firestorePhotoURL = userData.photoURL;
        
        // Firestore의 photoURL이 있으면 사용, 없으면 Firebase Auth의 photoURL 사용
        setProfileImageURL(firestorePhotoURL || currentUser.photoURL);
      } else {
        // Firestore 문서가 없으면 Firebase Auth의 photoURL 사용
        setProfileImageURL(currentUser.photoURL);
      }
    }, (error) => {
      console.error('프로필 이미지 구독 오류:', error);
      // 오류 발생 시 Firebase Auth의 photoURL 사용
      setProfileImageURL(currentUser.photoURL);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className={`${styles.container} bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center ${className}`}>
        <User className={`${styles.icon} text-gray-500 dark:text-gray-400`} />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`${styles.container} relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 ring-2 ring-white dark:ring-gray-700`}>
        {profileImageURL ? (
          <img
            src={profileImageURL}
            alt={currentUser.displayName || '프로필'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 아이콘으로 대체
              console.error('프로필 이미지 로드 실패:', profileImageURL);
              setProfileImageURL(null);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <User className={`${styles.icon} text-gray-500 dark:text-gray-400`} />
          </div>
        )}
      </div>
      
      {/* 온라인 상태 표시 */}
      {showOnlineStatus && (
        <div className={`${styles.status} absolute -bottom-0.5 -right-0.5 bg-green-400 dark:bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900`}></div>
      )}
    </div>
  );
};

export default ProfileAvatar; 