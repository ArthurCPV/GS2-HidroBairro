import type { Coordinates } from '@/types/domain';

export interface MapViewport extends Coordinates {
  latitudeDelta: number;
  longitudeDelta: number;
}
