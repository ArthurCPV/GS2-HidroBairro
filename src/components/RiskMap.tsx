import type { ComponentType } from 'react';
import { Platform } from 'react-native';
import type { RiskMapProps } from './RiskMapTypes';

const loadRiskMap = Platform.select({
  native: () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Keep the native-only map out of web.
    require('./RiskMapNative').default as ComponentType<RiskMapProps>,
  default: () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Load the web fallback on browsers.
    require('./RiskMapWeb').default as ComponentType<RiskMapProps>,
});

if (!loadRiskMap) {
  throw new Error('Não há uma implementação de mapa para esta plataforma.');
}

const RiskMap = loadRiskMap();

export default RiskMap;
