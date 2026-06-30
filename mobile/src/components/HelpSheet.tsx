import React from 'react';
import { Animated, GestureResponderHandlers, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export type HelpSection = {
  title: string;
  body: string;
};

type HelpHighlight = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
};

type HelpSheetProps = {
  visible: boolean;
  height: Animated.Value;
  translateY: Animated.Value;
  panHandlers: GestureResponderHandlers;
  sections: HelpSection[];
  subtitle?: string;
  introTitle?: string;
  introText?: string;
  highlights?: HelpHighlight[];
  groupTitle?: string;
  onClose: () => void;
};

export function HelpSheet({
  visible,
  height,
  translateY,
  panHandlers,
  sections,
  subtitle = 'Guia rápido da Colmeia',
  introTitle = 'Como a casa fica organizada',
  introText = 'A Colmeia junta estoque, lista de compras, tarefas e atividades da casa para todo mundo saber o que tem, o que acabou e quem mexeu.',
  highlights = [
    { icon: 'box' as const, title: 'Estoque', body: 'Guarde itens com validade e categoria.' },
    { icon: 'shopping-cart' as const, title: 'Compras', body: 'Crie listas e envie comprados para o estoque.' },
    { icon: 'check-square' as const, title: 'Tarefas', body: 'Organize rotinas e responsabilidades.' },
  ],
  groupTitle = 'Home e app',
  onClose,
}: HelpSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheetMotion, { transform: [{ translateY }] }]}>
          <Animated.View style={[styles.sheet, { height }]}>
            <View style={styles.dragArea} {...panHandlers}>
              <View style={styles.handle} />
              <View style={styles.dragHint} />
            </View>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Ajuda</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.72}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.introCard}>
                <Text style={styles.introTitle}>{introTitle}</Text>
                <Text style={styles.introText}>{introText}</Text>
              </View>

              <View style={styles.highlightGrid}>
                {highlights.map((item) => (
                  <View key={item.title} style={styles.highlightCard}>
                    <View style={styles.highlightIcon}>
                      <Feather name={item.icon} size={17} color={Colors.accent} />
                    </View>
                    <Text style={styles.highlightTitle}>{item.title}</Text>
                    <Text style={styles.highlightText}>{item.body}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.groupTitle}>{groupTitle}</Text>
              {sections.map((section, index) => (
                <View key={section.title} style={styles.section}>
                  <View style={styles.sectionNumber}>
                    <Text style={styles.sectionNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.sectionBody}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionText}>{section.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetMotion: {
    zIndex: 2,
    elevation: 24,
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
    zIndex: 2,
    elevation: 24,
  },
  dragArea: {
    minHeight: 36,
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E7DCCB',
    alignSelf: 'center',
  },
  dragHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    minHeight: 60,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    backgroundColor: Colors.background,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  closeButton: {
    position: 'absolute',
    top: 42,
    right: 16,
    zIndex: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34 },
  introCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  introTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  introText: { fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  highlightGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  highlightCard: {
    flex: 1,
    minHeight: 118,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.card,
    padding: 12,
  },
  highlightIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '14',
    marginBottom: 8,
  },
  highlightTitle: { fontSize: 13, lineHeight: 17, fontWeight: '900', color: Colors.textPrimary },
  highlightText: { fontSize: 11, lineHeight: 15, color: Colors.textSecondary, marginTop: 4 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  section: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionNumberText: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  sectionBody: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  sectionText: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
});
