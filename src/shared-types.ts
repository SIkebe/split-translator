// Shared type definitions for Split Translator extension

// Response interfaces
interface SplitAndTranslateResponse {
  success: boolean;
  error?: string;
}

// Message interfaces
interface SplitAndTranslateMessage {
  action: 'splitAndTranslate';
  currentTab: chrome.tabs.Tab;
  targetLanguage: string;
}

// Data interfaces
interface SplitViewData {
  originalTabId: number;
  duplicatedTabId: number;
  targetLanguage: string;
  originalWindowId: number;
  duplicatedWindowId: number;
}

// Geometry interfaces
interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface WindowPosition extends Bounds {}

interface DisplayBounds extends Bounds {}

// UI interfaces
interface FocusableElements {
  elements: NodeListOf<Element>;
  first: Element | null;
  last: Element | null;
}
