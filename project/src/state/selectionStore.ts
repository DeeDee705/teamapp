import { create } from 'zustand';
import { Member } from '../types';
import { DataManager } from '../utils/dataManager';

interface SelectionState {
  selectedLocationIds: string[];
  selectedGroupIds: string[];
  selectedMemberIds: string[];
  
  // Actions
  setLocations: (ids: string[]) => void;
  setGroups: (ids: string[]) => void;
  setMembers: (ids: string[]) => void;
  clear: () => void;
  
  // Derived selectors
  getSelectedMembers: () => Member[];
  getPresentSelectedMembers: () => Member[];
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedLocationIds: [],
  selectedGroupIds: [],
  selectedMemberIds: [],

  setLocations: (ids: string[]) => {
    set({ selectedLocationIds: ids });
    
    // When locations change, filter groups to only those in selected locations
    const dataManager = DataManager.getInstance();
    const validGroupIds: string[] = [];
    
    ids.forEach(locationId => {
      const location = dataManager.getLocationById(locationId);
      if (location) {
        location.groups.forEach(group => {
          if (!validGroupIds.includes(group.id)) {
            validGroupIds.push(group.id);
          }
        });
      }
    });
    
    // Keep only groups that belong to selected locations
    const currentGroups = get().selectedGroupIds;
    const filteredGroups = currentGroups.filter(groupId => validGroupIds.includes(groupId));
    set({ selectedGroupIds: filteredGroups });
    
    // Update members based on filtered groups
    get().setMembers(get().selectedMemberIds);
  },

  setGroups: (ids: string[]) => {
    set({ selectedGroupIds: ids });
    
    // When groups change, filter members to only those in selected groups
    const dataManager = DataManager.getInstance();
    const validMemberIds: string[] = [];
    
    ids.forEach(groupId => {
      const members = dataManager.getMembersByGroupId(groupId);
      members.forEach(member => {
        if (!validMemberIds.includes(member.id)) {
          validMemberIds.push(member.id);
        }
      });
    });
    
    // Keep only members that belong to selected groups
    const currentMembers = get().selectedMemberIds;
    const filteredMembers = currentMembers.filter(memberId => validMemberIds.includes(memberId));
    set({ selectedMemberIds: filteredMembers });
  },

  setMembers: (ids: string[]) => {
    // Only allow members that belong to currently selected groups
    const { selectedGroupIds } = get();
    const dataManager = DataManager.getInstance();
    const validMemberIds: string[] = [];
    
    selectedGroupIds.forEach(groupId => {
      const members = dataManager.getMembersByGroupId(groupId);
      members.forEach(member => {
        validMemberIds.push(member.id);
      });
    });
    
    const filteredIds = ids.filter(memberId => validMemberIds.includes(memberId));
    set({ selectedMemberIds: filteredIds });
  },

  clear: () => {
    set({
      selectedLocationIds: [],
      selectedGroupIds: [],
      selectedMemberIds: []
    });
  },

  getSelectedMembers: () => {
    const { selectedMemberIds } = get();
    const dataManager = DataManager.getInstance();
    return dataManager.getMembersByIds(selectedMemberIds);
  },

  getPresentSelectedMembers: () => {
    const { selectedMemberIds } = get();
    const dataManager = DataManager.getInstance();
    return dataManager.getPresentMembersByIds(selectedMemberIds);
  }
}));