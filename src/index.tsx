/* exported EnqueueResultState.Passed */
import {
  NativeModules,
  NativeModule,
  EventSubscriptionVendor,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';

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
}

const nativeQueueIt: EventSubscriptionVendor &
  NativeModule &
  NativeQueueItModule = NativeModules.QueueIt;
const queueItEventEmitter = new NativeEventEmitter(nativeQueueIt);

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

class QueueItEngine {
  enableTesting(value: boolean): void {
    nativeQueueIt.enableTesting(value);
  }

  async run(
    customerId: string,
    eventOrAliasId: string,
    layoutName?: string,
    language?: string
  ): Promise<EnqueueResult> {
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
  }

  async runWithEnqueueToken(
    customerId: string,
    eventOrAliasId: string,
    enqueueToken: string,
    layoutName?: string,
    language?: string
  ): Promise<EnqueueResult> {
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
  }

  async runWithEnqueueKey(
    customerId: string,
    eventOrAliasId: string,
    enqueuekey: string,
    layoutName?: string,
    language?: string
  ): Promise<EnqueueResult> {
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
