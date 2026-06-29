import React from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import GlobalSearchModal from './GlobalSearchModal';
import { useGlobalSearchModal } from '../context/GlobalSearchContext';
import { useHouseholds } from '../hooks/useHouseholds';
import { useSelectedHousehold } from '../context/SelectedHouseholdContext';
import { api } from '../services/api';

function HeaderMenuButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => {
        const parent = navigation.getParent?.();
        if (parent) parent.navigate('Menu');
        else navigation.navigate('Menu');
      }}
      style={styles.headerMenuButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Feather name="menu" size={30} color={Colors.textPrimary} />
    </TouchableOpacity>
  );
}

function HeaderSearchButton() {
  const { openSearch } = useGlobalSearchModal();
  return (
    <TouchableOpacity
      onPress={openSearch}
      style={styles.headerSearchButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Feather name="search" size={23} color={Colors.textPrimary} />
    </TouchableOpacity>
  );
}

export function StorageHouseholdHeader({ navigation, storageName, householdName }: { navigation: any; storageName: string; householdName: string }) {
  const { data: households } = useHouseholds();
  const { selectedHouseholdId, setSelectedHouseholdId } = useSelectedHousehold();
  const activeName = households?.find((household) => household.id === selectedHouseholdId)?.name ?? householdName;

  async function changeHousehold(householdId: string) {
    setSelectedHouseholdId(householdId);
    const response = await api.get<{ id: string; name: string; emoji: string }[]>(`/households/${householdId}/storages`);
    const storage = response.data.find((item) => item.name === storageName) ?? response.data[0];
    if (storage) navigation.replace('Fridge', { householdId, storageId: storage.id, storageName: storage.name, storageEmoji: storage.emoji });
  }

  function openHouseholdSelector() {
    const options = households ?? [];
    if (options.length <= 1) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options.map((household) => household.name), 'Cancelar'],
          cancelButtonIndex: options.length,
          userInterfaceStyle: 'light',
        },
        (index) => {
          if (index < options.length) void changeHousehold(options[index].id);
        },
      );
      return;
    }

    Alert.alert('Escolher casa', undefined, options.map((household) => ({
      text: household.name,
      onPress: () => void changeHousehold(household.id),
    })), { cancelable: true });
  }

  return (
    <View style={{ position: 'relative', minWidth: 150 }}>
      <TouchableOpacity onPress={openHouseholdSelector} activeOpacity={0.75} style={{ paddingVertical: 2 }}>
        <Text style={styles.storageHeaderTitle}>{storageName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={styles.storageHeaderSubtitle}>{activeName}</Text>
          <Feather name="chevron-down" size={13} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function AppHeader({ navigation, route, options, back }: any) {
  const insets = useSafeAreaInsets();
  const title = options.title ?? route.name;
  const headerTitle = options.headerTitle;
  const headerRight = options.headerRight;
  const headerAlert = options.headerAlert;
  const showBack = !!back && options.headerBackVisible !== false;

  const titleContent = typeof headerTitle === 'function'
    ? headerTitle({ children: title, tintColor: Colors.textPrimary })
    : (
      <Text style={styles.appHeaderTitle} numberOfLines={1}>
        {typeof headerTitle === 'string' ? headerTitle : title}
      </Text>
    );

  return (
    <>
      <View style={[styles.appHeader, { paddingTop: insets.top + 6 }]}>
        <View style={styles.appHeaderRow}>
          {showBack && (
            <TouchableOpacity
              style={styles.appHeaderBack}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="chevron-left" size={26} color={Colors.accent} />
            </TouchableOpacity>
          )}
          <View style={[styles.appHeaderTitleWrap, !showBack && styles.appHeaderTitleWrapNoBack]}>
            {titleContent}
          </View>
          <View style={styles.appHeaderRight}>
            {headerAlert ? headerAlert({ tintColor: Colors.textPrimary }) : null}
            <HeaderSearchButton />
            {headerRight ? headerRight({ tintColor: Colors.textPrimary }) : <HeaderMenuButton />}
          </View>
        </View>
      </View>
      <GlobalSearchModal navigation={navigation.getParent?.() ?? navigation} />
    </>
  );
}

const styles = StyleSheet.create({
  headerMenuButton: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSearchButton: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  appHeaderRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appHeaderBack: {
    width: 34,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  appHeaderTitleWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  appHeaderTitleWrapNoBack: {
    paddingLeft: 0,
  },
  appHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  appHeaderRight: {
    minWidth: 28,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  storageHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  storageHeaderSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    lineHeight: 14,
  },
});
