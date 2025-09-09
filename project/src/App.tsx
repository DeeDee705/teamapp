import React, { useState } from 'react';
import { AppScreen } from './types';
import Home from './components/Home';
import LocationManager from './components/LocationManager';
import MemberManager from './components/MemberManager';
import TeamGenerator from './components/TeamGenerator';
import RandomPicker from './components/RandomPicker';
import CoinToss from './components/CoinToss';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [screenData, setScreenData] = useState<any>(null);

  const handleNavigate = (screen: AppScreen, data?: any) => {
    setCurrentScreen(screen);
    setScreenData(data);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      
      case 'locations':
        return <LocationManager onNavigate={handleNavigate} />;
      
      case 'members':
        return (
          <MemberManager 
            locationId={screenData?.locationId} 
            onNavigate={handleNavigate} 
          />
        );
      
      case 'team-generator':
        return <TeamGenerator onNavigate={handleNavigate} />;
      
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