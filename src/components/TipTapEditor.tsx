import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Image from '@tiptap/extension-image';
import { LinkIcon, Bold, Italic, List, ListOrdered, Quote, Undo, Redo, YoutubeIcon, ImageIcon } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 타입 정의
interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

// 에디터 컴포넌트
const TipTapEditor: React.FC<TipTapEditorProps> = ({ content, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Youtube.configure({
        nocookie: true,
        HTMLAttributes: {
          class: 'w-full max-w-2xl mx-auto aspect-video rounded-lg',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 부모 상태와 에디터 내용 동기화
  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  // 이미지 삽입
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const storage = getStorage();
      // 유니크한 파일명 생성
      const fileName = `images/${new Date().getTime()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // 파일 업로드
      await uploadBytes(storageRef, file);

      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(storageRef);

      // 에디터에 이미지 삽입
      editor.chain().focus().setImage({ src: downloadURL }).run();
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
    }
  }, [editor]);

  // YouTube 영상 삽입
  const insertYouTube = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('YouTube URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  // 링크 삽입
  const insertLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href || '';
    const url = window.prompt('링크 URL을 입력하세요:', previous);
    if (!url) return;
    let finalUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    try {
      new URL(finalUrl);
    } catch {
      alert('올바른 URL 형식이 아닙니다.');
      return;
    }
    const { from, to } = editor.state.selection;
    if (from === to) {
      editor.chain().focus().insertContent(`<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${finalUrl}</a> `).run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl, target: '_blank' }).run();
    }
  }, [editor]);

  // 메뉴바
  const MenuBar = () => {
    if (!editor) return null;
    const btn = (active: boolean) => `p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${active ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' : 'text-gray-600 dark:text-gray-400'}`;
    
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 p-3 flex gap-2 flex-wrap bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-1">
          <button 
            type="button" 
            onMouseDown={(e) => {
              e.preventDefault(); // 기본 동작 방지
              editor.chain().focus().toggleBold().run();
            }} 
            className={btn(editor.isActive('bold'))} 
            title="굵게">
            <Bold size={16} />
          </button>
          <button 
            type="button" 
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleItalic().run();
            }} 
            className={btn(editor.isActive('italic'))} 
            title="기울임">
            <Italic size={16} />
          </button>
        </div>
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
        <div className="flex gap-1">
          <button 
            type="button" 
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBulletList().run();
            }} 
            className={btn(editor.isActive('bulletList'))} 
            title="글머리 기호">
            <List size={16} />
          </button>
          <button 
            type="button" 
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
            }} 
            className={btn(editor.isActive('orderedList'))} 
            title="번호 매기기">
            <ListOrdered size={16} />
          </button>
          <button 
            type="button" 
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBlockquote().run();
            }} 
            className={btn(editor.isActive('blockquote'))} 
            title="인용문">
            <Quote size={16} />
          </button>
        </div>
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
        <div className="flex gap-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertYouTube();
            }}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="YouTube 영상 추가"
          >
            <YoutubeIcon size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
            title="이미지 추가"
          >
            <ImageIcon size={16} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertLink();
            }}
            className={btn(editor.isActive('link'))}
            title="링크 추가"
          >
            <LinkIcon size={16} />
          </button>
        </div>
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
        <div className="flex gap-1">
          <button 
            type="button" 
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().undo().run();
            }} 
            disabled={!editor.can().undo()} 
            className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${!editor.can().undo() ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400'}`} 
            title="실행 취소">
            <Undo size={16} />
          </button>
          <button 
            type="button" 
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().redo().run();
            }} 
            disabled={!editor.can().redo()} 
            className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${!editor.can().redo() ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400'}`} 
            title="다시 실행">
            <Redo size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (!editor) {
    return <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">에디터 로딩 중...</div>;
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      <MenuBar />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <div className="p-4">
        <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] focus:outline-none text-gray-900 dark:text-gray-100" />
      </div>
    </div>
  );
};

export default TipTapEditor;
