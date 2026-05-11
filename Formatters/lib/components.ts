/**
 * components.ts — Reusable SharePoint JSON Node Factories
 * 
 * Vibe Coding SharePoint Views
 * https://github.com/......./vibe-coded-list-views
 * 
 * Each factory returns a typed SPElement compatible with SP List Formatting JSON.
 * 
 *   import { theme } from './theme';
 *   import { statusBadge } from './components';
 *   const badge = statusBadge('[$Status]', myStatusMap);
 */

import { theme } from './theme';
import type {
  SPElement,
  StatusMap,
  ActionConfig,
  CardRootOptions,
  AvatarSize,
  FlexDirection,
  DataTableRow,
  DataTableOptions,
} from './types';


// ─── Status Badge ─────────────────────────────────────────────────────────────

/**
 * Creates a pill-shaped status badge with conditional color and optional icon.
 * 
 * @example
 *   statusBadge('[$Status]', {
 *     'Active':    { color: '#107c10', icon: 'SkypeCircleCheck' },
 *     'On Hold':   { color: '#ffb900', icon: 'Warning', textColor: '#000' },
 *     'Closed':    { color: '#737a7f', icon: 'Blocked' },
 *   })
 */
export function statusBadge(fieldRef: string, statusMap: StatusMap): SPElement {
  const entries = Object.entries(statusMap);

  // Background-color: must use hex in expressions (no CSS class for status colors)
  const colorExpr = buildConditionalChain(
    fieldRef,
    entries.map(([val, cfg]) => [val, cfg.color]),
    theme.colors.statusGray,
  );

  // Text color via CSS class: default white, conditionally override for dark-on-light badges
  const textColorOverrides = entries.filter(([, cfg]) => cfg.textColor);
  let fontColorClass: string;
  if (textColorOverrides.length > 0) {
    // Build conditional class: dark text for specific statuses, white for everything else
    fontColorClass = buildConditionalChain(
      fieldRef,
      textColorOverrides.map(([val]) => [val, 'ms-fontColor-black']),
      'ms-fontColor-white',
    );
  } else {
    fontColorClass = 'ms-fontColor-white';
  }

  const children: SPElement[] = [];

  // Conditional icon (if any entries have icons)
  const iconEntries = entries.filter(([, cfg]) => cfg.icon);
  if (iconEntries.length > 0) {
    const iconExpr = buildConditionalChain(
      fieldRef,
      iconEntries.map(([val, cfg]) => [val, cfg.icon!]),
      '',
    );
    children.push({
      elmType: 'span',
      attributes: { iconName: iconExpr },
      style: {
        display: `=if(${fieldRef}=='','none','inline')`,
        'margin-right': theme.spacing.xs,
      },
    });
  }

  // Label text
  children.push({
    elmType: 'span',
    txtContent: fieldRef,
  });

  return {
    elmType: 'div',
    attributes: {
      class: fontColorClass,
    },
    style: {
      display: 'flex',
      'align-items': 'center',
      padding: `2px ${theme.spacing.sm}`,
      'border-radius': '999px',
      'background-color': colorExpr,
      'white-space': 'nowrap',
      ...theme.typography.caption,
      'font-weight': '600',
    },
    children,
  };
}


// ─── Dual Container ──────────────────────────────────────────────────────────

/**
 * Creates the Dual-Container pattern: two mutually exclusive sibling containers
 * for interactive (authorized) vs. read-only (viewer) states.
 */
export function dualContainer(
  authExpression: string,
  interactiveContent: SPElement,
  readOnlyContent: SPElement,
): SPElement {
  return {
    elmType: 'div',
    style: { display: 'flex' },
    children: [
      {
        elmType: 'div',
        style: { display: `=if(${authExpression}, 'flex', 'none')` },
        children: [interactiveContent],
      },
      {
        elmType: 'div',
        style: { display: `=if(${authExpression}, 'none', 'flex')` },
        children: [readOnlyContent],
      },
    ],
  };
}


// ─── User Avatar ──────────────────────────────────────────────────────────────

/**
 * Creates a circular user avatar using the native getUserImage() function.
 */
export function userAvatar(emailExpr: string, size: AvatarSize = 's'): SPElement {
  const sizeMap: Record<AvatarSize, string> = { s: '24px', m: '48px', l: '96px' };
  const px = sizeMap[size];

  return {
    elmType: 'img',
    attributes: {
      src: `=getUserImage(${emailExpr},'${size}')`,
    },
    style: {
      width: px,
      height: px,
      'border-radius': '50%',
      'object-fit': 'cover',
      'flex-shrink': '0',
    },
  };
}


