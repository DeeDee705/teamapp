import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Settings, Shuffle, User, Star, Filter, X, RotateCcw, Plus, Minus } from 'lucide-react';
import { AppScreen, Member, Team, Gender, CustomAttribute, CustomRule, TeamGenerationOptions } from '../types';
import { DataManager } from '../utils/dataManager';
import { TeamBalancer } from '../utils/teamBalancer';
import { applyFilters } from '../utils/filters';

interface TeamGeneratorProps {
  onNavigate: (screen: AppScreen, data?: any) => void;
  screenData?: {
    selectedLocationId?: string;
    selectedGroupIds?: string[];
  };
}

export default function TeamGenerator({ onNavigate, screenData }: TeamGeneratorProps) {
  // Pool and teams
  const [attendancePool, setAttendancePool] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filter states
  const [genderFilter, setGenderFilter] = useState<Record<Gender, boolean>>({
    Male: true, Female: true, Other: true
  });
  const [ageRange, setAgeRange] = useState<{ min?: number; max?: number }>({});
  const [skillRange, setSkillRange] = useState<{ min?: number; max?: number }>({});
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Team generation options
  const [generationOptions, setGenerationOptions] = useState<TeamGenerationOptions>({
    type: 'balanced',
    numberOfTeams: 2
  });

  const dataManager = DataManager.getInstance();
  const settings = dataManager.getSettings();
  
  // Helper function to save filters when persistFilters is enabled
  const saveFiltersToStorage = () => {
    if (settings.persistFilters) {
      const filtersToSave = {
        genderFilter,
        ageRange,
        skillRange,
        customRules,
        numberOfTeams
      };
      localStorage.setItem('team-generator-filters', JSON.stringify(filtersToSave));
    }
  };

  useEffect(() => {
    // Load custom attributes
    setCustomAttributes(dataManager.getCustomAttributes());
    
    // Build attendance pool from navigation context (from "Who's Here")
    const pool: Member[] = screenData?.selectedLocationId && screenData?.selectedGroupIds?.length
      ? dataManager.getPresentMembersByGroups(screenData.selectedLocationId, screenData.selectedGroupIds)
      : [];
    
    setAttendancePool(pool);
    
    // Load persisted filters if enabled
    if (settings.persistFilters) {
      const savedFilters = localStorage.getItem('team-generator-filters');
      if (savedFilters) {
        try {
          const parsed = JSON.parse(savedFilters);
          if (parsed.genderFilter) setGenderFilter(parsed.genderFilter);
          if (parsed.ageRange) setAgeRange(parsed.ageRange);
          if (parsed.skillRange) setSkillRange(parsed.skillRange);
          if (parsed.customRules) setCustomRules(parsed.customRules);
          if (parsed.numberOfTeams) setNumberOfTeams(parsed.numberOfTeams);
        } catch (error) {
          console.error('Failed to load persisted filters:', error);
        }
      }
    }
  }, [screenData]);

  // Apply filters whenever filters or pool changes
  useEffect(() => {
    const filtered = applyFilters(attendancePool, { genderFilter, ageRange, skillRange, customRules });
    setFilteredMembers(filtered);
    
    // Auto-adjust number of teams based on available members
    const divisor = settings.teamClampRule === 'conservative' ? 2 : 1;
    const maxTeams = Math.max(2, Math.min(8, Math.floor(filtered.length / divisor)));
    if (numberOfTeams > maxTeams) {
      setNumberOfTeams(maxTeams);
    }
  }, [attendancePool, genderFilter, ageRange, skillRange, customRules, numberOfTeams, settings.teamClampRule]);

  // Filter manipulation functions
  const resetFilters = () => {
    setGenderFilter({ Male: true, Female: true, Other: true });
    setAgeRange({});
    setSkillRange({});
    setCustomRules([]);
    saveFiltersToStorage();
  };

  const addCustomRule = () => {
    if (customAttributes.length === 0) return;
    const newRule: CustomRule = {
      key: customAttributes[0].key,
      op: 'equals',
      value: ''
    };
    setCustomRules(prev => [...prev, newRule]);
  };

  const updateCustomRule = (index: number, updates: Partial<CustomRule>) => {
    setCustomRules(prev => prev.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    ));
  };

  const removeCustomRule = (index: number) => {
    setCustomRules(prev => prev.filter((_, i) => i !== index));
  };

  const generateTeams = async () => {
    if (filteredMembers.length < 2) return;
    
    setIsGenerating(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newTeams = TeamBalancer.generateTeams(filteredMembers, generationOptions);
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
        {/* Filter Toggle */}
        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Filter size={20} className="text-[#f2e205]" />
              <span>Filters ({filteredMembers.length} of {attendancePool.length} members)</span>
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={resetFilters}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                title="Reset Filters"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                {showFilters ? <Minus size={16} /> : <Plus size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Sections */}
        {showFilters && (
          <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-4">
            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(genderFilter) as Gender[]).map(gender => (
                  <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genderFilter[gender]}
                      onChange={(e) => {
                        setGenderFilter(prev => ({ ...prev, [gender]: e.target.checked }));
                        saveFiltersToStorage();
                      }}
                      className="w-4 h-4 text-[#f2e205] bg-[#2a2a2a] border-gray-600 rounded focus:ring-[#f2e205]"
                    />
                    <span className="text-sm">{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Range Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Age Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min age"
                  value={ageRange.min || ''}
                  onChange={(e) => {
                    setAgeRange(prev => ({ ...prev, min: parseInt(e.target.value) || undefined }));
                    saveFiltersToStorage();
                  }}
                  className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Max age"
                  value={ageRange.max || ''}
                  onChange={(e) => {
                    setAgeRange(prev => ({ ...prev, max: parseInt(e.target.value) || undefined }));
                    saveFiltersToStorage();
                  }}
                  className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* Skill Range Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Skill Level Range</label>
              <div className="flex space-x-2">
                <select
                  value={skillRange.min || ''}
                  onChange={(e) => {
                    setSkillRange(prev => ({ ...prev, min: parseInt(e.target.value) || undefined }));
                    saveFiltersToStorage();
                  }}
                  className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                >
                  <option value="">Min Skill</option>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <select
                  value={skillRange.max || ''}
                  onChange={(e) => {
                    setSkillRange(prev => ({ ...prev, max: parseInt(e.target.value) || undefined }));
                    saveFiltersToStorage();
                  }}
                  className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                >
                  <option value="">Max Skill</option>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Rules */}
            {customAttributes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Custom Rules</label>
                  <button
                    onClick={addCustomRule}
                    className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {customRules.map((rule, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <select
                      value={rule.key}
                      onChange={(e) => {
                        updateCustomRule(index, { key: e.target.value });
                        saveFiltersToStorage();
                      }}
                      className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                    >
                      {customAttributes.map(attr => (
                        <option key={attr.key} value={attr.key}>{attr.label}</option>
                      ))}
                    </select>
                    <select
                      value={rule.op}
                      onChange={(e) => {
                        updateCustomRule(index, { op: e.target.value as CustomRule['op'] });
                        saveFiltersToStorage();
                      }}
                      className="bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="gte">≥</option>
                      <option value="lte">≤</option>
                    </select>
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => {
                        updateCustomRule(index, { value: e.target.value });
                        saveFiltersToStorage();
                      }}
                      className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                      placeholder="Value"
                    />
                    <button
                      onClick={() => {
                        removeCustomRule(index);
                        saveFiltersToStorage();
                      }}
                      className="p-2 hover:bg-[#2a2a2a] rounded transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4">Team Generation Settings</h3>
            
            {/* Team Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Team Type</label>
              <select
                value={generationOptions.type}
                onChange={(e) => {
                  const newOptions = { 
                    ...generationOptions, 
                    type: e.target.value as TeamGenerationOptions['type']
                  };
                  setGenerationOptions(newOptions);
                  saveFiltersToStorage();
                }}
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
                max={Math.max(2, Math.min(8, Math.floor(filteredMembers.length / (settings.teamClampRule === 'conservative' ? 2 : 1))))}
                value={generationOptions.numberOfTeams}
                onChange={(e) => {
                  const newOptions = { 
                    ...generationOptions, 
                    numberOfTeams: parseInt(e.target.value)
                  };
                  setGenerationOptions(newOptions);
                  saveFiltersToStorage();
                }}
                className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs opacity-60 mt-1">
                <span>2</span>
                <span>{Math.max(2, Math.min(8, Math.floor(filteredMembers.length / (settings.teamClampRule === 'conservative' ? 2 : 1))))}</span>
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
                    onChange={(e) => {
                      const newOptions = { 
                        ...generationOptions, 
                        ageRange: { 
                          ...generationOptions.ageRange,
                          min: parseInt(e.target.value) || 0,
                          max: generationOptions.ageRange?.max || 100
                        }
                      };
                      setGenerationOptions(newOptions);
                      saveFiltersToStorage();
                    }}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Max age"
                    value={generationOptions.ageRange?.max || ''}
                    onChange={(e) => {
                      const newOptions = { 
                        ...generationOptions, 
                        ageRange: { 
                          min: generationOptions.ageRange?.min || 0,
                          max: parseInt(e.target.value) || 100
                        }
                      };
                      setGenerationOptions(newOptions);
                      saveFiltersToStorage();
                    }}
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
                    onChange={(e) => {
                      const newOptions = { 
                        ...generationOptions, 
                        skillRange: { 
                          ...generationOptions.skillRange,
                          min: parseInt(e.target.value),
                          max: generationOptions.skillRange?.max || 5
                        }
                      };
                      setGenerationOptions(newOptions);
                      saveFiltersToStorage();
                    }}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>Min: {n}</option>
                    ))}
                  </select>
                  <select
                    value={generationOptions.skillRange?.max || 5}
                    onChange={(e) => {
                      const newOptions = { 
                        ...generationOptions, 
                        skillRange: { 
                          min: generationOptions.skillRange?.min || 1,
                          max: parseInt(e.target.value)
                        }
                      };
                      setGenerationOptions(newOptions);
                      saveFiltersToStorage();
                    }}
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
            <span>Present Members ({filteredMembers.length})</span>
          </h3>
          {filteredMembers.length === 0 ? (
            <p className="text-center opacity-60 py-4">
              No members selected or marked as present
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredMembers.slice(0, 8).map(member => (
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
              {filteredMembers.length > 8 && (
                <div className="bg-[#2a2a2a] rounded-lg p-2 flex items-center justify-center">
                  <span className="text-sm opacity-60">
                    +{filteredMembers.length - 8} more
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generateTeams}
          disabled={filteredMembers.length < 2 || isGenerating}
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
                {(settings.showSkill || settings.showGender) && (
                  <div className="grid gap-4 mb-4 p-3 bg-[#2a2a2a] rounded-lg" style={{gridTemplateColumns: `repeat(${(settings.showSkill ? 1 : 0) + (settings.showGender ? 1 : 0)}, minmax(0, 1fr))`}}>
                    {settings.showSkill && (
                      <div className="text-center">
                        <div className="text-sm opacity-60">Avg Skill</div>
                        <div className="font-semibold text-[#f2e205]">{team.avgSkill}</div>
                      </div>
                    )}
                    {settings.showGender && (
                      <div className="text-center">
                        <div className="text-sm opacity-60">Gender Mix</div>
                        <div className="text-xs">
                          M:{team.genderRatio.male}% F:{team.genderRatio.female}%
                          {team.genderRatio.other > 0 && ` O:${team.genderRatio.other}%`}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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