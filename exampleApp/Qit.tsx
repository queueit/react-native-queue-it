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

import { QueueIt, EnqueueResultState } from 'react-native-queue-it';

import type { EnqueueResult } from 'react-native-queue-it';

type AppState = {
  clientId: string;
  eventOrAlias: string;
  isTesting: boolean;
  enqueueToken: string;
  enqueueKey: string;
};

class Qit extends Component<{}, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      clientId: '',
      eventOrAlias: '',
      isTesting: false,
      enqueueToken: '',
      enqueueKey: '',
    };
  }
  componentDidMount() {}

  getEnqueueToken = () => 'myToken';

  getEnqueueKey = () => 'myKey';

  enqueue = async () => {
    try {
      console.log('going to queue-it');

      QueueIt.once('openingQueueView', () => {
        console.log('opening queue page..');
      });

      QueueIt.once('webViewClosed', () => {
        console.log('The queue page is closed by the user.');
      });

      let enqueueResult: EnqueueResult;

      if (this.state.enqueueKey) {
        enqueueResult = await QueueIt.runWithEnqueueKey(
          this.state.clientId,
          this.state.eventOrAlias,
          this.getEnqueueKey()
        );
      } else if (this.state.enqueueToken) {
        enqueueResult = await QueueIt.runWithEnqueueToken(
          this.state.clientId,
          this.state.eventOrAlias,
          this.getEnqueueToken()
        );
      } else {
        enqueueResult = await QueueIt.run(
          this.state.clientId,
          this.state.eventOrAlias
        );
      }
      switch (enqueueResult.State) {
        case EnqueueResultState.Disabled:
          console.log(
            `queue is disabled and token is: ${enqueueResult.QueueITToken}`
          );
          break;
        case EnqueueResultState.Passed:
          console.log(`
          user got his turn, with QueueITToken: ${enqueueResult.QueueITToken}
          `);
          break;
        case EnqueueResultState.Unavailable:
          console.log('queue is unavailable');
          break;
        case EnqueueResultState.RestartedSession:
          console.log('user decided to restart the session');
          await this.enqueue();
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
                  onChangeText={text => this.onClientChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Event Id or Alias</Text>
                <TextInput
                  style={styles.inputBox}
                  onChangeText={text => this.onEventChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Enqueue token</Text>
                <TextInput
                  style={styles.inputBox}
                  onChangeText={text => this.onEnqueueTokenChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Enqueue key</Text>
                <TextInput
                  style={styles.inputBox}
                  onChangeText={text => this.onEnqueueKeyChange(text)}
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
    backgroundColor: 'white',
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
    backgroundColor: 'white',
    padding: 10,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'black',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default Qit;
