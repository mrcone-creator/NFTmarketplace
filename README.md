# 💎 NFT Marketplace

> **管理者発行型 NFT マーケットプレイス**  
> 運営管理者が NFT を発行し、ユーザーが MetaMask 等で購入できる Web3 マーケット

---

## 📁 ファイル構成

```
NFTmarketplace/
├── index.html          # ユーザー向けマーケットプレイス
├── styles.css          # デザインシステム (ダークサイバーパンク)
├── app.js              # ウォレット接続・購入ロジック
├── admin/
│   ├── index.html      # 管理者パネル
│   ├── admin.css       # 管理者スタイル
│   └── admin.js        # 管理者ロジック (NFT発行・管理)
├── docs/
│   ├── USER_MANUAL.md  # ユーザーマニュアル
│   └── ADMIN_MANUAL.md # 管理者マニュアル
└── README.md           # このファイル
```

---

## 🚀 起動方法

```bash
# ブラウザで直接開く (ユーザー画面)
start index.html

# 管理者パネルを開く
start admin/index.html
```

もしくは VS Code の **Live Server** 拡張機能を使用:
- `index.html` を右クリック → "Open with Live Server"

---

## 👥 ユーザー向け機能

| 機能 | 説明 |
|------|------|
| 🦊 ウォレット接続 | MetaMask / WalletConnect / Coinbase Wallet |
| 🎨 NFT ブラウズ | カテゴリ・キーワード・価格でフィルター |
| 💎 NFT 購入 | ワンクリック購入フロー (TX シミュレーション) |
| 🏆 マイコレクション | 所有 NFT の一覧表示 |
| 📊 アクティビティ | 取引履歴の確認 |
| ❤️ お気に入り | NFT のお気に入り登録 |

---

## 👑 管理者向け機能

| 機能 | 説明 |
|------|------|
| ✨ NFT 発行 | 絵文字・グラデーション・価格・説明を設定して発行 |
| ✏️ NFT 編集 | 既存 NFT の名前・価格・ステータスを編集 |
| 📊 ダッシュボード | 売上・NFT 数・コレクター数のリアルタイム統計 |
| 💰 売上管理 | 取引履歴・総売上・ETH/JPY 換算 |
| ⚙️ 設定 | マーケット公開制御・購入制限・ETH レート設定 |

---

## 💱 対応ウォレット

| ウォレット | タイプ | 備考 |
|-----------|--------|------|
| MetaMask | EVM | 実際の接続対応 + デモモード |
| WalletConnect | EVM | デモシミュレーション |
| Coinbase Wallet | EVM | デモシミュレーション |

> **Note**: 本番環境では ethers.js や wagmi を使用して実際のスマートコントラクトと連携してください。

---

## 🏷️ NFT カテゴリ

- 🖼️ **アート** — デジタルアート作品
- 🏆 **コレクタブル** — 限定コレクターズアイテム
- 🎵 **ミュージック** — 音楽 NFT
- 🎮 **ゲーミング** — ゲームアイテム・キャラクター

---

## 🗃️ データ管理

本アプリは **localStorage** を使用してデータを管理します：

| キー | 内容 |
|------|------|
| `nftm_admin_nfts` | 管理者発行の NFT データ |
| `nftm_owned` | ユーザーが所有する NFT の ID リスト |
| `nftm_activity` | 購入アクティビティログ |
| `nftm_likes` | お気に入り登録リスト |
| `nftm_wallet` | 接続ウォレット情報 |
| `nftm_settings` | 管理者設定 |

---

## 🔧 本番実装に必要なもの

```bash
# Ethereum / EVM
npm install ethers @openzeppelin/contracts hardhat

# Solana
npm install @solana/web3.js @metaplex-foundation/js

# Wallet
npm install wagmi viem @rainbow-me/rainbowkit
```

---

## ⚠️ セキュリティ注意事項

- 本ツールは **教育・デモ目的** です
- 実際の資金を扱う前に **セキュリティ監査** を受けてください
- プライベートキーは絶対にコードに書かないでください
- Mainnet ではなく **Testnet** (Goerli, Sepolia) で先に確認してください

---

## 📄 ライセンス

© 2026 NFT Marketplace. All rights reserved.
