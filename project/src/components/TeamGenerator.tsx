import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Settings, Shuffle, User, Star, Filter, X, RotateCcw, Plus, Minus } from 'lucide-react';
import { AppScreen, Member, Team, Gender, CustomAttribute, CustomRule, TeamGenerationOptions } from '../types';
import { DataManager } from '../utils/dataManager';
import { TeamBalancer } from '../utils/teamBalancer';
import { applyFilters } from '../utils/filters';
import { SelectionBar } from './SelectionBar';
import { useSelectionStore } from '../state/selectionStore';

interface TeamGeneratorProps {
  onNavigate: (screen: AppScreen, data?: any) => void;
}

export default function TeamGenerator({ onNavigate }: TeamGeneratorProps) {
  // Pool and teams
  const [attendancePool, setAttendancePool] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filter states
  const [genderFilter, setGenderFilter] = useState<Record<Gender, boolean>>({
    Male: true, Female: true, Other: true
  });
  // Age bands - predefined ranges users can select multiple of
  const AGE_BANDS = [
    { id: 'kids', label: 'Kids (8-12)', min: 8, max: 12 },
    { id: 'teens', label: 'Teens (13-17)', min: 13, max: 17 },
    { id: 'young-adults', label: 'Young Adults (18-25)', min: 18, max: 25 },
    { id: 'adults', label: 'Adults (26-35)', min: 26, max: 35 },
    { id: 'seniors', label: 'Seniors (36+)', min: 36, max: 100 }
  ];
  
  const [selectedAgeBands, setSelectedAgeBands] = useState<string[]>([]);
  const [genderMode, setGenderMode] = useState<'mixed' | 'separated'>('mixed');
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
  
  // Selection store - subscribe to reactive values
  const selectedMemberIds = useSelectionStore(state => state.selectedMemberIds);
  
  // Helper function to save filters when persistFilters is enabled
  const saveFiltersToStorage = (filtersToSave: any) => {
    if (settings.persistFilters) {
      localStorage.setItem('team-generator-filters', JSON.stringify(filtersToSave));
    }
  };

  useEffect(() => {
    // Load custom attributes on mount
    setCustomAttributes(dataManager.getCustomAttributes());
    
    // Load persisted filters if enabled
    if (settings.persistFilters) {
      const savedFilters = localStorage.getItem('team-generator-filters');
      if (savedFilters) {
        try {
          const parsed = JSON.parse(savedFilters);
          if (parsed.genderFilter) setGenderFilter(parsed.genderFilter);
          
          // Backward compatibility: Convert old ageRange to selectedAgeBands
          if (parsed.selectedAgeBands) {
            setSelectedAgeBands(parsed.selectedAgeBands);
          } else if (parsed.ageRange) {
            // Map old age range to appropriate age bands
            const matchingBands = AGE_BANDS.filter(band => {
              const rangeOverlaps = (
                (parsed.ageRange.min == null || band.max >= parsed.ageRange.min) &&
                (parsed.ageRange.max == null || band.min <= parsed.ageRange.max)
              );
              return rangeOverlaps;
            }).map(band => band.id);
            setSelectedAgeBands(matchingBands);
          }
          
          if (parsed.genderMode) setGenderMode(parsed.genderMode);
          if (parsed.skillRange) setSkillRange(parsed.skillRange);
          if (parsed.customRules) setCustomRules(parsed.customRules);
          if (parsed.numberOfTeams) {
            setGenerationOptions(prev => ({ ...prev, numberOfTeams: parsed.numberOfTeams }));
          }
        } catch (error) {
          console.error('Failed to load persisted filters:', error);
        }
      }
    }
  }, []);

  // Update attendance pool when selection changes
  useEffect(() => {
    const pool = dataManager.getPresentMembersByIds(selectedMemberIds);
    setAttendancePool(pool);
  }, [selectedMemberIds, dataManager]);

  // Auto-save filters when they change
  useEffect(() => {
    const filtersToSave = {
      genderFilter,
      selectedAgeBands,
      genderMode,
      skillRange,
      customRules,
      numberOfTeams: generationOptions.numberOfTeams
    };
    saveFiltersToStorage(filtersToSave);
  }, [genderFilter, selectedAgeBands, genderMode, skillRange, customRules, generationOptions.numberOfTeams, settings.persistFilters]);

  // Apply filters whenever filters or pool changes
  useEffect(() => {
    // Convert age bands to age ranges for filtering
    const ageRanges = selectedAgeBands.length > 0 
      ? selectedAgeBands.map(bandId => AGE_BANDS.find(b => b.id === bandId)!).filter(Boolean)
      : [];
    
    const filtered = applyFilters(attendancePool, { 
      genderFilter, 
      ageBands: ageRanges,
      skillRange, 
      customRules 
    });
    setFilteredMembers(filtered);
    
    // Auto-adjust number of teams based on available members and gender mode
    const divisor = settings.teamClampRule === 'conservative' ? 2 : 1;
    const minTeamsNeeded = genderMode === 'separated' 
      ? Object.keys(filtered.reduce((acc, member) => {
          if (!acc[member.gender]) acc[member.gender] = [];
          acc[member.gender].push(member);
          return acc;
        }, {} as Record<string, Member[]>)).filter(gender => filtered.some(m => m.gender === gender)).length
      : 2;
    const baseMax = Math.max(2, Math.min(8, Math.floor(filtered.length / divisor)));
    const adjustedMin = Math.max(2, minTeamsNeeded);
    const adjustedMax = Math.max(adjustedMin, baseMax);
    
    // Clamp numberOfTeams to valid range [adjustedMin, adjustedMax]
    if (generationOptions.numberOfTeams < adjustedMin || generationOptions.numberOfTeams > adjustedMax) {
      const clampedValue = Math.max(adjustedMin, Math.min(adjustedMax, generationOptions.numberOfTeams));
      setGenerationOptions(prev => ({ ...prev, numberOfTeams: clampedValue }));
    }
  }, [attendancePool, genderFilter, selectedAgeBands, skillRange, customRules, generationOptions.numberOfTeams, settings.teamClampRule, genderMode]);

  // Filter manipulation functions
  const resetFilters = () => {
    setGenderFilter({ Male: true, Female: true, Other: true });
    setSelectedAgeBands([]);
    setGenderMode('mixed');
    setSkillRange({});
    setCustomRules([]);
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

  // Helper functions for filter chips
  const getActiveGenderFilters = () => {
    const active = Object.entries(genderFilter).filter(([_, isActive]) => isActive).map(([gender, _]) => gender);
    const all = Object.keys(genderFilter);
    return { active, isPartial: active.length < all.length && active.length > 0 };
  };

  const hasActiveAgeFilter = () => selectedAgeBands.length > 0;
  const hasActiveSkillFilter = () => skillRange.min !== undefined || skillRange.max !== undefined;

  const removeGenderFilter = () => {
    setGenderFilter({ Male: true, Female: true, Other: true });
  };

  const removeAgeFilter = () => {
    setSelectedAgeBands([]);
  };

  const removeSkillFilter = () => {
    setSkillRange({});
  };

  const removeAllCustomRules = () => {
    setCustomRules([]);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    const { isPartial } = getActiveGenderFilters();
    return isPartial || hasActiveAgeFilter() || hasActiveSkillFilter() || customRules.length > 0;
  };

  const generateTeams = async () => {
    if (filteredMembers.length < 2) return;
    
    setIsGenerating(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let newTeams;
    
    if (genderMode === 'separated') {
      // Separate members by gender and generate teams for each group
      const membersByGender = filteredMembers.reduce((acc, member) => {
        if (!acc[member.gender]) acc[member.gender] = [];
        acc[member.gender].push(member);
        return acc;
      }, {} as Record<string, Member[]>);
      
      const genderEntries = Object.entries(membersByGender).filter(([_, members]) => members.length > 0);
      const totalMembers = filteredMembers.length;
      
      // Check if we can honor the exact request (need at least 1 team per gender)
      const minTeamsNeeded = genderEntries.length;
      const requestedTeams = generationOptions.numberOfTeams;
      
      if (requestedTeams < minTeamsNeeded) {
        // Block generation - cannot have fewer teams than genders in separated mode
        alert(`Cannot generate ${requestedTeams} teams when separating by gender. Need at least ${minTeamsNeeded} teams (one per gender).`);
        setIsGenerating(false);
        return;
      }
      
      // Min-1 seeding: Give each gender 1 team, then distribute the rest
      const genderAllocations = genderEntries.map(([gender, members]) => ({
        gender,
        members,
        finalAllocation: 1 // Start with 1 team per gender
      }));
      
      // Distribute remaining teams using largest-remainder method
      const remainingTeams = requestedTeams - minTeamsNeeded;
      
      if (remainingTeams > 0) {
        const remainderData = genderEntries.map(([gender, members]) => {
          const proportion = members.length / totalMembers;
          const exactAllocation = proportion * remainingTeams;
          const baseAllocation = Math.floor(exactAllocation);
          const remainder = exactAllocation - baseAllocation;
          return { gender, baseAllocation, remainder };
        });
        
        // Add base allocations to each gender
        genderAllocations.forEach(allocation => {
          const data = remainderData.find(d => d.gender === allocation.gender);
          allocation.finalAllocation += data?.baseAllocation || 0;
        });
        
        // Distribute remaining teams to genders with largest remainders
        const totalBaseAllocated = remainderData.reduce((sum, d) => sum + d.baseAllocation, 0);
        const leftover = remainingTeams - totalBaseAllocated;
        
        if (leftover > 0) {
          const sortedByRemainder = remainderData.slice().sort((a, b) => b.remainder - a.remainder);
          for (let i = 0; i < leftover && i < sortedByRemainder.length; i++) {
            const allocation = genderAllocations.find(a => a.gender === sortedByRemainder[i].gender);
            if (allocation) allocation.finalAllocation += 1;
          }
        }
      }
      
      // Verify allocation sums to exactly the requested team count
      const verifyTotal = genderAllocations.reduce((sum, allocation) => sum + allocation.finalAllocation, 0);
      if (verifyTotal !== requestedTeams) {
        console.error(`Team allocation error: expected ${requestedTeams}, got ${verifyTotal}`);
      }
      
      // Generate teams for each gender using their exact allocation
      const allGenderTeams = [];
      
      genderAllocations.forEach(({ gender, members, finalAllocation }) => {
        // Use TeamBalancer for all cases (removes singleton special case)
        const genderTeams = TeamBalancer.generateTeams(members, {
          ...generationOptions,
          // Override conflicting settings for gender separation
          type: genderMode === 'separated' ? 'balanced' : generationOptions.type,
          numberOfTeams: finalAllocation
        });
        // Add gender prefix to team names
        genderTeams.forEach(team => {
          team.name = `${gender} ${team.name}`;
        });
        allGenderTeams.push(...genderTeams);
      });
      
      newTeams = allGenderTeams;
    } else {
      // Mixed teams (default)
      newTeams = TeamBalancer.generateTeams(filteredMembers, generationOptions);
    }
    
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

      {/* Selection Bar */}
      <SelectionBar />

      <div className="p-4 space-y-6">
        
        {/* No Selection Hint */}
        {attendancePool.length === 0 && (
          <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4 text-center">
            <p className="text-sm opacity-80">
              No one selected. Open the bar above to pick locations/groups/members.
            </p>
          </div>
        )}

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
            {/* Gender Mode Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Team Gender Composition</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="genderMode"
                    value="mixed"
                    checked={genderMode === 'mixed'}
                    onChange={(e) => {
                      setGenderMode('mixed');
                    }}
                    className="w-4 h-4 text-[#f2e205] bg-[#2a2a2a] border-gray-600 focus:ring-[#f2e205]"
                  />
                  <span className="text-sm">Mixed Teams</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="genderMode"
                    value="separated"
                    checked={genderMode === 'separated'}
                    onChange={(e) => {
                      setGenderMode('separated');
                    }}
                    className="w-4 h-4 text-[#f2e205] bg-[#2a2a2a] border-gray-600 focus:ring-[#f2e205]"
                  />
                  <span className="text-sm">Gender Separated Teams</span>
                </label>
              </div>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Gender Filter</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(genderFilter) as Gender[]).map(gender => (
                  <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genderFilter[gender]}
                      onChange={(e) => {
                        setGenderFilter(prev => ({ ...prev, [gender]: e.target.checked }));
                      }}
                      className="w-4 h-4 text-[#f2e205] bg-[#2a2a2a] border-gray-600 rounded focus:ring-[#f2e205]"
                    />
                    <span className="text-sm">{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Bands Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Age Groups</label>
              <div className="grid grid-cols-2 gap-2">
                {AGE_BANDS.map(band => (
                  <label key={band.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAgeBands.includes(band.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAgeBands(prev => [...prev, band.id]);
                        } else {
                          setSelectedAgeBands(prev => prev.filter(id => id !== band.id));
                        }
                      }}
                      className="w-4 h-4 text-[#f2e205] bg-[#2a2a2a] border-gray-600 rounded focus:ring-[#f2e205]"
                    />
                    <span className="text-sm">{band.label}</span>
                  </label>
                ))}
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
                      }}
                      className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2"
                      placeholder="Value"
                    />
                    <button
                      onClick={() => {
                        removeCustomRule(index);
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
              {(() => {
                const minTeamsNeeded = genderMode === 'separated' 
                  ? Object.keys(filteredMembers.reduce((acc, member) => {
                      if (!acc[member.gender]) acc[member.gender] = [];
                      acc[member.gender].push(member);
                      return acc;
                    }, {} as Record<string, Member[]>)).filter(gender => filteredMembers.some(m => m.gender === gender)).length
                  : 2;
                const baseMax = Math.max(2, Math.min(8, Math.floor(filteredMembers.length / (settings.teamClampRule === 'conservative' ? 2 : 1))));
                const adjustedMin = Math.max(2, minTeamsNeeded);
                const adjustedMax = Math.max(adjustedMin, baseMax);
                
                return (
                  <>
                    <input
                      type="range"
                      min={adjustedMin}
                      max={adjustedMax}
                      value={generationOptions.numberOfTeams}
                      onChange={(e) => {
                        const newOptions = { 
                          ...generationOptions, 
                          numberOfTeams: parseInt(e.target.value)
                        };
                        setGenerationOptions(newOptions);
                      }}
                      className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs opacity-60 mt-1">
                      <span>{adjustedMin}</span>
                      <span>{adjustedMax}</span>
                    </div>
                    {genderMode === 'separated' && minTeamsNeeded > 2 && (
                      <div className="text-xs text-yellow-400 mt-1">
                        Need at least {minTeamsNeeded} teams when separating by gender
                      </div>
                    )}
                  </>
                );
              })()}
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

        {/* Active Filter Summary Chips */}
        {hasActiveFilters() && (
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center space-x-2">
              <Filter size={16} className="text-[#f2e205]" />
              <span>Active Filters</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {/* Gender Filter Chip */}
              {(() => {
                const { active, isPartial } = getActiveGenderFilters();
                return isPartial && (
                  <div className="flex items-center space-x-2 bg-[#2a2a2a] px-3 py-1.5 rounded-lg">
                    <span className="text-sm">
                      Gender: {active.join(', ')} only
                    </span>
                    <button
                      onClick={removeGenderFilter}
                      className="p-0.5 hover:bg-[#3a3a3a] rounded transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })()}

              {/* Age Range Filter Chip */}
              {hasActiveAgeFilter() && (
                <div className="flex items-center space-x-2 bg-[#2a2a2a] px-3 py-1.5 rounded-lg">
                  <span className="text-sm">
                    Age: {ageRange.min || '?'}-{ageRange.max || '?'}
                  </span>
                  <button
                    onClick={removeAgeFilter}
                    className="p-0.5 hover:bg-[#3a3a3a] rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Skill Range Filter Chip */}
              {hasActiveSkillFilter() && (
                <div className="flex items-center space-x-2 bg-[#2a2a2a] px-3 py-1.5 rounded-lg">
                  <span className="text-sm">
                    Skill: {skillRange.min || '?'}-{skillRange.max || '?'}
                  </span>
                  <button
                    onClick={removeSkillFilter}
                    className="p-0.5 hover:bg-[#3a3a3a] rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Custom Rules Chip */}
              {customRules.length > 0 && (
                <div className="flex items-center space-x-2 bg-[#2a2a2a] px-3 py-1.5 rounded-lg">
                  <span className="text-sm">
                    {customRules.length} custom rule{customRules.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={removeAllCustomRules}
                    className="p-0.5 hover:bg-[#3a3a3a] rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Clear All Filters Button */}
              <button
                onClick={resetFilters}
                className="flex items-center space-x-1 bg-[#f2e205] text-[#0d0d0d] px-3 py-1.5 rounded-lg hover:bg-[#e6d600] transition-colors text-sm font-medium"
              >
                <RotateCcw size={14} />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        )}

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