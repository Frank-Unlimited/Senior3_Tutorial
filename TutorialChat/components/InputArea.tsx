import React, { useRef, useState, ChangeEvent } from 'react';
import { SendIcon, PhotoIcon, XMarkIcon } from './Icon';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for Gemini (just get the base64 data)
        const base64Data = base64String.split(',')[1];
        
        const newAttachment: Attachment = {
          type: 'image',
          mimeType: file.type,
          data: base64Data,
          previewUrl: base64String
        };
        
        setAttachments(prev => [...prev, newAttachment]);
      };
      
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    
    onSend(text, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-emerald-100 px-4 py-3 z-50">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative shrink-0 group">
                <img src={att.previewUrl} alt="preview" className="h-16 w-16 rounded-xl object-cover border border-emerald-200" />
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-md hover:bg-black transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-end gap-2">
          
          <button 
            className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="Upload image"
          >
            <PhotoIcon className="w-6 h-6" />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp, image/heic"
          />

          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-[24px] px-4 py-2 focus-within:ring-2 focus-within:ring-emerald-200 focus-within:border-emerald-300 transition-all">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "生物老师正在思考..." : "输入生物问题或上传题目图片..."}
              disabled={isLoading}
              rows={1}
              className="w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none resize-none max-h-32 py-2 text-[16px] placeholder-gray-400 text-slate-800"
              style={{ minHeight: '40px' }}
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && attachments.length === 0)}
            className={`p-3 rounded-full shrink-0 transition-all duration-200 shadow-sm ${
              (text.trim() || attachments.length > 0) && !isLoading
                ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 transform hover:scale-105' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;