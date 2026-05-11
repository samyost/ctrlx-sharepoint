/**
 * theme.ts — Fluent UI Theme Tokens & CSS Class Helpers
 * 
 * Vibe Coding SharePoint Views
 * https://github.com/pnp/vibe-coded-list-views
 * 
 * Usage:
 *   import { theme } from './theme';
 *   theme.colors.themePrimary       // → '#536a8b'
 *   theme.cssClass('backgroundColor', 'themePrimary')  // → 'sp-css-backgroundColor-themePrimary'
 */

// ─── Type Definitions ─────────────────────────────────────────────────────────

export type CssClassType = 'backgroundColor' | 'color' | 'borderColor';
export type MsClassType = 'bgColor' | 'fontColor' | 'borderColor';

export interface ThemeColors {
  // Primary palette
  themeLighterAlt: string;
  themeLighter: string;
  themeLight: string;
  themeTertiary: string;
  themeSecondary: string;
  themePrimary: string;
  themeDarkAlt: string;
  themeDark: string;
  themeDarker: string;
  // Neutral palette
  white: string;
  black: string;
  neutralLighterAlt: string;
  neutralLighter: string;
  neutralLight: string;
  neutralQuaternaryAlt: string;
  neutralQuaternary: string;
  neutralTertiaryAlt: string;
  neutralTertiary: string;
  neutralSecondary: string;
  neutralPrimaryAlt: string;
  neutralPrimary: string;
  neutralDark: string;
  // Semantic aliases
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  border: string;
  // Status palette
  statusGreen: string;
  statusYellow: string;
  statusRed: string;
  statusBlue: string;
  statusOrange: string;
  statusGray: string;
}

export interface TypographyPreset {
  'font-size': string;
  'font-weight': string;
}

export interface Theme {
  colors: ThemeColors;
  cssClass: (type: CssClassType, token: string) => string;
  msClass: (type: MsClassType, token: string) => string;
  spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', string>;
  typography: Record<'caption' | 'body' | 'bodyLarge' | 'subtitle' | 'title' | 'headline', TypographyPreset>;
}


// ─── Color Tokens ─────────────────────────────────────────────────────────────
// Source: SharePoint Fluent UI Modern Theme (Dark Mode site)
// These hex values are fallbacks for SVG/Power Automate/external contexts.
// In SP JSON formatters, ALWAYS prefer CSS class helpers below.

const colors: ThemeColors = {
  // Primary palette (Dark Theme mapping: themeDarker=lightest, themeLighterAlt=darkest)
  themeDarker:      '#d0e2f3',
  themeDark:        '#c0d4e5', // Interpolated to fix the duplicate #90a5c2
  themeDarkAlt:     '#90a5c2',
  themePrimary:     '#536a8b',
  themeSecondary:   '#617697',
  themeTertiary:    '#526684',
  themeLight:       '#40546e',
  themeLighter:     '#354760',
  themeLighterAlt:  '#081628',

  // Neutral palette (names inverted for Dark Mode)
  white:                '#1a1d21',   // darkest background
  black:                '#ffffff',   // brightest text
  neutralLighterAlt:    '#11141a',
  neutralLighter:       '#0e1114',
  neutralLight:         '#080b0d',
  neutralQuaternaryAlt: '#2a2e31',
  neutralQuaternary:    '#5f656a',
  neutralTertiaryAlt:   '#737a7f',
  neutralTertiary:      '#686f73',
  neutralSecondary:     '#d5d5d5',
  neutralPrimaryAlt:    '#d1d1d1',
  neutralPrimary:       '#ffffff',
  neutralDark:          '#ffffff',

  // Semantic aliases (for readability in builder scripts)
  background:     '#1a1d21',
  surface:        '#0e1114',
  text:           '#ffffff',
  textSecondary:  '#d5d5d5',
  textMuted:      '#686f73',
  accent:         '#536a8b',
  accentLight:    '#90a5c2',
  border:         '#2a2e31',

  // Status palette (curated for SharePoint badges)
  statusGreen:    '#107c10',
  statusYellow:   '#ffb900',
  statusRed:      '#d13438',
  statusBlue:     '#0078d4',
  statusOrange:   '#ff8c00',
  statusGray:     '#737a7f',
};


// ─── CSS Class Helpers ────────────────────────────────────────────────────────

const VALID_CSS_TYPES: CssClassType[] = ['backgroundColor', 'color', 'borderColor'];
const VALID_MS_TYPES: MsClassType[] = ['bgColor', 'fontColor', 'borderColor'];

function cssClass(type: CssClassType, token: string): string {
  if (!VALID_CSS_TYPES.includes(type)) {
    throw new Error(`cssClass: type must be one of ${VALID_CSS_TYPES.join(', ')}. Got: ${type}`);
  }
  return `sp-css-${type}-${token}`;
}

function msClass(type: MsClassType, token: string): string {
  if (!VALID_MS_TYPES.includes(type)) {
    throw new Error(`msClass: type must be one of ${VALID_MS_TYPES.join(', ')}. Got: ${type}`);
  }
  return `ms-${type}-${token}`;
}


// ─── Spacing Scale ────────────────────────────────────────────────────────────

const spacing: Theme['spacing'] = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '24px',
  xxl: '32px',
};


// ─── Typography Presets ───────────────────────────────────────────────────────

const typography: Theme['typography'] = {
  caption:   { 'font-size': '10px', 'font-weight': '400' },
  body:      { 'font-size': '12px', 'font-weight': '400' },
  bodyLarge: { 'font-size': '14px', 'font-weight': '400' },
  subtitle:  { 'font-size': '14px', 'font-weight': '600' },
  title:     { 'font-size': '16px', 'font-weight': '600' },
  headline:  { 'font-size': '20px', 'font-weight': '700' },
};


// ─── Export ───────────────────────────────────────────────────────────────────

export const theme: Theme = {
  colors,
  cssClass,
  msClass,
  spacing,
  typography,
};
