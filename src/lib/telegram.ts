interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
  is_bot?: boolean;
  is_fake?: boolean;
  is_scam?: boolean;
}

interface WebAppInitData {
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  [key: string]: any;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: WebAppInitData;
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        isClosingConfirmationEnabled: boolean;
        headerColor: string;
        backgroundColor: string;
        bottomBarColor: string;
        ready: () => void;
        expand: () => void;
        close: () => void;
        onEvent: (eventType: string, callback: () => void) => void;
        offEvent: (eventType: string, callback: () => void) => void;
        sendData: (data: string) => void;
        openLink: (url: string) => void;
        openInvoice: (url: string, callback?: () => void) => void;
        showPopup: (params: any, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isLoading: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showLoader: () => void;
          hideLoader: () => void;
        };
      };
    };
  }
}

export function initTelegram(): void {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();

    if (window.Telegram.WebApp.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  }
}

export function getTelegramUser(): TelegramUser | null {
  if (!window.Telegram?.WebApp) {
    return null;
  }

  const user = window.Telegram.WebApp.initDataUnsafe?.user;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    first_name: user.first_name || 'Guest',
    last_name: user.last_name,
    username: user.username,
    language_code: user.language_code || 'en',
    photo_url: user.photo_url,
    is_premium: user.is_premium || false,
    is_bot: user.is_bot || false,
    is_fake: user.is_fake || false,
    is_scam: user.is_scam || false
  };
}

export function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

export function closeTelegram(): void {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.close();
  }
}

export function openTelegramLink(url: string): void {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openLink(url);
  }
}

export function showTelegramAlert(message: string): void {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(message);
  }
}

export function showTelegramConfirm(message: string, callback: (confirmed: boolean) => void): void {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showConfirm(message, callback);
  }
}

export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy'): void {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
  }
}
