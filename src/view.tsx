import React from 'react';
import { requireNativeComponent } from 'react-native';
import type {EnqueueResult} from './index';

let RNQueueitWebview = requireNativeComponent('RNQueueitWebview') as any;
type StatusChangedFunction = (result: EnqueueResult) => void;

interface Props {
  customerId: string;
  waitingRoomId: string;
  onStatusChanged: StatusChangedFunction
}

class QueueitView extends React.Component<Props, any> {
  _onStatusChanged = (event: any)=>{
    if(!this.props.onStatusChanged){
      return;
    }
    this.props.onStatusChanged(event.nativeEvent);
  }

  render() {
    return <RNQueueitWebview 
    {...this.props}
    onStatusChanged={this._onStatusChanged}
    ></RNQueueitWebview>;
  }
}

export { QueueitView };
