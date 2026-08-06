/**
 * The 🎵 Music tab's instruments.
 *
 * Kept out of the component so the app frame can render them in the same left
 * navigation the Write tab uses for tracing sets — one menu pattern, wherever
 * a child is choosing what to work with. Colours follow the category chips.
 */

export type Instrument =
  | 'piano'
  | 'xylophone'
  | 'handpan'
  | 'kalimba'
  | 'tambourine'
  | 'guitar'
  | 'drums'
  | 'epads'
  | 'tabla';

export interface InstrumentDef {
  id: Instrument;
  emoji: string;
  name: string;
  color: string;
  colorDark: string;
}

export const INSTRUMENTS: InstrumentDef[] = [
  { id: 'piano', emoji: '🎹', name: 'Piano', color: '#EDE7F6', colorDark: '#4527A0' },
  { id: 'xylophone', emoji: '🎼', name: 'Xylophone', color: '#FFF8E1', colorDark: '#F57F17' },
  { id: 'handpan', emoji: '🛸', name: 'Handpan', color: '#ECEFF1', colorDark: '#37474F' },
  { id: 'kalimba', emoji: '🎶', name: 'Kalimba', color: '#EFEBE9', colorDark: '#5D4037' },
  { id: 'guitar', emoji: '🎸', name: 'Guitar', color: '#FFF3E0', colorDark: '#E65100' },
  { id: 'tambourine', emoji: '🔔', name: 'Tambourine', color: '#FFF3E0', colorDark: '#EF6C00' },
  { id: 'drums', emoji: '🥁', name: 'Drums', color: '#FCE4EC', colorDark: '#AD1457' },
  { id: 'epads', emoji: '🎛️', name: 'Drum Pads', color: '#E8EAF6', colorDark: '#283593' },
  { id: 'tabla', emoji: '🪘', name: 'Tabla', color: '#E0F2F1', colorDark: '#00695C' },
];
