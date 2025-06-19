import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import { updateProfile } from 'firebase/auth';

export interface ProfileImageUploadResult {
  photoURL: string;
  success: boolean;
  message: string;
}

class ProfileImageService {
  // 지원하는 이미지 형식
  private allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  // 최대 파일 크기 (10MB)
  private maxFileSize = 10 * 1024 * 1024;

  // 파일 유효성 검사
  validateFile(file: File): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: '파일을 선택해주세요.' };
    }

    if (!this.allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'JPEG, PNG, WebP, GIF 형식만 지원됩니다.' 
      };
    }

    if (file.size > this.maxFileSize) {
      return { 
        isValid: false, 
        error: '파일 크기는 10MB 이하여야 합니다.' 
      };
    }

    return { isValid: true };
  }

  // 기존 프로필 이미지 삭제 (구글 프로필 이미지 제외)
  async deleteExistingImage(userId: string, currentPhotoURL?: string): Promise<void> {
    if (!currentPhotoURL) return;

    // 구글 프로필 이미지는 삭제하지 않음
    if (currentPhotoURL.includes('googleusercontent.com') || 
        currentPhotoURL.includes('googleapis.com')) {
      console.log('구글 프로필 이미지는 삭제하지 않습니다.');
      return;
    }

    // Firebase Storage의 이미지인 경우에만 삭제
    if (currentPhotoURL.includes('firebase') && currentPhotoURL.includes(userId)) {
      try {
        const imageRef = ref(storage, `profile-images/${userId}`);
        await deleteObject(imageRef);
        console.log('기존 프로필 이미지가 삭제되었습니다.');
      } catch (error) {
        console.error('기존 이미지 삭제 중 오류:', error);
        // 삭제 실패해도 새 이미지 업로드는 계속 진행
      }
    }
  }

  // 프로필 이미지 업로드
  async uploadProfileImage(
    file: File, 
    userId: string, 
    currentPhotoURL?: string
  ): Promise<ProfileImageUploadResult> {
    try {
      // 파일 유효성 검사
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          photoURL: '',
          success: false,
          message: validation.error || '파일이 유효하지 않습니다.'
        };
      }

      // 기존 이미지 삭제 (구글 프로필 이미지 제외)
      await this.deleteExistingImage(userId, currentPhotoURL);

      // 새 이미지 업로드
      const imageRef = ref(storage, `profile-images/${userId}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('프로필 이미지 업로드 성공:', downloadURL);

      return {
        photoURL: downloadURL,
        success: true,
        message: '프로필 이미지가 성공적으로 업로드되었습니다.'
      };

    } catch (error) {
      console.error('프로필 이미지 업로드 중 오류:', error);
      return {
        photoURL: '',
        success: false,
        message: '이미지 업로드 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 프로필 이미지 업데이트 (Firebase Auth + Firestore)
  async updateUserProfileImage(
    user: any, 
    photoURL: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Firebase Auth 프로필 업데이트
      await updateProfile(user, { photoURL });

      // Firestore 문서 업데이트
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL,
        updatedAt: new Date()
      });

      console.log('사용자 프로필 이미지 업데이트 완료');

      return {
        success: true,
        message: '프로필 이미지가 성공적으로 변경되었습니다.'
      };

    } catch (error) {
      console.error('프로필 이미지 업데이트 중 오류:', error);
      return {
        success: false,
        message: '프로필 업데이트 중 오류가 발생했습니다.'
      };
    }
  }

  // 프로필 이미지 삭제 (기본 이미지로 변경)
  async deleteProfileImage(
    user: any, 
    currentPhotoURL?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 기존 이미지 삭제 (구글 프로필 이미지 제외)
      await this.deleteExistingImage(user.uid, currentPhotoURL);

      // Firebase Auth 프로필에서 photoURL 제거
      await updateProfile(user, { photoURL: null });

      // Firestore 문서에서 photoURL 제거
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: null,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: '프로필 이미지가 삭제되었습니다.'
      };

    } catch (error) {
      console.error('프로필 이미지 삭제 중 오류:', error);
      return {
        success: false,
        message: '프로필 이미지 삭제 중 오류가 발생했습니다.'
      };
    }
  }

  // 현재 사용자 프로필 이미지 URL 가져오기
  async getCurrentProfileImage(userId: string): Promise<string | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.photoURL || null;
      }
      
      return null;
    } catch (error) {
      console.error('프로필 이미지 조회 중 오류:', error);
      return null;
    }
  }

  // 이미지 파일을 Base64로 미리보기용 URL 생성
  generatePreviewURL(file: File): string {
    return URL.createObjectURL(file);
  }

  // 미리보기 URL 메모리 해제
  revokePreviewURL(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const profileImageService = new ProfileImageService();
export default profileImageService; 