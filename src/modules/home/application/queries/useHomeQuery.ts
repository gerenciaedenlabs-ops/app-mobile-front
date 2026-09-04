import { useHomeStore } from '../HomeStore';

export function useHomeQuery() {
  return useHomeStore((state) => state.status);
}
