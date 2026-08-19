/**
 * Navigation types shared across AppLayout, AppShell, and Sidebar.
 */
export type NavLeaf = { label: string; href: string; active?: boolean };
export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  children?: NavLeaf[];
  active?: boolean;
  parentActive?: boolean;
};
export type NavGroup = { label: string; items: NavItem[] };
export type NavTree = NavGroup[];
