import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useShoppingLists, useDeleteShoppingList, useUpdateShoppingList, useShoppingActivity } from '../../hooks/useShoppingLists';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { formatBrShortDate } from '../../utils/dateUtils';
import { ShoppingListCardSkeleton } from '../../components/Skeleton';
import { Colors } from '../../constants/colors';
import { Typography } from '../../theme/typography';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { ShoppingList } from '../../types';
import { useActivitySeen } from '../../hooks/useActivitySeen';
import { HelpSheet } from '../../components/HelpSheet';
import AlertsSheet from '../../components/AlertsSheet';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { useShoppingAlerts } from './hooks/useShoppingAlerts';
import { SHOPPING_HELP_HIGHLIGHTS, SHOPPING_HELP_SECTIONS } from './helpContent';
import { LoadErrorState } from '../../components/LoadErrorState';
import { HeaderActionGroup, HeaderIconButton } from '../../components/HeaderActions';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingLists'>;
};

export default function ShoppingListsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households, isLoading: loadingHouseholds, isError: householdsError, isFetching: fetchingHouseholds, refetch: refetchHouseholds } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;

  const { data: lists, isLoading, isError: listsError, isFetching: fetchingLists, refetch } = useShoppingLists(effectiveId);
  const { data: shoppingActivity } = useShoppingActivity(effectiveId);
  const {
    lastSeenAt: shoppingActivitySeenAt,
    markSeen: markShoppingActivitySeen,
  } = useActivitySeen('shopping', effectiveId, shoppingActivity ?? [], user?.id);
  const openAlertList = React.useCallback((list: ShoppingList) => {
    navigation.navigate('ShoppingListDetail', {
      householdId: list.householdId,
      listId: list.id,
      listName: list.name,
      listUrgent: list.urgent,
      listPlace: list.place,
      listCategory: list.category,
      highlightList: true,
    });
  }, [navigation]);
  const { alertSections, alertCount } = useShoppingAlerts({
    lists,
    activity: shoppingActivity,
    userId: user?.id,
    lastSeenAt: shoppingActivitySeenAt,
    onOpenList: openAlertList,
  });

  useRefreshOnFocus(refetch);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const household = households?.find((h) => h.id === effectiveId);

  const deleteList = useDeleteShoppingList(effectiveId ?? '');
  const updateList = useUpdateShoppingList(effectiveId ?? '');
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUrgent, setEditUrgent] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [alertsVisible, setAlertsVisible] = useState(false);
  const helpSheet = useBottomSheetMotion({
    onOpen: () => setHelpVisible(true),
    onClose: () => setHelpVisible(false),
  });
  const alertsSheet = useBottomSheetMotion({
    onOpen: () => {
      setAlertsVisible(true);
      markShoppingActivitySeen();
    },
    onClose: () => setAlertsVisible(false),
  });

  React.useEffect(() => {
    (navigation as any).setOptions({
      title: household?.name ?? 'Listas de Compras',
      headerAlert: () => (
        <HeaderIconButton icon="bell" badgeCount={alertCount} onPress={() => effectiveId && alertsSheet.open()} />
      ),
      headerRight: () => (
        <HeaderActionGroup>
          <HeaderIconButton icon="help-circle" onPress={helpSheet.open} />
          <HeaderIconButton icon="menu" size={30} onPress={() => navigation.getParent()?.navigate('Menu' as never)} />
        </HeaderActionGroup>
      ),
    });
  }, [alertCount, navigation, household, effectiveId, alertsSheet.open, helpSheet.open]);

  async function handleRefresh() {
    setManualRefreshing(true);
    await refetch();
    setManualRefreshing(false);
  }

  function handleDelete(list: ShoppingList) {
    Alert.alert('Excluir lista', `Excluir "${list.name}"? Todos os itens serão removidos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteList.mutate(list.id),
      },
    ]);
  }

  function openEdit(list: ShoppingList) {
    setEditingList(list);
    setEditName(list.name);
    setEditPlace(list.place ?? '');
    setEditCategory(list.category ?? '');
    setEditUrgent(list.urgent);
  }

  async function handleSaveEdit() {
    if (!editingList) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Erro', 'Digite o nome da lista.');
      return;
    }

    try {
      await updateList.mutateAsync({
        listId: editingList.id,
        name: trimmedName,
        place: editPlace.trim() || undefined,
        category: editCategory.trim() || undefined,
        urgent: editUrgent,
      });
      setEditingList(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a lista.');
    }
  }

  if (loadingHouseholds) {
    return (
      <View style={styles.container}>
        <View style={[styles.list, { gap: 12 }]}>
          {Array.from({ length: 4 }).map((_, i) => <ShoppingListCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  if (householdsError || !households) {
    return (
      <LoadErrorState
        title="Não consegui carregar suas casas"
        message="Confira sua conexão e tente novamente."
        isRetrying={fetchingHouseholds}
        onRetry={() => {
          void refetchHouseholds();
        }}
      />
    );
  }

  if (!effectiveId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhuma casa selecionada</Text>
        <Text style={styles.emptySubtitle}>Crie ou entre em uma casa primeiro</Text>
      </View>
    );
  }

  if (listsError || !lists) {
    return (
      <LoadErrorState
        title="Não consegui carregar suas listas"
        message="Confira sua conexão e tente novamente."
        isRetrying={fetchingLists}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  function renderCard({ item }: { item: ShoppingList }) {
    const total = item.itemCount;
    const createdDateLabel = formatBrShortDate(item.createdAt);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ShoppingListDetail', {
          householdId: effectiveId!,
          listId: item.id,
          listName: item.name,
          listUrgent: item.urgent,
          listPlace: item.place,
          listCategory: item.category,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.titleDot}>•</Text>
          <Text style={styles.cardDate}>{createdDateLabel}</Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.cardMetaLeft}>
            {item.place ? <Text style={styles.metaChip} numberOfLines={1}>{item.place}</Text> : null}
            {item.category ? <Text style={styles.metaChip} numberOfLines={1}>{item.category}</Text> : null}
          </View>
          <View style={styles.cardChips}>
            {item.urgent && (
              <Text style={styles.urgentText}>Urgente</Text>
            )}
            <Text style={styles.badgeText}>
              {total === 0 ? 'Vazia' : `${total} ${total === 1 ? 'item' : 'itens'}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEdit(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={[styles.list, { gap: 12 }]}>
          {Array.from({ length: 4 }).map((_, i) => <ShoppingListCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={[styles.list, lists.length === 0 && styles.listEmpty]}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nenhuma lista ainda</Text>
              <Text style={styles.emptySubtitle}>Crie uma lista para começar</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CreateShoppingList', { householdId: effectiveId })}
        >
          <Text style={styles.buttonText}>+ Nova lista</Text>
        </TouchableOpacity>
      </View>

      <HelpSheet
        visible={helpVisible}
        height={helpSheet.height}
        translateY={helpSheet.translateY}
        panHandlers={helpSheet.panHandlers}
        sections={SHOPPING_HELP_SECTIONS}
        subtitle="Guia rápido das listas"
        introTitle="Como usar listas de compras"
        introText="Organize compras por lugar ou necessidade, marque itens durante a compra e mande produtos comprados para o estoque certo."
        highlights={SHOPPING_HELP_HIGHLIGHTS}
        groupTitle="Funções das listas"
        onClose={helpSheet.close}
      />

      <AlertsSheet
        visible={alertsVisible}
        height={alertsSheet.height}
        translateY={alertsSheet.translateY}
        panHandlers={alertsSheet.panHandlers}
        subtitle="Listas de compras"
        sections={alertSections}
        onClose={alertsSheet.close}
      />

      <Modal visible={!!editingList} transparent animationType="slide" onRequestClose={() => setEditingList(null)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setEditingList(null)} />
          <KeyboardAvoidingView style={styles.sheetKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              style={styles.sheet}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Editar lista</Text>

              <Text style={styles.sheetLabel}>Nome da lista</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ex: Mercado da semana"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="next"
              />

              <Text style={styles.sheetLabel}>Lugar de compra</Text>
              <TextInput
                style={styles.editInput}
                value={editPlace}
                onChangeText={setEditPlace}
                placeholder="Ex: Mercado, farmácia"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="next"
              />

              <Text style={styles.sheetLabel}>Categoria</Text>
              <TextInput
                style={styles.editInput}
                value={editCategory}
                onChangeText={setEditCategory}
                placeholder="Ex: Semana, limpeza"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={handleSaveEdit}
              />

              <TouchableOpacity style={styles.editCheckRow} onPress={() => setEditUrgent((value) => !value)} activeOpacity={0.75}>
                <View style={[styles.editCheckbox, editUrgent && styles.editCheckboxChecked]}>
                  {editUrgent && <Text style={styles.editCheckboxMark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editCheckTitle}>Lista urgente</Text>
                  <Text style={styles.editCheckSubtitle}>Use para destacar essa lista na Home.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleSaveEdit} disabled={updateList.isPending}>
                {updateList.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Salvar alterações</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 8 },
  householdPicker: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  pickerItem: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.background },
  pickerItemActive: { backgroundColor: Colors.accent },
  pickerItemText: { fontFamily: Typography.rounded, fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  pickerItemTextActive: { color: '#fff' },
  list: { padding: 18, gap: 12 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
    paddingRight: 92,
    position: 'relative',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
  cardName: { fontFamily: Typography.title, fontSize: 17, fontWeight: '800', color: Colors.textPrimary, flexShrink: 1, maxWidth: '62%' },
  titleDot: { fontFamily: Typography.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 17, marginTop: 1 },
  badgeText: { fontFamily: Typography.rounded, fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  headerButton: { paddingHorizontal: 4 },
  headerActivityText: { fontFamily: Typography.title, color: Colors.accent, fontSize: 15, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingRight: 4 },
  cardMetaLeft: { flex: 1, minWidth: 0, gap: 4 },
  cardChips: { width: 78, gap: 4 },
  cardDate: { fontFamily: Typography.body, flexShrink: 0, fontSize: 13, color: Colors.textSecondary },
  metaChip: { fontFamily: Typography.body, fontSize: 13, color: Colors.textSecondary, maxWidth: 160 },
  urgentText: { fontFamily: Typography.title, fontSize: 13, fontWeight: '800', color: '#F0A500' },
  deleteButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontFamily: Typography.title, fontSize: 13, color: Colors.textSecondary, fontWeight: '700', lineHeight: 18 },
  editButton: {
    position: 'absolute',
    right: 34,
    top: 0,
    bottom: 0,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { fontFamily: Typography.title, fontSize: 13, color: Colors.accent, fontWeight: '800', lineHeight: 18 },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '94%',
  },
  sheetKeyboard: { justifyContent: 'flex-end', maxHeight: '100%' },
  sheetContent: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 42, gap: 10 },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.separator,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontFamily: Typography.display, fontSize: 23, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  sheetLabel: {
    fontFamily: Typography.title,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: Typography.body,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  editCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.separator,
    marginTop: 8,
  },
  editCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCheckboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  editCheckboxMark: { fontFamily: Typography.title, color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 16 },
  editCheckTitle: { fontFamily: Typography.title, fontSize: 15, color: Colors.textPrimary, fontWeight: '700' },
  editCheckSubtitle: { fontFamily: Typography.body, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  emptyContainer: { alignItems: 'center', gap: 8, paddingTop: 40 },
  emptyTitle: { fontFamily: Typography.title, fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontFamily: Typography.body, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Typography.title, color: '#fff', fontSize: 16, fontWeight: '800' },
});

