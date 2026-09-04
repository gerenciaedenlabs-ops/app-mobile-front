import type { HomeAdapter } from '../../infrastructure/HomeAdapter';
import { useHomeStore } from '../HomeStore';

export function initializeHomeCommand(adapter: HomeAdapter): void {
  useHomeStore.getState().setStatus(adapter.getInitialStatus());
}
