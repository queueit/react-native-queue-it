import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
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

  readonly onWebViewEvent: EventEmitter<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('QueueIt');
