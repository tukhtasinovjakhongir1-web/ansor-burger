export {};

type TgButton = {
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
  isVisible: boolean;
};

declare global {
  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
      user?: {
        id: number;
        first_name?: string;
        last_name?: string;
        username?: string;
        photo_url?: string;
        language_code?: string;
      };
      start_param?: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    isExpanded: boolean;
    ready(): void;
    expand(): void;
    close(): void;
    isVersionAtLeast(v: string): boolean;
    setHeaderColor(color: string): void;
    setBackgroundColor(color: string): void;
    setBottomBarColor?(color: string): void;
    disableVerticalSwipes?(): void;
    enableClosingConfirmation?(): void;
    disableClosingConfirmation?(): void;
    openLink(url: string): void;
    openTelegramLink(url: string): void;
    showAlert(message: string, cb?: () => void): void;
    showConfirm(message: string, cb: (ok: boolean) => void): void;
    requestContact?(cb: (ok: boolean, res?: { responseUnsafe?: { contact?: { phone_number?: string } } }) => void): void;
    BackButton: TgButton;
    MainButton: TgButton;
    HapticFeedback: {
      impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
      notificationOccurred(type: 'error' | 'success' | 'warning'): void;
      selectionChanged(): void;
    };
  }

  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}
