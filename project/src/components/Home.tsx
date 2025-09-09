import { Users, UserCheck, Coins } from 'lucide-react';
import { AppScreen } from '../types';

interface HomeProps {
  onNavigate: (screen: AppScreen) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const features = [
    {
      id: 'make-teams',
      title: 'Make Teams',
      description: 'Create balanced teams from your locations and members',
      icon: Users,
      screen: 'locations' as AppScreen
    },
    {
      id: 'pick-random',
      title: 'Pick Random Persons',
      description: 'Randomly select people with filtering options',
      icon: UserCheck,
      screen: 'random-picker' as AppScreen
    },
    {
      id: 'coin-toss',
      title: 'Coin Toss',
      description: 'Simple coin flip with smooth animations',
      icon: Coins,
      screen: 'coin-toss' as AppScreen
    }
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2ebc4] p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Team Manager</h1>
          <p className="text-lg opacity-80">
            Manage your teams with smart balancing and random selection
          </p>
        </div>

        <div className="space-y-6">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => onNavigate(feature.screen)}
                className="w-full bg-[#f2e205] text-[#0d0d0d] rounded-xl p-6 hover:bg-[#e6d600] active:bg-[#d9c900] transition-colors duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-[#0d0d0d] bg-opacity-20 rounded-lg p-3">
                    <IconComponent size={32} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm opacity-80">{feature.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm opacity-60">
            Built for mobile-first team management
          </p>
        </div>
      </div>
    </div>
  );
}