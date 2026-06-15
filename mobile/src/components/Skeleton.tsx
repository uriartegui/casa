import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle, DimensionValue, StyleProp } from 'react-native';
import { Colors } from '../constants/colors';

export function SkeletonBlock({ width, height, style }: { width?: DimensionValue; height: number; style?: StyleProp<ViewStyle> }) {
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

export function SkeletonLine({ width = '100%', height = 12, style }: { width?: DimensionValue; height?: number; style?: StyleProp<ViewStyle> }) {
  return <SkeletonBlock width={width} height={height} style={[styles.line, style]} />;
}

export function SkeletonChip({ width = 84 }: { width?: DimensionValue }) {
  return <SkeletonBlock height={30} width={width} style={styles.chip} />;
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

export function StoragePickerSkeleton() {
  return (
    <View style={styles.pickerRow}>
      <SkeletonChip width={98} />
      <SkeletonChip width={82} />
      <SkeletonChip width={96} />
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

export function HomeCardSkeleton() {
  return (
    <View style={styles.homeCard}>
      <View style={styles.homeCardHeader}>
        <SkeletonBlock height={18} width="38%" />
        <SkeletonBlock height={14} width={72} />
      </View>
      <View style={{ gap: 10 }}>
        <SkeletonLine width="78%" height={14} />
        <SkeletonLine width="56%" height={14} />
      </View>
    </View>
  );
}

export function HouseholdCardSkeleton() {
  return (
    <View style={styles.listCard}>
      <SkeletonLine width="48%" height={18} />
      <View style={styles.listCardMeta}>
        <SkeletonBlock height={13} width={76} style={{ borderRadius: 8 }} />
        <SkeletonBlock height={13} width={56} style={{ borderRadius: 8 }} />
      </View>
    </View>
  );
}

export function MemberRowSkeleton() {
  return (
    <View style={styles.memberRow}>
      <SkeletonBlock height={36} width={36} style={{ borderRadius: 18, flexShrink: 0 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonLine width="45%" height={15} />
        <SkeletonLine width="20%" height={11} />
      </View>
      <SkeletonLine width={10} height={14} />
    </View>
  );
}

export function StorageAdminCardSkeleton() {
  return (
    <View style={styles.storageAdminCard}>
      <View style={{ gap: 6 }}>
        <SkeletonLine width="42%" height={16} />
        <SkeletonLine width={48} height={11} />
      </View>
      <View style={styles.storageAdminActions}>
        <SkeletonBlock height={38} width="48%" style={{ borderRadius: 10 }} />
        <SkeletonBlock height={38} width="48%" style={{ borderRadius: 10 }} />
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
    backgroundColor: Colors.separator,
    borderRadius: 6,
  },
  line: { borderRadius: 999 },
  chip: { borderRadius: 16 },
  fridgeRow: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.separator,
    marginBottom: 8,
  },
  fridgeInfo: { flex: 1, gap: 6, marginRight: 12 },
  pickerRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  listCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    gap: 12,
  },
  listCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  listCardMeta: { flexDirection: 'row', gap: 8 },
  homeCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    gap: 14,
  },
  homeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  storageAdminCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  storageAdminActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  shoppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
});
