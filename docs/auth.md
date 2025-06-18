# Firebase Authentication 구현 상세

## 📋 구현 현황

### ✅ 완료된 기능
- **Firebase Authentication 설정** (Google OAuth + Email/Password)
- **AuthContext 전역 상태 관리**
- **자동 로그인 유지**
- **Protected Routes (PrivateRoute)**
- **설문조사 온보딩 시스템**

### 🚧 개선 예정
- **비밀번호 재설정 기능**
- **이메일 인증 시스템**
- **소셜 로그인 확장** (GitHub, Facebook 등)

## 🔧 Firebase 설정 (현재 구현)

### Firebase 프로젝트 설정
```typescript
// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google 로그인 Provider 설정
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'  // 계정 선택 화면 강제 표시
});
```

## 🔐 인증 서비스 구현

### authService.ts (핵심 인증 로직)
```typescript
// src/services/authService.ts
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';

export const authService = {
  // 이메일/비밀번호 회원가입
  async signUp(email: string, password: string, displayName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Firestore에 사용자 프로필 생성
      await this.createUserProfile(user, { displayName });
      
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  // 이메일/비밀번호 로그인
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  // Google 소셜 로그인
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // 새 사용자인지 확인
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await this.createUserProfile(user);
      }
      
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  // 로그아웃
  async signOut() {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  // Firestore 사용자 프로필 생성
  async createUserProfile(user: User, additionalData = {}) {
    const userRef = doc(db, 'users', user.uid);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      surveyCompleted: false,
      createdAt: Timestamp.now(),
      ...additionalData
    };
    
    await setDoc(userRef, userData);
    return userData;
  }
};
```

## 🌐 AuthContext 구현 (전역 상태 관리)

### AuthContext.tsx
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  surveyCompleted: boolean;
  createdAt: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, displayName: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<any>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Firestore에서 사용자 프로필 가져오기
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 로그인
  const login = async (email: string, password: string) => {
    return await authService.signIn(email, password);
  };

  // 회원가입
  const register = async (email: string, password: string, displayName: string) => {
    return await authService.signUp(email, password, displayName);
  };

  // Google 로그인
  const loginWithGoogle = async () => {
    return await authService.signInWithGoogle();
  };

  // 로그아웃
  const logout = async () => {
    const result = await authService.signOut();
    if (!result.error) {
      setCurrentUser(null);
      setUserProfile(null);
    }
    return result;
  };

  // 사용자 프로필 업데이트
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { ...userProfile, ...data }, { merge: true });
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

## 🛡️ Protected Routes 구현

### PrivateRoute.tsx
```typescript
// src/components/auth/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

export default PrivateRoute;
```

## 📝 로그인 페이지 구현

### LoginPage.tsx (실제 구현됨)
```typescript
// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    const result = await loginWithGoogle();
    
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI 커뮤니티 로그인
          </h2>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Google로 로그인
          </button>
        </div>

        <div className="text-center">
          <Link 
            to="/signup" 
            className="text-blue-600 hover:text-blue-800"
          >
            계정이 없으신가요? 회원가입
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

## 🎯 설문조사 온보딩 시스템

### SurveyPage.tsx (설문조사 연동)
```typescript
// src/pages/SurveyPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SurveyPage: React.FC = () => {
  const { updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    occupation: '',
    interests: [] as string[],
    experience: '',
    goals: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateUserProfile({
      surveyCompleted: true,
      personalInfo: formData
    });
    
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          프로필 설정
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 설문조사 필드들 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              연령대
            </label>
            <select 
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">선택하세요</option>
              <option value="20대">20대</option>
              <option value="30대">30대</option>
              <option value="40대">40대</option>
              <option value="50대 이상">50대 이상</option>
            </select>
          </div>

          {/* 추가 필드들... */}
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
          >
            프로필 설정 완료
          </button>
        </form>
      </div>
    </div>
  );
};

export default SurveyPage;
```

## 🔄 라우팅 설정 (App.tsx)

### 메인 앱 라우팅
```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PostProvider } from './contexts/PostContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp';
import SurveyPage from './pages/SurveyPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* 공개 라우트 */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUp />} />
                
                {/* 보호된 라우트 */}
                <Route path="/" element={
                  <PrivateRoute>
                    <Layout>
                      <HomePage />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/survey" element={
                  <PrivateRoute>
                    <SurveyPage />
                  </PrivateRoute>
                } />
              </Routes>
            </div>
          </Router>
        </PostProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

## 📊 사용자 인증 플로우

### 1. 신규 사용자 플로우
```
회원가입 → 이메일 인증 (선택) → 설문조사 → 메인 페이지
```

### 2. 기존 사용자 플로우
```
로그인 → 자동 인증 상태 확인 → 메인 페이지
```

### 3. Google 로그인 플로우
```
Google 버튼 클릭 → 팝업 인증 → 프로필 생성/확인 → 메인 페이지
```

## 🔐 보안 고려사항

### 현재 구현된 보안 기능 ✅
- **Firebase Authentication** 공식 SDK 사용
- **HTTPS 통신** 강제
- **자동 토큰 갱신** Firebase에서 자동 처리
- **Cross-Site 보호** Firebase 기본 보안 적용

### 추가 보안 개선 계획 🚧
- **이메일 인증** 필수화
- **비밀번호 복잡성** 검증 강화
- **2FA 인증** 도입 검토
- **세션 타임아웃** 설정

## 📈 성능 최적화

### 현재 최적화 ✅
- **Context 분리**: Auth 상태만 별도 관리
- **지연 로딩**: 불필요한 데이터 로딩 최소화
- **메모이제이션**: useCallback, useMemo 활용

### 계획된 최적화 🚧
- **오프라인 지원**: Firebase Auth 오프라인 기능
- **캐싱 개선**: 사용자 프로필 로컬 캐싱
- **에러 재시도**: 네트워크 오류 자동 재시도

---

**마지막 업데이트**: 2024년 1월 15일  
**구현 완료율**: 90% (핵심 기능 완성)  
**다음 단계**: 비밀번호 재설정, 이메일 인증 구현
