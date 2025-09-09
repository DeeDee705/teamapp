import { Member, Team, TeamGenerationOptions } from '../types';

export class TeamBalancer {
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public static generateTeams(members: Member[], options: TeamGenerationOptions): Team[] {
    if (members.length === 0) return [];
    
    let filteredMembers = [...members];

    // Apply filters based on team type
    switch (options.type) {
      case 'female':
        filteredMembers = members.filter(m => m.gender === 'Female');
        break;
      case 'male':
        filteredMembers = members.filter(m => m.gender === 'Male');
        break;
      case 'age':
        if (options.ageRange) {
          filteredMembers = members.filter(m => 
            m.age >= options.ageRange!.min && m.age <= options.ageRange!.max
          );
        }
        break;
      case 'skill':
        if (options.skillRange) {
          filteredMembers = members.filter(m => 
            m.skillLevel >= options.skillRange!.min && m.skillLevel <= options.skillRange!.max
          );
        }
        break;
    }

    if (filteredMembers.length === 0) return [];

    return options.type === 'balanced' 
      ? this.createBalancedTeams(filteredMembers, options.numberOfTeams)
      : this.createRandomTeams(filteredMembers, options.numberOfTeams);
  }

  private static createBalancedTeams(members: Member[], numberOfTeams: number): Team[] {
    const teams: Team[] = [];
    
    // Initialize teams
    for (let i = 0; i < numberOfTeams; i++) {
      teams.push({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
        members: [],
        avgSkill: 0,
        genderRatio: { male: 0, female: 0, other: 0 }
      });
    }

    // Sort members by skill level (descending) for better distribution
    const sortedMembers = [...members].sort((a, b) => b.skillLevel - a.skillLevel);
    
    // Distribute members using snake draft approach
    let currentTeamIndex = 0;
    let direction = 1; // 1 for forward, -1 for backward
    
    for (const member of sortedMembers) {
      teams[currentTeamIndex].members.push(member);
      
      // Move to next team
      currentTeamIndex += direction;
      
      // Reverse direction at the ends
      if (currentTeamIndex >= numberOfTeams) {
        currentTeamIndex = numberOfTeams - 1;
        direction = -1;
      } else if (currentTeamIndex < 0) {
        currentTeamIndex = 0;
        direction = 1;
      }
    }

    // Calculate team statistics
    return teams.map(team => this.calculateTeamStats(team));
  }

  private static createRandomTeams(members: Member[], numberOfTeams: number): Team[] {
    const shuffledMembers = this.shuffleArray(members);
    const teams: Team[] = [];
    
    // Initialize teams
    for (let i = 0; i < numberOfTeams; i++) {
      teams.push({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
        members: [],
        avgSkill: 0,
        genderRatio: { male: 0, female: 0, other: 0 }
      });
    }

    // Distribute members randomly
    shuffledMembers.forEach((member, index) => {
      teams[index % numberOfTeams].members.push(member);
    });

    return teams.map(team => this.calculateTeamStats(team));
  }

  private static calculateTeamStats(team: Team): Team {
    if (team.members.length === 0) {
      return { ...team, avgSkill: 0, genderRatio: { male: 0, female: 0, other: 0 } };
    }

    const avgSkill = team.members.reduce((sum, member) => sum + member.skillLevel, 0) / team.members.length;
    
    const genderCounts = team.members.reduce((acc, member) => {
      acc[member.gender.toLowerCase() as keyof typeof acc]++;
      return acc;
    }, { male: 0, female: 0, other: 0 });

    const total = team.members.length;
    const genderRatio = {
      male: Math.round((genderCounts.male / total) * 100),
      female: Math.round((genderCounts.female / total) * 100),
      other: Math.round((genderCounts.other / total) * 100)
    };

    return {
      ...team,
      avgSkill: Math.round(avgSkill * 10) / 10,
      genderRatio
    };
  }

  public static getRandomMembers(members: Member[], count: number, filters?: {
    gender?: string;
    ageRange?: { min: number; max: number };
    skillRange?: { min: number; max: number };
  }): Member[] {
    let filteredMembers = [...members];

    if (filters?.gender) {
      filteredMembers = filteredMembers.filter(m => m.gender === filters.gender);
    }

    if (filters?.ageRange) {
      filteredMembers = filteredMembers.filter(m => 
        m.age >= filters.ageRange!.min && m.age <= filters.ageRange!.max
      );
    }

    if (filters?.skillRange) {
      filteredMembers = filteredMembers.filter(m => 
        m.skillLevel >= filters.skillRange!.min && m.skillLevel <= filters.skillRange!.max
      );
    }

    const shuffled = this.shuffleArray(filteredMembers);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}