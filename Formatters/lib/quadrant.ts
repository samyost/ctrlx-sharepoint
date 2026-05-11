/**
 * quadrant.ts — Quadrant Card Layout Factory
 *
 * Assembles a 2x2 "quadrant card" for SharePoint gallery/tile views.
 * Each quadrant is populated by fields from a QuadrantConfig, with
 * rendering dispatched to component factories based on the `render` type.
 *
 * ALL COLORS use SP theme CSS classes — NO hard-coded hex values.
 *
 * Layout:
 *   ┌──────────────┬──────────────┐
 *   │ Q1: Identity │ Q2: State    │
 *   ├──────────────┼──────────────┤
 *   │ Q3: Details  │ Q4: Actions  │
 *   └──────────────┴──────────────┘
 *
 * Usage:
 *   import { buildQuadrantTile } from '../lib/quadrant';
 *   const tile = buildQuadrantTile(config, options);
 *   compileTile(tile, 'MyCard');
 */

import { theme } from './theme';
import {
  statusBadge,
  persona,
  userAvatar,
  breadcrumbPath,
  pillsBadge,
  revLabel,
  columnRef,
} from './components';
import { applyGapShim } from './primitives';
import type {
  SPElement,
  SPTileFormatter,
  QuadrantConfig,
  QuadrantFieldConfig,
  QuadrantActionConfig,
  QuadrantCardOptions,
  StatusMap,
  CustomRowAction,
} from './types';


// ─── Render Field Dispatcher ──────────────────────────────────────────────────

/**
 * Dispatches a single QuadrantFieldConfig to the appropriate component factory.
 * Returns an SPElement wrapped in a container with optional label and empty-collapse.
 */
function renderField(cfg: QuadrantFieldConfig): SPElement {
  const hideWhenEmpty = cfg.hideWhenEmpty !== false; // default: true
  let content: SPElement;

  switch (cfg.render) {
    case 'title':
      content = {
        elmType: 'span',
        attributes: { class: 'ms-fontColor-neutralPrimary' },
        txtContent: cfg.field,
        style: {
          ...theme.typography.subtitle,
          overflow: 'hidden',
          'text-overflow': 'ellipsis',
          'white-space': 'nowrap',
        },
      };
      break;

    case 'text':
      content = {
        elmType: 'span',
        attributes: { class: 'ms-fontColor-neutralSecondary' },
        txtContent: cfg.field,
        style: {
          ...theme.typography.body,
          overflow: 'hidden',
          'text-overflow': 'ellipsis',
          ...(cfg.truncate ? { 'max-width': `${cfg.truncate}ch`, 'white-space': 'nowrap' } : {}),
        },
      };
      break;

    case 'label':
      content = {
        elmType: 'span',
        attributes: { class: 'ms-fontColor-neutralTertiary' },
        txtContent: cfg.label
          ? `='${cfg.label}: ' + ${cfg.field}`
          : cfg.field,
        style: {
          ...theme.typography.caption,
          'white-space': 'nowrap',
        },
      };
      break;

    case 'statusBadge':
      if (!cfg.statusMap) {
        throw new Error(`renderField: 'statusBadge' requires a statusMap for ${cfg.field}`);
      }
      content = statusBadge(cfg.field, cfg.statusMap);
      break;

    case 'persona':
      content = persona(cfg.field);
      break;

    case 'personaSmall': {
      // Replicates personProp logic: [$Field] → [$Field.email], @ref → @ref.email
      const emailRef = cfg.field.startsWith('[$') && cfg.field.endsWith(']')
        ? cfg.field.slice(0, -1) + '.email]'
        : `${cfg.field}.email`;
      content = userAvatar(emailRef, 's');
      break;
    }

    case 'breadcrumb':
      content = breadcrumbPath(cfg.field, cfg.delimiter || ':');
      break;

    case 'pills':
      content = pillsBadge(cfg.field, cfg.delimiter || ';');
      break;

    case 'relativeDate':
      content = buildRelativeDateElement(cfg.field);
      break;

    case 'columnRef':
      content = columnRef(cfg.field, {}, { galleryCard: true });
      break;

    default:
      content = {
        elmType: 'span',
        txtContent: cfg.field,
        style: theme.typography.body,
      };
  }

  // Wrap with label prefix if specified (and not already handled by the render type)
  if (cfg.label && cfg.render !== 'label' && cfg.render !== 'relativeDate') {
    const wrapper: SPElement = {
      elmType: 'div',
      style: {
        display: 'flex',
        'align-items': 'center',
      },
      children: [
        {
          elmType: 'span',
          attributes: { class: 'ms-fontColor-neutralTertiary' },
          txtContent: `${cfg.label}:`,
          style: {
            ...theme.typography.caption,
            'white-space': 'nowrap',
            'margin-right': theme.spacing.xs,
          },
        },
        content,
      ],
    };

    if (hideWhenEmpty) {
      wrapper.style!.display = `=if(${cfg.field}=='','none','flex')`;
    }
    return wrapper;
  }

  // Apply empty-collapse directly if no label wrapper
  if (hideWhenEmpty && cfg.render !== 'pills') {
    const container: SPElement = {
      elmType: 'div',
      style: {
        display: `=if(${cfg.field}=='','none','flex')`,
      },
      children: [content],
    };
    return container;
  }

  return content;
}


