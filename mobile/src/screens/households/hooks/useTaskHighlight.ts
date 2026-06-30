import React from 'react';
import { Animated } from 'react-native';
import { HouseTask } from '../../../types';

export function useTaskHighlight({
  tasks,
  highlightTaskId,
}: {
  tasks?: HouseTask[];
  highlightTaskId?: string;
}) {
  const highlightAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!highlightTaskId || !tasks?.some((task) => task.id === highlightTaskId)) return;
    highlightAnim.setValue(0);
    Animated.sequence([
      Animated.timing(highlightAnim, { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.delay(650),
      Animated.timing(highlightAnim, { toValue: 0, duration: 950, useNativeDriver: false }),
    ]).start();
  }, [highlightAnim, highlightTaskId, tasks]);

  return highlightAnim;
}
