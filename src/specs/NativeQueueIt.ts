import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export type WebViewEventDetails = {
  url: string;
};

export type WebViewEvent = {
  name: string;
  details?: WebViewEventDetails;
};

export interface Spec extends TurboModule {
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

  readonly onWebViewEvent: EventEmitter<WebViewEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('QueueIt');
