import { Location, Member } from '../types';

const STORAGE_KEY = 'team-management-data';

export class DataManager {
  private static instance: DataManager;
  private locations: Location[] = [];

  private constructor() {
    this.loadData();
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

  public addLocation(name: string): Location {
    const location: Location = {
      id: Date.now().toString(),
      name,
      members: []
    };
    this.locations.push(location);
    this.saveData();
    return location;
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
  public addMember(locationId: string, member: Omit<Member, 'id' | 'age'>): Member {
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) throw new Error('Location not found');

    const newMember: Member = {
      ...member,
      id: Date.now().toString(),
      age: new Date().getFullYear() - member.birthYear
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
      if (updates.birthYear) {
        member.age = new Date().getFullYear() - updates.birthYear;
      }
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
}