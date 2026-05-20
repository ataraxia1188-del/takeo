import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRecords } from '../hooks/useRecords';

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_W = Math.floor(SCREEN_W / 7);

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function dateKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function buildCalendar(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const cells: (Date | null)[] = Array(first.getDay()).fill(null); // 先頭の空白

  for (let d = 1; d <= last.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }

  const tail = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < tail; i++) cells.push(null); // 末尾の空白

  return cells;
}

export default function CalendarScreen() {
  const { records } = useRecords();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const cells = buildCalendar(year, month);

  return (
    <ScrollView style={styles.container}>
      {/* 月ナビゲーション */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{year}年{month + 1}月</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 曜日ヘッダー */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text
            key={d}
            style={[
              styles.weekday,
              i === 0 && styles.sun,
              i === 6 && styles.sat,
              { width: CELL_W },
            ]}
          >
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.separator} />

      {/* カレンダーグリッド */}
      <View style={styles.grid}>
        {cells.map((date, i) => (
          <CalendarCell
            key={date ? dateKey(date) : `empty-${i}`}
            date={date}
            record={date ? records[dateKey(date)] : undefined}
            isToday={
              date != null &&
              date.getFullYear() === now.getFullYear() &&
              date.getMonth()    === now.getMonth() &&
              date.getDate()     === now.getDate()
            }
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── CalendarCell ──────────────────────────────────────────────────────────

function CalendarCell({ date, record, isToday }: {
  date: Date | null;
  record?: { mugCount: number; plateCount: number };
  isToday: boolean;
}) {
  if (!date) return <View style={[styles.cell, { width: CELL_W }]} />;

  const weekday  = date.getDay();
  const hasRecord = record && (record.mugCount > 0 || record.plateCount > 0);

  return (
    <View style={[styles.cell, { width: CELL_W }]}>
      <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
        <Text style={[
          styles.dayNum,
          isToday            && styles.todayNum,
          !isToday && weekday === 0 && styles.sunNum,
          !isToday && weekday === 6 && styles.satNum,
        ]}>
          {date.getDate()}
        </Text>
      </View>

      {hasRecord && (
        <View style={styles.recordArea}>
          {record!.mugCount > 0 && (
            <Text style={styles.recordLine}>🍺{record!.mugCount}</Text>
          )}
          {record!.plateCount > 0 && (
            <Text style={styles.recordLine}>🍽{record!.plateCount}</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navBtn:     { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navArrow:   { fontSize: 34, color: '#007AFF', lineHeight: 42 },
  monthTitle: { fontSize: 18, fontWeight: '700' },

  weekRow:  { flexDirection: 'row' },
  weekday:  { textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#888', paddingVertical: 6 },
  sun:      { color: '#ef4444' },
  sat:      { color: '#3b82f6' },
  separator:{ height: StyleSheet.hairlineWidth, backgroundColor: '#ddd' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    minHeight: 66,
    alignItems: 'center',
    paddingVertical: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  dayCircle:   { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: '#007AFF' },
  dayNum:      { fontSize: 13, color: '#222' },
  todayNum:    { color: '#fff', fontWeight: '700' },
  sunNum:      { color: '#ef4444' },
  satNum:      { color: '#3b82f6' },

  recordArea: { alignItems: 'center', marginTop: 1 },
  recordLine: { fontSize: 10, lineHeight: 13 },
});
