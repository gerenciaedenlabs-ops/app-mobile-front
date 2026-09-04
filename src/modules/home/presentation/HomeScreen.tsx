import { useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { initializeHomeCommand } from '../application/commands/InitializeHomeCommand';
import { useHomeQuery } from '../application/queries/useHomeQuery';
import { HomeAdapter } from '../infrastructure/HomeAdapter';
import { WelcomeComponent } from './components/WelcomeComponent';

export function HomeScreen() {
  const adapter = useRef(new HomeAdapter()).current;
  const { description, title } = useHomeQuery();

  useEffect(() => {
    initializeHomeCommand(adapter);
  }, [adapter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <WelcomeComponent title={title} description={description} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F3EE' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
});
