export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** The permission atom required to see this link. Undefined = visible to all authenticated users. */
  requiredPermission?: string;
  /** Section header label to group this item under (e.g. 'Users', 'Other'). */
  section?: string;
  /** Whether this item has a '+' action button (like Contacts). */
  showAdd?: boolean;
  /** Badge count to display next to the label. */
  badge?: number;
  /** Expandable sub-items. */
  children?: NavigationItem[];
}

export interface NavigationConfig {
  items: NavigationItem[];
}
