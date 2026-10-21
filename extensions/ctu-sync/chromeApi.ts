interface Tab {
  id?: number;
  url?: string;
  status?: string;
}
interface Sender {
  id?: string;
  tab?: Tab;
  url?: string;
}
interface ChromeApi {
  runtime: {
    id: string;
    sendMessage(message: unknown): Promise<unknown>;
    onMessage: {
      addListener(
        handler: (message: unknown, sender: Sender, reply: (value: unknown) => void) => boolean,
      ): void;
    };
  };
  tabs: {
    create(options: { url: string; active: boolean }): Promise<Tab>;
    get(id: number): Promise<Tab>;
    update(id: number, options: { url?: string; active?: boolean }): Promise<Tab>;
    remove(id: number): Promise<void>;
  };
  scripting: {
    executeScript<T>(options: {
      target: { tabId: number };
      world?: 'MAIN' | 'ISOLATED';
      func: () => T | Promise<T>;
    }): Promise<{ result?: Awaited<T> }[]>;
  };
}
export const chromeApi = (globalThis as unknown as { chrome: ChromeApi }).chrome;
