import React, { useState } from 'react';
import {
  Animated, Dimensions, View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, PanResponder,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSelectedHousehold } from '../../context/SelectedHouseholdContext';
import { useHouseholds } from '../../hooks/useHouseholds';
import { useShoppingLists, useDeleteShoppingList, useUpdateShoppingList, useShoppingActivity } from '../../hooks/useShoppingLists';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { formatBrShortDate } from '../../utils/dateUtils';
import { ShoppingListCardSkeleton } from '../../components/Skeleton';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { ShoppingList } from '../../types';
import ShoppingActivityScreen from './ShoppingActivityScreen';
import { useActivitySeen } from '../../hooks/useActivitySeen';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingLists'>;
};

const SHOPPING_HELP_SECTIONS = [
  {
    title: 'Listas',
    body: 'Crie uma lista para cada compra, mercado ou necessidade da casa. Cada lista guarda local, categoria, itens e historico.',
  },
  {
    title: 'Urgente',
    body: 'Marque como urgente na criacao ou edicao. A lista fica destacada na Home para todo mundo ver mais rapido.',
  },
  {
    title: 'Itens',
    body: 'Entre na lista para adicionar produtos, quantidades e categorias. O total do card mostra quantos itens ainda existem na lista.',
  },
  {
    title: 'Compra feita',
    body: 'Ao marcar um item como comprado, voce pode mandar para o estoque escolhido com quantidade, unidade e categoria.',
  },
  {
    title: 'Atividades',
    body: 'O sino mostra o que outras pessoas fizeram nas listas. Ao abrir, as novidades deixam de contar como novas.',
  },
  {
    title: 'Editar e excluir',
    body: 'Use Editar no card para alterar nome, local, categoria e urgencia. O X remove a lista inteira.',
  },
];