// ─── Rev Label ────────────────────────────────────────────────────────────────

/**
 * Creates a subtle monospace version label for cache-busting verification.
 */
export function revLabel(version: number | string): SPElement {
  return {
    elmType: 'span',
    txtContent: `rev-${version}`,
    style: {
      'font-size': '10px',
      opacity: '0.3',
      'font-family': 'monospace',
      'white-space': 'nowrap',
    },
  };
}


// ─── Action Cluster ───────────────────────────────────────────────────────────

/**
 * Creates a top-right absolute-positioned cluster of action icons.
 */
export function actionCluster(actions: ActionConfig[]): SPElement {
  const children: SPElement[] = actions.map((act): SPElement => {
    if (typeof act.action === 'string') {
      // Link-based action
      return {
        elmType: 'a',
        attributes: {
          href: act.action,
          target: '_blank',
          title: act.title,
          class: 'ms-fontColor-themePrimary',
        },
        style: {
          padding: '6px',
          cursor: 'pointer',
          'text-decoration': 'none',
        },
        children: [{
          elmType: 'span',
          attributes: { iconName: act.icon },
        }],
      };
    }

    // customRowAction-based action
    return {
      elmType: 'div',
      customRowAction: act.action,
      attributes: {
        title: act.title,
        class: 'ms-fontColor-themePrimary',
      },
      style: {
        padding: '6px',
        cursor: 'pointer',
      },
      children: [{
        elmType: 'span',
        attributes: { iconName: act.icon },
      }],
    };
  });

  // Gap shim: margin-right on all but last child
  for (let i = 0; i < children.length - 1; i++) {
    if (!children[i].style) children[i].style = {};
    children[i].style!['margin-right'] = '2px';
  }

  return {
    elmType: 'div',
    style: {
      position: 'absolute',
      top: '2px',
      right: '2px',
      display: 'flex',
      'align-items': 'center',
      'z-index': '10',
    },
    children,
  };
}


// ─── Empty State ──────────────────────────────────────────────────────────────

/**
 * Creates an inverse-visibility empty state message.
 */
export function emptyState(hasDataExpr: string, message: string): SPElement {
  return {
    elmType: 'div',
    style: {
      display: `=if(${hasDataExpr}, 'none', 'flex')`,
      padding: `${theme.spacing.md} 0`,
      opacity: '0.35',
      ...theme.typography.body,
      'font-size': '13px',
      'font-style': 'italic',
    },
    txtContent: message,
  };
}


// ─── Inline Edit ──────────────────────────────────────────────────────────────

/**
 * Creates an always-visible inline edit field with placeholder text.
 * 
 * Prevents the "Visibility Lock-Out Bug" — if the container is hidden when
 * the field is empty, users can never click it to add the first value.
 * This factory keeps the container always visible, using conditional
 * txtContent to show a placeholder when empty.
 * 
 * @param fieldRef - SP field reference (e.g., '[$Update]', '[$Notes]')
 * @param placeholder - Text shown when field is empty (e.g., 'Add update...')
 * @param options.multiline - If true, uses pre-wrap for line breaks (default: false)
 * @param options.minLines - Minimum line height reservation (default: 1)
 * @param options.styleOverrides - Additional style properties
 * 
 * @example
 *   // Simple one-liner
 *   inlineEdit('[$Update]', 'Add update...')
 * 
 *   // Multi-line notes field with 2-line minimum
 *   inlineEdit('[$Notes]', 'Click to add notes...', { multiline: true, minLines: 2 })
 */
export function inlineEdit(
  fieldRef: string,
  placeholder: string,
  options: {
    multiline?: boolean;
    minLines?: number;
    styleOverrides?: Record<string, string>;
  } = {},
): SPElement {
  const { multiline = false, minLines = 1, styleOverrides = {} } = options;

  const baseStyle: Record<string, string> = {
    display: 'flex',
    cursor: 'pointer',
    ...theme.typography.body,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    'border-radius': '4px',
    'min-height': `${minLines * 20}px`,
    ...styleOverrides,
  };

  if (multiline) {
    baseStyle['white-space'] = 'pre-wrap';
  }

  return {
    elmType: 'div',
    inlineEditField: fieldRef,
    style: baseStyle,
    txtContent: `=if(${fieldRef} == '', '${placeholder.replace(/'/g, "''")}', ${fieldRef})`,
  };
}


// ─── Layout Helpers ───────────────────────────────────────────────────────────

/**
 * Creates a flex container with common defaults.
 */
