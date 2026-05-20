import React, { useLayoutEffect, useCallback } from 'react';
import {
  View,           // 汎用のコンテナ要素（div に相当）
  Text,           // テキスト表示
  StyleSheet,     // スタイルをまとめて定義するユーティリティ
  TouchableOpacity, // タップ可能な要素（タップ時に半透明になる）
  Platform,       // iOS / Android を判定するユーティリティ
  UIManager,      // ネイティブUIの設定（Android の LayoutAnimation 有効化に使う）
  LayoutAnimation, // 要素の追加・削除時にアニメーションをつける
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // 画面遷移を操作するフック
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App'; // 画面名の型定義をインポート
import { useRecords } from '../hooks/useRecords';   // 記録の読み書きカスタムフック

// Android では LayoutAnimation をコードで有効化する必要がある（iOS は不要）
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// このコンポーネントのナビゲーション型（どの画面から来ていて、どこへ遷移できるか）
type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

// 1列に表示する最大アイテム数
const ITEMS_PER_COL = 10;
// 表示する最大列数（これを超えた分は +N バッジで表示）
const MAX_COLS = 3;

export default function MainScreen() {
  // useNavigation: 画面遷移（navigate, goBack など）を操作するフック
  const navigation = useNavigation<Nav>();

  // カスタムフックから今日の記録と操作関数を取得
  const { today, addMug, addPlate, removeMug, removePlate } = useRecords();

  // useLayoutEffect: 描画の直前に実行される（useEffect より早い）
  // ヘッダーボタンの設定など、描画前に確定させたいものに使う
  useLayoutEffect(() => {
    navigation.setOptions({
      // headerRight: ヘッダー右側にカスタム要素を配置する
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Calendar')} hitSlop={8}>
          {/* hitSlop: タップ可能な領域をアイコンより少し広げてタップしやすくする */}
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // アイテム追加時のアニメーション設定
  // useCallback: この関数は毎回再生成しなくてよいのでメモ化する
  const handleAdd = useCallback((fn: () => void) => {
    // スプリングアニメーション（弾むような動き）を設定してから fn を呼ぶ
    LayoutAnimation.configureNext({
      duration: 350,
      create: {
        type: LayoutAnimation.Types.spring,
        property: LayoutAnimation.Properties.scaleXY, // 拡大縮小でアニメーション
        springDamping: 0.65, // バネの減衰率（小さいほど弾む）
      },
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.85 },
    });
    fn(); // 実際のカウント更新処理
  }, []);

  // アイテム削除時のアニメーション設定（シンプルなイーズイン・アウト）
  const handleRemove = useCallback((fn: () => void) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    fn();
  }, []);

  return (
    <View style={styles.container}>

      {/* 上部: 現在のカウントをバッジで表示するエリア */}
      <View style={styles.badgeRow}>
        <CountBadge emoji="🍺" label="何杯目" unit="杯" count={today.mugCount}  color="#f97316" />
        <CountBadge emoji="🍽️" label="お皿"   unit="個" count={today.plateCount} color="#14b8a6" />
      </View>

      {/* 下部: スタック表示エリア（左: ジョッキ、右: お皿） */}
      <View style={styles.columns}>
        {/* タップ → 追加、長押し → 削除 */}
        <StackColumn
          emoji="🍺"
          count={today.mugCount}
          color="#f97316"
          onTap={() => handleAdd(addMug)}
          onLongPress={() => handleRemove(removeMug)}
        />
        <View style={styles.divider} /> {/* 左右を区切る縦線 */}
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

// ─── CountBadge: 上部に表示するカウントバッジ ─────────────────────────────

// Props の型定義（このコンポーネントが受け取るデータの形）
function CountBadge({ emoji, label, unit, count, color }: {
  emoji: string;
  label: string;
  unit: string;
  count: number;
  color: string;
}) {
  return (
    // color + '22' は16進数の透明度指定（22 = 約13%不透明）
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeLabel, { color }]}>{emoji} {label}</Text>
      <Text style={[styles.badgeCount, { color }]}>{count}</Text>
      <Text style={styles.badgeUnit}>{unit}</Text>
    </View>
  );
}

// ─── StackColumn: 絵文字を積み上げて表示する列コンポーネント ───────────────

function StackColumn({ emoji, count, color, onTap, onLongPress }: {
  emoji: string;
  count: number;
  color: string;
  onTap: () => void;
  onLongPress: () => void;
}) {
  // 画面に表示する個数の上限（MAX_COLS列 × ITEMS_PER_COL個）
  const visibleCount = Math.min(count, ITEMS_PER_COL * MAX_COLS);
  // 上限を超えた分（+N バッジに表示する数）
  const overflow = Math.max(0, count - visibleCount);
  // 何列必要かを計算（切り上げ: 例 11個 → 2列）
  const numCols = visibleCount === 0 ? 1 : Math.ceil(visibleCount / ITEMS_PER_COL);
  // 列数に応じて絵文字のサイズを小さくする（多い列 = 小さいアイコン）
  const emojiSize = numCols === 1 ? 42 : numCols === 2 ? 32 : 24;
  const lineH = emojiSize + 6; // 行の高さ（絵文字サイズ + 余白）

  return (
    // TouchableOpacity: タップ・長押しの両方を検知できる要素
    <TouchableOpacity
      style={styles.column}
      activeOpacity={0.85} // タップ時の透明度（1に近いほど変化が少ない）
      onPress={onTap}
      onLongPress={onLongPress}
      delayLongPress={500} // 500ms 押し続けると長押し判定
    >
      {/* 上限超過バッジ（超えている場合のみ表示） */}
      {overflow > 0 && (
        <View style={[styles.overflowBadge, { borderColor: color, backgroundColor: color + '18' }]}>
          <Text style={[styles.overflowText, { color }]}>+{overflow}</Text>
        </View>
      )}

      {/* 絵文字のスタック表示エリア */}
      <View style={styles.stackArea}>
        {count === 0 ? (
          // カウントが0のときはヒントを表示
          <View style={styles.emptyHint}>
            <Text style={styles.emptyIcon}>👆</Text>
            <Text style={styles.emptyText}>タップして{'\n'}追加</Text>
          </View>
        ) : (
          // 横並びの列グループ（各列が下揃えになる）
          <View style={styles.subColsRow}>
            {/* Array.from で numCols 個の列を生成する */}
            {Array.from({ length: numCols }, (_, col) => {
              const start = col * ITEMS_PER_COL;    // この列の開始インデックス
              const colCount = Math.min(ITEMS_PER_COL, visibleCount - start); // この列の個数
              return (
                <View key={col} style={styles.subCol}>
                  {/* この列に並べる絵文字を生成 */}
                  {Array.from({ length: colCount }, (_, i) => (
                    <Text key={i} style={[styles.emoji, { fontSize: emojiSize, lineHeight: lineH }]}>
                      {emoji}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── スタイル定義 ──────────────────────────────────────────────────────────
// StyleSheet.create を使うと、スタイルを一箇所にまとめて管理できる
// オブジェクトのプロパティ名がクラス名のように機能する

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  calendarIcon: { fontSize: 24 },

  // バッジ行: 横並び（flexDirection: 'row'）で左右に並べる
  badgeRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,                      // 子要素の間隔
    backgroundColor: '#f9f9f9',
    borderBottomWidth: StyleSheet.hairlineWidth, // 1px未満の細い線
    borderBottomColor: '#ddd',
  },
  badge: {
    flex: 1,                      // 利用可能な幅を均等に分け合う
    alignItems: 'center',         // 子要素を横中央に揃える
    paddingVertical: 12,
    borderRadius: 14,
  },
  badgeLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  badgeCount: { fontSize: 44, fontWeight: '800', lineHeight: 52 },
  badgeUnit:  { fontSize: 12, color: '#999' },

  // 左右の列エリア
  columns:  { flex: 1, flexDirection: 'row' },
  divider:  { width: StyleSheet.hairlineWidth, backgroundColor: '#ddd' },
  column:   { flex: 1, paddingBottom: 20 },

  // 上限超過バッジ
  overflowBadge: {
    alignSelf: 'center',          // 親の横方向の中央に配置
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  overflowText: { fontSize: 12, fontWeight: '700' },

  // 絵文字のスタック表示エリア（下揃えで表示）
  stackArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',   // 子要素を下に寄せる（絵文字が下から積み上がる）
  },
  // 複数の列を横に並べるコンテナ
  subColsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',       // 各列を下揃えにする（短い列も下から始まる）
    gap: 4,
  },
  subCol: {
    alignItems: 'center',         // 絵文字を列内で中央揃え
  },
  emoji: { fontSize: 42, lineHeight: 48 }, // サイズは StackColumn 内で動的に上書きされる

  emptyHint:  { alignItems: 'center', gap: 8, marginBottom: 20 },
  emptyIcon:  { fontSize: 36, opacity: 0.2 },
  emptyText:  { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 20 },
});
