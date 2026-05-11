/**
 * Demo_ProjectCard.ts — Example Builder Script
 *
 * Demonstrates the full pipeline:
 *   1. Import typed theme, components, and helpers
 *   2. Build a "Project Card" column formatter using factory functions
 *   3. Compile to dist/Demo_ProjectCard.json
 *
 * Target list shape (rename to match your environment):
 *   - Title (Single line of text)
 *   - Status (Choice: Not Started / In Progress / On Hold / Completed / Cancelled)
 *   - Lead   (Person)
 *
 * Run:  npx tsx Formatters/src/Demo_ProjectCard.ts
 */

import { theme } from '../lib/theme';
import {
  statusBadge,
  revLabel,
  userAvatar,
  actionCluster,
  flexContainer,
  cardRoot,
} from '../lib/components';
import { compile } from '../lib/helpers';
import type { StatusMap } from '../lib/types';


// ─── Configuration ────────────────────────────────────────────────────────────

const REV = 1;

// Set this to your tenant + site path before deploying.
// Example: 'https://contoso.sharepoint.com/sites/your-site'
const SITE_URL = 'https://contoso.sharepoint.com/sites/your-site';
const LIST_NAME = 'Projects';

const STATUS_MAP: StatusMap = {
  'Not Started': { color: theme.colors.statusGray,   icon: 'CircleRing' },
  'In Progress': { color: theme.colors.statusBlue,   icon: 'ProgressRingDots' },
  'On Hold':     { color: theme.colors.statusOrange, icon: 'Warning', textColor: '#000000' },
  'Completed':   { color: theme.colors.statusGreen,  icon: 'SkypeCircleCheck' },
  'Cancelled':   { color: theme.colors.statusRed,    icon: 'Blocked' },
};


// ─── Build the Formatter ──────────────────────────────────────────────────────

// Header row: Title + Rev label
const headerRow = flexContainer('row', [
  {
    elmType: 'span',
    txtContent: '[$Title]',
    style: {
      flex: '1',
      ...theme.typography.subtitle,
    },
  },
  revLabel(REV),
], {
  'align-items': 'baseline',
  gap: theme.spacing.sm,
});

// Status badge
const badge = statusBadge('[$Status]', STATUS_MAP);

// Lead avatar + name row
const leadRow = flexContainer('row', [
  userAvatar('[$Lead.email]', 's'),
  {
    elmType: 'span',
    txtContent: '[$Lead.title]',
    style: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
  },
], {
  'align-items': 'center',
  gap: theme.spacing.sm,
  'padding-top': theme.spacing.sm,
});

// Action cluster (Edit + Open)
const actions = actionCluster([
  {
    icon: 'Edit',
    title: 'Edit item',
    action: {
      action: 'embed',
      actionInput: {
        src: `='${SITE_URL}/Lists/${LIST_NAME}/EditForm.aspx?ID=' + [$ID]`,
        width: "=if(@window.innerWidth > 1200, '1000', if(@window.innerWidth > 500, toString(@window.innerWidth - 150), '350'))",
        height: "=if(@window.innerHeight > 1100, '1000', if(@window.innerHeight > 600, toString(@window.innerHeight - 250), '350'))",
      },
    },
  },
  {
    icon: 'OpenInNewTab',
    title: 'Open in new tab',
    action: `='${SITE_URL}/Lists/${LIST_NAME}/DispForm.aspx?ID=' + [$ID]`,
  },
]);

// Metadata row: Status badge
const metaRow = flexContainer('row', [badge], {
  'align-items': 'center',
  gap: theme.spacing.sm,
  'padding-top': theme.spacing.sm,
});


// ─── Assemble the Card ────────────────────────────────────────────────────────

const card = cardRoot([
  actions,
  headerRow,
  metaRow,
  leadRow,
], {
  doneExpr: "[$Status] == 'Completed' || [$Status] == 'Cancelled'",
  noOpClick: true,
});


// ─── Compile ──────────────────────────────────────────────────────────────────

compile(card, 'Demo_ProjectCard');
