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
};

export default function ShoppingActivityScreen({ navigation, route }: Props) {
  const { householdId } = route.params;
  const { data: shoppingActivity } = useShoppingActivity(householdId);
  const [period, setPeriod] = React.useState<'all' | '7d' | '30d'>('all');

  React.useEffect(() => {
    navigation.setOptions({ title: 'Atividade da lista' });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityTimeline
        shoppingEvents={shoppingActivity}
        scope="shopping"
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
