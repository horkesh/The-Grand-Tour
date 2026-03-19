/** Design tokens for export templates — inline styles only (html2canvas requirement) */

export const FONT = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
} as const;

export const COLOR = {
  teal: '#194f4c',
  tealDark: '#0d2f2d',
  rust: '#ac3d29',
  warmWhite: '#f9f7f4',
  warmWhiteDim: 'rgba(249,247,244,0.7)',
  warmWhiteFaint: 'rgba(249,247,244,0.45)',
  dark: '#0D0D0D',
  slate: '#64748b',
  slateDim: 'rgba(100,116,139,0.5)',
  amber: '#d97706',
  white: '#FFFFFF',
} as const;

/** Standard export canvas sizes (width × height) */
export const CANVAS = {
  story: { width: 1080, height: 1920 },
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
} as const;
