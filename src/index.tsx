import { NativeModules, EventSubscriptionVendor } from 'react-native';

type QueueItType = EventSubscriptionVendor & {
  enableTesting(): void;
  run(clientId: string, eventOrAlias: string): Promise<string>;
  on(eventType: string, callback: () => void): void;
};

enum EnqueueResultState {
  Passed = 1,
  Disabled,
  Unavailable,
}

interface EnqueueResult {
  Token: string
  State: EnqueueResultState;
}

const { QueueIt } = NativeModules;


export {
  QueueIt as QueueItType,
  EnqueueResult
};