export function flexContainer(
  direction: FlexDirection,
  children: SPElement[],
  styleOverrides: Record<string, string> = {},
): SPElement {
  return {
    elmType: 'div',
    style: {
      display: 'flex',
      'flex-direction': direction,
      ...styleOverrides,
    },
    children,
  };
}

/**
 * Creates a card root container with standard padding, relative positioning
 * (for action clusters), and optional terminal-state opacity.
 */
export function cardRoot(children: SPElement[], options: CardRootOptions = {}): SPElement {
  const root: SPElement = {
    elmType: 'div',
    style: {
      display: 'flex',
      'flex-direction': 'column',
      position: 'relative',
      padding: theme.spacing.md,
      cursor: 'default',
    },
    children,
  };

  if (options.doneExpr) {
    root.style!.opacity = `=if(${options.doneExpr}, '0.45', '1')`;
  }

  if (options.noOpClick) {
    root.customRowAction = { action: 'setValue', actionInput: {} };
  }

  return root;
}


// ─── Column Formatter Reference ───────────────────────────────────────────────

/**
 * Creates a sanitization wrapper around a columnFormatterReference.
 * Isolates the referenced formatter's layout flow from the parent container.
 * 
 * Use this when embedding one column's formatter inside another column's
 * formatter, a rowFormatter, or a customCardProps card.
 * 
 * @param fieldRef - SP field reference (e.g., '[$AssignedToUI]', '[$TaskStateUI]')
 * @param styleOverrides - Optional style overrides for the wrapper div
 * @param options.galleryCard - If true, adds `sp-card-formatterRef` class for tile/gallery views
 * 
 * @example
 *   // In a rowFormatter, reference AssignedToUI's column formatter:
 *   columnRef('[$AssignedToUI]')
 * 
 *   // In a gallery tile card:
 *   columnRef('[$TaskStateUI]', {}, { galleryCard: true })
 */
export function columnRef(
  fieldRef: string,
  styleOverrides: Record<string, string> = {},
  options: { galleryCard?: boolean } = {},
): SPElement {
  const wrapper: SPElement = {
    elmType: 'div',
    style: {
      display: 'flex',
      'align-items': 'center',
      width: '100%',
      ...styleOverrides,
    },
    children: [{
      elmType: 'div',
      columnFormatterReference: fieldRef,
    }],
  };

  if (options.galleryCard) {
    wrapper.attributes = {
      class: 'sp-card-content sp-card-formatterRef',
    };
  }

  return wrapper;
}



// ─── Breadcrumb Path ─────────────────────────────────────────────────────────

/**
 * Creates a breadcrumb-style path from a delimited string (e.g., "Parent:Child").
 * 
 * @param fieldRef - The field containing the delimited string (e.g., '[$Area]')
 * @param delimiter - The character used to split the path (default: ':')
 */
export function breadcrumbPath(fieldRef: string, delimiter: string = ':'): SPElement {
  return {
    elmType: 'div',
    attributes: { class: 'ms-fontColor-neutralTertiary' },
    style: {
      display: 'flex',
      'flex-wrap': 'wrap',
      'align-items': 'center',
      ...theme.typography.caption,
    },
    children: [
      {
        elmType: 'div',
        forEach: `_part in split(${fieldRef},'${delimiter}')`,
        style: { display: 'flex', 'align-items': 'center' },
        children: [
          { elmType: 'span', txtContent: '_part' },
          {
            elmType: 'span',
            txtContent: ' > ',
            style: {
              display: `=if(indexOf(${fieldRef},_part)<lastIndexOf(${fieldRef},'${delimiter}'),'inline','none')`,
              padding: '0 2px',
              opacity: '0.6',
            },
          },
        ],
      },
    ],
  };
}


// ─── Member Count Badge ───────────────────────────────────────────────────────

/**
 * Creates a compact badge showing the count of members in a multi-person field.
 * 
 * @param fieldRef - The multi-person field reference (e.g., '@currentField', '[$Members]')
 */
export function memberCountBadge(fieldRef: string): SPElement {
  return {
    elmType: 'div',
    style: {
      display: `=if(length(${fieldRef}) == 0, 'none', 'flex')`,
      'align-items': 'center',
    },
    children: [
      {
        elmType: 'span',
        attributes: { iconName: 'People' },
        style: { 'font-size': '14px', opacity: '0.7', 'margin-right': theme.spacing.xs },
      },
      {
        elmType: 'span',
        txtContent: `=length(${fieldRef}) + if(length(${fieldRef}) == 1, ' member', ' members')`,
        style: {
          ...theme.typography.caption,
          'white-space': 'nowrap',
        },
      },
    ],
  };
}


// ─── Persona ──────────────────────────────────────────────────────────────────