// ─── Relative Date Element ────────────────────────────────────────────────────

/**
 * Builds the proven "friendly date" element.
 * Shows: today, yesterday, this week, X weeks ago, X months ago
 * Uses a rolling-window formula (simpler than Monday-anchor; less calendar-precise).
 * @see .agent/knowledge/sp-dates.md — both formula approaches compared
 */
function buildRelativeDateElement(fieldRef: string): SPElement {
  // Day difference: floor((Number(@now) - Number(Date(field))) / 86400000)
  const dayDiff = `floor((Number(@now)-Number(Date(${fieldRef})))/86400000)`;

  const dateExpr = `=if(${fieldRef}=='','',if(${dayDiff}<1,'today',if(${dayDiff}<2,'yesterday',if(${dayDiff}<7,'this week',if(${dayDiff}<14,'last week',if(${dayDiff}<30,substring(toString(${dayDiff}/7),0,indexOf(toString(${dayDiff}/7)+'.','.'))+' weeks ago',substring(toString(${dayDiff}/30),0,indexOf(toString(${dayDiff}/30)+'.','.'))+' months ago'))))))`;

  return {
    elmType: 'span',
    attributes: { class: 'ms-fontColor-neutralTertiary' },
    txtContent: dateExpr,
    style: {
      ...theme.typography.caption,
      'white-space': 'nowrap',
    },
  };
}


// ─── Quadrant Zone Builder ────────────────────────────────────────────────────

/**
 * Assembles a single quadrant's content from an array of field configs.
 * Uses sp-css-borderColor-neutralLight for separator lines.
 */
function quadrantZone(
  fields: QuadrantFieldConfig[],
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
): SPElement {
  const isTop = position.startsWith('top');
  const isLeft = position.startsWith('top-left') || position.startsWith('bottom-left');

  const children: SPElement[] = fields.map(f => renderField(f));

  // Build border classes for separators (no hex colors)
  const borderClasses = 'sp-css-borderColor-neutralLight';

  const zone: SPElement = {
    elmType: 'div',
    attributes: { class: borderClasses },
    style: {
      display: 'flex',
      'flex-direction': 'column',
      width: '50%',
      padding: theme.spacing.sm,
      overflow: 'hidden',
      ...(isTop ? { 'border-bottom-width': '1px', 'border-bottom-style': 'solid' } : {}),
      ...(isLeft ? { 'border-right-width': '1px', 'border-right-style': 'solid' } : {}),
      ...(position === 'top-right' ? { 'align-items': 'flex-end' } : {}),
      ...(position === 'bottom-right' ? { 'align-items': 'flex-end', 'justify-content': 'flex-end' } : {}),
    },
    children,
  };

  applyGapShim(zone, theme.spacing.xs, 'column');
  return zone;
}


// ─── Actions Zone (Q4) ───────────────────────────────────────────────────────

/**
 * Builds the Q4 actions zone with subtle-then-expand hover behavior.
 * Shows a "..." indicator always, reveals action buttons on hover.
 */
