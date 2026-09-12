import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

interface DevelopmentHeaderProps {
  title: string;
  subtitle: string;
}

export function DevelopmentHeader({ title, subtitle }: DevelopmentHeaderProps) {
  const router = useRouter();
  return (
    <View className="flex-row items-center gap-3 py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={() => router.back()}
        className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-slate-200"
      >
        <Text className="text-2xl text-ink">‹</Text>
      </Pressable>
      <View className="flex-1">
        <Text className="text-xl font-extrabold text-ink">{title}</Text>
        <Text className="text-xs text-ink-muted">{subtitle}</Text>
      </View>
    </View>
  );
}

