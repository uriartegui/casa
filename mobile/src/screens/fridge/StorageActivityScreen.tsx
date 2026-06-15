import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { FridgeStackParamList } from '../../navigation/AppTabs';
import { useFridgeActivity } from '../../hooks/useFridge';
import { useShoppingActivity } from '../../hooks/useShoppingLists';
import ActivityTimeline, { ActivityScope } from '../../components/ActivityTimeline';

type Props = {
  navigation: NativeStackNavigationProp<FridgeStackParamList, 'StorageActivity'>;
  route: RouteProp<FridgeStackParamList, 'StorageActivity'>;
};

export default function StorageActivityScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const { data: fridgeActivity } = useFridgeActivity(householdId);
  const { data: shoppingActivity } = useShoppingActivity(householdId);
  const [scope, setScope] = React.useState<ActivityScope>('all');
  const [period, setPeriod] = React.useState<'all' | '7d' | '30d'>('all');

  React.useEffect(() => {
    navigation.setOptions({ title: 'Atividade da casa' });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityTimeline
        fridgeEvents={fridgeActivity}
        shoppingEvents={shoppingActivity}
        scope={scope}
        onScopeChange={setScope}
        period={period}
        onPeriodChange={setPeriod}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
