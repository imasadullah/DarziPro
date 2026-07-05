interface Window {
  api: {
    auth: {
      hasUsers(): Promise<{ success: boolean; data?: boolean; error?: string }>;
      registerOwner(data: any): Promise<{ success: boolean; data?: any; error?: string }>;
      login(credentials: any): Promise<{ success: boolean; data?: any; error?: string }>;
      loginWithPIN(pin: string): Promise<{ success: boolean; data?: any; error?: string }>;
      logout(): Promise<{ success: boolean; error?: string }>;
      getCurrentUser(): Promise<{ success: boolean; data?: any; error?: string }>;
    };
    system: {
      getSettings(): Promise<{ success: boolean; data?: any; error?: string }>;
      saveSettings(settings: any): Promise<{ success: boolean; error?: string }>;
    };
  };
}
