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

import {
  QueueIt,
  EnqueueResultState,
  TryPassState,
} from 'react-native-queue-it';

import type {
  EnqueueResult,
  QueueItTryPassResult,
} from 'react-native-queue-it';

type AppState = {
  clientId: string;
  eventOrAlias: string;
  enqueueToken: string;
  enqueueKey: string;
  waitingRoomDomain: string;
  queuePathPrefix: string;
  inviteCode: string;
  queryToAdd: string;
};

class Qit extends Component<{}, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      clientId: '',
      eventOrAlias: '',
      enqueueToken: '',
      enqueueKey: '',
      waitingRoomDomain: '',
      queuePathPrefix: '',
      inviteCode: '',
      queryToAdd: '',
    };
  }
  componentDidMount() {}

  getEnqueueToken = () => 'myToken';

  getEnqueueKey = () => 'myKey';

  registerHandlers = () => {
    QueueIt.once('openingQueueView', () => {
      console.log('opening queue page..');
    });

    QueueIt.once('webViewClosed', () => {
      console.log('The queue page is closed by the user.');
    });

    return QueueIt.on('queueUrlChanged', details => {
      console.log(`queue page address changed: ${details?.url}`);
    });
  };

  handleResult = async (enqueueResult: EnqueueResult) => {
    switch (enqueueResult.State) {
      case EnqueueResultState.Disabled:
        console.log(
          `queue is disabled and token is: ${enqueueResult.QueueITToken}`,
        );
        break;
      case EnqueueResultState.Passed:
        console.log(`
          user got his turn, with QueueITToken: ${enqueueResult.QueueITToken}
          `);
        break;
      case EnqueueResultState.Unavailable:
        console.log(
          `queue is unavailable, ErrorCode: ${enqueueResult.ErrorCode}`,
        );
        break;
      case EnqueueResultState.RestartedSession:
        console.log('user decided to restart the session');
        await this.enqueue();
    }
  };

  logError = (e: unknown) => {
    const userInfo = (e as { userInfo?: { errorCode?: string } }).userInfo;
    console.log(`error: ${e}, errorCode: ${userInfo?.errorCode}`);
  };

  enqueue = async () => {
    let urlSubscription: { remove: () => void } | undefined;
    try {
      console.log('going to queue-it');

      urlSubscription = this.registerHandlers();

      const { waitingRoomDomain, queuePathPrefix, inviteCode } = this.state;
      const options = { waitingRoomDomain, queuePathPrefix, inviteCode };
      let enqueueResult: EnqueueResult;

      if (this.state.enqueueKey) {
        enqueueResult = await QueueIt.runWithEnqueueKey(
          this.state.clientId,
          this.state.eventOrAlias,
          this.getEnqueueKey(),
          undefined,
          undefined,
          options,
        );
      } else if (this.state.enqueueToken) {
        enqueueResult = await QueueIt.runWithEnqueueToken(
          this.state.clientId,
          this.state.eventOrAlias,
          this.getEnqueueToken(),
          undefined,
          undefined,
          options,
        );
      } else {
        enqueueResult = await QueueIt.run(
          this.state.clientId,
          this.state.eventOrAlias,
          undefined,
          undefined,
          options,
        );
      }
      await this.handleResult(enqueueResult);
    } catch (e) {
      this.logError(e);
    } finally {
      urlSubscription?.remove();
    }
  };

  withQueryAdded = (queueUrl: string) => {
    const query = this.state.queryToAdd.trim();
    if (!query) {
      return queueUrl;
    }
    if (/[?&]$/.test(queueUrl)) {
      return `${queueUrl}${query}`;
    }
    if (queueUrl.includes('?')) {
      return `${queueUrl}&${query}`;
    }
    return `${queueUrl}?${query}`;
  };

  checkPassThenShow = async () => {
    let urlSubscription: { remove: () => void } | undefined;
    try {
      console.log('checking for a pass');

      const { waitingRoomDomain, queuePathPrefix, inviteCode } = this.state;
      const options = { waitingRoomDomain, queuePathPrefix, inviteCode };
      let passResult: QueueItTryPassResult;

      if (this.state.enqueueKey) {
        passResult = await QueueIt.tryPassWithEnqueueKey(
          this.state.clientId,
          this.state.eventOrAlias,
          this.getEnqueueKey(),
          undefined,
          undefined,
          options,
        );
      } else if (this.state.enqueueToken) {
        passResult = await QueueIt.tryPassWithEnqueueToken(
          this.state.clientId,
          this.state.eventOrAlias,
          this.getEnqueueToken(),
          undefined,
          undefined,
          options,
        );
      } else {
        passResult = await QueueIt.tryPass(
          this.state.clientId,
          this.state.eventOrAlias,
          undefined,
          undefined,
          options,
        );
      }
      console.log(
        `pass check: State ${passResult.State}, RedirectType ${passResult.RedirectType}`,
      );

      if (passResult.State === TryPassState.Queue) {
        urlSubscription = this.registerHandlers();
        passResult = {
          ...passResult,
          QueueUrl: this.withQueryAdded(passResult.QueueUrl),
        };
      }
      await this.handleResult(await QueueIt.showQueue(passResult));
    } catch (e) {
      this.logError(e);
    } finally {
      urlSubscription?.remove();
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

  onWaitingRoomDomainChange = (txt: string) => {
    this.setState({ waitingRoomDomain: txt });
  };

  onQueuePathPrefixChange = (txt: string) => {
    this.setState({ queuePathPrefix: txt });
  };

  onInviteCodeChange = (txt: string) => {
    this.setState({ inviteCode: txt });
  };

  onQueryToAddChange = (txt: string) => {
    this.setState({ queryToAdd: txt });
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
                  autoCapitalize="none"
                  style={styles.inputBox}
                  onChangeText={text => this.onClientChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Event Id or Alias</Text>
                <TextInput
                  autoCapitalize="none"
                  style={styles.inputBox}
                  onChangeText={text => this.onEventChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Enqueue token</Text>
                <TextInput
                  autoCapitalize="none"
                  style={styles.inputBox}
                  onChangeText={text => this.onEnqueueTokenChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Enqueue key</Text>
                <TextInput
                  autoCapitalize="none"
                  style={styles.inputBox}
                  onChangeText={text => this.onEnqueueKeyChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Waiting room domain (optional)</Text>
                <TextInput
                  autoCapitalize="none"
                  style={styles.inputBox}
                  onChangeText={text => this.onWaitingRoomDomainChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Queue path prefix (optional)</Text>
                <TextInput
                  autoCapitalize="none"
                  style={styles.inputBox}
                  onChangeText={text => this.onQueuePathPrefixChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Invite code (optional)</Text>
                <TextInput
                  autoCapitalize="none"
                  style={styles.inputBox}
                  onChangeText={text => this.onInviteCodeChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Text>Query to add to the queue address (optional)</Text>
                <TextInput
                  autoCapitalize="none"
                  style={styles.inputBox}
                  onChangeText={text => this.onQueryToAddChange(text)}
                />
              </View>
              <View style={styles.margined}>
                <Button onPress={this.enqueue} title="Enqueue" />
              </View>
              <View style={styles.margined}>
                <Button
                  onPress={this.checkPassThenShow}
                  title="Check pass, then show"
                />
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
