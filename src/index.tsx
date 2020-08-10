import {
  NativeModules,
  EventSubscriptionVendor,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';

const nativeQueueIt = NativeModules.QueueIt as EventSubscriptionVendor & {
  enableTesting(value: boolean): void;
  runAsync(clientId: string, eventOrAlias: string): Promise<any>;
};
const queueItEventEmitter = new NativeEventEmitter(nativeQueueIt);

export enum EnqueueResultState {
  Passed = 'Passed',
  Disabled = 'Disabled',
  Unavailable = 'Unavailable',
}

export interface EnqueueResult {
  QueueITToken: string;
  State: EnqueueResultState;
}

class QueueItEngine {
  enableTesting(value: boolean): void {
    nativeQueueIt.enableTesting(value);
  }

  async run(customerId: string, eventOrAliasId: string): Promise<EnqueueResult> {
    const result = await nativeQueueIt.runAsync(customerId, eventOrAliasId);
    return {
      QueueITToken: result.queueittoken,
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
