export type Gender = 'Male' | 'Female' | 'Other';

export interface Member {
  id: string;
  name: string;
  birthYear: number;
  gender: Gender;
  skillLevel: 1 | 2 | 3 | 4 | 5;
  isPresent: boolean;
  groupId?: string | null; // group within the location
}

export interface Group {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
  groups: Group[];     // fixed groups for this location
  members: Member[];   // belong to this location
}

export interface Team {
  id: string;
  name: string;
  members: Member[];
  avgSkill: number;
  genderRatio: {
    male: number;
    female: number;
    other: number;
  };
}

export interface TeamGenerationOptions {
  type: 'balanced' | 'female' | 'male' | 'age' | 'skill';
  numberOfTeams: number;
  ageRange?: { min: number; max: number };
  skillRange?: { min: number; max: number };
}

export interface RandomPickerOptions {
  count: number;
  gender?: Gender;
  ageRange?: { min: number; max: number };
  skillRange?: { min: number; max: number };
}

// Config interface
export interface AppConfig {
  MAX_GROUPS_PER_LOCATION: number; // default 8, can be increased to 50
}

export type AppScreen = 
  | 'home' 
  | 'locations' 
  | 'members' 
  | 'team-generator' 
  | 'random-picker' 
  | 'coin-toss';