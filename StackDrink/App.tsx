// React 本体と useEffect フックをインポート
import React, { useEffect } from 'react';

// React Navigation: 画面遷移（ナビゲーション）を管理するライブラリ
// NavigationContainer: アプリ全体をラップするコンテナ
// createNativeStackNavigator: iOSのネイティブな画面遷移を提供するスタック型ナビゲーター
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Expo 提供のステータスバー（画面上部の時刻・電波・バッテリー表示エリア）管理コンポーネント
import { StatusBar } from 'expo-status-bar';

// 通知の操作（リスナー登録など）に使う
import * as Notifications from 'expo-notifications';

// 各画面コンポーネント
import MainScreen from './src/screens/MainScreen';
import CalendarScreen from './src/screens/CalendarScreen';

// 通知関連のユーティリティ関数
import {
  setupNotificationCategory,
  requestNotificationPermissions,
  handleAddMugAction,
  ACTION_ADD_MUG,
} from './src/utils/notifications';

// TypeScript: 画面名と受け渡すパラメータの型を定義する
// undefined は「パラメータなし」を意味する
// この型はナビゲーションの型安全性（間違った画面名や引数を防ぐ）のために使う
export type RootStackParamList = {
  Main: undefined;
  Calendar: undefined;
};

// スタックナビゲーターのインスタンスを作成
// Stack.Navigator（親）と Stack.Screen（各画面）に分けて使う
const Stack = createNativeStackNavigator<RootStackParamList>();

// アプリ全体のルートコンポーネント
export default function App() {

  // useEffect: コンポーネントのマウント時（アプリ起動時）に一度だけ実行
  useEffect(() => {
    // 即時実行の非同期関数（async/await を useEffect 内で使うためのパターン）
    (async () => {
      await setupNotificationCategory();        // 通知アクションボタンを登録
      await requestNotificationPermissions();   // ユーザーに通知許可を求める
    })();

    // 通知アクション（ボタンタップ）への応答を監視するリスナーを登録
    // ユーザーが通知の「+1杯」ボタンをタップすると、この関数が呼ばれる
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      // actionIdentifier でどのボタンが押されたかを判定する
      if (response.actionIdentifier === ACTION_ADD_MUG) {
        handleAddMugAction(); // ストレージのカウントを増やし、通知を更新
      }
    });

    // クリーンアップ: コンポーネント破棄時にリスナーを解除してメモリリークを防ぐ
    return () => sub.remove();
  }, []); // 依存配列が空 = マウント時のみ実行

  return (
    // NavigationContainer: 全画面をラップする必須のコンテナ
    <NavigationContainer>

      {/* ステータスバーのスタイルを自動設定（背景色に合わせて白/黒を切り替え） */}
      <StatusBar style="auto" />

      {/* Stack.Navigator: 画面をスタック（積み重ね）で管理する
          新しい画面が上に積まれ、戻ると下の画面が現れる */}
      <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>

        {/* 最初に表示される画面（スタックの一番下） */}
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{ title: '今日の記録' }} // ヘッダーのタイトル
        />

        {/* カレンダー画面（Mainから遷移する） */}
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: 'カレンダー' }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
