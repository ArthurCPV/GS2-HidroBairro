import type {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type HomeTabParamList = {
  Home: undefined;
  Map: undefined;
  Alerts: undefined;
  Guidance: undefined;
  Requests: undefined;
};

export type RootStackParamList = {
  Authentication: undefined;
  Main: NavigatorScreenParams<HomeTabParamList> | undefined;
  AlertDetails: { id: string };
  NewRequest: { requestId?: number } | undefined;
  RequestDetails: { id: string };
};

export type HomeTabNavigationProp<
  RouteName extends keyof HomeTabParamList,
> = CompositeNavigationProp<
  BottomTabNavigationProp<HomeTabParamList, RouteName>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export type RouteLink = {
  label: string;
  onPress: () => void;
};
