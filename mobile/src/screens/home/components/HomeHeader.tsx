import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { HeaderActionGroup, HeaderIconButton } from '../../../components/HeaderActions';
import { Typography } from '../../../theme/typography';

type Props = {
  topInset: number;
  todayLabel: string;
  firstName: string;
  activityUnreadCount: number;
  onSearch: () => void;
  onHelp: () => void;
  onAlerts: () => void;
  onMenu: () => void;
};

export default function HomeHeader({
  topInset,
  todayLabel,
  firstName,
  activityUnreadCount,
  onSearch,
  onHelp,
  onAlerts,
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

        <HeaderActionGroup>
          <HeaderIconButton icon="bell" badgeCount={activityUnreadCount} onPress={onAlerts} />
          <HeaderIconButton icon="search" onPress={onSearch} />
          <HeaderIconButton icon="help-circle" onPress={onHelp} />
          <HeaderIconButton icon="menu" size={30} onPress={onMenu} />
        </HeaderActionGroup>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: -20,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: Colors.background,
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
    fontFamily: Typography.title,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  headerGreeting: { fontFamily: Typography.body, fontSize: 16, color: Colors.textSecondary },
  headerGreetingName: { fontFamily: Typography.title, color: Colors.textPrimary, fontWeight: '800' },
});
