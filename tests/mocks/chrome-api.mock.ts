// Chrome API mocks for testing

export interface MockChromeTab extends chrome.tabs.Tab {
  id: number;
  url: string;
  windowId: number;
  status: 'loading' | 'complete';
}

export interface MockChromeWindow extends chrome.windows.Window {
  id: number;
  left: number;
  top: number;
  width: number;
  height: number;
  tabs?: MockChromeTab[];
}

export interface MockDisplayInfo {
  id: string;
  name: string;
  workArea: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export class ChromeApiMock {
  // Default mock data
  static readonly DEFAULT_TAB: MockChromeTab = {
    id: 1,
    url: 'https://example.com',
    windowId: 1,
    status: 'complete',
    active: true,
    highlighted: true,
    pinned: false,
    incognito: false,
    selected: true,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    index: 0,
    frozen: false,
  };

  static readonly DEFAULT_WINDOW: MockChromeWindow = {
    id: 1,
    left: 100,
    top: 100,
    width: 1200,
    height: 800,
    focused: true,
    incognito: false,
    type: 'normal',
    state: 'normal',
    alwaysOnTop: false,
    tabs: [ChromeApiMock.DEFAULT_TAB],
  };

  static readonly DEFAULT_DISPLAY: MockDisplayInfo = {
    id: 'primary',
    name: 'Primary Display',
    workArea: {
      left: 0,
      top: 0,
      width: 1920,
      height: 1080,
    },
  };

  // Mock implementations
  static mockTabsQuery(tabs: MockChromeTab[] = [ChromeApiMock.DEFAULT_TAB]): jest.Mock {
    return jest.fn().mockResolvedValue(tabs);
  }

  static mockTabsGet(tab: MockChromeTab = ChromeApiMock.DEFAULT_TAB): jest.Mock {
    return jest.fn().mockResolvedValue(tab);
  }

  static mockTabsUpdate(updatedTab: Partial<MockChromeTab> = {}): jest.Mock {
    return jest.fn().mockResolvedValue({ ...ChromeApiMock.DEFAULT_TAB, ...updatedTab });
  }

  static mockWindowsGet(window: MockChromeWindow = ChromeApiMock.DEFAULT_WINDOW): jest.Mock {
    return jest.fn().mockResolvedValue(window);
  }

  static mockWindowsCreate(newWindow: Partial<MockChromeWindow> = {}): jest.Mock {
    return jest.fn().mockResolvedValue({
      ...ChromeApiMock.DEFAULT_WINDOW,
      id: 2,
      ...newWindow,
    });
  }

  static mockWindowsUpdate(updatedWindow: Partial<MockChromeWindow> = {}): jest.Mock {
    return jest.fn().mockResolvedValue({ ...ChromeApiMock.DEFAULT_WINDOW, ...updatedWindow });
  }

  static mockStorageGet(data: Record<string, any> = {}): jest.Mock {
    return jest.fn().mockResolvedValue(data);
  }

  static mockStorageSet(): jest.Mock {
    return jest.fn().mockResolvedValue(undefined);
  }

  static mockDisplayGetInfo(displays: MockDisplayInfo[] = [ChromeApiMock.DEFAULT_DISPLAY]): jest.Mock {
    return jest.fn().mockImplementation((callback: (displays: MockDisplayInfo[]) => void) => {
      callback(displays);
    });
  }

  static mockSendMessage(response: any = { success: true }): jest.Mock {
    return jest.fn().mockResolvedValue(response);
  }

  // Helper to setup common mocks
  static setupDefaultMocks(): void {
    // Ensure chrome.system.display exists
    if (!(globalThis as any).chrome.system) {
      (globalThis as any).chrome.system = {};
    }
    if (!(globalThis as any).chrome.system.display) {
      (globalThis as any).chrome.system.display = {};
    }

    (globalThis as any).chrome.tabs.query = ChromeApiMock.mockTabsQuery();
    (globalThis as any).chrome.tabs.get = ChromeApiMock.mockTabsGet();
    (globalThis as any).chrome.tabs.update = ChromeApiMock.mockTabsUpdate();
    (globalThis as any).chrome.windows.get = ChromeApiMock.mockWindowsGet();
    (globalThis as any).chrome.windows.create = ChromeApiMock.mockWindowsCreate();
    (globalThis as any).chrome.windows.update = ChromeApiMock.mockWindowsUpdate();
    (globalThis as any).chrome.storage.local.get = ChromeApiMock.mockStorageGet();
    (globalThis as any).chrome.storage.local.set = ChromeApiMock.mockStorageSet();
    (globalThis as any).chrome.storage.sync.get = ChromeApiMock.mockStorageGet();
    (globalThis as any).chrome.storage.sync.set = ChromeApiMock.mockStorageSet();
    (globalThis as any).chrome.system.display.getInfo = ChromeApiMock.mockDisplayGetInfo();
    (globalThis as any).chrome.runtime.sendMessage = ChromeApiMock.mockSendMessage();
  }

  // Create custom window configurations
  static createMockWindow(options: Partial<MockChromeWindow> = {}): MockChromeWindow {
    return {
      ...ChromeApiMock.DEFAULT_WINDOW,
      ...options,
    };
  }

  // Create custom tab configurations
  static createMockTab(options: Partial<MockChromeTab> = {}): MockChromeTab {
    return {
      ...ChromeApiMock.DEFAULT_TAB,
      ...options,
    };
  }

  // Create custom display configurations
  static createMockDisplay(options: Partial<MockDisplayInfo> = {}): MockDisplayInfo {
    return {
      ...ChromeApiMock.DEFAULT_DISPLAY,
      ...options,
    };
  }
}
