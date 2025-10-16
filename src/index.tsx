import { NativeModules } from 'react-native';

type EventSubscription = { remove: () => void };

interface NativeQueueItModule {
  enableTesting(value: boolean): void;

  runAsync(
    clientId: string,
    eventOrAlias: string,
    layoutName?: string,
    language?: string
  ): Promise<any>;

  runWithEnqueueKeyAsync(
    clientId: string,
    eventOrAlias: string,
    enqueueKey: string,
    layoutName?: string,
    language?: string
  ): Promise<any>;

  runWithEnqueueTokenAsync(
    clientId: string,
    eventOrAlias: string,
    enqueueToken: string,
    layoutName?: string,
    language?: string
  ): Promise<any>;

  onWebViewEvent?: (cb: (e: string) => void) => { remove: () => void };

  onceAsync?: (eventName: string) => Promise<void>;
}

function safeRequireTurbo(): NativeQueueItModule | null {
  try {
    return require('./specs/NativeQueueIt').default as NativeQueueItModule;
  } catch {
    return null;
  }
}

const turbo = safeRequireTurbo();
const legacy = NativeModules.QueueIt as NativeQueueItModule | undefined;
const nativeQueueIt: NativeQueueItModule = (turbo ?? legacy)!;

const hasTurboEmitter =
  !!nativeQueueIt && typeof nativeQueueIt.onWebViewEvent === 'function';

export enum EnqueueResultState {
  Passed = 'Passed',
  Disabled = 'Disabled',
  Unavailable = 'Unavailable',
  RestartedSession = 'RestartedSession',
}

export interface EnqueueResult {
  QueueITToken: string;
  State: EnqueueResultState;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class QueueItEngine {
  private subs: EventSubscription[] = [];

  private removeSubRef(sub: EventSubscription) {
    const i = this.subs.indexOf(sub);
    if (i >= 0) {
      this.subs.splice(i, 1);
    }
  }

  enableTesting(value: boolean): void {
    nativeQueueIt.enableTesting(value);
  }

  async run(
    customerId: string,
    eventOrAliasId: string,
    layoutName?: string,
    language?: string
  ): Promise<EnqueueResult> {
    try {
      const result = await nativeQueueIt.runAsync(
        customerId,
        eventOrAliasId,
        layoutName,
        language
      );
      return {
        QueueITToken: result.queueittoken,
        State: result.state,
      };
    } catch (error) {
      this.offAll('openingQueueView');
      this.offAll('webViewClosed');
      throw error;
    }
  }

  async runWithEnqueueToken(
    customerId: string,
    eventOrAliasId: string,
    enqueueToken: string,
    layoutName?: string,
    language?: string
  ): Promise<EnqueueResult> {
    try {
      const result = await nativeQueueIt.runWithEnqueueTokenAsync(
        customerId,
        eventOrAliasId,
        enqueueToken,
        layoutName,
        language
      );
      return {
        QueueITToken: result.queueittoken,
        State: result.state,
      };
    } catch (error) {
      this.offAll('openingQueueView');
      this.offAll('webViewClosed');
      throw error;
    }
  }

  async runWithEnqueueKey(
    customerId: string,
    eventOrAliasId: string,
    enqueuekey: string,
    layoutName?: string,
    language?: string
  ): Promise<EnqueueResult> {
    try {
      const result = await nativeQueueIt.runWithEnqueueKeyAsync(
        customerId,
        eventOrAliasId,
        enqueuekey,
        layoutName,
        language
      );
      return {
        QueueITToken: result.queueittoken,
        State: result.state,
      };
    } catch (error) {
      this.offAll('openingQueueView');
      this.offAll('webViewClosed');
      throw error;
    }
  }

  on(eventType: string, listener: () => void): EventSubscription {
    if (hasTurboEmitter) {
      const inner = nativeQueueIt.onWebViewEvent!((e) => {
        if (e === eventType) {
          listener();
        }
      });
      const sub = { remove: () => inner.remove() };
      this.subs.push(sub);
      return sub;
    }

    const fn = nativeQueueIt.onceAsync;
    if (typeof fn !== 'function') {
      const sub = { remove: () => {} };
      this.subs.push(sub);
      return sub;
    }

    let active = true;
    const loop = async () => {
      while (active) {
        try {
          await fn(eventType);
          if (!active) {
            break;
          }
          listener();
        } catch {
          if (!active) {
            break;
          }
          await sleep(100);
        }
      }
    };
    void loop();

    const sub: EventSubscription = {
      remove: () => {
        active = false;
      },
    };
    this.subs.push(sub);
    return sub;
  }

  once(eventType: string, listener: () => void): void {
    if (hasTurboEmitter) {
      let done = false;
      const inner = nativeQueueIt.onWebViewEvent!((e) => {
        if (!done && e === eventType) {
          done = true;
          inner.remove();
          sub.remove();
          this.removeSubRef(sub);
          listener();
        }
      });
      const sub: EventSubscription = { remove: () => inner.remove() };
      this.subs.push(sub);
      return;
    }

    const fn = nativeQueueIt.onceAsync;
    let active = true;
    const sub: EventSubscription = {
      remove: () => {
        active = false;
      },
    };
    this.subs.push(sub);

    if (typeof fn === 'function') {
      fn(eventType)
        .then(() => {
          if (!active) {
            return;
          }
          active = false;
          sub.remove();
          this.removeSubRef(sub);
          listener();
        })
        .catch(() => {
          if (!active) {
            return;
          }
          active = false;
          sub.remove();
          this.removeSubRef(sub);
        });
    } else {
      active = false;
      sub.remove();
      this.removeSubRef(sub);
    }
  }

  offAll(_eventType?: string): void {
    this.subs.forEach((s) => s.remove());
    this.subs = [];
  }
}

export const QueueIt = new QueueItEngine();
