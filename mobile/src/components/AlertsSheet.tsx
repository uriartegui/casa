import React from 'react';
import { Animated, GestureResponderHandlers, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { AlertCenterItem, AlertCenterSection, AlertTone } from '../utils/alertCenter';

type Props = {
  visible: boolean;
  height: Animated.Value;
  translateY: Animated.Value;
  panHandlers: GestureResponderHandlers;
  title?: string;
  subtitle: string;
  sections: AlertCenterSection[];
  onClose: () => void;
};

const toneColor: Record<AlertTone, string> = {
  danger: Colors.destructive,
  warning: Colors.accent,
  info: Colors.textSecondary,
  success: Colors.success,
};

function AlertRow({ item, onClose }: { item: AlertCenterItem; onClose: () => void }) {
  const color = toneColor[item.tone];
  const handlePress = React.useCallback(() => {
    onClose();
    requestAnimationFrame(() => {
      item.onPress?.();
    });
  }, [item, onClose]);
  const content = (
    <>
      <View style={[styles.alertIcon, { backgroundColor: `${color}16` }]}>
        <Feather name={item.icon as keyof typeof Feather.glyphMap} size={16} color={color} />
      </View>
      <View style={styles.alertTextBlock}>
        <Text style={styles.alertTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.alertSubtitle} numberOfLines={2}>{item.subtitle}</Text>
      </View>
      {item.onPress && <Feather name="chevron-right" size={18} color={Colors.textSecondary} />}
    </>
  );

  if (item.onPress) {
    return (
      <TouchableOpacity style={styles.alertRow} onPress={handlePress} activeOpacity={0.74}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.alertRow}>{content}</View>;
}

export default function AlertsSheet({
  visible,
  height,
  translateY,
  panHandlers,
  title = 'Alertas',
  subtitle,
  sections,
  onClose,
}: Props) {
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);

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
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.72}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.introCard}>
                <View style={styles.introIcon}>
                  <Feather name={total > 0 ? 'bell' : 'check-circle'} size={18} color={total > 0 ? Colors.accent : Colors.success} />
                </View>
                <View style={styles.introTextBlock}>
                  <Text style={styles.introTitle}>{total > 0 ? `${total} ponto${total === 1 ? '' : 's'} de atenção` : 'Tudo tranquilo'}</Text>
                  <Text style={styles.introText}>
                    {total > 0 ? 'Veja o que precisa de ação ou o que mudou recentemente.' : 'Nenhum alerta importante neste contexto agora.'}
                  </Text>
                </View>
              </View>

              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.items.length > 0 ? (
                    section.items.map((item) => <AlertRow key={item.id} item={item} onClose={onClose} />)
                  ) : (
                    <View style={styles.emptyBox}>
                      <Text style={styles.emptyText}>{section.emptyText}</Text>
                    </View>
                  )}
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetMotion: { justifyContent: 'flex-end' },
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
  dragHint: { ...StyleSheet.absoluteFillObject },
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
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  introIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '14',
  },
  introTextBlock: { flex: 1, minWidth: 0 },
  introTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  introText: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextBlock: { flex: 1, minWidth: 0 },
  alertTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  alertSubtitle: { fontSize: 12, lineHeight: 17, color: Colors.textSecondary, marginTop: 2 },
  emptyBox: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  emptyText: { fontSize: 13, lineHeight: 18, color: Colors.textSecondary, textAlign: 'center' },
});
