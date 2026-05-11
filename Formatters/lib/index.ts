/**
 * index.ts — Public API for the TwFw Formatter Library
 *
 * Single entry point for all lib exports.
 * Import everything from here rather than individual lib files:
 *
 *   import { statusBadge, VStack, compile, theme, FIELDS } from '../lib';
 */

// ─── Tokens & Theme ───────────────────────────────────────────────────────────
export { theme } from './theme';
export type { Theme, ThemeColors, CssClassType, MsClassType, TypographyPreset } from './theme';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  SPElement,
  SPViewFormatter,
  SPTileFormatter,
  CustomRowAction,
  CustomCardProps,
  StatusConfig,
  StatusMap,
  ActionConfig,
  CardRootOptions,
  DataTableRow,
  DataTableOptions,
  AvatarSize,
  FlexDirection,
  QuadrantConfig,
  QuadrantFieldConfig,
  QuadrantActionConfig,
  QuadrantCardOptions,
  RenderType,
} from './types';

// ─── Field Registry ───────────────────────────────────────────────────────────
export { FIELDS } from './fields';

// ─── Layout Primitives ────────────────────────────────────────────────────────
export { Box, VStack, HStack, Text, applyGapShim } from './primitives';
export type { BoxProps, FlexProps, TextProps, SpacingToken, ColorToken, TypographyToken } from './primitives';

// ─── Component Factories ─────────────────────────────────────────────────────
export {
  statusBadge,
  dualContainer,
  userAvatar,
  persona,
  revLabel,
  actionCluster,
  emptyState,
  inlineEdit,
  flexContainer,
  cardRoot,
  columnRef,
  breadcrumbPath,
  memberCountBadge,
  pillsBadge,
  button,
  progressSpinnerFlat,
  dataTable,
} from './components';
export type { ButtonProps } from './components';

// ─── High-Level Patterns ──────────────────────────────────────────────────────
export { buildQuadrantTile } from './quadrant';

// ─── Build Pipeline ───────────────────────────────────────────────────────────
export {
  compile,
  compileTile,
  validate,
  wrapForEach,
  loopRange,
  sanitizeForCSOM,
  getMinTs,
  DIST_DIR,
} from './helpers';
