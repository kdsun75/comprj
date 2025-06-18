import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
  // 설문조사 데이터
  surveyCompleted: boolean;
  personalInfo?: {
    age?: string;
    gender?: string;
    occupation?: string;
    interests?: string[];
    experience?: string;
    goals?: string[];
  };
}

class AuthService {
  // 현재 사용자 상태 관찰
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // 이메일/비밀번호로 회원가입
  async signUpWithEmail(email: string, password: string, displayName: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 프로필 업데이트
      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      // Firestore에 사용자 프로필 생성
      await this.createUserProfile(userCredential.user, { displayName });
      
      return userCredential;
    } catch (error) {
      console.error('회원가입 오류:', error);
      throw this.handleAuthError(error);
    }
  }

  // 이메일/비밀번호로 로그인
  async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error('로그인 오류:', error);
      throw this.handleAuthError(error);
    }
  }

  // Google로 로그인
  async signInWithGoogle(): Promise<UserCredential> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // 새 사용자인지 확인
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await this.createUserProfile(result.user);
      }
      
      return result;
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      throw this.handleAuthError(error);
    }
  }

  // 로그아웃
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw error;
    }
  }

  // 비밀번호 재설정
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      throw this.handleAuthError(error);
    }
  }

  // 사용자 프로필 생성
  async createUserProfile(user: User, additionalData?: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || additionalData?.displayName || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          surveyCompleted: false,
          ...additionalData
        };
        if (user.photoURL) {
          (userProfile as any).photoURL = user.photoURL;
        }

        await setDoc(userRef, userProfile);
      }
    } catch (error) {
      console.error('사용자 프로필 생성 오류:', error);
      throw error;
    }
  }

  // 사용자 프로필 조회
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('사용자 프로필 조회 오류:', error);
      throw error;
    }
  }

  // 설문조사 데이터 저장
  async saveSurveyData(uid: string, surveyData: UserProfile['personalInfo']): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        personalInfo: surveyData,
        surveyCompleted: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('설문조사 저장 오류:', error);
      throw error;
    }
  }

  // 에러 처리
  private handleAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/user-not-found':
        return new Error('등록되지 않은 이메일입니다.');
      case 'auth/wrong-password':
        return new Error('비밀번호가 올바르지 않습니다.');
      case 'auth/email-already-in-use':
        return new Error('이미 사용 중인 이메일입니다.');
      case 'auth/weak-password':
        return new Error('비밀번호는 6자 이상이어야 합니다.');
      case 'auth/invalid-email':
        return new Error('유효하지 않은 이메일 형식입니다.');
      case 'auth/popup-closed-by-user':
        return new Error('로그인이 취소되었습니다.');
      case 'auth/cancelled-popup-request':
        return new Error('이미 진행 중인 로그인이 있습니다.');
      default:
        return new Error('인증 중 오류가 발생했습니다.');
    }
  }
}

export const authService = new AuthService();
export default authService; 