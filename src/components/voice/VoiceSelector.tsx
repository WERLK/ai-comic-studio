import { useState } from 'react';
import { Volume2, Play, Pause, Check, User } from 'lucide-react';
import { voiceActors, getVoicesByGender, getVoiceById } from '@/data/voiceActors';
import { useProjectStore } from '@/stores';

interface VoiceSelectorProps {
  selectedVoices: string[];
  onChange: (voices: string[]) => void;
  characterCount: number;
}

export function VoiceSelector({ selectedVoices, onChange, characterCount }: VoiceSelectorProps) {
  const { previewVoice, stopSpeaking } = useProjectStore();
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  const handlePreview = (voiceId: string) => {
    if (previewingVoiceId === voiceId) {
      stopSpeaking();
      setPreviewingVoiceId(null);
    } else {
      stopSpeaking();
      previewVoice(voiceId);
      setPreviewingVoiceId(voiceId);
      setTimeout(() => {
        stopSpeaking();
        setPreviewingVoiceId(null);
      }, 3000);
    }
  };

  const handleSelectVoice = (characterIndex: number, voiceId: string) => {
    const newVoices = [...selectedVoices];
    newVoices[characterIndex] = voiceId;
    onChange(newVoices);
  };

  const filteredVoices = genderFilter === 'all' 
    ? voiceActors.filter(v => !v.tags.includes('旁白'))
    : getVoicesByGender(genderFilter);

  const getToneColor = (tone: string) => {
    const colors: Record<string, string> = {
      bright: 'from-yellow-400 to-orange-400',
      calm: 'from-blue-400 to-cyan-400',
      energetic: 'from-green-400 to-emerald-400',
      warm: 'from-pink-400 to-rose-400',
      cool: 'from-purple-400 to-indigo-400',
      serious: 'from-gray-600 to-gray-800',
    };
    return colors[tone] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Character Voice Assignments */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-cyber-pink" />
          <h3 className="font-display font-semibold text-white">角色配音分配</h3>
        </div>
        
        {Array.from({ length: characterCount }).map((_, index) => {
          const selectedVoiceId = selectedVoices[index];
          const selectedVoice = selectedVoiceId ? getVoiceById(selectedVoiceId) : null;
          
          return (
            <div key={index} className="bg-cyber-dark2/80 rounded-xl p-4 border border-cyber-purple/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-cyber-blue">
                  角色 {index + 1}
                </span>
                {selectedVoice && (
                  <span className="text-xs text-gray-400">
                    已选: {selectedVoice.name}
                  </span>
                )}
              </div>
              
              {/* Quick Selection */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSelectVoice(index, '')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    !selectedVoiceId
                      ? 'bg-cyber-purple text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  自动分配
                </button>
                {filteredVoices.slice(0, 6).map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleSelectVoice(index, voice.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gradient-to-r ${
                      selectedVoiceId === voice.id
                        ? `${getToneColor(voice.tone)} text-white shadow-neon`
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {voice.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Voice Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-cyber-pink" />
            <h3 className="font-display font-semibold text-white">配音库</h3>
          </div>
          
          {/* Gender Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setGenderFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                genderFilter === 'all'
                  ? 'bg-cyber-pink text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setGenderFilter('male')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                genderFilter === 'male'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              男声
            </button>
            <button
              onClick={() => setGenderFilter('female')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                genderFilter === 'female'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              女声
            </button>
          </div>
        </div>

        {/* Voice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoices.includes(voice.id);
            const isPreviewing = previewingVoiceId === voice.id;
            
            return (
              <div
                key={voice.id}
                className={`bg-cyber-dark2/80 rounded-xl p-4 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyber-pink shadow-neon'
                    : 'border-cyber-purple/20 hover:border-cyber-purple/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-white text-sm">{voice.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{voice.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-cyber-pink flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Voice Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r ${getToneColor(voice.tone)} text-white`}>
                    {voice.tone === 'bright' ? '明亮' : 
                     voice.tone === 'calm' ? '冷静' :
                     voice.tone === 'energetic' ? '活力' :
                     voice.tone === 'warm' ? '温暖' :
                     voice.tone === 'cool' ? '冷酷' : '严肃'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-700 text-gray-400">
                    {voice.gender === 'male' ? '男' : '女'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-700 text-gray-400">
                    {voice.age === 'teen' ? '少年/少女' :
                     voice.age === 'adult' ? '成年' :
                     voice.age === 'middle' ? '中年' : voice.age}
                  </span>
                </div>

                {/* Preview Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(voice.id);
                  }}
                  className={`w-full py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    isPreviewing
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  {isPreviewing ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      停止预览
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      试听
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
