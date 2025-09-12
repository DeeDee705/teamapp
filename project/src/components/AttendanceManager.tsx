import { useState, useEffect, useCallback, memo } from 'react';
import { ArrowLeft, MapPin, Edit2, Trash2, UserCheck, Star, User, ChevronDown, ChevronRight } from 'lucide-react';
import { AppScreen, Location, Group, Member, Gender } from '../types';
import { DataManager } from '../utils/dataManager';

interface AttendanceManagerProps {
  onNavigate: (screen: AppScreen, data?: any) => void;
}

// Debounce timer for presence updates
let presenceTimer: Record<string, any> = {};

export default function AttendanceManager({ onNavigate }: AttendanceManagerProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Accordion state - only one location OR group open at a time
  const [openLocationId, setOpenLocationId] = useState<string | null>(null);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  
  // Selected groups for team generation
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  
  // Forms and management state
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  // Optimistic presence updates
  const [presenceByMemberId, setPresenceByMemberId] = useState<Record<string, boolean>>({});
  
  // Member form appears only inside open groups
  const [showAddMemberFormGroupId, setShowAddMemberFormGroupId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    birthYear: new Date().getFullYear() - 25,
    gender: 'Male' as Gender,
    skillLevel: 3 as 1 | 2 | 3 | 4 | 5
  });
  
  const [error, setError] = useState('');

  const dataManager = DataManager.getInstance();
  const settings = dataManager.getSettings();

  useEffect(() => {
    loadLocations();
  }, []);

  // Accordion handlers - only one location OR group open at a time
  const handleToggleLocation = useCallback((locationId: string) => {
    setOpenGroupId(null); // Close any open group when switching locations
    setShowAddMemberFormGroupId(null); // Close any open member forms
    setOpenLocationId(prev => (prev === locationId ? null : locationId));
  }, []);

  const handleToggleGroup = useCallback((groupId: string) => {
    setShowAddMemberFormGroupId(null); // Close any open member forms when switching groups
    setOpenGroupId(prev => (prev === groupId ? null : groupId));
  }, []);

  // Optimistic presence updates with debounced saves
  const debouncedSavePresence = useCallback((locationId: string, memberId: string, newVal: boolean) => {
    clearTimeout(presenceTimer[memberId]);
    presenceTimer[memberId] = setTimeout(() => {
      try {
        dataManager.updateMemberPresence(locationId, memberId, newVal);
      } catch (error) {
        // Revert on failure
        setPresenceByMemberId(prev => ({ ...prev, [memberId]: !newVal }));
        setError('Failed to update presence - reverted change');
        setTimeout(() => setError(''), 3000);
      }
    }, 300);
  }, [dataManager]);

  const handlePresenceToggle = useCallback((locationId: string, member: Member) => {
    const currentPresence = presenceByMemberId[member.id] ?? member.isPresent;
    const newVal = !currentPresence;

    // Optimistic local update
    setPresenceByMemberId(prev => ({ ...prev, [member.id]: newVal }));

    // Debounced persist
    debouncedSavePresence(locationId, member.id, newVal);
  }, [presenceByMemberId, debouncedSavePresence]);

  const loadLocations = () => {
    const locs = dataManager.getLocations();
    setLocations(locs);
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      setError('Location name is required');
      return;
    }

    try {
      dataManager.createLocation(newLocationName.trim());
      setNewLocationName('');
      setShowAddLocationForm(false);
      setError('');
      loadLocations();
    } catch (err) {
      setError('Failed to add location');
    }
  };

  const handleAddGroup = () => {
    if (!openLocationId || !newGroupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      dataManager.createGroup(openLocationId, newGroupName.trim());
      setNewGroupName('');
      setShowAddGroupForm(false);
      setError('');
      loadLocations();
    } catch (err: any) {
      setError(err.message || 'Failed to add group');
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
  };

  const handleUpdateGroup = () => {
    if (!editingGroup || !newGroupName.trim() || !openLocationId) return;

    dataManager.renameGroup(openLocationId, editingGroup.id, newGroupName.trim());
    setEditingGroup(null);
    setNewGroupName('');
    loadLocations();
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!openLocationId) return;
    if (confirm('Are you sure you want to delete this group? Members will be moved to Unassigned.')) {
      dataManager.deleteGroup(openLocationId, groupId, { reassignToGroupId: null });
      if (openGroupId === groupId) {
        setOpenGroupId(null); // Close if deleting open group
      }
      loadLocations();
    }
  };

  const handleToggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleAddMember = () => {
    if (!openLocationId || !openGroupId || !newMember.name.trim()) {
      setError('Member name is required');
      return;
    }

    try {
      const memberData = {
        name: newMember.name.trim(),
        birthYear: newMember.birthYear,
        gender: newMember.gender,
        skillLevel: newMember.skillLevel,
        isPresent: true,
        groupId: openGroupId === 'unassigned' ? null : openGroupId
      };

      dataManager.addMember(openLocationId, memberData);
      setShowAddMemberFormGroupId(null);
      setNewMember({
        name: '',
        birthYear: new Date().getFullYear() - 25,
        gender: 'Male',
        skillLevel: 3
      });
      setError('');
      loadLocations();
    } catch (err) {
      setError('Failed to add member');
    }
  };

  const handleMoveMember = (memberId: string, toGroupId: string | null) => {
    if (!openLocationId) return;
    dataManager.moveMember(openLocationId, memberId, toGroupId);
    loadLocations();
  };


  const handleGenerateTeams = () => {
    if (selectedGroupIds.length === 0) {
      setError('Please select at least one group to participate');
      return;
    }

    onNavigate('team-generator', { locationId: openLocationId, selectedGroupIds });
  };

  const getAge = (birthYear: number) => new Date().getFullYear() - birthYear;

  const renderSkillStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        size={12} 
        className={i < level ? 'text-yellow-400 fill-current' : 'text-gray-400'} 
      />
    ));
  };

  const getGenderColor = (gender: Gender) => {
    switch (gender) {
      case 'Male': return 'bg-blue-500';
      case 'Female': return 'bg-pink-500';
      case 'Other': return 'bg-purple-500';
    }
  };

  // Get open location data
  const openLocation = locations.find(loc => loc.id === openLocationId);
  
  // Group members for the open location
  const groupedMembers = openLocation?.members.reduce((acc, member) => {
    const groupId = member.groupId || 'unassigned';
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(member);
    return acc;
  }, {} as Record<string, Member[]>) || {};

  // Memoized components for performance
  const LocationHeader = memo(({ location, isOpen, memberCounts }: { 
    location: Location; 
    isOpen: boolean; 
    memberCounts: { total: number; present: number };
  }) => (
    <div 
      className={`p-4 border border-[#3a3a3a] rounded-lg cursor-pointer transition-all duration-200 ${
        isOpen ? 'bg-[#2a2a2a] border-[#F27A6B]' : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
      }`}
      onClick={() => handleToggleLocation(location.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <MapPin size={16} className="text-[#F27A6B]" />
          <h3 className="font-medium">{location.name}</h3>
        </div>
        <div className="text-sm opacity-60">
          {memberCounts.present}/{memberCounts.total} present
        </div>
      </div>
    </div>
  ));

  const GroupHeader = memo(({ 
    group, 
    isOpen, 
    memberCounts,
    isSelected
  }: { 
    group: Group | { id: 'unassigned'; name: 'Unassigned' }; 
    isOpen: boolean; 
    memberCounts: { total: number; present: number };
    isSelected: boolean;
  }) => (
    <div 
      className={`p-3 border border-[#4a4a4a] rounded-lg cursor-pointer transition-all duration-200 ${
        isOpen ? 'bg-[#3a3a3a] border-[#F27A6B]' : 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 flex-1"
          onClick={() => handleToggleGroup(group.id)}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleToggleGroupSelection(group.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded"
          />
          <span className="font-medium text-sm">{group.name}</span>
          <span className="text-xs opacity-60">
            {memberCounts.present}/{memberCounts.total}
          </span>
        </div>
        {group.id !== 'unassigned' && (
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditGroup(group as Group);
              }}
              className="p-1 text-[#F27A6B] hover:bg-[#F27A6B] hover:bg-opacity-20 rounded transition-colors"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGroup(group.id);
              }}
              className="p-1 text-red-400 hover:bg-red-400 hover:bg-opacity-20 rounded transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  ));

  const MemberRow = memo(({ 
    member, 
    locationId,
    isPresent
  }: { 
    member: Member; 
    locationId: string;
    isPresent: boolean;
  }) => {
    
    return (
      <div className="flex items-center justify-between p-3 bg-[#4a4a4a] rounded-lg transition-all duration-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handlePresenceToggle(locationId, member)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              isPresent 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-400 text-gray-400'
            }`}
          >
            {isPresent && <UserCheck size={14} />}
          </button>
          {settings.showGender && <div className={`w-3 h-3 rounded-full ${getGenderColor(member.gender)}`}></div>}
          <div>
            <div className="font-medium text-sm">{member.name}</div>
            {settings.showAge && <div className="text-xs opacity-60">Age {getAge(member.birthYear)}</div>}
          </div>
          {settings.showSkill && (
            <div className="flex space-x-1">
              {renderSkillStars(member.skillLevel)}
            </div>
          )}
        </div>
        <select
          value={member.groupId || ''}
          onChange={(e) => handleMoveMember(member.id, e.target.value || null)}
          className="bg-[#5a5a5a] text-[#f2ebc4] border border-[#6a6a6a] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#F27A6B]"
        >
          <option value="">Unassigned</option>
          {openLocation?.groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
    );
  });

  const selectedGroupsText = selectedGroupIds.length > 0 
    ? `${selectedGroupIds.length} group${selectedGroupIds.length > 1 ? 's' : ''} selected`
    : 'No groups selected';

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2ebc4]">
      {/* Header */}
      <div className="bg-[#F27A6B] text-[#0d0d0d] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-[#0d0d0d] hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">People</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium">{selectedGroupsText}</div>
          {selectedGroupIds.length > 0 && (
            <button
              onClick={handleGenerateTeams}
              className="bg-[#0d0d0d] text-[#F27A6B] px-3 py-1 rounded-lg text-sm font-medium hover:bg-opacity-80 transition-colors"
            >
              Generate Teams
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Progressive Disclosure Accordion */}
        <div className="space-y-4">
          {/* Add Location Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Locations</h2>
            <button
              onClick={() => setShowAddLocationForm(true)}
              className="bg-[#F27A6B] text-[#0d0d0d] px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#e36a5b] transition-colors"
            >
              + Add Location
            </button>
          </div>

          {/* Add Location Form */}
          {showAddLocationForm && (
            <div className="p-4 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
              <input
                type="text"
                placeholder="Location name"
                value={newLocationName}
                onChange={(e) => {
                  setNewLocationName(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B] mb-3"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAddLocation}
                  className="bg-[#F27A6B] text-[#0d0d0d] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e36a5b] transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddLocationForm(false);
                    setNewLocationName('');
                    setError('');
                  }}
                  className="px-4 py-2 text-[#f2ebc4] border border-[#4a4a4a] rounded-lg text-sm hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Level 1: Locations Accordion */}
          {locations.length > 0 ? (
            <div className="space-y-3">
              {locations.map(location => {
                const isLocationOpen = openLocationId === location.id;
                const memberCounts = {
                  total: location.members.length,
                  present: location.members.filter(m => 
                    (presenceByMemberId[m.id] ?? m.isPresent)
                  ).length
                };

                return (
                  <div key={location.id} className="space-y-2">
                    <LocationHeader
                      location={location}
                      isOpen={isLocationOpen}
                      memberCounts={memberCounts}
                    />

                    {/* Level 2: Groups Accordion (inside open location) */}
                    {isLocationOpen && (
                      <div className="ml-4 space-y-2">
                        {/* Add Group Button and Form */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Groups</span>
                          <button
                            onClick={() => setShowAddGroupForm(true)}
                            disabled={location.groups.length >= settings.maxGroupsPerLocation}
                            className="bg-[#F27A6B] text-[#0d0d0d] px-2 py-1 rounded text-xs font-medium hover:bg-[#e36a5b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            + Add Group ({location.groups.length}/{settings.maxGroupsPerLocation})
                          </button>
                        </div>

                        {(showAddGroupForm || editingGroup) && (
                          <div className="p-3 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
                            <input
                              type="text"
                              placeholder="Group name"
                              value={newGroupName}
                              onChange={(e) => {
                                setNewGroupName(e.target.value);
                                setError('');
                              }}
                              className="w-full bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B] mb-3"
                              autoFocus
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={editingGroup ? handleUpdateGroup : handleAddGroup}
                                className="bg-[#F27A6B] text-[#0d0d0d] px-3 py-1 rounded text-sm font-medium hover:bg-[#e36a5b] transition-colors"
                              >
                                {editingGroup ? 'Update' : 'Add'}
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddGroupForm(false);
                                  setEditingGroup(null);
                                  setNewGroupName('');
                                  setError('');
                                }}
                                className="px-3 py-1 text-[#f2ebc4] border border-[#4a4a4a] rounded text-sm hover:bg-[#2a2a2a] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Groups List */}
                        {[...location.groups, { id: 'unassigned', name: 'Unassigned' }].map(group => {
                          const members = groupedMembers[group.id] || [];
                          const isGroupOpen = openGroupId === group.id;
                          const memberCounts = {
                            total: members.length,
                            present: members.filter(m => 
                              (presenceByMemberId[m.id] ?? m.isPresent)
                            ).length
                          };
                          const isSelected = selectedGroupIds.includes(group.id);

                          return (
                            <div key={group.id} className="space-y-2">
                              <GroupHeader
                                group={group}
                                isOpen={isGroupOpen}
                                memberCounts={memberCounts}
                                isSelected={isSelected}
                              />

                              {/* Level 3: Members List (inside open group) */}
                              {isGroupOpen && (
                                <div className="ml-4 space-y-2">
                                  {/* Add Member Button and Form - only when group is open */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Members</span>
                                    <button
                                      onClick={() => {
                                        setShowAddMemberFormGroupId(group.id);
                                        setNewMember({
                                          name: '',
                                          birthYear: new Date().getFullYear() - 25,
                                          gender: 'Male',
                                          skillLevel: 3
                                        });
                                      }}
                                      className="bg-[#F27A6B] text-[#0d0d0d] px-2 py-1 rounded text-xs font-medium hover:bg-[#e36a5b] transition-colors"
                                    >
                                      + Add Member
                                    </button>
                                  </div>

                                  {/* Add Member Form - only appears in open group */}
                                  {showAddMemberFormGroupId === group.id && (
                                    <div className="p-3 bg-[#3a3a3a] rounded-lg border border-[#4a4a4a]">
                                      <div className="grid grid-cols-1 gap-2 mb-3">
                                        <input
                                          type="text"
                                          placeholder="Name"
                                          value={newMember.name}
                                          onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                                          className="bg-[#4a4a4a] text-[#f2ebc4] border border-[#5a5a5a] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B]"
                                          autoFocus
                                        />
                                        {settings.showAge && (
                                          <input
                                            type="number"
                                            placeholder="Birth Year"
                                            value={newMember.birthYear}
                                            onChange={(e) => setNewMember(prev => ({ ...prev, birthYear: parseInt(e.target.value) || new Date().getFullYear() - 25 }))}
                                            className="bg-[#4a4a4a] text-[#f2ebc4] border border-[#5a5a5a] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B]"
                                          />
                                        )}
                                        {settings.showGender && (
                                          <select
                                            value={newMember.gender}
                                            onChange={(e) => setNewMember(prev => ({ ...prev, gender: e.target.value as Gender }))}
                                            className="bg-[#4a4a4a] text-[#f2ebc4] border border-[#5a5a5a] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B]"
                                          >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                          </select>
                                        )}
                                        {settings.showSkill && (
                                          <select
                                            value={newMember.skillLevel}
                                            onChange={(e) => setNewMember(prev => ({ ...prev, skillLevel: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                                            className="bg-[#4a4a4a] text-[#f2ebc4] border border-[#5a5a5a] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B]"
                                          >
                                            <option value={1}>Skill Level 1</option>
                                            <option value={2}>Skill Level 2</option>
                                            <option value={3}>Skill Level 3</option>
                                            <option value={4}>Skill Level 4</option>
                                            <option value={5}>Skill Level 5</option>
                                          </select>
                                        )}
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={handleAddMember}
                                          className="bg-[#F27A6B] text-[#0d0d0d] px-3 py-1 rounded text-sm font-medium hover:bg-[#e36a5b] transition-colors"
                                        >
                                          Add to {group.name}
                                        </button>
                                        <button
                                          onClick={() => {
                                            setShowAddMemberFormGroupId(null);
                                            setNewMember({ name: '', birthYear: new Date().getFullYear() - 25, gender: 'Male', skillLevel: 3 });
                                          }}
                                          className="px-3 py-1 text-[#f2ebc4] border border-[#5a5a5a] rounded text-sm hover:bg-[#2a2a2a] transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Members List */}
                                  {members.length > 0 ? (
                                    <div className="space-y-2">
                                      {members.map(member => {
                                        const isPresent = presenceByMemberId[member.id] ?? member.isPresent;
                                        return (
                                          <MemberRow
                                            key={member.id}
                                            member={member}
                                            locationId={location.id}
                                            isPresent={isPresent}
                                          />
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4">
                                      <User size={24} className="mx-auto mb-2 opacity-40" />
                                      <p className="text-xs opacity-60">No members in this group</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin size={48} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm opacity-60">No locations yet. Add your first location to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}