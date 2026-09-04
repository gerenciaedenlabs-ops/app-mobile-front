import { create } from 'zustand';
import type { HomeStatus } from '../domain/HomeStatus';

type HomeState = {
  status: HomeStatus;
  setStatus: (status: HomeStatus) => void;
};

export const useHomeStore = create<HomeState>((set) => ({
  status: { title: '', description: '' },
  setStatus: (status) => set({ status }),
}));
