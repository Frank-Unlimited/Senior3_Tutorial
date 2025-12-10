import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { BiologyIcon } from './Icon';

interface MessageBubbleProps {
  message: Message;
  onQuickReply?: (text: string) => void;
}

// 检测消息中是否包含选择选项
const parseChoiceButtons = (content: string): { text: string; choices: { label: string; value: string }[] } | null => {
  // 匹配类似 "1️⃣ **引导式辅导**" 或 "2️⃣ **直接解答**" 的模式
  const choicePattern = /(\d️⃣)\s*\*\*([^*]+)\*\*/g;
  const matches = [...content.matchAll(choicePattern)];
  
  if (matches.length >= 2) {
    const choices = matches.map((match, index) => ({
      label: match[2].trim(),
      value: String(index + 1)
    }));
    
    // 移除选项部分，保留其他文本
    let cleanText = content;
    matches.forEach(match => {
      cleanText = cleanText.replace(match[0], '');
    });
    // 清理多余的换行和 "回复 1 或 2" 之类的提示
    cleanText = cleanText.replace(/回复\s*\d+\s*或\s*\d+[^。]*[。~]?/g, '').trim();
    
    return { text: cleanText, choices };
  }
  
  return null;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onQuickReply }) => {
  const isUser = message.role === Role.USER;
  
  // 解析选择按钮
  const choiceData = !isUser ? parseChoiceButtons(message.content) : null;
  const displayContent = choiceData ? choiceData.text : message.content;

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2.5`}>
        
        {/* Avatar */}
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${isUser ? 'hidden' : 'bg-emerald-100 border-emerald-200'}`}>
          {!isUser && <BiologyIcon className="w-5 h-5 text-emerald-600" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          
          <div 
            className={`relative px-4 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words ${
              isUser 
                ? 'bg-emerald-600 text-white rounded-tr-sm' 
                : 'bg-white border border-emerald-100/50 text-slate-800 rounded-tl-sm shadow-sm'
            } ${message.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
          >
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.attachments.map((att, idx) => (
                  <img 
                    key={idx} 
                    src={att.previewUrl} 
                    alt="attachment" 
                    className="max-h-48 rounded-lg object-cover border border-white/20 bg-white"
                  />
                ))}
              </div>
            )}
            
            {/* Text Content with Markdown */}
            <div className={isUser ? "text-emerald-50 whitespace-pre-wrap" : "prose prose-emerald prose-sm max-w-none"}>
              {isUser ? (
                message.content
              ) : (
                <ReactMarkdown
                  components={{
                    // 自定义渲染样式
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-emerald-700">{children}</strong>,
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-emerald-800">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-emerald-800">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-emerald-700">{children}</h3>,
                    code: ({ children }) => <code className="bg-emerald-50 px-1 rounded text-emerald-700">{children}</code>,
                  }}
                >
                  {/* 将单个换行符转换为两个换行符，让 Markdown 正确识别为段落分隔 */}
                  {displayContent.replace(/\n/g, '  \n')}
                </ReactMarkdown>
              )}
            </div>
          </div>
          
          {/* Choice Buttons */}
          {choiceData && choiceData.choices.length > 0 && onQuickReply && (
            <div className="flex flex-wrap gap-2 mt-2">
              {choiceData.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuickReply(choice.value)}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-sm text-emerald-700 font-medium transition-colors shadow-sm"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;