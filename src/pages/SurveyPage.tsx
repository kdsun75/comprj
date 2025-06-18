import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../services/authService';

const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const { saveSurveyData, currentUser } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<NonNullable<UserProfile['personalInfo']>>({
    age: '',
    gender: '',
    occupation: '',
    interests: [],
    experience: '',
    goals: []
  });

  const steps = [
    {
      title: '기본 정보',
      subtitle: '간단한 기본 정보를 알려주세요'
    },
    {
      title: '관심 분야',
      subtitle: '어떤 AI 분야에 관심이 있으신가요?'
    },
    {
      title: '경험 수준',
      subtitle: 'AI에 대한 경험 수준을 알려주세요'
    },
    {
      title: '목표',
      subtitle: '이 커뮤니티에서 이루고 싶은 목표는 무엇인가요?'
    }
  ];

  const ageOptions = [
    '18-25세', '26-30세', '31-35세', '36-40세', '41-45세', '46-50세', '50세 이상'
  ];

  const genderOptions = [
    '남성', '여성', '기타', '선택하지 않음'
  ];

  const occupationOptions = [
    '학생', '개발자', '데이터 사이언티스트', '연구원', '기획자', '마케터', 
    '디자이너', '교육자', '경영진', '프리랜서', '기타'
  ];

  const interestOptions = [
    '머신러닝', '딥러닝', '자연어처리', '컴퓨터 비전', 'AI 윤리', 
    '로보틱스', 'AI 툴', 'AI 비즈니스', 'AI 연구', 'AI 교육'
  ];

  const experienceOptions = [
    '완전 초보자', '기초 지식 보유', '어느 정도 경험', '상당한 경험', '전문가 수준'
  ];

  const goalOptions = [
    'AI 기초 학습', '실무 스킬 향상', '네트워킹', '프로젝트 협업', 
    '취업 준비', '창업 준비', '연구 논의', '최신 동향 파악'
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await saveSurveyData(surveyData);
      navigate('/');
    } catch (error) {
      console.error('설문조사 저장 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestToggle = (interest: string) => {
    if (!surveyData) return;
    
    const currentInterests = surveyData.interests || [];
    if (currentInterests.includes(interest)) {
      setSurveyData({
        ...surveyData,
        interests: currentInterests.filter(i => i !== interest)
      });
    } else {
      setSurveyData({
        ...surveyData,
        interests: [...currentInterests, interest]
      });
    }
  };

  const handleGoalToggle = (goal: string) => {
    const currentGoals = surveyData.goals || [];
    if (currentGoals.includes(goal)) {
      setSurveyData({
        ...surveyData,
        goals: currentGoals.filter(g => g !== goal)
      });
    } else {
      setSurveyData({
        ...surveyData,
        goals: [...currentGoals, goal]
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {/* 나이 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                나이대
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ageOptions.map((age) => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => setSurveyData({ ...surveyData, age })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      surveyData.age === age
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                성별
              </label>
              <div className="grid grid-cols-2 gap-3">
                {genderOptions.map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setSurveyData({ ...surveyData, gender })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      surveyData.gender === gender
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* 직업 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                직업
              </label>
              <div className="grid grid-cols-2 gap-3">
                {occupationOptions.map((occupation) => (
                  <button
                    key={occupation}
                    type="button"
                    onClick={() => setSurveyData({ ...surveyData, occupation })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      surveyData.occupation === occupation
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {occupation}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              관심 있는 분야를 모두 선택해주세요 (복수 선택 가능)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors relative ${
                    surveyData.interests?.includes(interest)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {interest}
                  {surveyData.interests?.includes(interest) && (
                    <Check className="w-4 h-4 absolute top-2 right-2 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              AI에 대한 현재 경험 수준을 선택해주세요
            </p>
            <div className="space-y-3">
              {experienceOptions.map((experience) => (
                <button
                  key={experience}
                  type="button"
                  onClick={() => setSurveyData({ ...surveyData, experience })}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    surveyData.experience === experience
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{experience}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              이 커뮤니티에서 이루고 싶은 목표를 선택해주세요 (복수 선택 가능)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {goalOptions.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleGoalToggle(goal)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors relative ${
                    surveyData.goals?.includes(goal)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {goal}
                  {surveyData.goals?.includes(goal) && (
                    <Check className="w-4 h-4 absolute top-2 right-2 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 진행 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">초기 설정</h1>
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep].subtitle}
            </p>
          </CardHeader>

          <CardContent>
            {renderStepContent()}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                className="flex items-center"
              >
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center"
              >
                {loading ? '저장 중...' : '완료'}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* 건너뛰기 옵션 */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            나중에 설정하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage; 