/**
 * QuadrantCard_Demo.ts — Quadrant Card Gallery View Formatter
 *
 * Demonstrates the configurable quadrant card pattern.
 * Maps columns to four visual zones via a QuadrantConfig object.
 *
 * Column naming convention: Q{n}_{FieldName}
 *   Q1_ = Identity (top-left)
 *   Q2_ = State (top-right)
 *   Q3_ = Details (bottom-left)
 *   Q4  = Actions (bottom-right, buttons only)
 *
 * Target: a SharePoint list (e.g. "QuadrantDemo") with a Gallery view.
 *         Rename SITE_URL / LIST_NAME below to match your environment.
 *
 * Run:  npx tsx Formatters/src/QuadrantCard_Demo.ts
 */

import { theme } from '../lib/theme';
import { buildQuadrantTile } from '../lib/quadrant';
import { compileTile } from '../lib/helpers';
import type { QuadrantConfig, QuadrantCardOptions, StatusMap } from '../lib/types';


// ─── Configuration ────────────────────────────────────────────────────────────

// Set these to match your tenant before deploying.
const SITE_URL  = 'https://contoso.sharepoint.com/sites/your-site';
const LIST_NAME = 'QuadrantDemo';


// ─── Status Maps ──────────────────────────────────────────────────────────────

const STATUS_MAP: StatusMap = {
  'Not Started': { color: theme.colors.statusGray,   icon: 'CircleRing' },
  'In Progress': { color: theme.colors.statusBlue,   icon: 'ProgressRingDots' },
  'On Hold':     { color: theme.colors.statusOrange, icon: 'Warning', textColor: '#000000' },
  'Completed':   { color: theme.colors.statusGreen,  icon: 'SkypeCircleCheck' },
  'Cancelled':   { color: theme.colors.statusRed,    icon: 'Blocked' },
};

const PRIORITY_MAP: StatusMap = {
  'High':   { color: theme.colors.statusRed,    icon: 'Important' },
  'Medium': { color: theme.colors.statusOrange, icon: 'Remove', textColor: '#000000' },
  'Low':    { color: theme.colors.statusGreen,  icon: 'Down' },
};


// ─── Quadrant Configuration ───────────────────────────────────────────────────

const config: QuadrantConfig = {
  // Q1: Identity — Who/what is this? Inherited context.
  identity: [
    { field: '[$Title]', render: 'title' },
    { field: '[$Q1_Location]', render: 'breadcrumb', delimiter: '>', label: undefined },
    { field: '[$Q1_Category]', render: 'label', label: 'Type' },
  ],

  // Q2: State — Current status and temporal position.
  state: [
    { field: '[$Q2_Status]', render: 'statusBadge', statusMap: STATUS_MAP },
    { field: '[$Q2_Priority]', render: 'statusBadge', statusMap: PRIORITY_MAP },
    { field: '[$Q2_DueDate]', render: 'relativeDate', label: 'Due' },
  ],

  // Q3: Details — Description, people, tags.
  details: [
    { field: '[$Q3_Description]', render: 'text', truncate: 60 },
    { field: '[$Q3_AssignedTo]', render: 'persona' },
    { field: '[$Q3_Tags]', render: 'pills', delimiter: ';' },
  ],

  // Q4: Actions — Hover-revealed buttons.
  actions: [
    {
      icon: 'Edit',
      title: 'Edit',
      action: { action: 'editProps' },
    },
    {
      icon: 'Share',
      title: 'Share',
      action: { action: 'share' },
    },
    {
      icon: 'OpenInNewTab',
      title: 'Open',
      action: `='${SITE_URL}/Lists/${LIST_NAME}/DispForm.aspx?ID=' + [$ID]`,
    },
  ],
};


// ─── Build Options ────────────────────────────────────────────────────────────

const options: QuadrantCardOptions = {
  width: 380,
  height: 280,
  fillHorizontally: true,
  hideSelection: false,
  doneExpr: "[$Q2_Status] == 'Completed' || [$Q2_Status] == 'Cancelled'",
  rev: 3,
};


// ─── Compile ──────────────────────────────────────────────────────────────────

const tile = buildQuadrantTile(config, options);
compileTile(tile, 'QuadrantCard_Demo');
