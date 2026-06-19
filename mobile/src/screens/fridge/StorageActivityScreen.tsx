import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { useFridgeActivity } from '../../hooks/useFridge';
import ActivityTimeline from '../../components/ActivityTimeline';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'StorageActivity'>;
  route: RouteProp<FridgeStackParamList, 'StorageActivity'>;
  embedded?: boolean;
  storageId?: string;
  storageName?: string;
};

export default function StorageActivityScreen({ navigation, route, embedded = false, storageId, storageName }: Props) {
  const { householdId } = route.params;
  const { data: fridgeActivity } = useFridgeActivity(householdId);
  const [period, setPeriod] = React.useState<'all' | '7d' | '30d'>('all');
  const scopedActivity = React.useMemo(() => {
    if (!storageId && !storageName) return fridgeActivity;
    return (fridgeActivity ?? []).filter((event) => {
      if (event.storageId) return event.storageId === storageId;
      return storageName ? event.storageName === storageName : true;
    });
  }, [fridgeActivity, storageId, storageName]);

  React.useEffect(() => {
    if (embedded) return;
    navigation.setOptions({ title: 'Atividade dos estoques' });
  }, [navigation, embedded]);

  return (
    <View style={styles.container}>
      <ActivityTimeline
        fridgeEvents={scopedActivity}
        scope="stock"
        period={period}
        onPeriodChange={setPeriod}
        showScopeFilter={false}
        emptyText={storageName ? `Nenhuma atividade em ${storageName}.` : 'Nenhuma atividade neste estoque.'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
