import type { SVGProps } from "react";

export type IconName =
  | "play" | "pause" | "volume" | "volume-x" | "maximize" | "minimize"
  | "search" | "x" | "chevron-left" | "chevron-right" | "chevron-down"
  | "plus" | "check" | "thumbs-up" | "thumbs-down" | "user" | "users"
  | "film" | "tv" | "library" | "home" | "edit" | "trash" | "download"
  | "upload" | "sparkles" | "eye" | "bell" | "menu" | "settings"
  | "captions" | "clock" | "bar-chart" | "heart" | "info" | "star"
  | "skip-back" | "skip-forward" | "globe" | "shield" | "flame";

const STROKED = new Set([
  "volume", "volume-x", "maximize", "minimize", "search", "x", "chevron-left", "chevron-right",
  "chevron-down", "plus", "check", "thumbs-up", "thumbs-down", "eye", "film", "tv", "library",
  "home", "edit", "trash", "download", "upload", "sparkles", "bell", "settings", "captions",
  "clock", "bar-chart", "heart", "info", "star", "skip-back", "skip-forward", "globe", "shield",
]);

const FILLED = new Set(["play", "pause", "user", "users", "menu", "flame"]);

const PATHS: Record<string, string> = {
  play: "M8 5.14v14l11-7-11-7z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
  volume: "M11 5 6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M18.4 5.6a9 9 0 0 1 0 12.8",
  "volume-x": "M11 5 6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6",
  maximize: "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
  minimize: "M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3",
  search: "M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z",
  x: "M18 6 6 18M6 6l12 12",
  "chevron-left": "m15 18-6-6 6-6",
  "chevron-right": "m9 18 6-6-6-6",
  "chevron-down": "m6 9 6 6 6-6",
  plus: "M12 5v14M5 12h14",
  check: "M20 6 9 17l-5-5",
  "thumbs-up": "M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",
  "thumbs-down": "M17 14V2M7 18.12 8 14H2.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 4.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z",
  user: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M10.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users: "M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M15.5 3.13a4 4 0 0 1 0 7.75",
  film: "M3 3h18v18H3zM7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4",
  tv: "M2 7h20v13H2zM8 2l4 5 4-5",
  library: "M4 4v16M9 4v16M13 4l5 16",
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
  edit: "M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  sparkles: "M12 3l1.9 5.8L19 11l-5.1 2.2L12 19l-1.9-5.8L5 11l5.1-2.2L12 3zM19 15l.9 2.6L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 15z",
  eye: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  menu: "M4 6h16M4 12h16M4 18h16",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  captions: "M2 5h20v14H2zM7 15h4M13 15h4M7 11h10",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  "bar-chart": "M12 20V10M18 20V4M6 20v-4",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  "skip-back": "M19 20 9 12l10-8v16zM5 19V5",
  "skip-forward": "M5 4l10 8-10 8V4zM19 5v14",
  flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3 2.5.5 5 2.5 5 6a4.5 4.5 0 0 1-9 0c0-1 .5-2 1.5-3 .5 1.5 1 2.5 2 3zM12 2c1 3 3 4.5 3 8",
};

export type { IconName as IName };

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  filled?: boolean;
}

export const INameDefault = null;

export function Icon({ name, size = 20, filled = false, className, ...rest }: IconProps) {
  const stroke = STROKED.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={stroke && !filled ? "none" : "currentColor"}
      stroke={stroke ? "currentColor" : "none"}
      strokeWidth={stroke ? 2 : 0}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
