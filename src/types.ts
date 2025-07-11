// Shared type definitions for Split Translator extension

export interface SplitAndTranslateResponse {
  success: boolean;
  error?: string;
}

export interface SplitAndTranslateMessage {
  action: 'splitAndTranslate';
  currentTab: chrome.tabs.Tab;
  targetLanguage: string;
}

export interface SplitViewData {
  originalTabId: number;
  duplicatedTabId: number;
  targetLanguage: string;
  originalWindowId: number;
  duplicatedWindowId: number;
}

export interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WindowPosition extends Bounds {}

export interface DisplayBounds extends Bounds {}
export interface FocusableElements {
  elements: NodeListOf<Element>;
  first: Element | null;
  last: Element | null;
}
