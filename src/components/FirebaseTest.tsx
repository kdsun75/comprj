import React, { useEffect, useState } from 'react';
import { realtimeDb } from '../firebase/config';
import { ref, set, get } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';

const FirebaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { currentUser } = useAuth();
  const { addTestChat, openChats, openChat } = useChatContext();

  const addLog = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebaseConnection = async () => {
    addLog('Firebase 연결 테스트 시작...');
    
    try {
      // 1. Firebase Config 확인
      addLog(`Firebase Config - databaseURL: ${process.env.REACT_APP_FIREBASE_DATABASE_URL || '미설정'}`);
      
      // 2. Realtime Database 인스턴스 확인
      if (!realtimeDb) {
        addLog('❌ Realtime Database 인스턴스가 없습니다.');
        return;
      }
      addLog('✅ Realtime Database 인스턴스 확인됨');

      // 3. 현재 사용자 확인
      if (!currentUser) {
        addLog('❌ 사용자가 로그인되지 않았습니다.');
        return;
      }
      addLog(`✅ 사용자 로그인됨: ${currentUser.uid}`);

      // 4. 테스트 데이터 쓰기
      const testRef = ref(realtimeDb, `test/${currentUser.uid}`);
      await set(testRef, {
        message: 'Hello Firebase!',
        timestamp: Date.now()
      });
      addLog('✅ 테스트 데이터 쓰기 성공');

      // 5. 테스트 데이터 읽기
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        addLog('✅ 테스트 데이터 읽기 성공');
        addLog(`데이터: ${JSON.stringify(snapshot.val())}`);
      } else {
        addLog('❌ 테스트 데이터 읽기 실패 - 데이터가 존재하지 않음');
      }

      // 6. 채팅방 생성 테스트
      const chatId = 'test_chat_123';
      const chatRef = ref(realtimeDb, `chats/${chatId}`);
      await set(chatRef, {
        participants: {
          [currentUser.uid]: true,
          'test_user': true
        },
        createdAt: Date.now()
      });
      addLog('✅ 채팅방 생성 테스트 성공');

    } catch (error) {
      addLog(`❌ 오류 발생: ${error}`);
      console.error('Firebase 테스트 오류:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      testFirebaseConnection();
    }
  }, [currentUser]);

  return (
    <div className="fixed top-4 right-4 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Firebase 연결 테스트</h3>
        <button 
          onClick={() => setTestResults([])}
          className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
        >
          Clear
        </button>
      </div>
      
      <div className="space-y-1 text-xs">
        {testResults.map((result, index) => (
          <div 
            key={index} 
            className={`p-2 rounded ${
              result.includes('❌') 
                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                : result.includes('✅')
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {result}
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <button 
          onClick={testFirebaseConnection}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          테스트 다시 실행
        </button>
        
        <button
          onClick={() => {
            console.log('테스트 채팅창 버튼 클릭됨');
            console.log('현재 openChats 길이:', openChats.length);
            addTestChat();
          }}
          className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          테스트 채팅창 강제 추가 (빨간색 채팅창)
        </button>
        
        <button
          onClick={async () => {
            console.log('🧪 실제 openChat 함수 테스트 시작');
            try {
              await openChat(
                'test-other-user-123', // 다른 테스트 사용자 ID
                '테스트 상대방',
                undefined
              );
              console.log('✅ openChat 함수 테스트 완료');
            } catch (error) {
              console.error('❌ openChat 함수 테스트 실패:', error);
            }
          }}
          className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
        >
          실제 openChat 함수 테스트 (다른 사용자)
        </button>
        
        <button
          onClick={() => {
            console.log('🔧 직접 상태 확인');
            console.log('현재 openChats:', openChats);
            console.log('openChats 길이:', openChats.length);
            console.log('React 컴포넌트 리렌더링 시간:', new Date().toISOString());
          }}
          className="w-full px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
        >
          현재 상태 확인
        </button>
        
        <button
          onClick={async () => {
            console.log('🧬 간단한 Promise 테스트');
            try {
              const testPromise = new Promise((resolve) => {
                console.log('Promise 생성됨');
                setTimeout(() => {
                  console.log('Promise 해결 중...');
                  resolve('테스트 결과');
                }, 100);
              });
              
              console.log('await 호출 직전');
              const result = await testPromise;
              console.log('await 완료! 결과:', result);
            } catch (error) {
              console.error('Promise 테스트 에러:', error);
            }
          }}
          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Promise 동작 테스트
        </button>
        
        <div className="text-xs text-gray-600 dark:text-gray-400">
          현재 열린 채팅창 수: {openChats.length}
        </div>
      </div>
    </div>
  );
};

export default FirebaseTest; 