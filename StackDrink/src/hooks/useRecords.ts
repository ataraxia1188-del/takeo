// React のフック（useState, useEffect, useCallback）をインポート
// フックは関数コンポーネントで状態や副作用を扱うための仕組み
import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native'; // アプリの状態（フォアグラウンド/バックグラウンド）を監視
import { DayRecord, Records, loadRecords, saveRecords, todayKey } from '../utils/storage';
import { updateDrinkNotification } from '../utils/notifications';

// カスタムフック: useXxx という命名規則でフックであることを示す
// コンポーネントから記録の読み書きロジックを分離することで、コードを整理できる
export function useRecords() {
  // useState: コンポーネントが持つ状態（変わるとUIが再描画される）
  // 初期値は空オブジェクト {}。型は Records（日付 → DayRecord のマップ）
  const [records, setRecords] = useState<Records>({});

  // useCallback: 関数をメモ化して毎回の再生成を防ぐ
  // 依存配列（第2引数）が変わらない限り、同じ関数参照を使い回す
  const reload = useCallback(() => {
    // loadRecords() は非同期なので .then() でデータを受け取り state にセット
    loadRecords().then(setRecords);
  }, []); // 依存なし = 初回のみ生成

  // useEffect: コンポーネントのマウント時・依存配列の値が変わったときに実行
  useEffect(() => {
    reload(); // アプリ起動時に保存済み記録を読み込む

    // AppState.addEventListener: アプリの状態変化を監視するイベントリスナー
    // バックグラウンドから戻ったとき（'active'）に記録を再読み込みする
    // ロック画面から通知ボタンでカウントした後、アプリに戻ったときに反映させるため
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });

    // useEffect の return はクリーンアップ関数（コンポーネント破棄時に実行）
    // リスナーを解除してメモリリークを防ぐ
    return () => sub.remove();
  }, [reload]);

  // 今日の記録を更新する共通関数
  // fn: 現在の DayRecord を受け取り、更新後の DayRecord を返す関数
  const mutateToday = useCallback((fn: (r: DayRecord) => DayRecord) => {
    const key = todayKey(); // 今日の日付文字列（例: "2024-01-15"）

    // setRecords に関数を渡すと「前の state」を確実に参照できる（非同期の問題を防ぐ）
    setRecords(prev => {
      // 今日の記録がなければ初期値を使う（??はnull合体演算子: 左がnull/undefinedなら右を使う）
      const today = prev[key] ?? { mugCount: 0, plateCount: 0 };
      const updated = fn(today);                    // 渡された関数で記録を更新
      const next = { ...prev, [key]: updated };     // スプレッド構文で新しいオブジェクトを作成
      saveRecords(next);                            // ストレージに保存
      updateDrinkNotification(updated.mugCount, updated.plateCount); // 通知バーも更新
      return next;                                  // 新しい state として返す
    });
  }, []);

  // 各操作をシンプルな関数として公開する
  // アロー関数と useCallback でメモ化している
  const addMug      = useCallback(() => mutateToday(r => ({ ...r, mugCount: r.mugCount + 1 })), [mutateToday]);
  const addPlate    = useCallback(() => mutateToday(r => ({ ...r, plateCount: r.plateCount + 1 })), [mutateToday]);
  const removeMug   = useCallback(() => mutateToday(r => ({ ...r, mugCount: Math.max(0, r.mugCount - 1) })), [mutateToday]);
  const removePlate = useCallback(() => mutateToday(r => ({ ...r, plateCount: Math.max(0, r.plateCount - 1) })), [mutateToday]);

  // 今日の記録（なければ初期値）。コンポーネントで使いやすいように取り出しておく
  const today = records[todayKey()] ?? { mugCount: 0, plateCount: 0 };

  // このフックが提供する値と操作をオブジェクトとして返す
  return { records, today, addMug, addPlate, removeMug, removePlate };
}
