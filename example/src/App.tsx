import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Button,
  TextInput,
  NativeEventEmitter,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import QueueIt from 'react-native-queue-it';

type AppState = {
  clientId: string;
  event: string;
};

class App extends Component<{}, AppState> {
  eventListener: any;
  componentDidMount() {
    QueueIt.enableTesting();
    const eventEmitter = new NativeEventEmitter(QueueIt);
    this.eventListener = eventEmitter.addListener('openingQueueView', () => {
      console.log('opening queue page..');
    });
  }

  enqueue = async () => {
    try {
      console.log('going to queue-it');
      const token = await QueueIt.run(this.state.clientId, this.state.event);
      console.log(`got through: ${token}`);
    } catch (e) {
      console.log(`error: ${e}`);
    }
  };

  onClientChange = (txt: string) => {
    this.setState({ clientId: txt });
  };

  onEventChange = (txt: string) => {
    this.setState({ event: txt });
  };

  render() {
    return (
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                <Text style={styles.highlight}>QueueIt ReactNative Demo</Text>
              </Text>

              <View style={styles.margined}>
                <Text>Client Id</Text>
                <TextInput
                  style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
                  onChangeText={text => this.onClientChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Event Id or Alias</Text>
                <TextInput
                  style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
                  onChangeText={(text) => this.onEventChange(text)}
                />
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
  scrollView: {
    backgroundColor: Colors.lighter,
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
