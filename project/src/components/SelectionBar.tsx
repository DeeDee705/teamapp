import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, X, Search } from 'lucide-react';
import { useSelectionStore } from '../state/selectionStore';
import { DataManager } from '../utils/dataManager';

export interface SelectionBarProps {
  className?: string;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [memberSearch, setMemberSearch] = useState('');
  
  const {
    selectedLocationIds,
    selectedGroupIds,
    selectedMemberIds,
    setLocations,
    setGroups,
    setMembers,
    clear
  } = useSelectionStore();
  
  const dataManager = DataManager.getInstance();
  const allLocations = dataManager.getLocations();
  
  // Get available groups based on selected locations
  const availableGroups = useMemo(() => {
    const groups: Array<{id: string, name: string, locationName: string}> = [];
    selectedLocationIds.forEach(locationId => {
      const location = dataManager.getLocationById(locationId);
      if (location) {
        location.groups.forEach(group => {
          groups.push({
            id: group.id,
            name: group.name,
            locationName: location.name
          });
        });
      }
    });
    return groups;
  }, [selectedLocationIds]);
  
  // Get available members based on selected groups
  const availableMembers = useMemo(() => {
    const members: Array<{id: string, name: string, groupName: string, isPresent: boolean}> = [];
    selectedGroupIds.forEach(groupId => {
      const groupMembers = dataManager.getMembersByGroupId(groupId);
      const group = availableGroups.find(g => g.id === groupId);
      groupMembers.forEach(member => {
        members.push({
          id: member.id,
          name: member.name,
          groupName: group?.name || 'Unknown',
          isPresent: member.isPresent
        });
      });
    });
    
    // Filter by search
    if (memberSearch.trim()) {
      const search = memberSearch.toLowerCase();
      return members.filter(member => 
        member.name.toLowerCase().includes(search) ||
        member.groupName.toLowerCase().includes(search)
      );
    }
    
    return members;
  }, [selectedGroupIds, availableGroups, memberSearch]);
  
