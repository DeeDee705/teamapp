import { Location, Member, Group, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../config/settings';

const STORAGE_KEY = 'team-management-data';
const SETTINGS_KEY = 'team-management-settings';

export class DataManager {
  private static instance: DataManager;
  private locations: Location[] = [];
  private settings: AppSettings = DEFAULT_SETTINGS;

  private constructor() {
    this.loadData();
    this.loadSettings();
  }

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  private saveData(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.locations));
  }

  private loadData(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        this.locations = JSON.parse(data);
        // Migration: initialize groups array for legacy locations
        this.locations.forEach(location => {
          if (!location.groups) {
            location.groups = [];
          }
          // Migration: remove age field if it exists (will be derived)
          location.members.forEach(member => {
            delete (member as any).age;
          });
        });
        this.saveData(); // Save migrated data
      } catch (error) {
        console.error('Failed to load data:', error);
        this.locations = [];
      }
    }
  }

  // Location methods
  public getLocations(): Location[] {
    return this.locations;
  }

  public createLocation(name: string): Location {
    const location: Location = {
      id: Date.now().toString(),
      name,
      groups: [],
      members: []
    };
    this.locations.push(location);
    this.saveData();
    return location;
  }

  public addLocation(name: string): Location {
    return this.createLocation(name);
  }

  public renameLocation(locationId: string, name: string): void {
    const location = this.locations.find(loc => loc.id === locationId);
    if (location) {
      location.name = name;
      this.saveData();
    }
  }

  public deleteLocation(locationId: string): void {
    this.locations = this.locations.filter(loc => loc.id !== locationId);
    this.saveData();
  }

  public updateLocation(locationId: string, name: string): void {
    const location = this.locations.find(loc => loc.id === locationId);
    if (location) {
      location.name = name;
      this.saveData();
    }
  }

  // Member methods
  public addMember(locationId: string, member: Omit<Member, 'id'>): Member {
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) throw new Error('Location not found');

    const newMember: Member = {
      ...member,
      id: Date.now().toString()
    };

    location.members.push(newMember);
    this.saveData();
    return newMember;
  }

  public updateMember(locationId: string, memberId: string, updates: Partial<Member>): void {
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) return;

    const member = location.members.find(m => m.id === memberId);
    if (member) {
      Object.assign(member, updates);
      this.saveData();
    }
  }

  public deleteMember(locationId: string, memberId: string): void {
    const location = this.locations.find(loc => loc.id === locationId);
    if (location) {
      location.members = location.members.filter(m => m.id !== memberId);
      this.saveData();
    }
  }

  public getPresentMembers(locationIds: string[]): Member[] {
    return this.locations
      .filter(loc => locationIds.includes(loc.id))
      .flatMap(loc => loc.members)
      .filter(member => member.isPresent);
  }

  public updateMemberPresence(locationId: string, memberId: string, isPresent: boolean): void {
    this.updateMember(locationId, memberId, { isPresent });
  }

  // Group methods
  public createGroup(locationId: string, name: string, config?: { maxGroups?: number }): Group {
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) throw new Error('Location not found');

    const maxGroups = config?.maxGroups || this.settings.maxGroupsPerLocation;
    if (location.groups.length >= maxGroups) {
      throw new Error(`Maximum ${maxGroups} groups allowed per location`);
    }

    const group: Group = {
      id: Date.now().toString(),
      name
    };

    location.groups.push(group);
    this.saveData();
    return group;
  }

  public renameGroup(locationId: string, groupId: string, name: string): void {
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) return;

    const group = location.groups.find(g => g.id === groupId);
    if (group) {
      group.name = name;
      this.saveData();
    }
  }

  public deleteGroup(locationId: string, groupId: string, options?: { reassignToGroupId?: string | null }): void {
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) return;

    // Remove the group
    location.groups = location.groups.filter(g => g.id !== groupId);

    // Handle member reassignment
    location.members.forEach(member => {
      if (member.groupId === groupId) {
        member.groupId = options?.reassignToGroupId || null;
      }
    });

    this.saveData();
  }

  public getGroups(locationId: string): Group[] {
    const location = this.locations.find(loc => loc.id === locationId);
    return location?.groups || [];
  }

  public getMembersByGroup(locationId: string, groupId: string | null): Member[] {
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) return [];

    return location.members.filter(member => member.groupId === groupId);
  }

  public getPresentMembersByGroups(locationId: string, groupIds: string[]): Member[] {
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) return [];

    return location.members.filter(member => 
      member.isPresent && 
      member.groupId && 
      groupIds.includes(member.groupId)
    );
  }

  // Membership methods
  public assignMemberToGroup(locationId: string, memberId: string, groupId: string | null): void {
    this.updateMember(locationId, memberId, { groupId });
  }

  public moveMember(locationId: string, memberId: string, toGroupId: string | null): void {
    this.assignMemberToGroup(locationId, memberId, toGroupId);
  }

  // Settings methods
  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public updateSettings(patch: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...patch };
    this.saveSettings();
  }

  private loadSettings(): void {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      try {
        const savedSettings = JSON.parse(data);
        this.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
      } catch (error) {
        console.error('Failed to load settings:', error);
        this.settings = DEFAULT_SETTINGS;
      }
    } else {
      this.settings = DEFAULT_SETTINGS;
    }
  }

  private saveSettings(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
  }

  // Dangerous action
  public deleteAllMembers(): void {
    this.locations.forEach(location => {
      location.members = [];
    });
    this.saveData();
  }
}