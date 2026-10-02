# バイトの声 MVP

店舗単位でアルバイト先の評価と口コミを確認する、スマホ優先の口コミサイト。
HTML / CSS / JavaScriptで構成し、Vercelで静的サイトとして配信します。

## Vercelへのデプロイ

1. VercelでGitHubリポジトリ `caljun/baito` をImportします。
2. Root Directoryはリポジトリ直下（空欄または `.`）にします。
3. Deployを押します。

`vercel.json` にFramework Preset `Other`、ビルド・インストール不要、Output Directory `dist` を設定しています。環境変数は不要です。

## ローカル起動

```sh
python3 -m http.server 3000 --directory dist
```

`http://localhost:3000` を開きます。

## 実装内容

- 店舗の追加（Firestore共有保存）
- 店名・会社名の検索
- 架空の3店舗と初期口コミ
- 店舗詳細は最大幅660pxの1カラム（総合評価・時給・働いた期間・みんなの声）
- 時給と働いた期間は投稿がない初期3店舗のみ固定サンプル値。追加店舗は未登録表示
- 総合評価は口コミから算出、みんなの声は手入力のsummary
- 評価に応じて滑らかに変化するグラデーション
- 4項目に独立した投稿ボタン・フォーム（点数、時給、働いた期間、コメント）
- 時給は投稿値の平均、働いた期間は最多回答を表示。実投稿があればサンプル値に優先
- 投稿後の平均・分布・コメントの更新
- スマホ・PCのレスポンシブ表示

## データ保存

店舗と口コミはFirebaseプロジェクト `baito-73a07` のCloud Firestoreに保存し、利用者間で共有します。更新はリアルタイムで反映します。従来のlocalStorageデータは自動公開・移行しません。

### Firebase側の初期設定

1. FirebaseコンソールのCloud Firestoreで、まだ作成していなければデフォルトのデータベースを作成します。
2. Rulesタブに `firestore.rules` の内容を貼り付けて公開します。Firebase CLIでログイン済みなら `firebase deploy --only firestore:rules --project baito-73a07` でも反映できます。
3. Vercelのデプロイを開き、別ブラウザでも店舗と投稿が表示されることを確認します。

Firebase Web設定は `dist/firebase.js` にあります。Analytics・Storage・ログイン機能は使用しません。

ルールは公開読み取りと、入力形式・長さ・評価範囲・存在する店舗への新規投稿のみ許可し、更新・削除を拒否します。MVPの匿名投稿仕様に合わせ、作成にログインを要求しません。大量投稿を抑制する制御は未実装です。

初期3店舗とダミー口コミは画面側の固定サンプルです。追加店舗と実際の投稿だけをFirestoreに保存します。

店舗情報と初期口コミは `dist/app.js` にあり、summaryは固定の手入力文章です。AI・求人・登録・ログイン機能は含みません。

## ファイル構成

- `dist/index.html`: ページと投稿ダイアログ
- `dist/style.css`: デザインとレスポンシブ対応
- `dist/app.js`: データ、検索、店舗詳細、評価投稿
- `vercel.json`: Vercelのデプロイ設定

- `dist/firebase.js`: Firebase初期化とFirestoreの読み書き
- `firestore.rules`: Firestoreアクセスルール
- `firebase.json`, `.firebaserc`: Firebase CLI設定

## 独立投稿の保存形式

`reviews` コレクションに `storeId`, `type`, `createdAt` と該当項目だけを保存します。
- `rating`: `score`（0〜10の整数）
- `wage`: `hourlyWage`（1〜100000円の整数）
- `period`: `workPeriod`（4択）
- `comment`: `comment`（必須・最大2000文字）

総合評価と評価人数には点数投稿だけを集計します。従来の点数付き口コミも引き続き読み込みます。時給・期間・コメントには点数は必要ありません。コメントは保存されますが、AI要約は未実装のため「みんなの声」のsummaryは自動更新されません。

検証: `node --test tests/contributions.test.cjs`

各投稿で「最後に働いていた年」を必須選択します。「現在も勤務中」と、東京時間の今年を含む直近10年（2026年時点では2026〜2017年）が選択肢です。`currentlyWorking` と `lastWorkedYear` を投稿日時 `createdAt` と別に保存します。既存投稿は時期不明のまま保持し、各項目の下に、現在も勤務中・直近10年のデータを角丸カードで横並び表示します。データがない年はデータなし。既存投稿は時期不明として別表示します。
