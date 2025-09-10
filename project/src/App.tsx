import { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { AppScreen } from './types';
import Home from './components/Home';
import AttendanceManager from './components/AttendanceManager';
import MemberManager from './components/MemberManager';
import TeamGenerator from './components/TeamGenerator';
import RandomPicker from './components/RandomPicker';
import CoinToss from './components/CoinToss';
import Settings from './components/Settings';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [screenData, setScreenData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsKey, setSettingsKey] = useState(0); // For forcing re-renders when settings change

  const handleNavigate = (screen: AppScreen, data?: any) => {
    setCurrentScreen(screen);
    setScreenData(data);
  };

  const handleSettingsChange = () => {
    setSettingsKey(prev => prev + 1); // Force re-render of all components when settings change
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      
      case 'locations':
        return <AttendanceManager onNavigate={handleNavigate} />;
      
      case 'members':
        return (
          <MemberManager 
            locationId={screenData?.locationId} 
            onNavigate={handleNavigate} 
          />
        );
      
      case 'team-generator':
        return <TeamGenerator onNavigate={handleNavigate} screenData={screenData} />;
      
      case 'random-picker':
        return <RandomPicker onNavigate={handleNavigate} />;
      
      case 'coin-toss':
        return <CoinToss onNavigate={handleNavigate} />;
      
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="App" key={settingsKey}>
      {/* Global header with settings - only show on non-home screens */}
      {currentScreen !== 'home' && (
        <div className="fixed top-0 right-0 z-30 p-4">
          <button
            onClick={() => setShowSettings(true)}
            className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#f2ebc4] p-2 rounded-lg border border-[#3a3a3a] transition-colors"
            title="Settings"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      )}

      {/* Main content */}
      {renderScreen()}

      {/* Settings modal */}
      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}

export default App;