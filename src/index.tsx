import { NativeModules, EventSubscriptionVendor } from 'react-native';

type QueueItType = EventSubscriptionVendor & {  
  enableTesting(): void;
  run(clientId: string, eventOrAlias: string): Promise<string>;
};

const { QueueIt } = NativeModules;

export default QueueIt as QueueItType;
