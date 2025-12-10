import React, { useState, useEffect } from 'react';

export interface ModelConfig {
  visionModel: string;
  visionApiKey: string;
  deepModel: string;
  deepApiKey: string;
  quickModel: string;
  quickApiKey: string;
  backendUrl: string;
}

const DEFAULT_CONFIG: ModelConfig = {
  visionModel: 'doubao-vision',
  visionApiKey: '',
  deepModel: 'doubao-pro',
  deepApiKey: '',
  quickModel: 'doubao-lite',
  quickApiKey: '',
  backendUrl: 'http://localhost:8000',
};

// 可选的模型列表
const VISION_MODELS = [
  { id: 'doubao-vision', name: '豆包视觉 (doubao-1-5-vision-pro)', provider: 'doubao' },
  { id: 'gpt-4-vision', name: 'GPT-4 Vision', provider: 'openai' },
  { id: 'claude-vision', name: 'Claude 3 Vision', provider: 'anthropic' },
];

const DEEP_MODELS = [
  { id: 'doubao-pro', name: '豆包 Pro (doubao-1-5-pro)', provider: 'doubao' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
  { id: 'claude-3', name: 'Claude 3 Opus', provider: 'anthropic' },
  { id: 'deepseek', name: 'DeepSeek', provider: 'deepseek' },
];

const QUICK_MODELS = [
  { id: 'doubao-lite', name: '豆包 Lite (doubao-1-5-lite)', provider: 'doubao' },
  { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', provider: 'openai' },
  { id: 'claude-instant', name: 'Claude Instant', provider: 'anthropic' },
];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ModelConfig) => void;
  onResetSession?: () => void;  // 重置会话回调
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, onSave, onResetSession }) => {
  const [config, setConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [showApiKeys, setShowApiKeys] = useState({
    vision: false,
    deep: false,
    quick: false,
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // 从 localStorage 加载配置
  useEffect(() => {
    const saved = localStorage.getItem('biologyTutorConfig');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
  }, []);

  // 重置保存状态
  useEffect(() => {
    if (saveStatus === 'success' || saveStatus === 'error') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSave = () => {
    setSaveStatus('saving');
    
    try {
      localStorage.setItem('biologyTutorConfig', JSON.stringify(config));
      onSave(config);
      
      // 重置会话，让新配置立即生效
      if (onResetSession) {
        onResetSession();
      }
      
      setSaveStatus('success');
      setSaveMessage('✅ 设置已保存！会话已重置，新配置已生效。');
      
      // 延迟关闭，让用户看到成功提示
      setTimeout(() => {
        onClose();
        setSaveStatus('idle');
      }, 1500);
    } catch (e) {
      setSaveStatus('error');
      setSaveMessage('❌ 保存失败，请重试');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">⚙️ 模型设置</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Backend URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🌐 后端服务地址
            </label>
            <input
              type="text"
              value={config.backendUrl}
              onChange={(e) => setConfig({ ...config, backendUrl: e.target.value })}
              placeholder="http://localhost:8000"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Vision Model */}
          <div className="p-4 bg-blue-50 rounded-xl">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              👁️ 视觉理解模型
            </label>
            <select
              value={config.visionModel}
              onChange={(e) => setConfig({ ...config, visionModel: e.target.value })}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white mb-2"
            >
              {VISION_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="relative">
              <input
                type={showApiKeys.vision ? 'text' : 'password'}
                value={config.visionApiKey}
                onChange={(e) => setConfig({ ...config, visionApiKey: e.target.value })}
                placeholder="API Key"
                className="w-full px-3 py-2 border border-blue-200 rounded-lg pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKeys({ ...showApiKeys, vision: !showApiKeys.vision })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showApiKeys.vision ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Deep Thinking Model */}
          <div className="p-4 bg-purple-50 rounded-xl">
            <label className="block text-sm font-medium text-purple-800 mb-2">
              🧠 深度思考模型
            </label>
            <select
              value={config.deepModel}
              onChange={(e) => setConfig({ ...config, deepModel: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 rounded-lg bg-white mb-2"
            >
              {DEEP_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="relative">
              <input
                type={showApiKeys.deep ? 'text' : 'password'}
                value={config.deepApiKey}
                onChange={(e) => setConfig({ ...config, deepApiKey: e.target.value })}
                placeholder="API Key"
                className="w-full px-3 py-2 border border-purple-200 rounded-lg pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKeys({ ...showApiKeys, deep: !showApiKeys.deep })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showApiKeys.deep ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Quick Model */}
          <div className="p-4 bg-green-50 rounded-xl">
            <label className="block text-sm font-medium text-green-800 mb-2">
              ⚡ 快速响应模型
            </label>
            <select
              value={config.quickModel}
              onChange={(e) => setConfig({ ...config, quickModel: e.target.value })}
              className="w-full px-3 py-2 border border-green-200 rounded-lg bg-white mb-2"
            >
              {QUICK_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="relative">
              <input
                type={showApiKeys.quick ? 'text' : 'password'}
                value={config.quickApiKey}
                onChange={(e) => setConfig({ ...config, quickApiKey: e.target.value })}
                placeholder="API Key"
                className="w-full px-3 py-2 border border-green-200 rounded-lg pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKeys({ ...showApiKeys, quick: !showApiKeys.quick })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showApiKeys.quick ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          {/* 保存状态提示 */}
          {saveStatus !== 'idle' && (
            <div className={`mb-3 px-4 py-2 rounded-lg text-sm ${
              saveStatus === 'success' ? 'bg-green-100 text-green-700' :
              saveStatus === 'error' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {saveStatus === 'saving' ? '⏳ 正在保存...' : saveMessage}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={saveStatus === 'saving'}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2 rounded-lg transition-colors ${
                saveStatus === 'saving' 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {saveStatus === 'saving' ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
export { DEFAULT_CONFIG };
