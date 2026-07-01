import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { ShoppingItem } from '../../../types';
import { Typography } from '../../../theme/typography';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

type ListFocusSummaryProps = {
  total: number;
  boughtCount: number;
  urgent: boolean;
  currentPlace: string;
  currentCategory: string;
  highlightStyle: {
    backgroundColor: Animated.AnimatedInterpolation<string | number>;
    borderColor: Animated.AnimatedInterpolation<string | number>;
  };
  onToggleUrgent: () => void;
};

type ShoppingItemRowProps = {
  item: ShoppingItem;
  highlightStyle: any;
  onToggle: (item: ShoppingItem) => void;
  onDelete: (itemId: string, itemName?: string) => void;
};

export function ListFocusSummary({
  total,
  boughtCount,
  urgent,
  currentPlace,
  currentCategory,
  highlightStyle,
  onToggleUrgent,
}: ListFocusSummaryProps) {
  return (
    <Animated.View style={[styles.listFocusBand, highlightStyle]}>
      {total > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressFraction}>{boughtCount}/{total}</Text>
            <Text style={styles.progressLabel}>
              {boughtCount === total ? 'tudo comprado' : 'comprados'}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(boughtCount / total) * 100}%` as any }]} />
          </View>
        </View>
      )}

      <View style={styles.metaRow}>
        <TouchableOpacity
          style={[styles.urgentChip, urgent && styles.urgentChipActive]}
          onPress={onToggleUrgent}
          activeOpacity={0.75}
        >
          <Text style={[styles.urgentChipText, urgent && styles.urgentChipTextActive]}>
            {urgent ? 'Urgente' : 'Marcar urgente'}
          </Text>
        </TouchableOpacity>
        {!!currentPlace && <Text style={styles.metaText}>{currentPlace}</Text>}
        {!!currentCategory && <Text style={styles.metaText}>{currentCategory}</Text>}
      </View>
    </Animated.View>
  );
}

export function ShoppingItemRow({ item, highlightStyle, onToggle, onDelete }: ShoppingItemRowProps) {
  return (
    <AnimatedTouchableOpacity style={[styles.itemRow, highlightStyle]} onPress={() => onToggle(item)} activeOpacity={0.7}>
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
      </View>
      <Text style={[styles.itemQty, item.checked && styles.itemQtyChecked]}>
        {item.quantity} {item.unit ?? ''}
      </Text>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={(event) => {
          event.stopPropagation();
          onDelete(item.id, item.name);
        }}
        activeOpacity={0.7}
        accessibilityLabel={`Remover ${item.name}`}
      >
        <Text style={styles.removeButtonText}>X</Text>
      </TouchableOpacity>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listFocusBand: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  progressContainer: { marginBottom: 10 },
  progressTopRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 7 },
  progressFraction: { fontFamily: Typography.display, fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  progressLabel: { fontFamily: Typography.title, fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.separator,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 14,
    rowGap: 6,
  },
  urgentChip: {
    minHeight: 28,
    justifyContent: 'center',
  },
  urgentChipActive: {},
  urgentChipText: { fontFamily: Typography.title, fontSize: 14, fontWeight: '800', color: Colors.destructive },
  urgentChipTextActive: { color: Colors.destructive },
  metaText: {
    color: Colors.textSecondary,
    fontFamily: Typography.title,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 0,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: { color: '#fff', fontWeight: '800', fontSize: 15, lineHeight: 18 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontFamily: Typography.rounded, fontSize: 16, color: Colors.textPrimary, fontWeight: '600' },
  itemNameChecked: { textDecorationLine: 'line-through', color: Colors.textSecondary, fontWeight: '500' },
  itemQty: { fontFamily: Typography.body, fontSize: 13, color: Colors.textSecondary, marginLeft: 8 },
  itemQtyChecked: { textDecorationLine: 'line-through' },
  removeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  removeButtonText: {
    color: Colors.destructive,
    fontFamily: Typography.title,
    fontSize: 16,
    fontWeight: '800',
  },
});
