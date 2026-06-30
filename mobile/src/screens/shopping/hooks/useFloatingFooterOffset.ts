import React from 'react';
import { Keyboard, LayoutChangeEvent, Platform } from 'react-native';

export function useFloatingFooterOffset() {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [footerHeight, setFooterHeight] = React.useState(0);
  const footerKeyboardOffset = Platform.OS === 'ios' ? keyboardHeight : 0;

  React.useEffect(() => {
    const updateKeyboardHeight = (event: { endCoordinates: { height: number } }) => {
      if (event.endCoordinates.height > 0) setKeyboardHeight(event.endCoordinates.height);
    };
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, updateKeyboardHeight);
    const frameSubscription = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillChangeFrame', updateKeyboardHeight)
      : null;
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSubscription.remove();
      frameSubscription?.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleFooterLayout = React.useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height);
  }, []);

  return {
    footerHeight,
    footerKeyboardOffset,
    handleFooterLayout,
  };
}
