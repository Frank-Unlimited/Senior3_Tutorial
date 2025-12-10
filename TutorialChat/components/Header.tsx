import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, BiologyIcon } from './Icon';
import { ModelConfig } from './SettingsPanel';

// 模型选项
const VISION_MODELS = [
  { id: 'doubao-vision', name: '豆包视觉', provider: 'doubao' },
  { id: 'gpt-4-vision', name: 'GPT-4 Vision', provider: 'openai' },
  { id: 'claude-vision', name: 'Claude 3 Vision', provider: 'anthropic' },
];

const DEEP_MODELS = [
  { id: 'doubao-pro', name: '豆包 Pro', provider: 'doubao' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
  { id: 'claude-3', name: 'Claude 3', provider: 'anthropic' },
  { id: 'deepseek', name: 'DeepSeek', provider: 'deepseek' },
];

const QUICK_MODELS = [
  { id: 'doubao-lite', name: '豆包 Lite', provider: 'doubao' },
  { id: 'gpt-3.5', name: 'GPT-3.5', provider: 'openai' },
  { id: 'claude-instant', name: 'Claude Instant', provider: 'anthropic' },
];

interface HeaderProps {
  disabled: boolean;
  modelConfig: ModelConfig;
  onConfigChange: (config: ModelConfig) => void;
  onResetSession?: () => void;
}

const Header: React.FC<HeaderProps> = ({ disabled, modelConfig, onConfigChange, onResetSession }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<ModelConfig>(modelConfig);
  const [showApiKeys, setShowApiKeys] = useState({ vision: false, deep: false, quick: false });

  useEffect(() => {
    setLocalConfig(modelConfig);
  }, [modelConfig]);

  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = () => {
    onConfigChange(localConfig);
    localStorage.setItem('biologyTutorConfig', JSON.stringify(localConfig));
    
    // 清除当前会话，使用新配置
    if (onResetSession) {
      onResetSession();
    }
    
    // 显示保存成功提示
    setSaveMessage('✅ 配置已保存，会话已重置');
    setTimeout(() => {
      setSaveMessage('');
      setIsOpen(false);
    }, 1500);
  };

  const getModelName = (type: 'vision' | 'deep' | 'quick') => {
    const models = type === 'vision' ? VISION_MODELS : type === 'deep' ? DEEP_MODELS : QUICK_MODELS;
    const modelId = type === 'vision' ? localConfig.visionModel : type === 'deep' ? localConfig.deepModel : localConfig.quickModel;
    return models.find(m => m.id === modelId)?.name || '未选择';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#f0fdf4]/90 backdrop-blur-md border-b border-emerald-100 h-14 flex items-center justify-center px-4 transition-all">
      <div className="relative">
        <button 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 py-1.5 px-3 rounded-full hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <BiologyIcon className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-800">高中生物智能辅导</span>
          <ChevronDownIcon className={`w-3.5 h-3.5 text-emerald-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu - Model Settings */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden z-20 ring-1 ring-black/5">
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">模型配置</div>
                
                {/* Backend URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">🌐 后端地址</label>
                  <input
                    type="text"
                    value={localConfig.backendUrl}
                    onChange={(e) => setLocalConfig({ ...localConfig, backendUrl: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                    placeholder="http://localhost:8000"
                  />
                </div>

                {/* Vision Model */}
                <div className="p-3 bg-blue-50 rounded-xl">
                  <label className="block text-xs font-medium text-blue-700 mb-1">👁️ 视觉模型</label>
                  <select
                    value={localConfig.visionModel}
                    onChange={(e) => setLocalConfig({ ...localConfig, visionModel: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-lg bg-white mb-2"
                  >
                    {VISION_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <div className="relative">
                    <input
                      type={showApiKeys.vision ? 'text' : 'password'}
                      value={localConfig.visionApiKey}
                      onChange={(e) => setLocalConfig({ ...localConfig, visionApiKey: e.target.value })}
                      placeholder="API Key"
                      className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded-lg pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeys({ ...showApiKeys, vision: !showApiKeys.vision })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                    >
                      {showApiKeys.vision ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Deep Model */}
                <div className="p-3 bg-purple-50 rounded-xl">
                  <label className="block text-xs font-medium text-purple-700 mb-1">🧠 深度思考模型</label>
                  <select
                    value={localConfig.deepModel}
                    onChange={(e) => setLocalConfig({ ...localConfig, deepModel: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-purple-200 rounded-lg bg-white mb-2"
                  >
                    {DEEP_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <div className="relative">
                    <input
                      type={showApiKeys.deep ? 'text' : 'password'}
                      value={localConfig.deepApiKey}
                      onChange={(e) => setLocalConfig({ ...localConfig, deepApiKey: e.target.value })}
                      placeholder="API Key"
                      className="w-full px-2 py-1.5 text-sm border border-purple-200 rounded-lg pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeys({ ...showApiKeys, deep: !showApiKeys.deep })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                    >
                      {showApiKeys.deep ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Quick Model */}
                <div className="p-3 bg-green-50 rounded-xl">
                  <label className="block text-xs font-medium text-green-700 mb-1">⚡ 快速模型</label>
                  <select
                    value={localConfig.quickModel}
                    onChange={(e) => setLocalConfig({ ...localConfig, quickModel: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-green-200 rounded-lg bg-white mb-2"
                  >
                    {QUICK_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <div className="relative">
                    <input
                      type={showApiKeys.quick ? 'text' : 'password'}
                      value={localConfig.quickApiKey}
                      onChange={(e) => setLocalConfig({ ...localConfig, quickApiKey: e.target.value })}
                      placeholder="API Key"
                      className="w-full px-2 py-1.5 text-sm border border-green-200 rounded-lg pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeys({ ...showApiKeys, quick: !showApiKeys.quick })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                    >
                      {showApiKeys.quick ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Save Message */}
                {saveMessage && (
                  <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm text-center">
                    {saveMessage}
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={!!saveMessage}
                  className={`w-full py-2 rounded-lg transition-colors text-sm font-medium ${
                    saveMessage 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {saveMessage ? '已保存' : '保存配置'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;