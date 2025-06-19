import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, User, Loader2, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { profileImageService } from '../../../services/profileImageService';
import Button from '../../ui/Button';

interface ProfileImageUploadProps {
  currentPhotoURL?: string;
  onImageUpdate?: (photoURL: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentPhotoURL,
  onImageUpdate,
  size = 'md',
  showUploadButton = true
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 크기별 스타일
  const sizeStyles = {
    sm: {
      container: 'w-16 h-16',
      icon: 'w-4 h-4',
      button: 'w-6 h-6',
      text: 'text-xs'
    },
    md: {
      container: 'w-24 h-24',
      icon: 'w-6 h-6',
      button: 'w-8 h-8',
      text: 'text-sm'
    },
    lg: {
      container: 'w-32 h-32',
      icon: 'w-8 h-8',
      button: 'w-10 h-10',
      text: 'text-base'
    }
  };

  const styles = sizeStyles[size];

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewURL) {
        profileImageService.revokePreviewURL(previewURL);
      }
    };
  }, [previewURL]);

  // 메시지 자동 제거
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    // 파일 유효성 검사
    const validation = profileImageService.validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || '파일이 유효하지 않습니다.');
      return;
    }

    // 이전 미리보기 URL 정리
    if (previewURL) {
      profileImageService.revokePreviewURL(previewURL);
    }

    // 새 파일 설정 및 미리보기 생성
    setSelectedFile(file);
    const preview = profileImageService.generatePreviewURL(file);
    setPreviewURL(preview);
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // 이미지 업로드
      const uploadResult = await profileImageService.uploadProfileImage(
        selectedFile,
        currentUser.uid,
        currentPhotoURL
      );

      if (!uploadResult.success) {
        setError(uploadResult.message);
        return;
      }

      // 사용자 프로필 업데이트
      const updateResult = await profileImageService.updateUserProfileImage(
        currentUser,
        uploadResult.photoURL
      );

      if (updateResult.success) {
        setSuccess(updateResult.message);
        onImageUpdate?.(uploadResult.photoURL);
        
        // 상태 초기화
        setSelectedFile(null);
        if (previewURL) {
          profileImageService.revokePreviewURL(previewURL);
          setPreviewURL(null);
        }
        
        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(updateResult.message);
      }

    } catch (error) {
      console.error('이미지 업로드 중 오류:', error);
      setError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !currentPhotoURL) return;

    if (!window.confirm('프로필 이미지를 삭제하시겠습니까?')) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await profileImageService.deleteProfileImage(
        currentUser,
        currentPhotoURL
      );

      if (result.success) {
        setSuccess(result.message);
        onImageUpdate?.(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('프로필 이미지 삭제 중 오류:', error);
      setError('이미지 삭제 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (previewURL) {
      profileImageService.revokePreviewURL(previewURL);
      setPreviewURL(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  const displayImageURL = previewURL || currentPhotoURL;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 프로필 이미지 표시 영역 */}
      <div className="relative group">
        <div className={`${styles.container} relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-lg`}>
          {displayImageURL ? (
            <img
              src={displayImageURL}
              alt="프로필 이미지"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
              <User className={`${styles.icon} text-gray-400 dark:text-gray-500`} />
            </div>
          )}
          
          {/* 호버 시 카메라 아이콘 */}
          {showUploadButton && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
          
          {/* 로딩 스피너 */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* 삭제 버튼 (현재 이미지가 있고, 구글 이미지가 아닌 경우) */}
        {currentPhotoURL && 
         !currentPhotoURL.includes('googleusercontent.com') && 
         !uploading && 
         !selectedFile && (
          <button
            onClick={handleDelete}
            className={`${styles.button} absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200`}
            title="이미지 삭제"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* 업로드 버튼들 */}
      {showUploadButton && (
        <div className="flex flex-col items-center space-y-2">
          {!selectedFile ? (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
              size="sm"
            >
              <Upload className="w-4 h-4" />
              이미지 선택
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-2"
                size="sm"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                업로드
              </Button>
              <Button
                onClick={handleCancel}
                disabled={uploading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                취소
              </Button>
            </div>
          )}
          
          <p className={`${styles.text} text-gray-500 dark:text-gray-400 text-center`}>
            JPEG, PNG, WebP, GIF (최대 10MB)
          </p>
        </div>
      )}

      {/* 메시지 표시 */}
      {error && (
        <div className="w-full max-w-sm p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:border-red-600 dark:text-red-300">
          {error}
        </div>
      )}
      
      {success && (
        <div className="w-full max-w-sm p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm dark:bg-green-900 dark:border-green-600 dark:text-green-300">
          {success}
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload; 