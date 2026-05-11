/**
 * types.ts — Shared Type Definitions for SP JSON Formatting
 * 
 * 
 * 
 * These types model the SharePoint List Formatting JSON schema,
 * providing IntelliSense and compile-time safety for builder scripts.
 */


// ─── Core SP JSON Element ─────────────────────────────────────────────────────

export interface SPElement {
  elmType: 'div' | 'span' | 'a' | 'img' | 'button' | 'svg' | 'path';
  txtContent?: string;
  style?: Record<string, string>;
  attributes?: Record<string, string>;
  children?: SPElement[];
  forEach?: string;
  customRowAction?: CustomRowAction;
  customCardProps?: CustomCardProps;
  inlineEditField?: string;
  columnFormatterReference?: string;
  defaultHoverField?: string;
  _elmName?: string;
  _debug?: {
    compiledFrom: string;
    compiledAt: string;
    lastModified?: string;
  };
}

export interface CustomRowAction {
  action: 'setValue' | 'embed' | 'share' | 'delete' | 'editProps' | 'executeFlow' | 'defaultClick';
  actionInput?: Record<string, any> | string;
  actionParams?: string;
}

export interface CustomCardProps {
  openOnEvent: 'click' | 'hover';
  directionalHint?: string;
  isBeakVisible?: boolean;
  beakStyle?: Record<string, string>;
  formatter: SPElement;
}


// ─── View Formatter Root ──────────────────────────────────────────────────────

export interface SPViewFormatter {
  hideSelection?: boolean;
  hideColumnHeader?: boolean;
  commandBarProps?: {
    commands: Array<{ key: string; hide: boolean }>;
  };
  rowFormatter?: SPElement;
}


// ─── Component Factory Types ──────────────────────────────────────────────────

export interface StatusConfig {
  color: string;
  icon?: string;
  textColor?: string;
}

export type StatusMap = Record<string, StatusConfig>;

export interface ActionConfig {
  icon: string;
  title: string;
  action: CustomRowAction | string;
}

export interface CardRootOptions {
  doneExpr?: string;
  noOpClick?: boolean;
}

export interface DataTableRow {
  /** Static label for the row header (left cell) */
  label: string;
  /** SP expression or field reference for the value (right cell) */
  value: string;
}

export interface DataTableOptions {
  /** Width of the label column (default: '40%') */
  labelWidth?: string;
  /** Padding inside each cell (default: '6px 8px') */
  cellPadding?: string;
  /** Show horizontal separator lines between rows (default: true) */
  borderSeparator?: boolean;
}

export type AvatarSize = 's' | 'm' | 'l';
export type FlexDirection = 'row' | 'column';


// ─── Tile / Gallery Formatter Root ────────────────────────────────────────────

export interface SPTileFormatter {
  $schema?: string;
  height?: number;
  width?: number;
  hideSelection?: boolean;
  fillHorizontally?: boolean;
  formatter: SPElement;
  _debug?: SPElement['_debug'];
}


// ─── Quadrant Card Config ─────────────────────────────────────────────────────

export type RenderType =
  | 'title'          // Bold subtitle typography
  | 'text'           // Body text, optional truncation
  | 'label'          // "Label: Value" caption style
  | 'statusBadge'    // Colored pill with icon
  | 'persona'        // Avatar + display name
  | 'personaSmall'   // Avatar only
  | 'breadcrumb'     // Split delimited path into segments
  | 'pills'          // Split delimited string into pill tags
  | 'relativeDate'   // Friendly relative date
  | 'columnRef';     // Delegate to existing column formatter

export interface QuadrantFieldConfig {
  field: string;           // SP field reference like '[$Title]'
  render: RenderType;
  label?: string;          // Optional label prefix (e.g., "Due")
  statusMap?: StatusMap;   // Required for 'statusBadge'
  delimiter?: string;      // For 'breadcrumb' and 'pills' (default: ';')
  truncate?: number;       // Max chars for 'text' (CSS ellipsis)
  hideWhenEmpty?: boolean; // Collapse when field is empty (default: true)
}

export interface QuadrantActionConfig {
  icon: string;
  title: string;
  action: CustomRowAction | string;
}

export interface QuadrantConfig {
  identity: QuadrantFieldConfig[];
  state: QuadrantFieldConfig[];
  details: QuadrantFieldConfig[];
  actions: QuadrantActionConfig[];
}

export interface QuadrantCardOptions {
  width?: number;
  height?: number;
  hideSelection?: boolean;
  fillHorizontally?: boolean;
  doneExpr?: string;        // Expression for terminal-state dimming
  rev?: number;
}
