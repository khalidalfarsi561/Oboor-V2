import React from "react";

export type LayoutSectionId = "hero" | "claim" | "store";

export type EditableElementId = 
  | "nav" 
  | "brand" 
  | "brand_text" 
  | "accent_text" 
  | "login_btn" 
  | "logout_btn" 
  | "wallet" 
  | "icon_bg" 
  | "hero" 
  | "claim" 
  | "store"
  | "global";

export type DesignPatch = React.CSSProperties & { 
  bgColor?: string; 
  radius?: number; 
  scale?: number; 
  padding?: number | string;
};

export type SiteSettings = { 
  order: LayoutSectionId[]; 
  design: Record<string, DesignPatch>;
};

/**
 * Normalizes the custom design patch into a standard React CSSProperties object.
 * (Task 3)
 */
export function mapDesignPatchToStyle(patch: DesignPatch): React.CSSProperties {
  const { bgColor, radius, scale, padding, ...rest } = patch;
  
  const style: React.CSSProperties = { ...rest };
  
  if (bgColor) style.backgroundColor = bgColor;
  if (radius !== undefined) style.borderRadius = `${radius}px`;
  if (padding !== undefined) style.padding = typeof padding === 'number' ? `${padding}px` : padding;
  if (scale !== undefined) style.transform = `scale(${scale})`;
  
  return style;
}
