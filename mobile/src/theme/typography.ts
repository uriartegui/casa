import { Platform } from 'react-native';

export const Typography = {
  display: Platform.select({
    ios: 'AvenirNext-Heavy',
    android: 'sans-serif-black',
    default: undefined,
  }),
  title: Platform.select({
    ios: 'AvenirNext-DemiBold',
    android: 'sans-serif-medium',
    default: undefined,
  }),
  body: Platform.select({
    ios: 'AvenirNext-Regular',
    android: 'sans-serif',
    default: undefined,
  }),
  rounded: Platform.select({
    ios: 'AvenirNext-Medium',
    android: 'sans-serif-rounded',
    default: undefined,
  }),
} as const;
