import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shuffle, Users, Filter, User, Star } from 'lucide-react';
import { AppScreen, Location, Member } from '../types';
import { DataManager } from '../utils/dataManager';
import { TeamBalancer } from '../utils/teamBalancer';

interface RandomPickerProps {
  onNavigate: (screen: AppScreen, data?: any) => void;
}

export default function RandomPicker({ onNavigate }: RandomPickerProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [pickCount, setPickCount] = useState(1);
  const [filters, setFilters] = useState({
    gender: '',
    minAge: '',
    maxAge: '',
    minSkill: '',
    maxSkill: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const dataManager = DataManager.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updateAvailableMembers();
  }, [selectedLocations]);

  const loadData = () => {
    const allLocations = dataManager.getLocations();
    setLocations(allLocations);
    if (allLocations.length > 0) {
      setSelectedLocations([allLocations[0].id]);
    }
  };

  const updateAvailableMembers = () => {
    const members = dataManager.getPresentMembers(selectedLocations);
    setAvailableMembers(members);
    
    // Adjust pick count if it exceeds available members
    if (pickCount > members.length) {
      setPickCount(Math.max(1, members.length));
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

  const pickRandomMembers = async () => {
    if (availableMembers.length === 0) return;
    
    setIsSelecting(true);
    
    // Build filter object
    const filterObject: any = {};
    
    if (filters.gender) {
      filterObject.gender = filters.gender;
    }
    
    if (filters.minAge || filters.maxAge) {
      filterObject.ageRange = {
        min: parseInt(filters.minAge) || 0,
        max: parseInt(filters.maxAge) || 100
      };
    }
    
    if (filters.minSkill || filters.maxSkill) {
      filterObject.skillRange = {
        min: parseInt(filters.minSkill) || 1,
        max: parseInt(filters.maxSkill) || 5
      };
    }
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const picked = TeamBalancer.getRandomMembers(availableMembers, pickCount, filterObject);
    setSelectedMembers(picked);
    setIsSelecting(false);
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

  const getFilteredMemberCount = () => {
    let filtered = [...availableMembers];
    
    if (filters.gender) {
      filtered = filtered.filter(m => m.gender === filters.gender);
    }
    
    if (filters.minAge || filters.maxAge) {
      const minAge = parseInt(filters.minAge) || 0;
      const maxAge = parseInt(filters.maxAge) || 100;
      filtered = filtered.filter(m => m.age >= minAge && m.age <= maxAge);
    }
    
    if (filters.minSkill || filters.maxSkill) {
      const minSkill = parseInt(filters.minSkill) || 1;
      const maxSkill = parseInt(filters.maxSkill) || 5;
      filtered = filtered.filter(m => m.skillLevel >= minSkill && m.skillLevel <= maxSkill);
    }
    
    return filtered.length;
  };

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
          <h1 className="text-xl font-semibold">Random Picker</h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${
            showFilters ? 'bg-[#0d0d0d] text-[#f2e205]' : 'bg-[#0d0d0d] bg-opacity-20 hover:bg-opacity-30'
          }`}
        >
          <Filter size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Location Selection */}
        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
            <Users size={20} className="text-[#f2e205]" />
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

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Filter size={20} className="text-[#f2e205]" />
              <span>Filters</span>
            </h3>
            
            <div className="space-y-4">
              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:border-[#f2e205]"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male Only</option>
                  <option value="Female">Female Only</option>
                  <option value="Other">Other Only</option>
                </select>
              </div>

              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Age Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min age"
                    value={filters.minAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAge: e.target.value }))}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2 focus:outline-none focus:border-[#f2e205]"
                  />
                  <input
                    type="number"
                    placeholder="Max age"
                    value={filters.maxAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2 focus:outline-none focus:border-[#f2e205]"
                  />
                </div>
              </div>

              {/* Skill Level Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Skill Level Range</label>
                <div className="flex space-x-2">
                  <select
                    value={filters.minSkill}
                    onChange={(e) => setFilters(prev => ({ ...prev, minSkill: e.target.value }))}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2 focus:outline-none focus:border-[#f2e205]"
                  >
                    <option value="">Min skill</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <select
                    value={filters.maxSkill}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxSkill: e.target.value }))}
                    className="flex-1 bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2 focus:outline-none focus:border-[#f2e205]"
                  >
                    <option value="">Max skill</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => setFilters({
                  gender: '',
                  minAge: '',
                  maxAge: '',
                  minSkill: '',
                  maxSkill: ''
                })}
                className="w-full bg-transparent border border-[#3a3a3a] text-[#f2ebc4] py-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Pick Count */}
        <div className="bg-[#1a1a1a] rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-3">Number to Pick</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPickCount(Math.max(1, pickCount - 1))}
              className="w-10 h-10 bg-[#2a2a2a] text-[#f2ebc4] rounded-lg hover:bg-[#3a3a3a] transition-colors flex items-center justify-center"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-[#f2e205]">{pickCount}</div>
              <div className="text-sm opacity-60">
                from {getFilteredMemberCount()} available
              </div>
            </div>
            <button
              onClick={() => setPickCount(Math.min(getFilteredMemberCount(), pickCount + 1))}
              disabled={pickCount >= getFilteredMemberCount()}
              className="w-10 h-10 bg-[#2a2a2a] text-[#f2ebc4] rounded-lg hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
          
          {/* Quick Pick Buttons */}
          <div className="flex space-x-2 mt-4">
            {[1, 2, 3, 5, 10].filter(n => n <= getFilteredMemberCount()).map(num => (
              <button
                key={num}
                onClick={() => setPickCount(num)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pickCount === num 
                    ? 'bg-[#f2e205] text-[#0d0d0d]' 
                    : 'bg-[#2a2a2a] text-[#f2ebc4] hover:bg-[#3a3a3a]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Pick Button */}
        <button
          onClick={pickRandomMembers}
          disabled={availableMembers.length === 0 || isSelecting || getFilteredMemberCount() === 0}
          className="w-full bg-[#f2e205] text-[#0d0d0d] py-4 rounded-xl font-semibold hover:bg-[#e6d600] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isSelecting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0d0d0d]"></div>
              <span>Selecting...</span>
            </>
          ) : (
            <>
              <Shuffle size={20} />
              <span>Pick Random Members</span>
            </>
          )}
        </button>

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <User size={24} className="text-[#f2e205]" />
              <span>Selected Members ({selectedMembers.length})</span>
            </h3>
            
            <div className="space-y-3">
              {selectedMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="bg-[#1a1a1a] rounded-xl p-4 transform transition-all duration-300"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'slideInUp 0.5s ease-out forwards'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#f2e205] rounded-full flex items-center justify-center text-[#0d0d0d] font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{member.name}</h4>
                        <div className="flex items-center space-x-4 text-sm opacity-60">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.gender === 'Male' ? 'bg-blue-500 bg-opacity-20 text-blue-300' :
                            member.gender === 'Female' ? 'bg-pink-500 bg-opacity-20 text-pink-300' :
                            'bg-purple-500 bg-opacity-20 text-purple-300'
                          }`}>
                            {member.gender}
                          </span>
                          <span>Age: {member.age}</span>
                          <div className="flex items-center space-x-1">
                            <span>Skill:</span>
                            <div className="flex">
                              {getSkillStars(member.skillLevel)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pick Again Button */}
            <button
              onClick={pickRandomMembers}
              className="w-full bg-transparent border-2 border-[#f2e205] text-[#f2e205] py-3 rounded-xl font-semibold hover:bg-[#f2e205] hover:text-[#0d0d0d] transition-colors flex items-center justify-center space-x-2"
            >
              <Shuffle size={20} />
              <span>Pick Again</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {availableMembers.length === 0 && (
          <div className="text-center py-12">
            <User size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-semibold mb-2">No members available</h3>
            <p className="opacity-60 mb-6">
              Add members to locations or mark them as present
            </p>
            <button
              onClick={() => onNavigate('locations')}
              className="bg-[#f2e205] text-[#0d0d0d] px-6 py-3 rounded-lg font-semibold hover:bg-[#e6d600] transition-colors"
            >
              Manage Locations
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}