import { NativeModules, Platform } from 'react-native';
import type { WebViewEvent } from './specs/NativeQueueIt';

type EventSubscription = { remove: () => void };

type SubscriptionRecord = EventSubscription & { eventType: string };

export type QueueItEventDetails = { url: string };

export type QueueItEventListener = (details?: QueueItEventDetails) => void;

interface NativeQueueItModule {
  runAsync(
    clientId: string,
    eventOrAlias: string,
    layoutName?: string,
    language?: string,
    waitingRoomDomain?: string,
    queuePathPrefix?: string,
    inviteCode?: string
  ): Promise<any>;

  runWithEnqueueKeyAsync(
    clientId: string,
    eventOrAlias: string,
    enqueueKey: string,
    layoutName?: string,
    language?: string,
    waitingRoomDomain?: string,
    queuePathPrefix?: string,
    inviteCode?: string
  ): Promise<any>;

  runWithEnqueueTokenAsync(
    clientId: string,
    eventOrAlias: string,
    enqueueToken: string,
    layoutName?: string,
    language?: string,
    waitingRoomDomain?: string,
    queuePathPrefix?: string,
    inviteCode?: string
  ): Promise<any>;

  tryPassAsync(
    clientId: string,
    eventOrAlias: string,
    layoutName?: string,
    language?: string,
    waitingRoomDomain?: string,
    queuePathPrefix?: string,
    inviteCode?: string
  ): Promise<any>;

  tryPassWithEnqueueKeyAsync(
    clientId: string,
    eventOrAlias: string,
    enqueueKey: string,
    layoutName?: string,
    language?: string,
    waitingRoomDomain?: string,
    queuePathPrefix?: string,
    inviteCode?: string
  ): Promise<any>;

  tryPassWithEnqueueTokenAsync(
    clientId: string,
    eventOrAlias: string,
    enqueueToken: string,
    layoutName?: string,
    language?: string,
    waitingRoomDomain?: string,
    queuePathPrefix?: string,
    inviteCode?: string
  ): Promise<any>;

  showQueueAsync(
    clientId: string,
    eventOrAlias: string,
    queueUrl: string,
    targetUrl: string,
    queueItToken: string,
    urlTTLInMinutes: number,
    waitingRoomDomain?: string,
    queuePathPrefix?: string
  ): Promise<any>;

  onWebViewEvent?: (cb: (e: WebViewEvent) => void) => { remove: () => void };

  onceAsync?: (
    eventName: string
  ) => Promise<QueueItEventDetails | null | undefined>;
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
  ErrorCode?: string;
}

export type QueueItRunOptions = {
  waitingRoomDomain?: string;
  queuePathPrefix?: string;
  inviteCode?: string;
};

export enum TryPassState {
  Passed = 'Passed',
  Disabled = 'Disabled',
  Unavailable = 'Unavailable',
  Queue = 'Queue',
}

export type RedirectType =
  | 'queue'
  | 'safetyNet'
  | 'afterEvent'
  | 'disabled'
  | 'directLink'
  | 'idle'
  | 'unknown';

export interface QueueItTryPassResult {
  QueueITToken: string;
  QueueUrl: string;
  TargetUrl: string;
  UrlTTLInMinutes: number;
  RedirectType: RedirectType;
  State: TryPassState;
  ErrorCode?: string;
  CustomerId: string;
  EventOrAliasId: string;
  WaitingRoomDomain?: string;
  QueuePathPrefix?: string;
}

const redirectTypes: RedirectType[] = [
  'queue',
  'safetyNet',
  'afterEvent',
  'disabled',
  'directLink',
  'idle',
  'unknown',
];

const stateByRedirectType: Record<RedirectType, TryPassState> = {
  safetyNet: TryPassState.Passed,
  directLink: TryPassState.Passed,
  disabled: TryPassState.Disabled,
  afterEvent: TryPassState.Disabled,
  idle: TryPassState.Disabled,
  queue: TryPassState.Queue,
  unknown: TryPassState.Queue,
};

