import type { DataCollection, FloodAlert, MonitoringPoint } from '@/types/domain';
import type { MapViewport } from '@/types/map';

export type RiskMapProps = {
  pointsData: DataCollection<readonly MonitoringPoint[]>;
  alertsData: DataCollection<readonly FloodAlert[]>;
  region: MapViewport;
  onRegionChangeComplete: (region: MapViewport) => void;
  userLocationEnabled: boolean;
};
