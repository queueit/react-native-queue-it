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
import { Colors } from 'react-native/Libraries/NewAppScreen';

import { QueueIt, EnqueueResultState } from 'react-native-queue-it';

type AppState = {
  clientId: string;
  eventOrAlias: string;
};

class App extends Component<{}, AppState> {
  componentDidMount() {
    QueueIt.enableTesting();
  }

  enqueue = async () => {
    try {
      console.log('going to queue-it');
      QueueIt.once('openingQueueView', () => {
        console.log('opening queue page..');
      });
      QueueIt.once('userExited', () => {
        console.log('user exited the line');
      });
      const enqueueResult = await QueueIt.run(
        this.state.clientId,
        this.state.eventOrAlias
      );
      switch (enqueueResult.State) {
        case EnqueueResultState.Disabled:
          console.log('queue is disabled');
          break;
        case EnqueueResultState.Passed:
          console.log(`user got his turn, with Queueittoken: ${enqueueResult.Queueittoken}`);
          break;
        case EnqueueResultState.Unavailable:
          console.log('queue is unavailable');
          break;
      }
    } catch (e) {
      console.log(`error: ${e}`);
    }
  };

  onClientChange = (txt: string) => {
    this.setState({ clientId: txt });
  };

  onEventChange = (txt: string) => {
    this.setState({ eventOrAlias: txt });
  };

  render() {
    return (
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}
        >
          <View style={styles.body}>
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
