import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useSelectedHousehold } from '../context/SelectedHouseholdContext';
import { useHouseholds } from '../hooks/useHouseholds';
import { useStorages } from '../hooks/useStorages';
import { useTaskCategories } from '../hooks/useHouseTasks';
import { RootStackParamList } from '../navigation/types';

export default function SideMenuScreen({ navigation }: any) {
  const state = navigation.getState();
  const previousRoute = state.routes[Math.max(0, state.index - 1)]?.name ?? 'HomeFlow';
  const previousParams = state.routes[Math.max(0, state.index - 1)]?.params as { screen?: string; params?: { storageId?: string } } | undefined;
  const activeStorageId = previousRoute === 'StorageFlow' ? previousParams?.params?.storageId : undefined;
  const initialStockOpen = previousRoute === 'StorageFlow';
  const menuProgress = React.useRef(new Animated.Value(0)).current;
  const stockProgress = React.useRef(new Animated.Value(initialStockOpen ? 1 : 0)).current;
  const tasksProgress = React.useRef(new Animated.Value(previousRoute === 'TasksFlow' ? 1 : 0)).current;
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;
  const { data: storages } = useStorages(effectiveId);
  const { data: taskCategories } = useTaskCategories(effectiveId);
  const [stockOpen, setStockOpen] = React.useState(initialStockOpen);
  const [tasksOpen, setTasksOpen] = React.useState(previousRoute === 'TasksFlow');
  const defaultTaskCategoryNames = ['Limpeza', 'Cozinha', 'Banheiro', 'Lavanderia', 'Manutenção', 'Compras', 'Organização', 'Outros'];
  const taskCategoryNames = taskCategories?.length
    ? taskCategories.map((category) => category.name)
    : defaultTaskCategoryNames;
  const entries = [
    { label: 'Casa', icon: 'home', route: 'HouseholdFlow' },
    { label: 'Perfil', icon: 'user', route: 'ProfileFlow' },
  ];

  React.useEffect(() => {
    Animated.timing(menuProgress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [menuProgress]);

  function closeMenu(afterClose?: () => void) {
    Animated.timing(menuProgress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
      if (afterClose) requestAnimationFrame(afterClose);
    });
  }

  function toggleStock() {
    if (stockOpen) {
      Animated.timing(stockProgress, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }).start(() => setStockOpen(false));
      return;
    }

    setStockOpen(true);
    Animated.timing(stockProgress, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }

  function toggleTasks() {
    const next = !tasksOpen;
    if (next) setTasksOpen(true);
    Animated.timing(tasksProgress, { toValue: next ? 1 : 0, duration: 150, useNativeDriver: true }).start(() => { if (!next) setTasksOpen(false); });
  }

  function goTo(route: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) {
    if (route === previousRoute && !params) {
      closeMenu();
      return;
    }
    closeMenu(() => navigation.navigate(route as never, params as never));
  }

  function openStorage(storage: { id: string; name: string; emoji: string }) {
    if (!effectiveId) return;
    goTo('StorageFlow', {
      screen: 'Fridge',
      params: {
        householdId: effectiveId,
        storageId: storage.id,
        storageName: storage.name,
        storageEmoji: storage.emoji,
      },
    });
  }

  return (
    <View style={styles.sideMenuRoot}>
      <Animated.View
        pointerEvents="none"
        style={[styles.sideMenuBackdropTint, { opacity: menuProgress }]}
      />
      <TouchableOpacity
        style={styles.sideMenuBackdrop}
        activeOpacity={1}
        onPress={() => closeMenu()}
      />
      <Animated.View
        style={[
          styles.sideMenuPanel,
          {
            opacity: menuProgress,
            transform: [
              {
                translateX: menuProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [28, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.sideMenuHeader}>
          <Text style={styles.sideMenuKicker}>Colmeia</Text>
          <Text style={styles.sideMenuTitle}>Menu Principal</Text>
        </View>
        <View style={styles.sideMenuList}>
          <TouchableOpacity
            style={[styles.sideMenuItem, previousRoute === 'HomeFlow' && styles.sideMenuItemActive]}
            activeOpacity={0.78}
            onPress={() => goTo('HomeFlow')}
          >
            <View style={styles.sideMenuIconWrap}>
              <Feather
                name="grid"
                size={21}
                color={previousRoute === 'HomeFlow' ? '#fff' : Colors.textSecondary}
              />
            </View>
            <Text style={[styles.sideMenuText, previousRoute === 'HomeFlow' && styles.sideMenuTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideMenuItem}
            activeOpacity={0.78}
            onPress={toggleStock}
          >
            <View style={styles.sideMenuIconWrap}>
              <Feather name="box" size={21} color={Colors.textSecondary} />
            </View>
            <Text style={styles.sideMenuText}>Estoque</Text>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: stockProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
              }}
            >
              <Feather
                name="chevron-down"
                size={22}
                color={stockOpen ? Colors.accent : Colors.textSecondary}
              />
            </Animated.View>
            <Text style={[styles.sideMenuChevron, stockOpen && styles.sideMenuChevronActive]}>
              {stockOpen ? '⌃' : '⌄'}
            </Text>
          </TouchableOpacity>

          {stockOpen && (
            <Animated.View
              style={[
                styles.sideSubmenu,
                {
                  opacity: stockProgress,
                  transform: [
                    {
                      translateY: stockProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {(storages ?? []).map((storage) => (
                <TouchableOpacity
                  key={storage.id}
                  style={[styles.sideSubmenuItem, activeStorageId === storage.id && styles.sideSubmenuItemActive]}
                  activeOpacity={0.72}
                  onPress={() => openStorage(storage)}
                >
                  <Text style={[styles.sideSubmenuText, activeStorageId === storage.id && styles.sideSubmenuTextActive]}>{storage.name}</Text>
                </TouchableOpacity>
              ))}
              {(storages ?? []).length === 0 && (
                <Text style={styles.sideSubmenuEmpty}>Nenhum estoque visível</Text>
              )}
            </Animated.View>
          )}

          <TouchableOpacity
            style={[styles.sideMenuItem, previousRoute === 'ShoppingFlow' && styles.sideMenuItemActive]}
            activeOpacity={0.78}
            onPress={() => goTo('ShoppingFlow')}
          >
            <View style={styles.sideMenuIconWrap}>
              <Feather name="shopping-cart" size={21} color={previousRoute === 'ShoppingFlow' ? '#fff' : Colors.textSecondary} />
            </View>
            <Text style={[styles.sideMenuText, previousRoute === 'ShoppingFlow' && styles.sideMenuTextActive]}>Lista de compras</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideMenuItem} activeOpacity={0.78} onPress={toggleTasks}>
            <View style={styles.sideMenuIconWrap}><Feather name="check-square" size={21} color={Colors.textSecondary} /></View>
            <Text style={styles.sideMenuText}>Tarefas</Text>
            <Animated.View style={{ transform: [{ rotate: tasksProgress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}><Feather name="chevron-down" size={22} color={tasksOpen ? Colors.accent : Colors.textSecondary} /></Animated.View>
          </TouchableOpacity>
          {tasksOpen && (
            <Animated.View style={[styles.sideSubmenu, { opacity: tasksProgress, transform: [{ translateY: tasksProgress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
              {taskCategoryNames.map((category) => (
                <TouchableOpacity key={category} style={styles.sideSubmenuItem} activeOpacity={0.72} onPress={() => goTo('TasksFlow', { screen: 'TaskCategory', params: { category }, merge: false } as any)}>
                  <Text style={styles.sideSubmenuText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {entries.map((entry) => {
            const active = previousRoute === entry.route;
            return (
              <TouchableOpacity
                key={entry.route}
                style={[styles.sideMenuItem, active && styles.sideMenuItemActive]}
                activeOpacity={0.78}
                onPress={() => goTo(entry.route as keyof RootStackParamList)}
              >
                <View style={styles.sideMenuIconWrap}>
                  <Feather
                    name={entry.icon as any}
                    size={21}
                    color={active ? '#fff' : Colors.textSecondary}
                  />
                </View>
                <Text style={[styles.sideMenuText, active && styles.sideMenuTextActive]}>{entry.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sideMenuRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  sideMenuBackdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31,22,10,0.48)',
  },
  sideMenuBackdrop: { flex: 0.24 },
  sideMenuPanel: {
    flex: 0.76,
    backgroundColor: '#FFFCF7',
    borderTopLeftRadius: 34,
    borderBottomLeftRadius: 34,
    overflow: 'hidden',
    paddingTop: 72,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: -8, height: 0 },
    elevation: 12,
  },
  sideMenuHeader: {
    paddingHorizontal: 30,
    marginBottom: 22,
  },
  sideMenuKicker: {
    display: 'none',
  },
  sideMenuTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  sideMenuList: {
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  sideMenuItem: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 30,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: '#FFFCF7',
  },
  sideMenuItemActive: {
    backgroundColor: Colors.accent,
    borderBottomColor: Colors.accent,
  },
  sideMenuIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideMenuText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '300',
    color: Colors.textSecondary,
  },
  sideMenuTextActive: { color: '#fff', fontWeight: '300' },
  sideMenuChevron: {
    display: 'none',
  },
  sideMenuChevronActive: { display: 'none' },
  sideSubmenu: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: '#F7F7F7',
  },
  sideSubmenuItem: {
    minHeight: 52,
    justifyContent: 'center',
    paddingLeft: 74,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  sideSubmenuItemActive: {
    backgroundColor: Colors.accent + '14',
  },
  sideSubmenuText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sideSubmenuTextActive: {
    color: Colors.accent,
  },
  sideSubmenuEmpty: {
    paddingVertical: 16,
    paddingLeft: 74,
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
