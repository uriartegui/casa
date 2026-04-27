import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Dimensions, ViewToken,
} from 'react-native';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    emoji: '🏠',
    title: 'Bem-vindo ao Casa',
    subtitle: 'Organize a sua casa com todo mundo que mora com você — em tempo real.',
  },
  {
    key: '2',
    emoji: '🧊',
    title: 'Geladeira compartilhada',
    subtitle: 'Adicione itens, controle vencimentos e saiba o que tem sem precisar abrir a geladeira.',
  },
  {
    key: '3',
    emoji: '🛒',
    title: 'Listas de compras',
    subtitle: 'Crie listas, marque itens no mercado e divida tarefas com quem mora com você.',
  },
];

type Props = {
  onDone: () => void;
};

export default function OnboardingScreen({ onDone }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0] != null) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  function handleNext() {
    if (activeIndex < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      onDone();
    }
  }

  const isLast = activeIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{isLast ? 'Começar' : 'Próximo'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 120,
  },
  emoji: { fontSize: 80, marginBottom: 32 },
  title: {
    fontSize: 28, fontWeight: '700', color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 16,
  },
  subtitle: {
    fontSize: 17, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 26,
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16,
    backgroundColor: Colors.background,
    gap: 20,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.separator },
  dotActive: { backgroundColor: Colors.accent, width: 24 },
  button: {
    backgroundColor: Colors.accent, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
