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
};

export default function StorageActivityScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const { data: fridgeActivity } = useFridgeActivity(householdId);
  const [period, setPeriod] = React.useState<'all' | '7d' | '30d'>('all');

  React.useEffect(() => {
    navigation.setOptions({ title: 'Atividade dos estoques' });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityTimeline
        fridgeEvents={fridgeActivity}
        scope="stock"
        period={period}
        onPeriodChange={setPeriod}
        showScopeFilter={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