function trimmedOrUndefined(value?: string): string | undefined {
  return value?.trim() || undefined;
}

function normaliseRunOptions(options?: QueueItRunOptions): QueueItRunOptions {
  const waitingRoomDomain = trimmedOrUndefined(options?.waitingRoomDomain);
  const queuePathPrefix = waitingRoomDomain
    ? trimmedOrUndefined(options?.queuePathPrefix)
    : undefined;
  const inviteCode = trimmedOrUndefined(options?.inviteCode);
  return { waitingRoomDomain, queuePathPrefix, inviteCode };
}

function toEnqueueResult(result: any): EnqueueResult {
  return {
    QueueITToken: result.queueittoken,
    State: result.state,
    ...(result.errorCode ? { ErrorCode: result.errorCode } : {}),
  };
}

function toRedirectType(nativeValue: unknown): RedirectType {
  const lowered = String(nativeValue).toLowerCase();
  return (
    redirectTypes.find((type) => type.toLowerCase() === lowered) ?? 'unknown'
  );
}

const noPassCheckResultMessage = 'The pass check ended without a result';

function toTryPassResult(
  result: any,
  customerId: string,
  eventOrAliasId: string,
  { waitingRoomDomain, queuePathPrefix }: QueueItRunOptions
): QueueItTryPassResult {
  if (result == null) {
    throw new Error(noPassCheckResultMessage);
  }
  const check = {
    CustomerId: customerId,
    EventOrAliasId: eventOrAliasId,
    ...(waitingRoomDomain ? { WaitingRoomDomain: waitingRoomDomain } : {}),
    ...(queuePathPrefix ? { QueuePathPrefix: queuePathPrefix } : {}),
  };
  if (result.state === EnqueueResultState.Unavailable) {
    return {
      QueueITToken: '',
      QueueUrl: '',
      TargetUrl: '',
      UrlTTLInMinutes: 0,
      RedirectType: 'unknown',
      State: TryPassState.Unavailable,
      ...(result.errorCode ? { ErrorCode: result.errorCode } : {}),
      ...check,
    };
  }
  const queueItToken = result.queueittoken ?? '';
  const queueUrl = result.queueUrl ?? '';
  if (!queueItToken && !queueUrl) {
    throw new Error(noPassCheckResultMessage);
  }
  const redirectType = toRedirectType(result.redirectType);
  const state = stateByRedirectType[redirectType];
  return {
    QueueITToken: queueItToken,
    QueueUrl: queueUrl,
    TargetUrl: result.targetUrl ?? '',
    UrlTTLInMinutes: result.urlTTLInMinutes ?? 0,
    RedirectType: redirectType,
    State:
      state === TryPassState.Queue && queueItToken
        ? TryPassState.Passed
        : state,
    ...check,
  };
}

const knownEvents = [
  'openingQueueView',
  'webViewClosed',
  'userExited',
  'queueUrlChanged',
];

