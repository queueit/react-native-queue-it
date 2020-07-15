import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import QueueIt from 'react-native-queue-it';

class App extends React.Component {
  render() {
    const result = 0;
    console.log(QueueIt);
    return (
      <View style={styles.container}>
        <Text>Result: {result}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
