import { useState } from 'react';
import { AppScreen } from './types';
import Home from './components/Home';
import AttendanceManager from './components/AttendanceManager';
import MemberManager from './components/MemberManager';
import TeamGenerator from './components/TeamGenerator';
import RandomPicker from './components/RandomPicker';
import CoinToss from './components/CoinToss';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [screenData, setScreenData] = useState<any>(null);

  const handleNavigate = (screen: AppScreen, data?: any) => {
    console.log('Navigating to:', screen, 'with data:', data);
    setCurrentScreen(screen);
    setScreenData(data);
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
    <div className="App">
      {renderScreen()}
    </div>
  );
}

export default App;