export default function ShoppingListsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { selectedHouseholdId, isSelectedHouseholdReady } = useSelectedHousehold();
  const { data: households, isLoading: loadingHouseholds } = useHouseholds();
  const effectiveId = selectedHouseholdId ?? (isSelectedHouseholdReady ? households?.[0]?.id : null) ?? null;

  const { data: lists, isLoading, refetch } = useShoppingLists(effectiveId);
  const { data: shoppingActivity } = useShoppingActivity(effectiveId);
  const {
    lastSeenAt: shoppingActivitySeenAt,
    markSeen: markShoppingActivitySeen,
    unseenCount: shoppingActivityUnreadCount,
  } = useActivitySeen('shopping', effectiveId, shoppingActivity ?? [], user?.id);

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
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [activityNewSince, setActivityNewSince] = useState<string | null>(null);
  const screenHeight = Dimensions.get('window').height;
  const activityCollapsedHeight = Math.round(screenHeight * 0.74);
  const activityExpandedHeight = Math.round(screenHeight - 64);
  const activityCloseThreshold = Math.round(screenHeight * 0.48);
  const activitySheetHeight = React.useRef(new Animated.Value(activityCollapsedHeight)).current;
  const activitySheetTranslateY = React.useRef(new Animated.Value(activityCollapsedHeight)).current;
  const activityHeightRef = React.useRef(activityCollapsedHeight);
  const activityDragStartHeight = React.useRef(activityCollapsedHeight);
  const helpSheetHeight = React.useRef(new Animated.Value(activityCollapsedHeight)).current;
  const helpSheetTranslateY = React.useRef(new Animated.Value(activityCollapsedHeight)).current;
  const helpHeightRef = React.useRef(activityCollapsedHeight);
  const helpDragStartHeight = React.useRef(activityCollapsedHeight);

  React.useEffect(() => {
    const listener = activitySheetHeight.addListener(({ value }) => {
      activityHeightRef.current = value;
    });
    return () => activitySheetHeight.removeListener(listener);
  }, [activitySheetHeight]);

  React.useEffect(() => {
    const listener = helpSheetHeight.addListener(({ value }) => {
      helpHeightRef.current = value;
    });
    return () => helpSheetHeight.removeListener(listener);
  }, [helpSheetHeight]);

  React.useEffect(() => {
    navigation.setOptions({
      title: household?.name ?? 'Listas de Compras',
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={openHelpModal}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="help-circle" size={23} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => effectiveId && openActivityModal()}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="bell" size={23} color={Colors.textPrimary} />
            {shoppingActivityUnreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{shoppingActivityUnreadCount > 99 ? '99+' : shoppingActivityUnreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('Menu' as never)}
            style={styles.headerMenuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="menu" size={30} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, household, effectiveId, shoppingActivityUnreadCount, shoppingActivitySeenAt, markShoppingActivitySeen]);

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
      Alert.alert('Erro', 'Nao foi possivel atualizar a lista.');
    }
  }

  function animateActivitySheet(toValue: number, onEnd?: () => void) {
    Animated.spring(activitySheetHeight, {
      toValue,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start(() => onEnd?.());
  }

  function animateHelpSheet(toValue: number, onEnd?: () => void) {
    Animated.spring(helpSheetHeight, {
      toValue,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start(() => onEnd?.());
  }

  function openHelpModal() {
    helpSheetHeight.setValue(activityCollapsedHeight);
    helpSheetTranslateY.setValue(activityCollapsedHeight);
    helpHeightRef.current = activityCollapsedHeight;
    setHelpVisible(true);
    requestAnimationFrame(() => {
      Animated.spring(helpSheetTranslateY, {
        toValue: 0,
        useNativeDriver: false,
        speed: 20,
        bounciness: 3,
      }).start();
    });
  }

  function closeHelpModal() {
    Animated.timing(helpSheetTranslateY, {
      toValue: Math.max(helpHeightRef.current, activityCollapsedHeight),
      duration: 190,
      useNativeDriver: false,
    }).start(() => {
      setHelpVisible(false);
      helpSheetHeight.setValue(activityCollapsedHeight);
      helpSheetTranslateY.setValue(activityCollapsedHeight);
      helpHeightRef.current = activityCollapsedHeight;
    });
  }

  function openActivityModal() {
    setActivityNewSince(shoppingActivitySeenAt);
    activitySheetHeight.setValue(activityCollapsedHeight);
    activitySheetTranslateY.setValue(activityCollapsedHeight);
    activityHeightRef.current = activityCollapsedHeight;
    setActivityModalVisible(true);
    markShoppingActivitySeen();
    requestAnimationFrame(() => {
      Animated.spring(activitySheetTranslateY, {
        toValue: 0,
        useNativeDriver: false,
        speed: 20,
        bounciness: 3,
      }).start();
    });
  }

  function closeActivityModal() {
    Animated.timing(activitySheetTranslateY, {
      toValue: Math.max(activityHeightRef.current, activityCollapsedHeight),
      duration: 190,
      useNativeDriver: false,
    }).start(() => {
      setActivityModalVisible(false);
      activitySheetHeight.setValue(activityCollapsedHeight);
      activitySheetTranslateY.setValue(activityCollapsedHeight);
      activityHeightRef.current = activityCollapsedHeight;
    });
  }

  const activitySheetPanResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      activityDragStartHeight.current = activityHeightRef.current;
    },
    onPanResponderMove: (_, gesture) => {
      const nextHeight = Math.max(0, Math.min(activityExpandedHeight, activityDragStartHeight.current - gesture.dy));
      activitySheetHeight.setValue(nextHeight);
    },
    onPanResponderRelease: (_, gesture) => {
      const currentHeight = activityHeightRef.current;
      const projectedHeight = Math.max(0, Math.min(activityExpandedHeight, activityDragStartHeight.current - gesture.dy));
      const midpoint = (activityCollapsedHeight + activityExpandedHeight) / 2;
      if (projectedHeight < activityCloseThreshold || gesture.moveY > screenHeight * 0.72) {
        closeActivityModal();
        return;
      }
      if (gesture.dy < -35 || gesture.vy < -0.75 || projectedHeight > midpoint || currentHeight > midpoint) {
        animateActivitySheet(activityExpandedHeight);
        return;
      }
      animateActivitySheet(activityCollapsedHeight);
    },
  }), [activityCloseThreshold, activityCollapsedHeight, activityExpandedHeight, activitySheetHeight, screenHeight]);

  const helpSheetPanResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      helpDragStartHeight.current = helpHeightRef.current;
    },
    onPanResponderMove: (_, gesture) => {
      const nextHeight = Math.max(0, Math.min(activityExpandedHeight, helpDragStartHeight.current - gesture.dy));
      helpSheetHeight.setValue(nextHeight);
    },
    onPanResponderRelease: (_, gesture) => {
      const currentHeight = helpHeightRef.current;
      const projectedHeight = Math.max(0, Math.min(activityExpandedHeight, helpDragStartHeight.current - gesture.dy));
      const midpoint = (activityCollapsedHeight + activityExpandedHeight) / 2;
      if (projectedHeight < activityCloseThreshold || gesture.moveY > screenHeight * 0.72) {
        closeHelpModal();
        return;
      }
      if (gesture.dy < -35 || gesture.vy < -0.75 || projectedHeight > midpoint || currentHeight > midpoint) {
        animateHelpSheet(activityExpandedHeight);
        return;
      }
      animateHelpSheet(activityCollapsedHeight);
    },
  }), [activityCloseThreshold, activityCollapsedHeight, activityExpandedHeight, helpSheetHeight, screenHeight]);

  if (loadingHouseholds) {
    return (
      <View style={styles.container}>
        <View style={[styles.list, { gap: 12 }]}>
          {Array.from({ length: 4 }).map((_, i) => <ShoppingListCardSkeleton key={i} />)}
        </View>
      </View>
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
          data={lists ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={[styles.list, (!lists || lists.length === 0) && styles.listEmpty]}
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

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={closeHelpModal}
      >
        <View style={styles.activityOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={closeHelpModal}
          />
          <Animated.View style={[styles.activitySheetMotion, { transform: [{ translateY: helpSheetTranslateY }] }]}>
            <Animated.View style={[styles.activitySheet, { height: helpSheetHeight }]}>
              <View style={styles.sheetDragArea} {...helpSheetPanResponder.panHandlers}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetDragHint} />
              </View>
              <View style={styles.helpHeader}>
                <Text style={styles.helpTitle}>Ajuda</Text>
                <Text style={styles.helpSubtitle}>Guia rapido das listas</Text>
              </View>

              <ScrollView
                style={styles.helpScroll}
                contentContainerStyle={styles.helpContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.helpIntroCard}>
                  <Text style={styles.helpIntroTitle}>Como usar listas de compras</Text>
                  <Text style={styles.helpIntroText}>
                    Organize compras por lugar ou necessidade, marque itens durante a compra e mande produtos comprados para o estoque certo.
                  </Text>
                </View>

                {SHOPPING_HELP_SECTIONS.map((section, index) => (
                  <View key={section.title} style={styles.helpSection}>
                    <View style={styles.helpSectionNumber}>
                      <Text style={styles.helpSectionNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.helpSectionBody}>
                      <Text style={styles.helpSectionTitle}>{section.title}</Text>
                      <Text style={styles.helpSectionText}>{section.body}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={activityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeActivityModal}
      >
        <View style={styles.activityOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={closeActivityModal}
          />
          <Animated.View style={[styles.activitySheetMotion, { transform: [{ translateY: activitySheetTranslateY }] }]}>
            <Animated.View style={[styles.activitySheet, { height: activitySheetHeight }]}>
            <View style={styles.sheetDragArea} {...activitySheetPanResponder.panHandlers}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetDragHint} />
            </View>
            <View style={styles.activitySheetHeader}>
              <Text style={styles.activitySheetTitle}>Atividades da lista</Text>
            </View>
            {effectiveId ? (
              <ShoppingActivityScreen
                navigation={navigation as any}
                route={{
                  key: 'ShoppingActivitySheet',
                  name: 'ShoppingActivity',
                  params: { householdId: effectiveId },
                } as any}
                embedded
                newSince={activityNewSince}
                localUserId={user?.id}
              />
            ) : null}
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={!!editingList} transparent animationType="slide" onRequestClose={() => setEditingList(null)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setEditingList(null)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.sheet}>
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
                placeholder="Ex: Mercado, farmacia"
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
            </View>
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
  pickerItemText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  pickerItemTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.separator, gap: 10,
    paddingRight: 92,
    position: 'relative',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
  cardName: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, flexShrink: 1, maxWidth: '62%' },
  titleDot: { fontSize: 13, color: Colors.textSecondary, lineHeight: 17, marginTop: 1 },
  badgeText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: { paddingHorizontal: 4 },
  headerActivityText: { color: Colors.accent, fontSize: 15, fontWeight: '500' },
  headerIconButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerMenuButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center' },
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
  cardMeta: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingRight: 4 },
  cardMetaLeft: { flex: 1, minWidth: 0, gap: 4 },
  cardChips: { width: 78, gap: 4 },
  cardDate: { flexShrink: 0, fontSize: 13, color: Colors.textSecondary },
  metaChip: { fontSize: 13, color: Colors.textSecondary, maxWidth: 160 },
  urgentText: { fontSize: 13, fontWeight: '700', color: '#F0A500' },
  deleteButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', lineHeight: 18 },
  editButton: {
    position: 'absolute',
    right: 34,
    top: 0,
    bottom: 0,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { fontSize: 13, color: Colors.accent, fontWeight: '700', lineHeight: 18 },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  activityOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  activitySheetMotion: {
    zIndex: 2,
    elevation: 24,
  },
  activitySheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    zIndex: 2,
    elevation: 24,
  },
  sheetDragArea: {
    minHeight: 36,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  sheetDragHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  activitySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  activitySheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  activitySheetClose: { fontSize: 15, fontWeight: '600', color: Colors.accent },
  helpHeader: {
    minHeight: 60,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  helpTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  helpSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  helpScroll: { flex: 1 },
  helpContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34 },
  helpIntroCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  helpIntroTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  helpIntroText: { fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  helpSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  helpSectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  helpSectionNumberText: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  helpSectionBody: { flex: 1 },
  helpSectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  helpSectionText: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.separator,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 21, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sheetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  editCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
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
  editCheckboxMark: { color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 16 },
  editCheckTitle: { fontSize: 15, color: Colors.textPrimary, fontWeight: '700' },
  editCheckSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  emptyContainer: { alignItems: 'center', gap: 8, paddingTop: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.separator, backgroundColor: Colors.background },
  button: { backgroundColor: Colors.accent, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
