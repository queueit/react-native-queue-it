import {
  NativeModules,
  EventSubscriptionVendor,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';

const nativeQueueIt = NativeModules.QueueIt as EventSubscriptionVendor & {
  enableTesting(): void;
  runAsync(clientId: string, eventOrAlias: string): Promise<any>;
};
const queueItEventEmitter = new NativeEventEmitter(nativeQueueIt);

export enum EnqueueResultState {
  Passed = 'Passed',
  Disabled = 'Disabled',
  Unavailable = 'Unavailable',
}

export interface EnqueueResult {
  Token: string;
  State: EnqueueResultState;
}

class QueueItEngine {
  enableTesting(): void {
    nativeQueueIt.enableTesting();
  }

  async run(clientId: string, eventOrAlias: string): Promise<EnqueueResult> {
    const result = await nativeQueueIt.runAsync(clientId, eventOrAlias);
    return {
      Token: result.token,
      State: result.state,
    };
  }

  on(
    eventType: string,
    listener: (...args: any[]) => any
  ): EmitterSubscription {
    return queueItEventEmitter.addListener(eventType, listener);
  }

  once(eventType: string, listener: (...args: any[]) => any): void {
    const l = queueItEventEmitter.addListener(eventType, (args) => {
      l.remove();
      listener.apply(args);
    });
  }
}

export const QueueIt = new QueueItEngine();
