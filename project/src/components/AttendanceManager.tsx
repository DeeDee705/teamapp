import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Edit2, Trash2, UserCheck, Star, User, ChevronDown, ChevronRight, Search, CheckSquare, Square } from 'lucide-react';
import { AppScreen, Location, Group, Member, Gender } from '../types';
import { DataManager } from '../utils/dataManager';
import { APP_CONFIG } from '../config/app';

interface AttendanceManagerProps {
  onNavigate: (screen: AppScreen, data?: any) => void;
}

export default function AttendanceManager({ onNavigate }: AttendanceManagerProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  
  // Location management
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  
  // Group management
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  // Member management
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    birthYear: new Date().getFullYear() - 25,
    gender: 'Male' as Gender,
    skillLevel: 3 as 1 | 2 | 3 | 4 | 5,
    groupId: null as string | null
  });
  
  // Group UI state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [groupSearches, setGroupSearches] = useState<Record<string, string>>({});
  
  const [error, setError] = useState('');

  const dataManager = DataManager.getInstance();
  const settings = dataManager.getSettings();

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    // Apply default collapse setting when location changes
    if (selectedLocation) {
      const settings = dataManager.getSettings();
      if (settings.defaultCollapseGroups) {
        const collapsed: Record<string, boolean> = {};
        selectedLocation.groups.forEach(group => {
          const memberCount = groupedMembers[group.id]?.length || 0;
          collapsed[group.id] = memberCount > 10; // Collapse groups with > 10 members
        });
        setExpandedGroups(collapsed);
      }
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedLocationId) {
      const location = locations.find(loc => loc.id === selectedLocationId);
      setSelectedLocation(location || null);
    } else {
      setSelectedLocation(null);
    }
  }, [selectedLocationId, locations]);

  const loadLocations = () => {
    const locs = dataManager.getLocations();
    setLocations(locs);
    if (locs.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locs[0].id);
    }
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
    if (!selectedLocationId || !newGroupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      dataManager.createGroup(selectedLocationId, newGroupName.trim());
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
    if (!editingGroup || !newGroupName.trim()) return;

    dataManager.renameGroup(selectedLocationId, editingGroup.id, newGroupName.trim());
    setEditingGroup(null);
    setNewGroupName('');
    loadLocations();
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group? Members will be moved to Unassigned.')) {
      dataManager.deleteGroup(selectedLocationId, groupId, { reassignToGroupId: null });
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
    if (!selectedLocationId || !newMember.name.trim()) {
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
        groupId: newMember.groupId
      };

      dataManager.addMember(selectedLocationId, memberData);
      setNewMember({
        name: '',
        birthYear: new Date().getFullYear() - 25,
        gender: 'Male',
        skillLevel: 3,
        groupId: null
      });
      setShowAddMemberForm(false);
      setError('');
      loadLocations();
    } catch (err) {
      setError('Failed to add member');
    }
  };

  const handleTogglePresence = (memberId: string, isPresent: boolean) => {
    dataManager.updateMemberPresence(selectedLocationId, memberId, isPresent);
    loadLocations();
  };

  const handleMoveMember = (memberId: string, toGroupId: string | null) => {
    dataManager.moveMember(selectedLocationId, memberId, toGroupId);
    loadLocations();
  };

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleGroupSearch = (groupId: string, search: string) => {
    setGroupSearches(prev => ({
      ...prev,
      [groupId]: search
    }));
  };

  const toggleAllGroupPresence = (groupId: string | null, isPresent: boolean) => {
    const members = groupedMembers[groupId || 'unassigned'] || [];
    members.forEach(member => {
      dataManager.updateMemberPresence(selectedLocationId, member.id, isPresent);
    });
    loadLocations();
  };

  const filterMembersBySearch = (members: Member[], search: string) => {
    if (!search.trim()) return members;
    return members.filter(member => 
      member.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleGenerateTeams = () => {
    if (!selectedLocation || selectedGroupIds.length === 0) {
      setError('Please select at least one group to participate');
      return;
    }

    onNavigate('team-generator', { selectedLocationId, selectedGroupIds });
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

  const groupedMembers = selectedLocation?.members.reduce((acc, member) => {
    const groupId = member.groupId || 'unassigned';
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(member);
    return acc;
  }, {} as Record<string, Member[]>) || {};

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
          <h1 className="text-xl font-semibold">Who's Here</h1>
        </div>
        <div className="text-sm font-medium">{selectedGroupsText}</div>
      </div>

      <div className="p-4">
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Location Selector */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Location</h3>
            <button
              onClick={() => setShowAddLocationForm(true)}
              className="bg-[#F27A6B] text-[#0d0d0d] px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#e36a5b] transition-colors"
            >
              + Add Location
            </button>
          </div>

          {showAddLocationForm && (
            <div className="mb-4 p-3 bg-[#2a2a2a] rounded-lg">
              <input
                type="text"
                placeholder="Location name"
                value={newLocationName}
                onChange={(e) => {
                  setNewLocationName(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B] mb-2"
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

          {locations.length > 0 ? (
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2 focus:outline-none focus:border-[#F27A6B]"
            >
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.members.length} members)
                </option>
              ))}
            </select>
          ) : (
            <div className="text-center py-4">
              <MapPin size={48} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm opacity-60">No locations yet. Add your first location to get started.</p>
            </div>
          )}
        </div>

        {selectedLocation && (
          <>
            {/* Groups Section */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Groups</h3>
                <button
                  onClick={() => setShowAddGroupForm(true)}
                  disabled={selectedLocation.groups.length >= APP_CONFIG.MAX_GROUPS_PER_LOCATION}
                  className="bg-[#F27A6B] text-[#0d0d0d] px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#e36a5b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Group ({selectedLocation.groups.length}/{APP_CONFIG.MAX_GROUPS_PER_LOCATION})
                </button>
              </div>

              {(showAddGroupForm || editingGroup) && (
                <div className="mb-4 p-3 bg-[#2a2a2a] rounded-lg">
                  <input
                    type="text"
                    placeholder="Group name"
                    value={newGroupName}
                    onChange={(e) => {
                      setNewGroupName(e.target.value);
                      setError('');
                    }}
                    className="w-full bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B] mb-2"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={editingGroup ? handleUpdateGroup : handleAddGroup}
                      className="bg-[#F27A6B] text-[#0d0d0d] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e36a5b] transition-colors"
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
                      className="px-4 py-2 text-[#f2ebc4] border border-[#4a4a4a] rounded-lg text-sm hover:bg-[#2a2a2a] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {selectedLocation.groups.map(group => {
                  const memberCount = groupedMembers[group.id]?.length || 0;
                  const isSelected = selectedGroupIds.includes(group.id);
                  
                  return (
                    <div
                      key={group.id}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-[#F27A6B] bg-opacity-20 border-[#F27A6B]' 
                          : 'bg-[#2a2a2a] border-[#3a3a3a] hover:bg-[#3a3a3a]'
                      }`}
                      onClick={() => handleToggleGroupSelection(group.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleGroupSelection(group.id)}
                            className="w-4 h-4 rounded"
                          />
                          <div>
                            <div className="font-medium">{group.name}</div>
                            <div className="text-sm opacity-60">{memberCount} members</div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditGroup(group);
                            }}
                            className="p-1 text-[#F27A6B] hover:bg-[#F27A6B] hover:bg-opacity-20 rounded transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                            className="p-1 text-red-400 hover:bg-red-400 hover:bg-opacity-20 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Members Section */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Members</h3>
                <button
                  onClick={() => setShowAddMemberForm(true)}
                  className="bg-[#F27A6B] text-[#0d0d0d] px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#e36a5b] transition-colors"
                >
                  + Add Member
                </button>
              </div>

              {showAddMemberForm && (
                <div className="mb-4 p-4 bg-[#2a2a2a] rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B]"
                    />
                    {settings.showAge && (
                      <input
                        type="number"
                        placeholder="Birth Year"
                        value={newMember.birthYear}
                        onChange={(e) => setNewMember(prev => ({ ...prev, birthYear: parseInt(e.target.value) || new Date().getFullYear() - 25 }))}
                        className="bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B]"
                      />
                    )}
                    {settings.showGender && (
                      <select
                        value={newMember.gender}
                        onChange={(e) => setNewMember(prev => ({ ...prev, gender: e.target.value as Gender }))}
                        className="bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B]"
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
                        className="bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B]"
                      >
                        <option value={1}>Skill Level 1</option>
                        <option value={2}>Skill Level 2</option>
                        <option value={3}>Skill Level 3</option>
                        <option value={4}>Skill Level 4</option>
                        <option value={5}>Skill Level 5</option>
                      </select>
                    )}
                  </div>
                  <select
                    value={newMember.groupId || ''}
                    onChange={(e) => setNewMember(prev => ({ ...prev, groupId: e.target.value || null }))}
                    className="w-full bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B] mb-3"
                  >
                    <option value="">Unassigned</option>
                    {selectedLocation.groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddMember}
                      className="bg-[#F27A6B] text-[#0d0d0d] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e36a5b] transition-colors"
                    >
                      Add Member
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMemberForm(false);
                        setNewMember({
                          name: '',
                          birthYear: new Date().getFullYear() - 25,
                          gender: 'Male',
                          skillLevel: 3,
                          groupId: null
                        });
                        setError('');
                      }}
                      className="px-4 py-2 text-[#f2ebc4] border border-[#4a4a4a] rounded-lg text-sm hover:bg-[#2a2a2a] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Group-aware Members Display */}
              {selectedLocation.groups.length > 0 ? (
                <div className="space-y-3">
                  {/* Grouped Members */}
                  {selectedLocation.groups.map(group => {
                    const members = groupedMembers[group.id] || [];
                    const isExpanded = expandedGroups[group.id] ?? true;
                    const search = groupSearches[group.id] || '';
                    const filteredMembers = filterMembersBySearch(members, search);
                    const presentCount = members.filter(m => m.isPresent).length;
                    
                    return (
                      <div key={group.id} className="bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
                        {/* Group Header */}
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleGroupExpanded(group.id)}
                                className="text-[#f2ebc4] hover:text-[#F27A6B] transition-colors"
                              >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                              <input
                                type="checkbox"
                                checked={selectedGroupIds.includes(group.id)}
                                onChange={() => handleToggleGroupSelection(group.id)}
                                className="w-4 h-4 rounded"
                              />
                              <h4 className="font-medium text-[#f2ebc4]">
                                {group.name} ({members.length} members, {presentCount} present)
                              </h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditGroup(group);
                                }}
                                className="p-1 text-[#F27A6B] hover:bg-[#F27A6B] hover:bg-opacity-20 rounded transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGroup(group.id);
                                }}
                                className="p-1 text-red-400 hover:bg-red-400 hover:bg-opacity-20 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Group Content (when expanded) */}
                        {isExpanded && (
                          <div className="px-4 pb-4">
                            {/* Group Toolbar */}
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="flex-1 relative">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search members..."
                                  value={search}
                                  onChange={(e) => handleGroupSearch(group.id, e.target.value)}
                                  className="w-full bg-[#3a3a3a] text-[#f2ebc4] border border-[#4a4a4a] rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#F27A6B]"
                                />
                              </div>
                              <button
                                onClick={() => toggleAllGroupPresence(group.id, true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                                title="Mark all present"
                              >
                                <CheckSquare size={14} />
                              </button>
                              <button
                                onClick={() => toggleAllGroupPresence(group.id, false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                                title="Mark all absent"
                              >
                                <Square size={14} />
                              </button>
                            </div>

                            {/* Members List */}
                            {filteredMembers.length > 0 ? (
                              <div className="space-y-2">
                                {filteredMembers.map(member => (
                                  <div key={member.id} className="flex items-center justify-between p-3 bg-[#3a3a3a] rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <button
                                        onClick={() => handleTogglePresence(member.id, !member.isPresent)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                          member.isPresent 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-400 text-gray-400'
                                        }`}
                                      >
                                        {member.isPresent && <UserCheck size={14} />}
                                      </button>
                                      {settings.showGender && <div className={`w-3 h-3 rounded-full ${getGenderColor(member.gender)}`}></div>}
                                      <div>
                                        <div className="font-medium">{member.name}</div>
                                        {settings.showAge && <div className="text-sm opacity-60">Age {getAge(member.birthYear)}</div>}
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
                                      className="bg-[#4a4a4a] text-[#f2ebc4] border border-[#5a5a5a] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#F27A6B]"
                                    >
                                      <option value="">Unassigned</option>
                                      {selectedLocation.groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            ) : members.length > 0 ? (
                              <div className="text-center py-4 text-gray-400">
                                No members match "{search}"
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-400">
                                No members in this group
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Unassigned Members */}
                  {groupedMembers.unassigned && groupedMembers.unassigned.length > 0 && (
                    <div className="bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleGroupExpanded('unassigned')}
                              className="text-[#f2ebc4] hover:text-[#F27A6B] transition-colors"
                            >
                              {expandedGroups.unassigned ?? true ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            <h4 className="font-medium text-gray-400">
                              Unassigned ({groupedMembers.unassigned.length} members)
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleAllGroupPresence(null, true)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                              title="Mark all present"
                            >
                              <CheckSquare size={14} />
                            </button>
                            <button
                              onClick={() => toggleAllGroupPresence(null, false)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                              title="Mark all absent"
                            >
                              <Square size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {(expandedGroups.unassigned ?? true) && (
                        <div className="px-4 pb-4">
                          <div className="space-y-2">
                            {groupedMembers.unassigned.map(member => (
                              <div key={member.id} className="flex items-center justify-between p-3 bg-[#3a3a3a] rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => handleTogglePresence(member.id, !member.isPresent)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      member.isPresent 
                                        ? 'bg-green-500 border-green-500 text-white' 
                                        : 'border-gray-400 text-gray-400'
                                    }`}
                                  >
                                    {member.isPresent && <UserCheck size={14} />}
                                  </button>
                                  {settings.showGender && <div className={`w-3 h-3 rounded-full ${getGenderColor(member.gender)}`}></div>}
                                  <div>
                                    <div className="font-medium">{member.name}</div>
                                    {settings.showAge && <div className="text-sm opacity-60">Age {getAge(member.birthYear)}</div>}
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
                                  className="bg-[#4a4a4a] text-[#f2ebc4] border border-[#5a5a5a] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#F27A6B]"
                                >
                                  <option value="">Unassigned</option>
                                  {selectedLocation.groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback to simple list when no groups exist */
                <div className="space-y-2">
                  {selectedLocation.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleTogglePresence(member.id, !member.isPresent)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            member.isPresent 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-400 text-gray-400'
                          }`}
                        >
                          {member.isPresent && <UserCheck size={14} />}
                        </button>
                        {settings.showGender && <div className={`w-3 h-3 rounded-full ${getGenderColor(member.gender)}`}></div>}
                        <div>
                          <div className="font-medium">{member.name}</div>
                          {settings.showAge && <div className="text-sm opacity-60">Age {getAge(member.birthYear)}</div>}
                        </div>
                        {settings.showSkill && (
                          <div className="flex space-x-1">
                            {renderSkillStars(member.skillLevel)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedLocation.members.length === 0 && (
                <div className="text-center py-8">
                  <User size={48} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm opacity-60">No members yet. Add your first member to get started.</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleGenerateTeams}
                disabled={selectedGroupIds.length === 0}
                className="flex-1 bg-[#f2e205] text-[#0d0d0d] py-4 rounded-xl font-semibold hover:bg-[#e6d600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Teams ({selectedGroupIds.length} groups)
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="px-6 py-4 text-[#f2ebc4] border border-[#3a3a3a] rounded-xl hover:bg-[#2a2a2a] transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}