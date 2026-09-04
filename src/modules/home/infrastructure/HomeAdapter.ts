import type { HomeStatus } from '../domain/HomeStatus';

export class HomeAdapter {
  getInitialStatus(): HomeStatus {
    return {
      title: 'EdenShip',
      description: 'Base React Native lista para crecer por módulos.',
    };
  }
}