  // Tri-state checkbox logic
  const getLocationCheckState = (locationId: string) => {
    const location = dataManager.getLocationById(locationId);
    if (!location || location.groups.length === 0) return 'unchecked';
    
    const locationGroupIds = location.groups.map(g => g.id);
    const selectedCount = locationGroupIds.filter(id => selectedGroupIds.includes(id)).length;
    
    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === locationGroupIds.length) return 'checked';
    return 'indeterminate';
  };
  
  const getGroupCheckState = (groupId: string) => {
    const groupMembers = dataManager.getMembersByGroupId(groupId);
    if (groupMembers.length === 0) return 'unchecked';
    
    const memberIds = groupMembers.map(m => m.id);
    const selectedCount = memberIds.filter(id => selectedMemberIds.includes(id)).length;
    
    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === memberIds.length) return 'checked';
    return 'indeterminate';
  };
  
  const toggleLocationSelection = (locationId: string) => {
    const location = dataManager.getLocationById(locationId);
    if (!location) return;
    
    const locationGroupIds = location.groups.map(g => g.id);
    const state = getLocationCheckState(locationId);
    
    if (state === 'checked') {
      // Unselect all groups and members in this location
      const newGroupIds = selectedGroupIds.filter(id => !locationGroupIds.includes(id));
      const newLocationIds = selectedLocationIds.filter(id => id !== locationId);
      setLocations(newLocationIds);
      setGroups(newGroupIds);
    } else {
      // Select location and all its groups
      const newLocationIds = [...new Set([...selectedLocationIds, locationId])];
      const newGroupIds = [...new Set([...selectedGroupIds, ...locationGroupIds])];
      setLocations(newLocationIds);
      setGroups(newGroupIds);
    }
  };
  
  const toggleGroupSelection = (groupId: string) => {
    const state = getGroupCheckState(groupId);
    const groupMembers = dataManager.getMembersByGroupId(groupId);
    const memberIds = groupMembers.map(m => m.id);
    
    if (state === 'checked') {
      // Unselect group and its members
      const newGroupIds = selectedGroupIds.filter(id => id !== groupId);
      const newMemberIds = selectedMemberIds.filter(id => !memberIds.includes(id));
      setGroups(newGroupIds);
      setMembers(newMemberIds);
    } else {
      // Select group and all its members
      const newGroupIds = [...new Set([...selectedGroupIds, groupId])];
      const newMemberIds = [...new Set([...selectedMemberIds, ...memberIds])];
      setGroups(newGroupIds);
      setMembers(newMemberIds);
    }
  };
  
  const toggleMemberSelection = (memberId: string) => {
    const isSelected = selectedMemberIds.includes(memberId);
    if (isSelected) {
      setMembers(selectedMemberIds.filter(id => id !== memberId));
    } else {
      setMembers([...selectedMemberIds, memberId]);
    }
  };
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  
  const selectedMembersCount = selectedMemberIds.length;
  const presentSelectedCount = useSelectionStore.getState().getPresentSelectedMembers().length;
  
  const TriStateCheckbox: React.FC<{
    state: 'checked' | 'unchecked' | 'indeterminate';
    onChange: () => void;
    label: string;
    count?: string;
  }> = ({ state, onChange, label, count }) => (
    <div className="flex items-center gap-2 py-1">
      <input
        type="checkbox"
        checked={state === 'checked'}
        ref={(el) => {
          if (el) el.indeterminate = state === 'indeterminate';
        }}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
      />
      <span className="flex-1 text-sm">{label}</span>
      {count && <span className="text-xs text-gray-500">{count}</span>}
    </div>
  );
  
  return (
    <div className={`bg-gray-800 border-b border-gray-700 ${className || ''}`}>
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Selection</span>
          {selectedMembersCount > 0 && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
              {presentSelectedCount}/{selectedMembersCount} present
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      
      {/* Expanded Content */}
      {isOpen && (
        <div className="border-t border-gray-700 bg-gray-750">
          <div className="p-4 space-y-4">
            
            {/* Clear All */}
            <div className="flex justify-end">
              <button
                onClick={clear}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X size={12} />
                Clear All
              </button>
            </div>
            
            {/* Locations Section */}
            <div>
              <button
                onClick={() => toggleSection('locations')}
                className="flex items-center justify-between w-full py-2 text-sm font-medium text-white hover:bg-gray-600 px-2 rounded"
              >
                <span>Locations ({selectedLocationIds.length}/{allLocations.length})</span>
                {expandedSections.has('locations') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              {expandedSections.has('locations') && (
                <div className="mt-2 pl-4 space-y-1">
                  {allLocations.map(location => (
                    <TriStateCheckbox
                      key={location.id}
                      state={getLocationCheckState(location.id)}
                      onChange={() => toggleLocationSelection(location.id)}
                      label={location.name}
                      count={`${location.groups.length} groups`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Groups Section */}
            {availableGroups.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('groups')}
                  className="flex items-center justify-between w-full py-2 text-sm font-medium text-white hover:bg-gray-600 px-2 rounded"
                >
                  <span>Groups ({selectedGroupIds.length}/{availableGroups.length})</span>
                  {expandedSections.has('groups') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {expandedSections.has('groups') && (
                  <div className="mt-2 pl-4 space-y-1">
                    {availableGroups.map(group => (
                      <TriStateCheckbox
                        key={group.id}
                        state={getGroupCheckState(group.id)}
                        onChange={() => toggleGroupSelection(group.id)}
                        label={`${group.name} (${group.locationName})`}
                        count={`${dataManager.getMembersByGroupId(group.id).length} members`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Members Section */}
            {availableMembers.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('members')}
                  className="flex items-center justify-between w-full py-2 text-sm font-medium text-white hover:bg-gray-600 px-2 rounded"
                >
                  <span>Members ({selectedMemberIds.length} selected)</span>
                  {expandedSections.has('members') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {expandedSections.has('members') && (
                  <div className="mt-2 pl-4 space-y-2">
                    {/* Search */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Member List */}
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {availableMembers.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 py-1"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(member.id)}
                            onChange={() => toggleMemberSelection(member.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="flex-1 text-sm">
                            {member.name}
                            <span className="text-xs text-gray-400 ml-1">({member.groupName})</span>
                          </span>
                          {member.isPresent && (
                            <span className="w-2 h-2 bg-green-500 rounded-full" title="Present"></span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};