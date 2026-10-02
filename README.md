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

- 店名・会社名の検索
- 架空の10店舗と初期口コミ
- 店舗詳細、平均評価、0〜10点の分布、手入力のsummary
- 評価に応じて滑らかに変化するグラデーション
- 匿名評価投稿（評価必須、コメント任意）
- 投稿後の平均・分布・コメントの更新
- スマホ・PCのレスポンシブ表示

## データ保存

投稿はlocalStorageに保存します。ブラウザや端末をまたいだ共有は未実装です。公開後も他の利用者の投稿は表示されません。また、以前の試作サイトとはドメインが異なるため、そのサイトに保存した投稿は引き継がれません。

店舗情報と初期口コミは `dist/app.js` にあり、summaryは固定の手入力文章です。AI・求人・登録・ログイン機能は含みません。

## ファイル構成

- `dist/index.html`: ページと投稿ダイアログ
- `dist/style.css`: デザインとレスポンシブ対応
- `dist/app.js`: データ、検索、店舗詳細、評価投稿
- `vercel.json`: Vercelのデプロイ設定
