import React, { useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useRecords } from '../hooks/useRecords';

// Android で LayoutAnimation を有効化
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const MAX_VISIBLE = 14;

export default function MainScreen() {
  const navigation = useNavigation<Nav>();
  const { today, addMug, addPlate, removeMug, removePlate } = useRecords();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Calendar')} hitSlop={8}>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleAdd = useCallback((fn: () => void) => {
    LayoutAnimation.configureNext({
      duration: 350,
      create: {
        type: LayoutAnimation.Types.spring,
        property: LayoutAnimation.Properties.scaleXY,
        springDamping: 0.65,
      },
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.85 },
    });
    fn();
  }, []);

  const handleRemove = useCallback((fn: () => void) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    fn();
  }, []);

  return (
    <View style={styles.container}>
      {/* カウントバッジ */}
      <View style={styles.badgeRow}>
        <CountBadge emoji="🍺" label="ジョッキ" count={today.mugCount}  color="#f97316" />
        <CountBadge emoji="🍽️" label="お皿"    count={today.plateCount} color="#14b8a6" />
      </View>

      {/* 積み重ねエリア */}
      <View style={styles.columns}>
        <StackColumn
          emoji="🍺"
          count={today.mugCount}
          color="#f97316"
          onTap={() => handleAdd(addMug)}
          onLongPress={() => handleRemove(removeMug)}
        />
        <View style={styles.divider} />
        <StackColumn
          emoji="🍽️"
          count={today.plateCount}
          color="#14b8a6"
          onTap={() => handleAdd(addPlate)}
          onLongPress={() => handleRemove(removePlate)}
        />
      </View>
    </View>
  );
}

// ─── CountBadge ────────────────────────────────────────────────────────────

function CountBadge({ emoji, label, count, color }: {
  emoji: string; label: string; count: number; color: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeLabel, { color }]}>{emoji} {label}</Text>
      <Text style={[styles.badgeCount, { color }]}>{count}</Text>
      <Text style={styles.badgeUnit}>個</Text>
    </View>
  );
}

// ─── StackColumn ───────────────────────────────────────────────────────────

function StackColumn({ emoji, count, color, onTap, onLongPress }: {
  emoji: string;
  count: number;
  color: string;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const displayCount = Math.min(count, MAX_VISIBLE);
  const overflow     = Math.max(0, count - MAX_VISIBLE);

  return (
    <TouchableOpacity
      style={styles.column}
      activeOpacity={0.85}
      onPress={onTap}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* 上限超え表示 */}
      {overflow > 0 && (
        <View style={[styles.overflowBadge, { borderColor: color, backgroundColor: color + '18' }]}>
          <Text style={[styles.overflowText, { color }]}>+{overflow}</Text>
        </View>
      )}

      {/* スタック表示エリア */}
      <View style={styles.stackArea}>
        {count === 0 ? (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyIcon}>👆</Text>
            <Text style={styles.emptyText}>タップして{'\n'}追加</Text>
          </View>
        ) : (
          // 下→上の順に積み重なるよう、最新アイテムを先頭（上）に配置
          // key={displayCount - i} により追加は先頭に挿入、削除も先頭から
          Array.from({ length: displayCount }, (_, i) => (
            <Text key={displayCount - i} style={styles.emoji}>{emoji}</Text>
          ))
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  calendarIcon: { fontSize: 24 },

  badgeRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  badge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  badgeLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  badgeCount: { fontSize: 44, fontWeight: '800', lineHeight: 52 },
  badgeUnit:  { fontSize: 12, color: '#999' },

  columns:  { flex: 1, flexDirection: 'row' },
  divider:  { width: StyleSheet.hairlineWidth, backgroundColor: '#ddd' },
  column:   { flex: 1, paddingBottom: 20 },

  overflowBadge: {
    alignSelf: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  overflowText: { fontSize: 12, fontWeight: '700' },

  stackArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',  // 下から積み上がる
  },
  emoji: { fontSize: 42, lineHeight: 48 },

  emptyHint:  { alignItems: 'center', gap: 8, marginBottom: 20 },
  emptyIcon:  { fontSize: 36, opacity: 0.2 },
  emptyText:  { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 20 },
});
