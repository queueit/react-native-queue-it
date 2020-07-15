import { NativeModules, EventSubscriptionVendor } from 'react-native';

type QueueItType = EventSubscriptionVendor & {
  multiply(a: number, b: number): Promise<number>;
  enableTesting(): void;
  run(clientId: string, eventOrAlias: string): Promise<string>;
};

const { QueueIt } = NativeModules;

export default QueueIt as QueueItType;
