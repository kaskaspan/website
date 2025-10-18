// Authentication utilities
export interface User {
  id: string;
  username: string;
  email: string;
  loginTime: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

// Simple authentication state management
let authState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
};

// Default credentials (in production, use a proper database)
const DEFAULT_CREDENTIALS = {
  username: "rone",
  password: "ronethe 4Is41",
};

// Simple session timeout (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Generate simple session token
function generateSessionToken(): string {
  return (
    "session_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
  );
}

// Simple login function
export function login(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  return new Promise((resolve) => {
    // Simple delay
    setTimeout(() => {
      if (
        username === DEFAULT_CREDENTIALS.username &&
        password === DEFAULT_CREDENTIALS.password
      ) {
        const user: User = {
          id: generateSessionToken(),
          username: DEFAULT_CREDENTIALS.username,
          email: `${DEFAULT_CREDENTIALS.username}@example.com`,
          loginTime: Date.now(),
        };

        authState = {
          isAuthenticated: true,
          user,
          isLoading: false,
        };

        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(user));
          localStorage.setItem("auth_token", user.id);
        }

        resolve({
          success: true,
          message: "Login successful!",
          user,
        });
      } else {
        resolve({
          success: false,
          message: "Invalid username or password",
        });
      }
    }, 500); // Short delay
  });
}

// Logout function
export function logout(): void {
  authState = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
  };

  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    // Clear cookie
    document.cookie =
      "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem("auth_user");
    const storedToken = localStorage.getItem("auth_token");

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        authState = {
          isAuthenticated: true,
          user,
          isLoading: false,
        };
        return true;
      } catch {
        // Invalid stored data, clear it
        logout();
        return false;
      }
    }
  }

  return authState.isAuthenticated;
}

// Get current user
export function getCurrentUser(): User | null {
  if (isAuthenticated()) {
    return authState.user;
  }
  return null;
}

// Get auth state
export function getAuthState(): AuthState {
  return { ...authState };
}

// Check session validity
export function isSessionValid(): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Session expires after 24 hours
  const now = Date.now();
  const sessionAge = now - user.loginTime;

  return sessionAge < SESSION_TIMEOUT;
}

// Initialize auth state from localStorage
export function initializeAuth(): void {
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem("auth_user");
    const storedToken = localStorage.getItem("auth_token");

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        if (isSessionValid()) {
          authState = {
            isAuthenticated: true,
            user,
            isLoading: false,
          };
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }
  }
}
