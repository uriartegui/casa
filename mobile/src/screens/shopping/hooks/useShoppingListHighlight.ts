import React from 'react';
import { Animated } from 'react-native';
import { ShoppingItem } from '../../../types';

function playHighlight(animation: Animated.Value) {
  animation.setValue(0);
  Animated.sequence([
    Animated.timing(animation, { toValue: 1, duration: 260, useNativeDriver: false }),
    Animated.delay(650),
    Animated.timing(animation, { toValue: 0, duration: 950, useNativeDriver: false }),
  ]).start();
}

export function useShoppingListHighlight({
  items,
  highlightItemId,
  highlightList,
}: {
  items?: ShoppingItem[];
  highlightItemId?: string;
  highlightList?: boolean;
}) {
  const highlightAnim = React.useRef(new Animated.Value(0)).current;
  const listHighlightAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!highlightItemId || !items?.some((item) => item.id === highlightItemId)) return;
    playHighlight(highlightAnim);
  }, [highlightAnim, highlightItemId, items]);

  React.useEffect(() => {
    if (!highlightList) return;
    playHighlight(listHighlightAnim);
  }, [highlightList, listHighlightAnim]);

  return {
    highlightAnim,
    listHighlightAnim,
  };
}
