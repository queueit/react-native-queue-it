import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Button,
  TextInput,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import { EnqueueResult, EnqueueResultState, QueueIt, QueueitView } from 'react-native-queue-it';

type AppState = {
  customerId: string;
  waitingRoomId: string;
  isTesting: boolean;
  enqueueToken: string;
  enqueueKey: string;
  showQueue: boolean;
};

class App extends Component<{}, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      customerId: '',
      waitingRoomId: '',
      isTesting: true,
      enqueueToken: '',
      enqueueKey: '',
      showQueue: false,
    };
  }
  componentDidMount() {}

  getEnqueueToken = () => 'myToken';

  getEnqueueKey = () => 'myKey';

  enqueue = async () => {
    try {
      console.log('going to queue-it');
      this.setState({
        showQueue: true,
      });
    } catch (e) {
      console.log(`error: ${e}`);
    }
  };

  onClientChange = (txt: string) => {
    this.setState({ customerId: txt });
  };

  onEventChange = (txt: string) => {
    this.setState({ waitingRoomId: txt });
  };

  onEnqueueKeyChange = (txt: string) => {
    this.setState({ enqueueKey: txt });
  };

  onEnqueueTokenChange = (txt: string) => {
    this.setState({ enqueueToken: txt });
  };

  toggleTesting = () => {
    const newT = !this.state.isTesting;
    QueueIt.enableTesting(newT);
    this.setState({ isTesting: newT });
  };

  onQueueStatusChanged = (newStatus: EnqueueResult)=>{
    console.log("Enqueue result: ", newStatus);
    if(newStatus.State != EnqueueResultState.Passed){
      console.warn("Got enqueue result different from passed!");
    }
    const shouldShowQueue = newStatus.State !== EnqueueResultState.Passed;
    this.setState({
      showQueue: shouldShowQueue
    });
  }

  render() {
    const showQueue = this.state.showQueue;
    QueueIt.enableTesting(this.state.isTesting);
    console.log(this.state);
    const QueueitViewComponent = QueueitView as any;
    return (
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}
        >
          <View style={styles.body}>
          {showQueue && (
                <QueueitViewComponent
                  style={styles.queueItView}
                  customerId={this.state.customerId}
                  waitingRoomId={this.state.waitingRoomId}
                  onStatusChanged={this.onQueueStatusChanged}
                />
              )}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                <Text style={styles.highlight}>QueueIt ReactNative Demo</Text>
              </Text>
              <View style={styles.margined}>
                <Text>Client Id</Text>
                <TextInput
                  style={styles.inputBox}
                  onChangeText={(text) => this.onClientChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Event Id or Alias</Text>
                <TextInput
                  style={styles.inputBox}
                  onChangeText={(text) => this.onEventChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Enqueue token</Text>
                <TextInput
                  style={styles.inputBox}
                  onChangeText={(text) => this.onEnqueueTokenChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Enqueue key</Text>
                <TextInput
                  style={styles.inputBox}
                  onChangeText={(text) => this.onEnqueueKeyChange(text)}
                />
              </View>
              <View style={styles.container}>
                <Text>
                  <CheckBox
                    style={styles.mr10}
                    value={this.state.isTesting}
                    onValueChange={() => this.toggleTesting()}
                  />
                  Enable testing
                </Text>
              </View>
              <View style={styles.margined}>
                <Button onPress={this.enqueue} title="Enqueue" />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  queueItView: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff",
    flex: 1,
    height: 252, 
    backgroundColor: 'purple',
    overflow: 'hidden'
  },
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  mr10: {
    marginRight: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 15,
  },
  inputBox: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  margined: {
    marginTop: 15,
  },
  body: {
    backgroundColor: Colors.white,
    padding: 10,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
