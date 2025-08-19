import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

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
}

export default TurboModuleRegistry.getEnforcing<Spec>('QueueIt');
