import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

function SkeletonBlock({ width, height, style }: { width?: number | string; height: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.block,
        { width: width ?? '100%', height, opacity },
        style,
      ]}
    />
  );
}

export function FridgeItemSkeleton() {
  return (
    <View style={styles.fridgeRow}>
      <View style={styles.fridgeInfo}>
        <SkeletonBlock height={16} width="60%" />
        <SkeletonBlock height={12} width="35%" style={{ marginTop: 6 }} />
      </View>
      <SkeletonBlock height={28} width={72} style={{ borderRadius: 8 }} />
    </View>
  );
}

export function ShoppingListCardSkeleton() {
  return (
    <View style={styles.listCard}>
      <View style={styles.listCardHeader}>
        <SkeletonBlock height={18} width="50%" />
        <SkeletonBlock height={24} width={64} style={{ borderRadius: 12 }} />
      </View>
      <View style={styles.listCardMeta}>
        <SkeletonBlock height={13} width={80} style={{ borderRadius: 8 }} />
        <SkeletonBlock height={13} width={60} style={{ borderRadius: 8 }} />
      </View>
    </View>
  );
}

export function ShoppingItemSkeleton() {
  return (
    <View style={styles.shoppingRow}>
      <SkeletonBlock height={22} width={22} style={{ borderRadius: 6, flexShrink: 0 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBlock height={15} width="55%" />
        <SkeletonBlock height={12} width="30%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
  },
  fridgeRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: 8,
  },
  fridgeInfo: { flex: 1, gap: 6, marginRight: 12 },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    gap: 12,
  },
  listCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listCardMeta: { flexDirection: 'row', gap: 8 },
  shoppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
});
