import React, { useState, useEffect } from 'react';
import { ExternalLink, X, Globe } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
  onRemove?: () => void;
  className?: string;
}

interface MetaData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ url, onRemove, className = '' }) => {
  const [metadata, setMetadata] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // URL 유효성 검사
        let validUrl: URL;
        try {
          validUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
        } catch {
          throw new Error('Invalid URL');
        }

        const domain = validUrl.hostname;
        
        // YouTube 링크 특별 처리
        if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
          let videoId = '';
          if (domain.includes('youtube.com')) {
            const urlParams = new URLSearchParams(validUrl.search);
            videoId = urlParams.get('v') || '';
          } else if (domain.includes('youtu.be')) {
            videoId = validUrl.pathname.slice(1);
          }
          
          if (videoId) {
            setMetadata({
              title: `YouTube 동영상`,
              description: `유튜브에서 시청하기`,
              image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              siteName: 'YouTube'
            });
          } else {
            throw new Error('Invalid YouTube URL');
          }
        } else if (domain.includes('github.com')) {
          // GitHub 링크 특별 처리
          setMetadata({
            title: `GitHub - ${validUrl.pathname}`,
            description: `GitHub 저장소 또는 페이지`,
            siteName: 'GitHub'
          });
        } else if (domain.includes('medium.com') || domain.includes('blog')) {
          // 블로그 링크 처리
          setMetadata({
            title: `블로그 포스트`,
            description: domain,
            siteName: domain
          });
        } else {
          // 일반 링크의 경우 도메인 정보만 표시
          setMetadata({
            title: domain.replace('www.', ''),
            description: `${domain}에서 더 보기`,
            siteName: domain.replace('www.', '')
          });
        }
      } catch (err) {
        console.error('메타데이터 가져오기 실패:', err);
        setError(true);
        
        // 에러가 발생해도 기본 정보는 표시
        try {
          const fallbackUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
          setMetadata({
            title: fallbackUrl.hostname.replace('www.', ''),
            description: '링크를 열어 내용을 확인하세요',
          });
        } catch {
          setMetadata({
            title: url,
            description: '링크 미리보기를 가져올 수 없습니다.',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchMetadata();
    }
  }, [url]);

  const handleClick = () => {
    try {
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('링크 열기 실패:', error);
      alert('올바르지 않은 링크입니다.');
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="flex space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !metadata) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Globe className="text-red-500" size={16} />
            <span className="text-red-700 text-sm">링크 미리보기를 불러올 수 없습니다</span>
          </div>
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors cursor-pointer ${className}`}>
      <div className="flex" onClick={handleClick}>
        {metadata?.image && (
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={metadata.image}
              alt={metadata.title || 'Link preview'}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              {metadata?.siteName && (
                <div className="text-xs text-gray-500 mb-1">{metadata.siteName}</div>
              )}
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                {metadata?.title || url}
              </h4>
              {metadata?.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {metadata.description}
                </p>
              )}
            </div>
            <div className="flex space-x-2 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="text-gray-500 hover:text-blue-600 transition-colors"
                title="링크 열기"
              >
                <ExternalLink size={14} />
              </button>
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                  title="미리보기 제거"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400 truncate">
            {(() => {
              try {
                return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
              } catch {
                return url;
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkPreview; 