import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import { DEFAULT_CONFIG, ModelConfig } from './components/SettingsPanel';
import { Message, Role, Attachment } from './types';
import { generateChatResponse, setModelConfig } from './services/chatService';
import { BiologyIcon } from './components/Icon';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelConfig, setModelConfigState] = useState<ModelConfig>(DEFAULT_CONFIG);

  // 加载保存的配置
  useEffect(() => {
    const saved = localStorage.getItem('biologyTutorConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setModelConfigState(config);
        setModelConfig(config);
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    }
  }, []);

  const handleConfigChange = (config: ModelConfig) => {
    setModelConfigState(config);
    setModelConfig(config);
  };

  // 重置会话（清除消息和后端会话ID）
  const handleResetSession = () => {
    setMessages([]);
    // 清除后端会话ID，下次会创建新会话
    (window as any).__biologySessionId = null;
  };
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string, attachments: Attachment[]) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content: text,
      attachments: attachments,
      timestamp: Date.now(),
    };

    // 1. Optimistic Update
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // 2. Create Placeholder for AI Response
    const aiMessageId = uuidv4();
    let aiMessageContent = '';
    
    // Initial AI message state
    setMessages(prev => [
      ...prev,
      {
        id: aiMessageId,
        role: Role.MODEL,
        content: '',
        timestamp: Date.now(),
      }
    ]);

    try {
      // 3. Call Service (Business Logic decoupled)
      const stream = generateChatResponse(newMessages, 'biology-tutor');

      for await (const chunk of stream) {
        aiMessageContent += chunk;
        
        // Update the specific message in state with new chunk
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: aiMessageContent } 
            : msg
        ));
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: "抱歉，出现了一些网络问题，请重试。", isError: true } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const SuggestionChip = ({ text }: { text: string }) => (
    <button 
      onClick={() => handleSend(text, [])}
      className="bg-white border border-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm shadow-sm hover:bg-emerald-50 transition-colors"
    >
      {text}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#f0fdf4]">
      
      {/* Header with Model Settings */}
      <Header 
        disabled={isLoading}
        modelConfig={modelConfig}
        onConfigChange={handleConfigChange}
        onResetSession={handleResetSession}
      />

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto px-4 pb-32 pt-20">
          
          {messages.length === 0 && (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center select-none">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                <BiologyIcon className="w-12 h-12 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-emerald-900 mb-2 tracking-tight">高中生物智能辅导</h1>
              <p className="text-sm text-emerald-600/80 max-w-xs mb-8">
                拍照上传题目，或者直接询问任何生物学概念。涵盖人教版必修与选修内容。
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                <SuggestionChip text="🧬 解释一下有丝分裂的过程" />
                <SuggestionChip text="🌿 光合作用的光反应在哪里进行？" />
                <SuggestionChip text="⚗️ 孟德尔遗传定律的适用条件" />
                <SuggestionChip text="🦠 病毒属于生命系统吗？" />
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              onQuickReply={index === messages.length - 1 && !isLoading ? (text) => handleSend(text, []) : undefined}
            />
          ))}
          
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea onSend={handleSend} isLoading={isLoading} />
      
    </div>
  );
};

export default App;