function actionsZone(actions: QuadrantActionConfig[]): SPElement {
  const actionButtons: SPElement[] = actions.map((act): SPElement => {
    const btn: SPElement = {
      elmType: 'div',
      attributes: {
        title: act.title,
        class: `ms-fontColor-themePrimary ${theme.msClass('bgColor', 'themeLight--hover')}`,
      },
      style: {
        display: 'flex',
        'align-items': 'center',
        padding: '3px 8px',
        'border-radius': '4px',
        cursor: 'pointer',
        'font-size': '11px',
        'white-space': 'nowrap',
      },
      children: [
        {
          elmType: 'span',
          attributes: { iconName: act.icon },
          style: { 'font-size': '14px', 'margin-right': '4px' },
        },
        {
          elmType: 'span',
          txtContent: act.title,
          style: { 'font-size': '11px' },
        },
      ],
    };

    if (typeof act.action === 'string') {
      return {
        elmType: 'a',
        attributes: {
          href: act.action,
          target: '_blank',
          title: act.title,
          class: 'ms-fontColor-themePrimary',
        },
        style: {
          'text-decoration': 'none',
          display: 'flex',
          'align-items': 'center',
          padding: '3px 8px',
          'border-radius': '4px',
          cursor: 'pointer',
        },
        children: [
          { elmType: 'span', attributes: { iconName: act.icon }, style: { 'font-size': '14px', 'margin-right': '4px' } },
          { elmType: 'span', txtContent: act.title, style: { 'font-size': '11px' } },
        ],
      };
    }

    btn.customRowAction = act.action;
    return btn;
  });

  return {
    elmType: 'div',
    style: {
      display: 'flex',
      'flex-direction': 'column',
      width: '50%',
      padding: theme.spacing.sm,
      'align-items': 'flex-end',
      'justify-content': 'flex-end',
      overflow: 'hidden',
    },
    children: [
      // Subtle "..." indicator (always visible)
      {
        elmType: 'span',
        attributes: {
          iconName: 'More',
          class: 'ms-fontColor-neutralTertiaryAlt',
        },
        style: {
          'font-size': '16px',
          opacity: '0.5',
        },
      },
      // Expanded action bar (hover-only)
      {
        elmType: 'div',
        attributes: { class: 'sp-card-showOnHoverChild' },
        style: {
          display: 'flex',
          'flex-direction': 'column',
          'margin-top': theme.spacing.xs,
          'align-items': 'flex-end',
        },
        children: actionButtons,
      },
    ],
  };
}


// ─── Main Factory ─────────────────────────────────────────────────────────────

/**
 * Builds a complete SPTileFormatter from a QuadrantConfig.
 * @see .agent/knowledge/sp-elements.md — SP card hover pattern, three-layer structure
 *
 * @example
 *   const tile = buildQuadrantTile(config, { rev: 1, width: 360, height: 300 });
 *   compileTile(tile, 'MyQuadrantCard');
 */
export function buildQuadrantTile(
  config: QuadrantConfig,
  options: QuadrantCardOptions = {},
): SPTileFormatter {
  const {
    width = 360,
    height = 300,
    hideSelection = false,
    fillHorizontally = true,
    doneExpr,
    rev = 1,
  } = options;

  // Build the four quadrant zones
  const q1 = quadrantZone(config.identity, 'top-left');
  const q2 = quadrantZone(config.state, 'top-right');
  const q3 = quadrantZone(config.details, 'bottom-left');
  const q4 = actionsZone(config.actions);

  // Rev label at bottom-right
  const revEl = revLabel(rev);

  // Inner card content
  const cardContent: SPElement = {
    elmType: 'div',
    style: {
      display: 'flex',
      'flex-direction': 'column',
      height: '100%',
    },
    children: [
      {
        elmType: 'div',
        style: { flex: '1', display: 'flex', 'flex-wrap': 'wrap' },
        children: [q1, q2, q3, q4],
      },
      {
        elmType: 'div',
        style: {
          display: 'flex',
          'justify-content': 'flex-end',
          padding: '0 4px 2px 0',
        },
        children: [revEl],
      },
    ],
  };

  // Apply terminal-state dimming
  if (doneExpr) {
    cardContent.style!.opacity = `=if(${doneExpr},'0.45','1')`;
  }

  // 3-layer sp-card pattern
  const formatter: SPElement = {
    elmType: 'div',
    attributes: { class: 'sp-card-container sp-card-showOnHoverParent' },
    children: [
      // Layer 2: Click blocker
      {
        elmType: 'div',
        attributes: { class: 'sp-card-defaultClickButton' },
        customRowAction: { action: 'defaultClick' },
      },
      // Layer 3: Visible card
      {
        elmType: 'div',
        attributes: {
          class: 'ms-bgColor-white sp-css-borderColor-neutralLight sp-card-borderHighlight sp-card-subContainer sp-card-subContainer-borderRadius',
        },
        style: {
          height: '100%',
          overflow: 'hidden',
        },
        children: [cardContent],
      },
    ],
  };

  return {
    $schema: 'https://developer.microsoft.com/json-schemas/sp/v2/tile-formatting.schema.json',
    height,
    width,
    hideSelection,
    fillHorizontally,
    formatter,
  };
}
