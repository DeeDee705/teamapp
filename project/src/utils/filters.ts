import { Member, CustomRule, Gender } from '../types';

const year = new Date().getFullYear();
const ageOf = (m: Member) => year - m.birthYear;

export function applyFilters(
  members: Member[],
  opts: {
    genderFilter: Record<Gender, boolean>;
    ageRange?: { min?: number; max?: number }; // Legacy support
    ageBands?: Array<{ min: number; max: number }>; // New multi-band support
    skillRange?: { min?: number; max?: number };
    customRules?: CustomRule[];
  }
): Member[] {
  const { genderFilter, ageRange, ageBands, skillRange, customRules } = opts;

  return members.filter((m) => {
    // gender
    if (!genderFilter[m.gender]) return false;

    // age filtering - support both legacy ageRange and new ageBands
    const age = ageOf(m);
    
    // If using age bands, member must fall within at least one band
    if (ageBands && ageBands.length > 0) {
      const inAnyBand = ageBands.some(band => age >= band.min && age <= band.max);
      if (!inAnyBand) return false;
    }
    // Legacy age range support (fallback)
    else if (ageRange) {
      if (ageRange.min != null && age < ageRange.min) return false;
      if (ageRange.max != null && age > ageRange.max) return false;
    }

    // skill
    if (skillRange?.min != null && m.skillLevel < skillRange.min) return false;
    if (skillRange?.max != null && m.skillLevel > skillRange.max) return false;

    // custom rules (AND)
    if (customRules?.length) {
      const attrs = m.attrs || {};
      for (const r of customRules) {
        const v = attrs[r.key];
        const pass =
          r.op === 'equals'   ? v === r.value :
          r.op === 'contains' ? String(v ?? '').toLowerCase().includes(String(r.value).toLowerCase()) :
          r.op === 'gte'      ? Number(v) >= Number(r.value) :
          r.op === 'lte'      ? Number(v) <= Number(r.value) :
          r.op === 'in'       ? Array.isArray(r.value) && r.value.includes(v) :
          r.op === 'is'       ? (!!v) === (!!r.value) :
          true;
        if (!pass) return false;
      }
    }

    return true;
  });
}