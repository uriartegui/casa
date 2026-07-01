import React from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';

type UseBottomSheetMotionOptions = {
  collapsedRatio?: number;
  expandedOffset?: number;
  closeRatio?: number;
  onOpen?: () => void;
  onClose?: () => void;
};

export function useBottomSheetMotion({
  collapsedRatio = 0.74,
  expandedOffset = 64,
  closeRatio = 0.48,
  onOpen,
  onClose,
}: UseBottomSheetMotionOptions = {}) {
  const screenHeight = Dimensions.get('window').height;
  const collapsedHeight = Math.round(screenHeight * collapsedRatio);
  const expandedHeight = Math.round(screenHeight - expandedOffset);
  const closeThreshold = Math.round(screenHeight * closeRatio);
  const height = React.useRef(new Animated.Value(collapsedHeight)).current;
  const translateY = React.useRef(new Animated.Value(collapsedHeight)).current;
  const heightRef = React.useRef(collapsedHeight);
  const dragStartHeight = React.useRef(collapsedHeight);
  const onOpenRef = React.useRef(onOpen);
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
  }, [onClose, onOpen]);

  React.useEffect(() => {
    const listener = height.addListener(({ value }) => {
      heightRef.current = value;
    });
    return () => height.removeListener(listener);
  }, [height]);

  const reset = React.useCallback(() => {
    height.setValue(collapsedHeight);
    translateY.setValue(collapsedHeight);
    heightRef.current = collapsedHeight;
  }, [collapsedHeight, height, translateY]);

  const animateHeight = React.useCallback((toValue: number, onEnd?: () => void) => {
    Animated.spring(height, {
      toValue,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start(() => onEnd?.());
  }, [height]);

  const open = React.useCallback(() => {
    reset();
    onOpenRef.current?.();
    requestAnimationFrame(() => {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
        speed: 20,
        bounciness: 3,
      }).start();
    });
  }, [onOpen, reset, translateY]);

  const close = React.useCallback(() => {
    Animated.timing(translateY, {
      toValue: Math.max(heightRef.current, collapsedHeight),
      duration: 190,
      useNativeDriver: false,
    }).start(() => {
      onCloseRef.current?.();
      reset();
    });
  }, [collapsedHeight, reset, translateY]);

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      dragStartHeight.current = heightRef.current;
    },
    onPanResponderMove: (_, gesture) => {
      const nextHeight = Math.max(0, Math.min(expandedHeight, dragStartHeight.current - gesture.dy));
      height.setValue(nextHeight);
    },
    onPanResponderRelease: (_, gesture) => {
      const currentHeight = heightRef.current;
      const projectedHeight = Math.max(0, Math.min(expandedHeight, dragStartHeight.current - gesture.dy));
      const midpoint = (collapsedHeight + expandedHeight) / 2;
      if (projectedHeight < closeThreshold || gesture.moveY > screenHeight * 0.72) {
        close();
        return;
      }
      if (gesture.dy < -35 || gesture.vy < -0.75 || projectedHeight > midpoint || currentHeight > midpoint) {
        animateHeight(expandedHeight);
        return;
      }
      animateHeight(collapsedHeight);
    },
  }), [animateHeight, close, closeThreshold, collapsedHeight, expandedHeight, height, screenHeight]);

  return {
    height,
    translateY,
    panHandlers: panResponder.panHandlers,
    open,
    close,
    collapsedHeight,
    expandedHeight,
  };
}
