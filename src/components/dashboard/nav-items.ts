import {
  HomeIcon,
  KitchenIcon,
  LogsIcon,
  ScanIcon,
  SettingsIcon,
  TrendsIcon,
} from "./icons";

/**
 * The dashboard's primary navigation, shared by the desktop sidebar and the
 * mobile drawer so the two can't drift out of sync.
 *
 * /admin is deliberately absent: it's an operator tool, rendered separately
 * below a divider and only when the user actually holds the role.
 */
export const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: HomeIcon },
  { label: "Scan Meal", href: "/scan", icon: ScanIcon },
  { label: "Kitchen", href: "/kitchen", icon: KitchenIcon },
  { label: "Logs", href: "/logs", icon: LogsIcon },
  { label: "Trends", href: "/trends", icon: TrendsIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
] as const;
