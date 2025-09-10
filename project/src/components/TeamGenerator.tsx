import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Settings, Shuffle, CheckCircle, User, Star } from 'lucide-react';
import { AppScreen, Location, Member, Team, TeamGenerationOptions } from '../types';
import { DataManager } from '../utils/dataManager';
import { TeamBalancer } from '../utils/teamBalancer';

interface TeamGeneratorProps {
  onNavigate: (screen: AppScreen, data?: any) => void;
  screenData?: {
    selectedLocationId?: string;
    selectedGroupIds?: string[];
  };
}

export default function TeamGenerator({ onNavigate, screenData }: TeamGeneratorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [presentMembers, setPresentMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [generationOptions, setGenerationOptions] = useState<TeamGenerationOptions>({
    type: 'balanced',
    numberOfTeams: 2
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const dataManager = DataManager.getInstance();
  const settings = dataManager.getSettings();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updatePresentMembers();
  }, [selectedLocations]);

  const loadData = () => {
    const allLocations = dataManager.getLocations();
    setLocations(allLocations);
    
    // If we have navigation data from AttendanceManager, use it
    if (screenData?.selectedLocationId) {
      setSelectedLocations([screenData.selectedLocationId]);
    } else if (allLocations.length > 0) {
      setSelectedLocations([allLocations[0].id]);
    }
  };

  const updatePresentMembers = () => {
    let members: Member[];
    
    // If we have group-based selection from AttendanceManager, use it
    if (screenData?.selectedLocationId && screenData?.selectedGroupIds?.length) {
      members = dataManager.getPresentMembersByGroups(
        screenData.selectedLocationId, 
        screenData.selectedGroupIds
      );
    } else {
      members = dataManager.getPresentMembers(selectedLocations);
    }
    
    setPresentMembers(members);
    
    // Adjust number of teams based on available members and settings
    const divisor = settings.teamClampRule === 'conservative' ? 2 : 1;
    const maxTeams = Math.max(2, Math.min(8, Math.floor(members.length / divisor)));
    if (generationOptions.numberOfTeams > maxTeams) {
      setGenerationOptions(prev => ({ ...prev, numberOfTeams: maxTeams }));
    }
  };

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationId)) {
        return prev.length > 1 ? prev.filter(id => id !== locationId) : prev;
      } else {
        return [...prev, locationId];
      }
    });
  };

  const generateTeams = async () => {
    if (presentMembers.length < 2) return;
    
    setIsGenerating(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newTeams = TeamBalancer.generateTeams(presentMembers, generationOptions);
    setTeams(newTeams);
    setIsGenerating(false);
  };

  const getSkillStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < level ? 'text-[#f2e205] fill-current' : 'text-gray-500'}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2ebc4]">
      {/* Header */}
      <div className="bg-[#f2e205] text-[#0d0d0d] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('locations')}
            className="p-2 hover:bg-[#0d0d0d] hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Team Generator</h1>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-[#0d0d0d] text-[#f2e205] p-2 rounded-lg hover:bg-opacity-80 transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Location Selection */}
        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
            <CheckCircle size={20} className="text-[#f2e205]" />
            <span>Select Locations</span>
          </h3>
          <div className="space-y-2">
            {locations.map(location => (
              <label
                key={location.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#2a2a2a] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location.id)}
                  onChange={() => toggleLocationSelection(location.id)}
                  className="w-4 h-4 text-[#f2e205] bg-[#2a2a2a] border-gray-600 rounded focus:ring-[#f2e205]"
                />
                <div className="flex-1">
                  <span className="font-medium">{location.name}</span>
                  <span className="text-sm opacity-60 ml-2">
                    ({location.members.filter(m => m.isPresent).length} present)
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4">Team Generation Settings</h3>
            
            {/* Team Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Team Type</label>
              <select
                value={generationOptions.type}
                onChange={(e) => setGenerationOptions(prev => ({ 
                  ...prev, 
                  type: e.target.value as TeamGenerationOptions['type']
                }))}
                className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:border-[#f2e205]"
              >
                <option value="balanced">Balanced Teams</option>
                <option value="female">All Female Teams</option>
                <option value="male">All Male Teams</option>
                <option value="age">Age-based Teams</option>
                <option value="skill">Skill-based Teams</option>
              </select>
            </div>

            {/* Number of Teams */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Number of Teams: {generationOptions.numberOfTeams}
              </label>
              <input
                type="range"
                min="2"
                max={Math.min(8, Math.floor(presentMembers.length / (settings.teamClampRule === 'conservative' ? 2 : 1)) || 2)}
                value={generationOptions.numberOfTeams}
                onChange={(e) => setGenerationOptions(prev => ({ 
                  ...prev, 
                  numberOfTeams: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs opacity-60 mt-1">
                <span>2</span>
                <span>{Math.min(8, Math.floor(presentMembers.length / (settings.teamClampRule === 'conservative' ? 2 : 1)) || 2)}</span>
              </div>
            </div>

            {/* Age Range (for age-based teams) */}
            {generationOptions.type === 'age' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Age Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min age"
                    value={generationOptions.ageRange?.min || ''}
                    onChange={(e) => setGenerationOptions(prev => ({ 
                      ...prev, 
                      ageRange: { 
                        ...prev.ageRange,
                        min: parseInt(e.target.value) || 0,
                        max: prev.ageRange?.max || 100
                      }
                    }))}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Max age"
                    value={generationOptions.ageRange?.max || ''}
                    onChange={(e) => setGenerationOptions(prev => ({ 
                      ...prev, 
                      ageRange: { 
                        min: prev.ageRange?.min || 0,
                        max: parseInt(e.target.value) || 100
                      }
                    }))}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            )}

            {/* Skill Range (for skill-based teams) */}
            {generationOptions.type === 'skill' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Skill Level Range</label>
                <div className="flex space-x-2">
                  <select
                    value={generationOptions.skillRange?.min || 1}
                    onChange={(e) => setGenerationOptions(prev => ({ 
                      ...prev, 
                      skillRange: { 
                        ...prev.skillRange,
                        min: parseInt(e.target.value),
                        max: prev.skillRange?.max || 5
                      }
                    }))}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>Min: {n}</option>
                    ))}
                  </select>
                  <select
                    value={generationOptions.skillRange?.max || 5}
                    onChange={(e) => setGenerationOptions(prev => ({ 
                      ...prev, 
                      skillRange: { 
                        min: prev.skillRange?.min || 1,
                        max: parseInt(e.target.value)
                      }
                    }))}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>Max: {n}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Present Members Summary */}
        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
            <User size={20} className="text-[#f2e205]" />
            <span>Present Members ({presentMembers.length})</span>
          </h3>
          {presentMembers.length === 0 ? (
            <p className="text-center opacity-60 py-4">
              No members selected or marked as present
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {presentMembers.slice(0, 8).map(member => (
                <div key={member.id} className="bg-[#2a2a2a] rounded-lg p-2">
                  <div className="font-medium text-sm">{member.name}</div>
                  <div className="flex items-center justify-between text-xs opacity-60">
                    <span>
                      {settings.showGender && `${member.gender}`}
                      {settings.showGender && settings.showAge && ', '}
                      {settings.showAge && `${new Date().getFullYear() - member.birthYear}y`}
                    </span>
                    {settings.showSkill && <div className="flex">{getSkillStars(member.skillLevel)}</div>}
                  </div>
                </div>
              ))}
              {presentMembers.length > 8 && (
                <div className="bg-[#2a2a2a] rounded-lg p-2 flex items-center justify-center">
                  <span className="text-sm opacity-60">
                    +{presentMembers.length - 8} more
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generateTeams}
          disabled={presentMembers.length < 2 || isGenerating}
          className="w-full bg-[#f2e205] text-[#0d0d0d] py-4 rounded-xl font-semibold hover:bg-[#e6d600] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0d0d0d]"></div>
              <span>Generating Teams...</span>
            </>
          ) : (
            <>
              <Shuffle size={20} />
              <span>Generate Teams</span>
            </>
          )}
        </button>

        {/* Generated Teams */}
        {teams.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <Users size={24} className="text-[#f2e205]" />
              <span>Generated Teams</span>
            </h3>
            {teams.map(team => (
              <div key={team.id} className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-[#f2e205]">{team.name}</h4>
                  <div className="text-sm opacity-60">
                    {team.members.length} members
                  </div>
                </div>
                
                {/* Team Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[#2a2a2a] rounded-lg">
                  <div className="text-center">
                    <div className="text-sm opacity-60">Avg Skill</div>
                    <div className="font-semibold text-[#f2e205]">{team.avgSkill}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm opacity-60">Gender Mix</div>
                    <div className="text-xs">
                      M:{team.genderRatio.male}% F:{team.genderRatio.female}%
                      {team.genderRatio.other > 0 && ` O:${team.genderRatio.other}%`}
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-2">
                  {team.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-[#2a2a2a] rounded-lg">
                      <div>
                        <span className="font-medium">{member.name}</span>
                        <span className="text-sm opacity-60 ml-2">
                          {settings.showGender && member.gender}
                          {settings.showGender && settings.showAge && ', '}
                          {settings.showAge && `${new Date().getFullYear() - member.birthYear}y`}
                        </span>
                      </div>
                      {settings.showSkill && (
                        <div className="flex">
                          {getSkillStars(member.skillLevel)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Regenerate Button */}
            <button
              onClick={generateTeams}
              className="w-full bg-transparent border-2 border-[#f2e205] text-[#f2e205] py-3 rounded-xl font-semibold hover:bg-[#f2e205] hover:text-[#0d0d0d] transition-colors flex items-center justify-center space-x-2"
            >
              <Shuffle size={20} />
              <span>Regenerate Teams</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}