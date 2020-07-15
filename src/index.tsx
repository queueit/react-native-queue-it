import { NativeModules } from 'react-native';

type QueueItType = {
  multiply(a: number, b: number): Promise<number>;
  enableTesting(): void;
  run(clientId: string, eventOrAlias: string): Promise<string>;
};

const { QueueIt } = NativeModules;

export default QueueIt as QueueItType;