/**
 * Inserts a sub-property inside a [$Field] reference.
 * e.g., personProp('[$Author]', 'email') → '[$Author.email]'
 *       personProp('@currentField', 'title') → '@currentField.title'
 */
function personProp(fieldRef: string, prop: string): string {
  if (fieldRef.startsWith('[$') && fieldRef.endsWith(']')) {
    // Insert property INSIDE the brackets: [$Field] → [$Field.prop]
    return fieldRef.slice(0, -1) + '.' + prop + ']';
  }
  // For @currentField or other refs, just append
  return `${fieldRef}.${prop}`;
}

/**
 * Creates a persona component combining an avatar and the user's display name.
 * 
 * @param personRef - The person object reference (e.g., '@currentField', '[$Author]')
 * @param size - Avatar size ('s', 'm', 'l')
 */
export function persona(personRef: string, size: AvatarSize = 's'): SPElement {
  const avatar = userAvatar(personProp(personRef, 'email'), size);
  avatar.style!['margin-right'] = theme.spacing.sm;

  return {
    elmType: 'div',
    style: {
      display: 'flex',
      'align-items': 'center',
    },
    children: [
      avatar,
      {
        elmType: 'span',
        txtContent: personProp(personRef, 'title'),
        style: {
          ...theme.typography.body,
          'white-space': 'nowrap',
          overflow: 'hidden',
          'text-overflow': 'ellipsis',
        },
      },
    ],
  };
}


// ─── Internal Utilities ───────────────────────────────────────────────────────

/**
 * Builds a chained conditional expression for SP JSON.
 * Produces: =if(field=='val1','result1',if(field=='val2','result2',...,default))
 */
function buildConditionalChain(
  fieldRef: string,
  entries: [string, string][],
  defaultValue: string,
): string {
  if (entries.length === 0) return defaultValue;

  let expr = `'${defaultValue}'`;
  for (let i = entries.length - 1; i >= 0; i--) {
    const [value, result] = entries[i];
    expr = `if(${fieldRef} == '${value}', '${result}', ${expr})`;
  }
  return `=${expr}`;
}

// ─── Button Components ────────────────────────────────────────────────────────

export interface ButtonProps {
  text: string;
  iconName?: string;
  /**
   * If true, uses a colored background. If false, uses transparent background
   * with colored text and border.
   */
  primary?: boolean;
  customCardProps?: SPElement['customCardProps'];
  customRowAction?: SPElement['customRowAction'];
  style?: Record<string, string>;
  title?: string;
}

/**
 * Creates a standard Fluent-like button. Uses a <div role="button"> to ensure
 * compatibility with customCardProps, and isolates the text label in its own span
 * to prevent icon fonts (MDL2) from hijacking the text font family.
 * @see .agent/knowledge/sp-elements.md — button vs div elmType rules
 */
export function button(props: ButtonProps): SPElement {
  const { text, iconName, primary = false, customCardProps, customRowAction, style, title } = props;

  const baseStyle: Record<string, string> = {
    display: 'flex',
    'align-items': 'center',
    padding: '4px 10px',
    'border-radius': '4px',
    cursor: 'pointer',
    'font-size': '12px',
    'font-weight': '600',
    'border-style': 'solid',
    'border-width': '1px',
    ...style,
  };

  const attributes: Record<string, string> = {
    role: 'button',
    tabindex: '0',
  };

  if (title) {
    attributes.title = title;
  }

  if (primary) {
    // Primary Button (Filled)
    attributes.class = `${theme.cssClass('backgroundColor', 'themePrimary')} ${theme.cssClass('color', 'white')} ${theme.cssClass('borderColor', 'themePrimary')} ${theme.msClass('bgColor', 'themeDarkAlt')}`;
  } else {
    // Default Button (Outline / Transparent)
    attributes.class = `${theme.cssClass('color', 'themePrimary')} sp-css-borderColor-themePrimary ${theme.msClass('bgColor', 'themeLight--hover')}`;
    baseStyle['background-color'] = 'transparent';
  }

  const children: SPElement[] = [];

  if (iconName) {
    children.push({
      elmType: 'span',
      attributes: { iconName },
      style: { 'margin-right': '4px' },
    });
  }

  // Label text separated into a span to protect from icon font leakage
  children.push({
    elmType: 'span',
    txtContent: text,
  });

  const btn: SPElement = {
    elmType: 'div',
    attributes,
    style: baseStyle,
    children,
  };

  if (customRowAction) btn.customRowAction = customRowAction;

  // When customCardProps is needed, wrap the button in a relative container
  // with an absolute overlay sibling that carries the click handler.
  // This ensures clicks anywhere on the button surface (including text) work.
  if (customCardProps) {
    baseStyle.position = 'relative';
    return {
      elmType: 'div',
      style: { display: 'inline-flex', position: 'relative' },
      children: [
        btn,
        {
          elmType: 'div',
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            cursor: 'pointer',
            'z-index': '2',
            'background-color': 'transparent',
          },
          customCardProps,
        },
      ],
    };
  }

  return btn;
}


