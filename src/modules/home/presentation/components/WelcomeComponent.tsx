import { StyleSheet, Text, View } from 'react-native';

type WelcomeComponentProps = {
  title: string;
  description: string;
};

export function WelcomeComponent({ title, description }: WelcomeComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SHIPATHON 2026</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  eyebrow: { color: '#F06A4F', fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  title: { color: '#1E2926', fontSize: 44, fontWeight: '800' },
  description: { color: '#64716D', fontSize: 17, lineHeight: 25 },
});
