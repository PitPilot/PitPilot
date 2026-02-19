"use client";

import Avatar from "boring-avatars";

// Brand-aligned palette
const DEFAULT_COLORS = [
  "#0d9488", // teal-600
  "#06b6d4", // cyan-500
  "#2dd4bf", // teal-300
  "#a78bfa", // violet-400
  "#f0abfc", // fuchsia-300
];

export interface UserAvatarProps {
  /** Seed string — typically user name, email, or ID. */
  name: string;
  /** Pixel size of the rendered avatar. */
  size?: number;
  /** Use a square mask instead of circular. */
  square?: boolean;
  /** Custom color palette (5 hex colors recommended). */
  colors?: string[];
  /** Extra CSS class names applied to the wrapper. */
  className?: string;
}

export function UserAvatar({
  name,
  size = 36,
  square = false,
  colors = DEFAULT_COLORS,
  className,
}: UserAvatarProps) {
  return (
    <span className={className} style={{ display: "inline-flex", lineHeight: 0 }}>
      <Avatar
        name={name || "?"}
        size={size}
        variant="bauhaus"
        colors={colors}
        square={square}
      />
    </span>
  );
}
