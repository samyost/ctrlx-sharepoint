import { theme } from './theme';
import type { SPElement } from './types';

// Strict token types derived from theme
export type SpacingToken = 'none' | keyof typeof theme.spacing;
export type ColorToken = 'transparent' | 'currentColor' | keyof typeof theme.colors;
export type TypographyToken = 'inherit' | keyof typeof theme.typography;

// Common strictly typed box properties
export interface BoxProps {
  padding?: SpacingToken | [SpacingToken, SpacingToken]; // [vertical, horizontal]
  margin?: SpacingToken | [SpacingToken, SpacingToken];
  bgColor?: ColorToken;
  borderColor?: ColorToken;
  borderRadius?: SpacingToken | '50%' | '2px' | '4px' | '6px' | '8px' | '10px' | '12px'; // standard bounds
  borderWidth?: 'none' | '1px' | '2px' | '3px' | '4px';
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  color?: ColorToken;
  width?: string;
  height?: string;
  flex?: string;
  flexShrink?: '0' | '1';
  flexGrow?: '0' | '1';
  styleOverrides?: Record<string, string>;
  attributes?: Record<string, string>;
  customRowAction?: SPElement['customRowAction'];
  customCardProps?: SPElement['customCardProps'];
  title?: string;
  display?: string; // Allows for dynamic SP display expressions like `=if(...)`
  opacity?: string; 
}

export interface FlexProps extends BoxProps {
  direction?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  gap?: SpacingToken;
  wrap?: 'nowrap' | 'wrap';
}

export interface TextProps extends BoxProps {
  variant?: TypographyToken;
  weight?: 'inherit' | '400' | '600' | '700'; /* inferred from variant unless overridden */
  align?: 'left' | 'center' | 'right';
  truncate?: boolean; // Applies SP standard ellipsis truncation
  content?: string;
}

// ─── Token Resolvers ──────────────────────────────────────────────────────────

function getSpacing(token?: SpacingToken): string | undefined {
  if (!token) return undefined;
  if (token === 'none') return '0';
  return theme.spacing[token];
}

/**
 * Shims CSS `gap` (unsupported in SP renderer) by injecting margin on children.
 * - Non-wrapping: applies margin-bottom (column) or margin-right (row) to all children except last.
 * - Wrapping: applies both margin-right and margin-bottom to all children.
 */
export function applyGapShim(el: SPElement, gapValue: string, direction: 'row' | 'column'): void {
  if (!el.children || el.children.length === 0) return;
  const isWrapping = el.style?.['flex-wrap'] === 'wrap' || el.style?.['flex-wrap'] === 'wrap-reverse';

  if (isWrapping) {
    for (const child of el.children) {
      if (!child.style) child.style = {};
      child.style!['margin-right'] = gapValue;
      child.style!['margin-bottom'] = gapValue;
    }
  } else {
    const marginProp = direction === 'column' ? 'margin-bottom' : 'margin-right';
    for (let i = 0; i < el.children.length - 1; i++) {
      if (!el.children[i].style) el.children[i].style = {};
      el.children[i].style![marginProp] = gapValue;
    }
  }
}

function resolvePadding(val?: SpacingToken | [SpacingToken, SpacingToken]): string | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) {
    return `${getSpacing(val[0])} ${getSpacing(val[1])}`;
  }
  return getSpacing(val as SpacingToken);
}

function resolveColor(token?: ColorToken): string | undefined {
  if (!token) return undefined;
  if (token === 'transparent') return 'transparent';
  if (token === 'currentColor') return 'currentColor';
  return theme.colors[token];
}

// ─── Primitive Generators ─────────────────────────────────────────────────────

export function Box(props: BoxProps, children?: SPElement[]): SPElement {
  const style: Record<string, string> = { ...props.styleOverrides };
  const attributes: Record<string, string> = { ...props.attributes };

  if (props.padding) style.padding = resolvePadding(props.padding)!;
  if (props.margin) style.margin = resolvePadding(props.margin)!;
  
  if (props.width) style.width = props.width;
  if (props.height) style.height = props.height;
  if (props.display !== undefined) style.display = props.display;
  if (props.opacity !== undefined) style.opacity = props.opacity;
  
  if (props.flex !== undefined) style.flex = props.flex;
  if (props.flexShrink !== undefined) style['flex-shrink'] = props.flexShrink;
  if (props.flexGrow !== undefined) style['flex-grow'] = props.flexGrow;
  
  if (props.bgColor) style['background-color'] = resolveColor(props.bgColor)!;
  if (props.color) style.color = resolveColor(props.color)!;
  
  if (props.borderWidth && props.borderWidth !== 'none') {
    style['border-width'] = props.borderWidth;
    style['border-style'] = props.borderStyle || 'solid';
    if (props.borderColor) {
        style['border-color'] = resolveColor(props.borderColor)!;
    }
  }

  if (props.borderRadius) {
      style['border-radius'] = props.borderRadius === '50%' ? '50%' : (getSpacing(props.borderRadius as SpacingToken) || props.borderRadius);
  }

  if (props.title) attributes.title = props.title;

  const el: SPElement = { elmType: 'div', style, attributes };
  if (children && children.length > 0) el.children = children;
  if (props.customRowAction) el.customRowAction = props.customRowAction;
  if (props.customCardProps) el.customCardProps = props.customCardProps;

  return el;
}

export function VStack(props: FlexProps, children?: SPElement[]): SPElement {
    const el = Box(props, children);
    if (!el.style!.display) el.style!.display = 'flex';
    el.style!['flex-direction'] = props.direction || 'column';
    if (props.alignItems) el.style!['align-items'] = props.alignItems;
    if (props.justifyContent) el.style!['justify-content'] = props.justifyContent;
    if (props.wrap) el.style!['flex-wrap'] = props.wrap;
    if (props.gap) applyGapShim(el, getSpacing(props.gap)!, props.direction || 'column');
    return el;
}

export function HStack(props: FlexProps, children?: SPElement[]): SPElement {
    const el = Box(props, children);
    if (!el.style!.display) el.style!.display = 'flex';
    el.style!['flex-direction'] = props.direction || 'row';
    if (props.alignItems) el.style!['align-items'] = props.alignItems;
    if (props.justifyContent) el.style!['justify-content'] = props.justifyContent;
    if (props.wrap) el.style!['flex-wrap'] = props.wrap;
    if (props.gap) applyGapShim(el, getSpacing(props.gap)!, props.direction || 'row');
    return el;
}

export function Text(props: TextProps, children?: SPElement[]): SPElement {
    const el = Box(props, children);
    el.elmType = 'span';
    if (props.content !== undefined) {
        el.txtContent = props.content;
    }
    
    if (props.variant && props.variant !== 'inherit') {
        const typo = theme.typography[props.variant];
        if (typo) {
            el.style!['font-size'] = typo['font-size'];
            el.style!['font-weight'] = typo['font-weight'];
        }
    }
    
    if (props.weight && props.weight !== 'inherit') {
        el.style!['font-weight'] = props.weight;
    }
    
    if (props.align) {
        el.style!['text-align'] = props.align;
    }
    
    if (props.truncate) {
        el.style!.overflow = 'hidden';
        el.style!['text-overflow'] = 'ellipsis';
        el.style!['white-space'] = 'nowrap';
    }
    
    return el;
}
