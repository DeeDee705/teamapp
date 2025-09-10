import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  showSkill: true,
  showGender: true,
  showAge: true,
  maxGroupsPerLocation: 8,
  defaultCollapseGroups: false,
  teamClampRule: 'conservative',
  defaultAlgorithm: 'balanced',
  persistFilters: true,
};