let hasWarnedUserExitedUnavailable = false;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class QueueItEngine {
  private subs: SubscriptionRecord[] = [];

  private removeSubRef(sub: SubscriptionRecord) {
    const i = this.subs.indexOf(sub);
    if (i >= 0) {
      this.subs.splice(i, 1);
    }
  }

  // remove() runs once and drops the record, so offAll() never removes it again.
  private addSub(
    eventType: string,
    removeInner: () => void
  ): SubscriptionRecord {
    let removed = false;
    const sub: SubscriptionRecord = {
      eventType,
      remove: () => {
        if (removed) {
          return;
        }
        removed = true;
        removeInner();
        this.removeSubRef(sub);
      },
    };
    this.subs.push(sub);
    return sub;
  }

  async run(
    customerId: string,
    eventOrAliasId: string,
    layoutName?: string,
    language?: string,
    options?: QueueItRunOptions
  ): Promise<EnqueueResult> {
    const { waitingRoomDomain, queuePathPrefix, inviteCode } =
      normaliseRunOptions(options);
    const result = await nativeQueueIt.runAsync(
      customerId,
      eventOrAliasId,
      layoutName,
      language,
      waitingRoomDomain,
      queuePathPrefix,
      inviteCode
    );
    return toEnqueueResult(result);
  }

  async runWithEnqueueToken(
    customerId: string,
    eventOrAliasId: string,
    enqueueToken: string,
    layoutName?: string,
    language?: string,
    options?: QueueItRunOptions
  ): Promise<EnqueueResult> {
    const { waitingRoomDomain, queuePathPrefix, inviteCode } =
      normaliseRunOptions(options);
    const result = await nativeQueueIt.runWithEnqueueTokenAsync(
      customerId,
      eventOrAliasId,
      enqueueToken,
      layoutName,
      language,
      waitingRoomDomain,
      queuePathPrefix,
      inviteCode
    );
    return toEnqueueResult(result);
  }

  async runWithEnqueueKey(
    customerId: string,
    eventOrAliasId: string,
    enqueuekey: string,
    layoutName?: string,
    language?: string,
    options?: QueueItRunOptions
  ): Promise<EnqueueResult> {
    const { waitingRoomDomain, queuePathPrefix, inviteCode } =
      normaliseRunOptions(options);
    const result = await nativeQueueIt.runWithEnqueueKeyAsync(
      customerId,
      eventOrAliasId,
      enqueuekey,
      layoutName,
      language,
      waitingRoomDomain,
      queuePathPrefix,
      inviteCode
    );
    return toEnqueueResult(result);
  }

  async tryPass(
    customerId: string,
    eventOrAliasId: string,
    layoutName?: string,
    language?: string,
    options?: QueueItRunOptions
  ): Promise<QueueItTryPassResult> {
    const normalised = normaliseRunOptions(options);
    const { waitingRoomDomain, queuePathPrefix, inviteCode } = normalised;
    const result = await nativeQueueIt.tryPassAsync(
      customerId,
      eventOrAliasId,
      layoutName,
      language,
      waitingRoomDomain,
      queuePathPrefix,
      inviteCode
    );
    return toTryPassResult(result, customerId, eventOrAliasId, normalised);
  }

  async tryPassWithEnqueueToken(
    customerId: string,
    eventOrAliasId: string,
    enqueueToken: string,
    layoutName?: string,
    language?: string,
    options?: QueueItRunOptions
  ): Promise<QueueItTryPassResult> {
    if (!enqueueToken) {
      throw new Error('EnqueueToken cannot be empty');
    }
    const normalised = normaliseRunOptions(options);
    const { waitingRoomDomain, queuePathPrefix, inviteCode } = normalised;
    const result = await nativeQueueIt.tryPassWithEnqueueTokenAsync(
      customerId,
      eventOrAliasId,
      enqueueToken,
      layoutName,
      language,
      waitingRoomDomain,
      queuePathPrefix,
      inviteCode
    );
    return toTryPassResult(result, customerId, eventOrAliasId, normalised);
  }

  async tryPassWithEnqueueKey(
    customerId: string,
    eventOrAliasId: string,
    enqueueKey: string,
    layoutName?: string,
    language?: string,
    options?: QueueItRunOptions
  ): Promise<QueueItTryPassResult> {
    if (!enqueueKey) {
      throw new Error('EnqueueKey cannot be empty');
    }
    const normalised = normaliseRunOptions(options);
    const { waitingRoomDomain, queuePathPrefix, inviteCode } = normalised;
    const result = await nativeQueueIt.tryPassWithEnqueueKeyAsync(
      customerId,
      eventOrAliasId,
      enqueueKey,
      layoutName,
      language,
      waitingRoomDomain,
      queuePathPrefix,
      inviteCode
    );
    return toTryPassResult(result, customerId, eventOrAliasId, normalised);
  }

  async showQueue(result: QueueItTryPassResult): Promise<EnqueueResult> {
    if (result.State !== TryPassState.Queue) {
      return {
        QueueITToken: result.QueueITToken,
        State: result.State as string as EnqueueResultState,
        ...(result.ErrorCode ? { ErrorCode: result.ErrorCode } : {}),
      };
    }
    if (!result.QueueUrl) {
      throw new Error('QueueUrl cannot be empty');
    }
    const { waitingRoomDomain, queuePathPrefix } = normaliseRunOptions({
      waitingRoomDomain: result.WaitingRoomDomain,
      queuePathPrefix: result.QueuePathPrefix,
    });
    const nativeResult = await nativeQueueIt.showQueueAsync(
      result.CustomerId,
      result.EventOrAliasId,
      result.QueueUrl,
      result.TargetUrl,
      result.QueueITToken,
      result.UrlTTLInMinutes,
      waitingRoomDomain,
      queuePathPrefix
    );
    return toEnqueueResult(nativeResult);
  }

  isEventAvailable(event: string): boolean {
    if (!knownEvents.includes(event)) {
      return false;
    }
    return !(Platform.OS === 'android' && event === 'userExited');
  }

  private warnIfUserExitedUnavailable(eventType: string) {
    if (
      __DEV__ &&
      eventType === 'userExited' &&
      !this.isEventAvailable(eventType) &&
      !hasWarnedUserExitedUnavailable
    ) {
      hasWarnedUserExitedUnavailable = true;
      console.warn(
        "react-native-queue-it: 'userExited' is not available on Android, the Android SDK never sends it."
      );
    }
  }

  on(eventType: string, listener: QueueItEventListener): EventSubscription {
    this.warnIfUserExitedUnavailable(eventType);
    if (hasTurboEmitter) {
      const inner = nativeQueueIt.onWebViewEvent!((e) => {
        if (e.name === eventType) {
          listener(e.details);
        }
      });
      return this.addSub(eventType, () => inner.remove());
    }

    const fn = nativeQueueIt.onceAsync;
    if (typeof fn !== 'function') {
      return this.addSub(eventType, () => {});
    }

    let active = true;
    const loop = async () => {
      while (active) {
        try {
          const details = await fn(eventType);
          if (!active) {
            break;
          }
          listener(details ?? undefined);
        } catch {
          if (!active) {
            break;
          }
          await sleep(100);
        }
      }
    };
    void loop();

    return this.addSub(eventType, () => {
      active = false;
    });
  }

  once(eventType: string, listener: QueueItEventListener): void {
    this.warnIfUserExitedUnavailable(eventType);
    if (hasTurboEmitter) {
      let done = false;
      const inner = nativeQueueIt.onWebViewEvent!((e) => {
        if (!done && e.name === eventType) {
          done = true;
          listener(e.details);
          // Defer the unsubscribe. Removing this listener synchronously here mutates the
          // native EventEmitter's listener list while it is still dispatching this very
          // event, which corrupts the dispatch loop and crashes (SIGSEGV in Hermes) on
          // the New Architecture — e.g. on the `webViewClosed` event when returning from
          // the queue. Running it on the next macrotask lets the native dispatch fully
          // unwind first. `done` already guarantees the listener fires at most once.
          setTimeout(() => {
            inner.remove();
            sub.remove();
            this.removeSubRef(sub);
          }, 0);
        }
      });
      const sub: SubscriptionRecord = {
        eventType,
        remove: () => inner.remove(),
      };
      this.subs.push(sub);
      return;
    }

    const fn = nativeQueueIt.onceAsync;
    let active = true;
    const sub: SubscriptionRecord = {
      eventType,
      remove: () => {
        active = false;
      },
    };
    this.subs.push(sub);

    if (typeof fn === 'function') {
      fn(eventType)
        .then((details) => {
          if (!active) {
            return;
          }
          active = false;
          sub.remove();
          this.removeSubRef(sub);
          listener(details ?? undefined);
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

  offAll(eventType?: string): void {
    const kept: SubscriptionRecord[] = [];
    // Copy first: an on() record's remove() drops itself from this.subs.
    [...this.subs].forEach((s) => {
      if (eventType == null || s.eventType === eventType) {
        s.remove();
      } else {
        kept.push(s);
      }
    });
    this.subs = kept;
  }
}

export const QueueIt = new QueueItEngine();
