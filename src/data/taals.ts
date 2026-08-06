import type { TablaBol } from '../services/audioEngine';

/**
 * Taal patterns — the cycles a tabla student learns first.
 *
 * A `null` beat is a rest. The bols are spelled as they are taught, then
 * mapped onto the strokes the synthesiser has: dhin sings like tin, ti is a
 * te, ta is a na.
 */
export interface Taal {
  id: string;
  name: string;
  beats: number;
  /** Beat 1 of the cycle — the sam, where a player lands hardest */
  sam: number;
  /** Where the cycle is counted with a wave rather than a clap */
  khali?: number[];
  bols: (TablaBol | null)[];
  /** Spoken names, for the child to read along with */
  spoken: string[];
}

export const TAALS: Taal[] = [
  {
    id: 'keherwa',
    name: 'Keherwa',
    beats: 8,
    sam: 0,
    khali: [4],
    bols: ['dha', 'ge', 'na', 'te', 'na', 'ka', 'tin', 'na'],
    spoken: ['Dha', 'Ge', 'Na', 'Ti', 'Na', 'Ka', 'Dhin', 'Na'],
  },
  {
    id: 'dadra',
    name: 'Dadra',
    beats: 6,
    sam: 0,
    khali: [3],
    bols: ['dha', 'tin', 'na', 'dha', 'tin', 'na'],
    spoken: ['Dha', 'Dhin', 'Na', 'Dha', 'Tin', 'Na'],
  },
  {
    id: 'teental',
    name: 'Teental',
    beats: 16,
    sam: 0,
    khali: [8],
    bols: [
      'dha', 'tin', 'tin', 'dha',
      'dha', 'tin', 'tin', 'dha',
      'dha', 'na', 'na', 'na',
      'na', 'tin', 'tin', 'dha',
    ],
    spoken: [
      'Dha', 'Dhin', 'Dhin', 'Dha',
      'Dha', 'Dhin', 'Dhin', 'Dha',
      'Dha', 'Tin', 'Tin', 'Ta',
      'Ta', 'Dhin', 'Dhin', 'Dha',
    ],
  },
  {
    id: 'rupak',
    name: 'Rupak',
    beats: 7,
    sam: 0,
    khali: [0],
    bols: ['tin', 'tin', 'na', 'dha', 'na', 'dha', 'na'],
    spoken: ['Tin', 'Tin', 'Na', 'Dhin', 'Na', 'Dhin', 'Na'],
  },
];
