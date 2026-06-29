import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

type Props = {
  topInset: number;
  todayLabel: string;
  firstName: string;
  activityUnreadCount: number;
  onSearch: () => void;
  onHelp: () => void;
  onActivity: () => void;
  onMenu: () => void;
};

export default function HomeHeader({
  topInset,
  todayLabel,
  firstName,
  activityUnreadCount,
  onSearch,
  onHelp,
  onActivity,
  onMenu,
}: Props) {
  return (
    <View style={[styles.header, { paddingTop: topInset + 6 }]}>
      <View style={styles.homeHeaderBar}>
        <View style={styles.homeHeaderIdentity}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={25} color="#fff" />
          </View>
          <View style={styles.homeHeaderTextBlock}>
            <Text style={styles.homeHeaderDate}>{todayLabel}</Text>
            <Text style={styles.headerGreeting}>
              Ola, <Text style={styles.headerGreetingName}>{firstName}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.homeHeaderActions}>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7} onPress={onActivity}>
            <Feather name="bell" size={23} color={Colors.textPrimary} />
            {activityUnreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{activityUnreadCount > 99 ? '99+' : activityUnreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7} onPress={onSearch}>
            <Feather name="search" size={23} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7} onPress={onHelp}>
            <Feather name="help-circle" size={23} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton} onPress={onMenu} activeOpacity={0.7}>
            <Feather name="menu" size={30} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -20,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  homeHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  homeHeaderIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeHeaderTextBlock: { flex: 1 },
  homeHeaderDate: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  headerGreeting: { fontSize: 17, color: Colors.textSecondary },
  headerGreetingName: { color: Colors.textPrimary, fontWeight: '800' },
  homeHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerBadge: {
    position: 'absolute',
    top: 2,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 12 },
});
