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
- 店舗詳細、平均評価、0〜10点の分布、手入力のsummary
- 評価に応じて滑らかに変化するグラデーション
- 匿名評価投稿（評価必須、コメント任意）
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
