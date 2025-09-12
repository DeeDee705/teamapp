import { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { AppScreen, Member } from '../types';
import { DataManager } from '../utils/dataManager';
import { SelectionBar } from './SelectionBar';
import { useSelectionStore } from '../state/selectionStore';

interface CoinTossProps {
  onNavigate: (screen: AppScreen) => void;
}

export default function CoinToss({ onNavigate }: CoinTossProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [flipHistory, setFlipHistory] = useState<Array<{ result: 'heads' | 'tails'; timestamp: Date }>>([]);
  const [attendancePool, setAttendancePool] = useState<Member[]>([]);

  const dataManager = DataManager.getInstance();
  
  // Selection store - subscribe to reactive values
  const selectedMemberIds = useSelectionStore(state => state.selectedMemberIds);

  // Update attendance pool when selection changes
  useEffect(() => {
    const pool = dataManager.getPresentMembersByIds(selectedMemberIds);
    setAttendancePool(pool);
  }, [selectedMemberIds]);

  const flipCoin = async () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setResult(null);
    
    // Simulate coin flip with random delay for better UX
    const flipDuration = 1500 + Math.random() * 500; // 1.5-2 seconds
    
    await new Promise(resolve => setTimeout(resolve, flipDuration));
    
    const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
    setResult(coinResult);
    setIsFlipping(false);
    
    // Add to history
    setFlipHistory(prev => [
      { result: coinResult, timestamp: new Date() },
      ...prev.slice(0, 9) // Keep last 10 flips
    ]);
  };

  const clearHistory = () => {
    setFlipHistory([]);
  };

  const getStats = () => {
    if (flipHistory.length === 0) return null;
    
    const heads = flipHistory.filter(flip => flip.result === 'heads').length;
    const tails = flipHistory.length - heads;
    
    return {
      total: flipHistory.length,
      heads,
      tails,
      headsPercentage: Math.round((heads / flipHistory.length) * 100),
      tailsPercentage: Math.round((tails / flipHistory.length) * 100)
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2ebc4]">
      {/* Header */}
      <div className="bg-[#f2e205] text-[#0d0d0d] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-[#0d0d0d] hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Coin Toss</h1>
        </div>
        {flipHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="bg-[#0d0d0d] text-[#f2e205] p-2 rounded-lg hover:bg-opacity-80 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
        )}
      </div>

      {/* Selection Bar */}
      <SelectionBar />

      <div className="p-4">
        
        {/* No Selection Hint */}
        {attendancePool.length === 0 && (
          <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4 text-center mb-6">
            <p className="text-sm opacity-80">
              No one selected. Open the bar above to pick locations/groups/members.
            </p>
          </div>
        )}

      </div>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 space-y-8">
        {/* Coin Display */}
        <div className="relative">
          <div 
            className={`w-48 h-48 rounded-full border-8 border-[#f2e205] bg-gradient-to-br from-[#f2e205] to-[#e6d600] flex items-center justify-center text-[#0d0d0d] font-bold text-4xl shadow-2xl transform transition-all duration-1000 ${
              isFlipping ? 'animate-spin' : ''
            } ${result ? 'scale-110' : 'scale-100'}`}
            style={{
              animationDuration: isFlipping ? '0.1s' : undefined,
              animationIterationCount: isFlipping ? 'infinite' : undefined
            }}
          >
            {isFlipping ? (
              <div className="animate-pulse">?</div>
            ) : result ? (
              <div className="text-center">
                <div className="text-6xl mb-2">
                  {result === 'heads' ? '👑' : '⚡'}
                </div>
                <div className="text-lg font-semibold uppercase tracking-wider">
                  {result}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-2">🪙</div>
                <div className="text-lg font-semibold">READY</div>
              </div>
            )}
          </div>
          
          {/* Glow effect for result */}
          {result && !isFlipping && (
            <div 
              className={`absolute inset-0 rounded-full ${
                result === 'heads' ? 'bg-blue-400' : 'bg-orange-400'
              } blur-xl opacity-20 animate-pulse`}
            />
          )}
        </div>

        {/* Result Display */}
        {result && !isFlipping && (
          <div className="text-center animate-fadeIn">
            <h2 className="text-3xl font-bold text-[#f2e205] mb-2">
              {result === 'heads' ? 'HEADS!' : 'TAILS!'}
            </h2>
            <p className="text-lg opacity-80">
              {result === 'heads' ? 'Heads wins this round!' : 'Tails takes the victory!'}
            </p>
          </div>
        )}

        {/* Flip Button */}
        <button
          onClick={flipCoin}
          disabled={isFlipping}
          className="bg-[#f2e205] text-[#0d0d0d] px-12 py-4 rounded-xl font-bold text-xl hover:bg-[#e6d600] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
        >
          {isFlipping ? 'Flipping...' : result ? 'Flip Again' : 'Flip Coin'}
        </button>

        {/* Statistics */}
        {stats && (
          <div className="bg-[#1a1a1a] rounded-xl p-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-center mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-300">{stats.heads}</div>
                <div className="text-sm opacity-60">Heads ({stats.headsPercentage}%)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-300">{stats.tails}</div>
                <div className="text-sm opacity-60">Tails ({stats.tailsPercentage}%)</div>
              </div>
            </div>
            <div className="text-center mt-3 text-sm opacity-60">
              Total flips: {stats.total}
            </div>
          </div>
        )}

        {/* Recent History */}
        {flipHistory.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl p-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-center mb-3">Recent Flips</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {flipHistory.slice(0, 10).map((flip, index) => (
                <div
                  key={flip.timestamp.getTime()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    flip.result === 'heads' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}
                  style={{
                    opacity: 1 - (index * 0.1),
                    transform: `scale(${1 - (index * 0.05)})`
                  }}
                >
                  {flip.result === 'heads' ? 'H' : 'T'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}