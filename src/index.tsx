import { NativeModules } from 'react-native';

type QueueItType = {
  multiply(a: number, b: number): Promise<number>;
};

const { QueueIt } = NativeModules;

export default QueueIt as QueueItType;
