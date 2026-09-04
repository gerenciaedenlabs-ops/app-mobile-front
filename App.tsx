import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomeScreen } from './src/modules/home/presentation/HomeScreen';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomeScreen />
    </QueryClientProvider>
  );
}
