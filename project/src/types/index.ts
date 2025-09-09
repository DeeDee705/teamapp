export interface Member {
  id: string;
  name: string;
  birthYear: number;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  skillLevel: number;
  isPresent: boolean;
}

export interface Location {
  id: string;
  name: string;
  members: Member[];
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
  gender?: 'Male' | 'Female' | 'Other';
  ageRange?: { min: number; max: number };
  skillRange?: { min: number; max: number };
}

export type AppScreen = 
  | 'home' 
  | 'locations' 
  | 'members' 
  | 'team-generator' 
  | 'random-picker' 
  | 'coin-toss';