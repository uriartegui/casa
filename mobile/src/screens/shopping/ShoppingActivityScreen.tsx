import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { ShoppingStackParamList } from '../../navigation/AppTabs';
import { useShoppingActivity } from '../../hooks/useShoppingLists';
import ActivityTimeline from '../../components/ActivityTimeline';

type Props = {
  navigation: NativeStackNavigationProp<ShoppingStackParamList, 'ShoppingActivity'>;
  route: RouteProp<ShoppingStackParamList, 'ShoppingActivity'>;
  embedded?: boolean;
  newSince?: string | null;
  localUserId?: string | null;
};

export default function ShoppingActivityScreen({ navigation, route, embedded = false, newSince, localUserId }: Props) {
  const { householdId } = route.params;
  const { data: shoppingActivity } = useShoppingActivity(householdId);
  const [period, setPeriod] = React.useState<'all' | '7d' | '30d'>('all');

  React.useEffect(() => {
    if (embedded) return;
    navigation.setOptions({ title: 'Atividade da lista' });
  }, [navigation, embedded]);

  return (
    <View style={styles.container}>
      <ActivityTimeline
        shoppingEvents={shoppingActivity}
        scope="shopping"
        period={period}
        onPeriodChange={setPeriod}
        showScopeFilter={false}
        newSince={newSince}
        localUserId={localUserId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