// ─── Progress Spinner ─────────────────────────────────────────────────────────

/**
 * Creates a flat circular progress spinner.
 * Uses a native Fluent UI icon with a rotation class for high performance.
 * 
 * @param size - Font size of the spinner (default: '20px')
 * @param colorExpr - Color expression or token (default: themePrimary)
 */
export function progressSpinnerFlat(
  size: string = '20px',
  colorExpr: string = theme.colors.themePrimary,
): SPElement {
  return {
    elmType: 'span',
    attributes: {
      iconName: 'ProgressLoopOuter',
      class: 'ms-Icon--Spin',
    },
    style: {
      'font-size': size,
      color: colorExpr,
      display: 'inline-block',
    },
  };
}


// ─── Pills Badge ──────────────────────────────────────────────────────────────

/**
 * Splits a delimited text field and renders each token as a pill tag.
 * Uses forEach + split() with the Zero Whitespace Rule.
 *
 * @param fieldRef - SP field reference (e.g., '[$Tags]')
 * @param delimiter - Character to split on (default: ';')
 */
export function pillsBadge(fieldRef: string, delimiter: string = ';'): SPElement {
  return {
    elmType: 'div',
    style: {
      display: `=if(${fieldRef}=='','none','flex')`,
      'flex-wrap': 'wrap',
    },
    children: [{
      elmType: 'span',
      forEach: `_tag in split(${fieldRef},'${delimiter}')`,
      attributes: { class: 'ms-bgColor-neutralLighter ms-fontColor-neutralSecondary' },
      txtContent: '=[$_tag]',
      style: {
        padding: '1px 8px',
        'border-radius': '10px',
        'font-size': '11px',
        'font-weight': '500',
        'white-space': 'nowrap',
        'margin-right': '3px',
        'margin-bottom': '3px',
      },
    }],
  };
}


// ─── Data Table ───────────────────────────────────────────────────────────────

/**
 * Creates a CSS table layout for key/value spec cards.
 * Uses `display: table` + `table-layout: fixed` for true equal-width columns
 * without flexbox math. Renders faster than flex for large lists.
 *
 * @param rows - Array of { label, value } pairs. Labels are static strings,
 *               values are SP field references or expressions.
 * @param options.labelWidth - Width of the label column (default: '40%')
 * @param options.cellPadding - Padding inside each cell (default: '6px 8px')
 * @param options.borderSeparator - Show lines between rows (default: true)
 *
 * @example
 *   dataTable([
 *     { label: 'Owner', value: '[$Owner.title]' },
 *     { label: 'Due', value: '=toLocaleDateString([$DueDate])' },
 *     { label: 'Status', value: '[$Status]' },
 *   ])
 */
export function dataTable(
  rows: DataTableRow[],
  options: DataTableOptions = {},
): SPElement {
  const {
    labelWidth = '40%',
    cellPadding = '6px 8px',
    borderSeparator = true,
  } = options;

  const borderStyle: Record<string, string> = borderSeparator
    ? { 'border-bottom-width': '1px', 'border-bottom-style': 'solid' }
    : {};

  return {
    elmType: 'div',
    attributes: { class: 'sp-css-borderColor-neutralLight' },
    style: {
      display: 'table',
      width: '100%',
      'table-layout': 'fixed',
      'border-collapse': 'collapse',
    },
    children: rows.map((row): SPElement => ({
      elmType: 'div',
      style: { display: 'table-row' },
      children: [
        {
          elmType: 'div',
          attributes: { class: 'ms-fontColor-neutralTertiary' },
          style: {
            display: 'table-cell',
            padding: cellPadding,
            width: labelWidth,
            'font-weight': '600',
            'vertical-align': 'top',
            ...theme.typography.caption,
            ...borderStyle,
          },
          txtContent: row.label,
        },
        {
          elmType: 'div',
          attributes: { class: 'ms-fontColor-neutralPrimary' },
          style: {
            display: 'table-cell',
            padding: cellPadding,
            'vertical-align': 'top',
            ...theme.typography.body,
            ...borderStyle,
          },
          txtContent: row.value,
        },
      ],
    })),
  };
}
