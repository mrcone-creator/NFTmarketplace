/* =============================================
   NFT MARKETPLACE — app.js v2
   3 fixed NFT types: Silver / Gold / Platina
   Staking: hold NFT → quarterly USDT rewards
   ============================================= */
'use strict';

// ─────────────────────────────────────
//  BASE CATALOG (デフォルト値)
// ─────────────────────────────────────
const NFT_BASE = [
    {
        id: 'silver', name: 'Silver NFT', tier: 'SILVER', emoji: '🥈',
        apr: 18, priceJPY: 500000, maxSupply: 100,
        color: '#94A3B8', accentColor: '#CBD5E1',
        bgGradient: 'linear-gradient(135deg,#1e293b,#334155,#64748b)',
        description: '年利{APR}%のUSDT報酬を四半期ごとに受け取れるエントリーNFT。{MAX}枚限定発行。',
        featuresTemplate: ['年利 {APR}% APR', '四半期USDT配当', '{MAX}枚限定'],
    },
    {
        id: 'gold', name: 'Gold NFT', tier: 'GOLD', emoji: '🥇',
        apr: 30, priceJPY: 1000000, maxSupply: 100,
        color: '#F59E0B', accentColor: '#FCD34D',
        bgGradient: 'linear-gradient(135deg,#451a03,#92400e,#d97706)',
        description: '年利{APR}%の高利回り。ゴールドNFT保有者への四半期USDT配当。{MAX}枚限定。',
        featuresTemplate: ['年利 {APR}% APR', '四半期USDT配当', '{MAX}枚限定'],
    },
    {
        id: 'platina', name: 'Platina NFT', tier: 'PLATINA', emoji: '💎',
        apr: 36, priceJPY: 2000000, maxSupply: 50,
        color: '#A78BFA', accentColor: '#DDD6FE',
        bgGradient: 'linear-gradient(135deg,#1e1b4b,#3730a3,#7c3aed)',
        description: '最高利回り年利{APR}%。プラチナ保有者専用の高額USDT配当。{MAX}枚限定プレミアム。',
        featuresTemplate: ['年利 {APR}% APR', '四半期USDT配当', '{MAX}枚限定 (プレミアム)'],
    },
];

const STORAGE = {
    WALLET: 'nftm_wallet',
    PURCHASES: 'nftm_purchases',
    SUPPLY: 'nftm_nft_supply',
    ACTIVITY: 'nftm_activity',
    NFT_CFG: 'nftm_nft_config',   // admin config key
};

// ─────────────────────────────────────
//  DYNAMIC CATALOG — merges admin settings
// ─────────────────────────────────────
/**
 * Returns a live NFT catalog by merging NFT_BASE with whatever
 * the admin saved in localStorage (nftm_nft_config).
 * Called fresh on every render so changes appear immediately.
 */
function getEffectiveCatalog() {
    let adminCfg = {};
    try { adminCfg = JSON.parse(localStorage.getItem(STORAGE.NFT_CFG) || '{}'); } catch (e) { }
    const ethJpy = adminCfg.ethJpy || 400000;
    const usdtJpy = adminCfg.usdtJpy || 150;

    return NFT_BASE.map(base => {
        const override = adminCfg[base.id] || {};
        const priceJPY = override.priceJPY || base.priceJPY;
        const maxSupply = override.maxSupply || base.maxSupply;
        const apr = override.apr || base.apr;
        const priceETH = +(priceJPY / ethJpy).toFixed(4);
        const priceUSDT = Math.round(priceJPY / usdtJpy);
        const quarterlyRewardUSDT = Math.round(priceJPY * apr / 100 / 4 / usdtJpy);
        // Replace template tokens in description and features
        const description = base.description
            .replace(/{APR}/g, apr)
            .replace(/{MAX}/g, maxSupply.toLocaleString());
        const features = base.featuresTemplate.map(f =>
            f.replace(/{APR}/g, apr).replace(/{MAX}/g, maxSupply.toLocaleString()));
        return {
            ...base, priceJPY, maxSupply, apr, priceETH, priceUSDT,
            quarterlyRewardUSDT, description, features
        };
    });
}

// ─────────────────────────────────────
//  STATE
// ─────────────────────────────────────
let state = {
    wallet: null,
    walletType: null,
    purchases: [],  // user's purchases
};

// ─────────────────────────────────────
//  INIT
// ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderMarketplace();
    setupScrollEffect();
});

function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE.WALLET);
    if (saved) {
        const w = JSON.parse(saved);
        state.wallet = w.address;
        state.walletType = w.type;
        updateWalletUI();
    }
    reloadPurchases();
}

function reloadPurchases() {
    const all = JSON.parse(localStorage.getItem(STORAGE.PURCHASES) || '[]');
    state.purchases = state.wallet ? all.filter(p => p.wallet === state.wallet) : [];
}

// ─────────────────────────────────────
//  SUPPLY
// ─────────────────────────────────────
function getSupply() {
    const saved = localStorage.getItem(STORAGE.SUPPLY);
    return saved ? JSON.parse(saved)
        : { silver: { sold: 0 }, gold: { sold: 0 }, platina: { sold: 0 } };
}
function saveSupply(s) { localStorage.setItem(STORAGE.SUPPLY, JSON.stringify(s)); }

// ─────────────────────────────────────
//  MARKETPLACE
// ─────────────────────────────────────
function renderMarketplace() {
    const grid = document.getElementById('nftCatalogGrid');
    if (!grid) return;
    const supply = getSupply();

    grid.innerHTML = getEffectiveCatalog().map(nft => {
        const sold = (supply[nft.id]?.sold || 0);
        const remaining = nft.maxSupply - sold;
        const soldOut = remaining <= 0;
        const pct = Math.round(sold / nft.maxSupply * 100);
        const owned = state.purchases.filter(p => p.nftType === nft.id).length;
        // Counter triggers when sold > 30% (remaining < 70%)
        const threshold70 = remaining < nft.maxSupply * 0.7;
        const isCritical = remaining <= nft.maxSupply * 0.1;  // <= 10% remaining
        const isWarning = remaining <= nft.maxSupply * 0.3;  // <= 30% remaining
        const counterClass = soldOut ? '' : isCritical ? 'counter-critical' : isWarning ? 'counter-warning' : 'counter-low';

        return `
    <div class="nft-catalog-card" id="card-${nft.id}">
      <div class="nft-catalog-img" style="background:${nft.bgGradient};">
        <div class="nft-catalog-emoji">${nft.emoji}</div>
        <div class="nft-tier-badge" style="color:${nft.accentColor};border-color:${nft.accentColor}50;">${nft.tier}</div>
        ${soldOut ? '<div class="sold-out-overlay">SOLD OUT</div>' : ''}
        ${threshold70 && !soldOut ? `<div class="nft-remaining-counter ${counterClass}"><span class="counter-icon">${isCritical ? '🔥' : '⚡'}</span><span class="counter-num">${remaining}</span><span class="counter-unit">枚</span></div>` : ''}
      </div>
      <div class="nft-catalog-body">
        <div class="nft-catalog-name">${nft.name}</div>
        <p class="nft-catalog-desc">${nft.description}</p>
        <div class="nft-stats-row">
          <div class="nft-stat-box"><div class="nft-stat-val" style="color:${nft.accentColor};">${nft.apr}%</div><div class="nft-stat-lbl">APR</div></div>
          <div class="nft-stat-box"><div class="nft-stat-val" style="color:#10b981;">${nft.quarterlyRewardUSDT.toLocaleString()}</div><div class="nft-stat-lbl">USDT/四半期</div></div>
          <div class="nft-stat-box"><div class="nft-stat-val" style="color:#10b981;">${(nft.quarterlyRewardUSDT * 4).toLocaleString()}</div><div class="nft-stat-lbl">USDT/年</div></div>
        </div>
        <div class="nft-features-row">
          ${nft.features.map(f => `<span class="nft-feature-chip">${f}</span>`).join('')}
        </div>
        <div class="nft-supply-block">
          <div class="nft-supply-top"><span>販売数</span><span>${sold} / ${nft.maxSupply} 枚</span></div>
          <div class="nft-supply-bar-wrap"><div class="nft-supply-bar-fill" style="width:${pct}%;background:${nft.color};"></div></div>
          ${threshold70 && !soldOut
                ? `<div class="nft-supply-alert ${counterClass}">⚠️ 残り <strong>${remaining}</strong> 枚！お早めに</div>`
                : `<div class="nft-supply-rem">残り <strong style="color:${nft.accentColor};">${remaining}</strong> 枚</div>`
            }
        </div>
        <div class="nft-price-block">
          <div class="nft-price-jpy">¥${nft.priceJPY.toLocaleString()}</div>
          <div class="nft-price-sub">${nft.priceETH} ETH / ${nft.priceUSDT.toLocaleString()} USDT 相当</div>
        </div>
        <button class="btn btn-primary nft-buy-btn" onclick="initPurchase('${nft.id}')" ${soldOut ? 'disabled' : ''}>
          ${soldOut ? '🚫 SOLD OUT' : `💳 購入する (¥${nft.priceJPY.toLocaleString()})`}
        </button>
        ${owned > 0 ? `<div class="nft-owned-badge">✅ ${owned}枚 所有中</div>` : ''}
      </div>
    </div>`;
    }).join('');
}

// ─────────────────────────────────────
//  PURCHASE
// ─────────────────────────────────────
function initPurchase(nftType) {
    if (!state.wallet) { openWalletModal(); showToast('info', '🦊', 'まずウォレットを接続してください'); return; }
    const nft = getEffectiveCatalog().find(n => n.id === nftType);
    if (!nft) return;
    const supply = getSupply();
    if ((supply[nftType]?.sold || 0) >= nft.maxSupply) { showToast('error', '🚫', 'このNFTは売り切れです'); return; }
    openPurchaseConfirmModal(nft);
}

function openPurchaseConfirmModal(nft) {
    const modal = document.getElementById('purchaseConfirmModal');
    if (!modal) return;
    setText('pcEmoji', nft.emoji);
    setText('pcName', nft.name);
    setText('pcAPR', nft.apr + '%');
    setText('pcPriceJPY', '¥' + nft.priceJPY.toLocaleString());
    setText('pcPriceETH', nft.priceETH + ' ETH');
    setText('pcPriceUSDT', nft.priceUSDT.toLocaleString() + ' USDT');
    setText('pcReward', nft.quarterlyRewardUSDT.toLocaleString() + ' USDT / 四半期');
    setText('pcAnnual', (nft.quarterlyRewardUSDT * 4).toLocaleString() + ' USDT / 年');
    document.getElementById('pcConfirmBtn').onclick = () => executePurchase(nft.id);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closePurchaseConfirmModal(e) {
    const modal = document.getElementById('purchaseConfirmModal');
    if (!e || e.target === modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
}

function executePurchase(nftType) {
    closePurchaseConfirmModal();
    const nft = getEffectiveCatalog().find(n => n.id === nftType);
    if (!nft) return;
    openProcessingModal(`${nft.name} (¥${nft.priceJPY.toLocaleString()}) の購入を処理しています`);
    setTimeout(() => updateProcessingModal('⛓️', 'ブロックチェーン確認中...', 'Ethereumネットワークで承認を待っています'), 1200);
    setTimeout(() => finalizePurchase(nft), 3000);
}

function finalizePurchase(nft) {
    const supply = getSupply();
    const s = supply[nft.id] || { sold: 0 };
    if (s.sold >= nft.maxSupply) { showToast('error', '🚫', '購入処理中に売り切れになりました'); closePurchaseModal(); return; }
    s.sold++;
    supply[nft.id] = s;
    saveSupply(supply);
    const tokenNum = s.sold;
    const tokenId = `${nft.tier}-${String(tokenNum).padStart(3, '0')}`;
    const now = new Date();
    // Quarterly reward dates for 3 years (12 quarters)
    const rewardDates = [];
    for (let i = 1; i <= 12; i++) {
        const d = new Date(now); d.setMonth(d.getMonth() + i * 3);
        rewardDates.push(d.toISOString().slice(0, 10));
    }
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const purchase = {
        id: `${nft.id}-${tokenNum}-${Date.now()}`,
        nftType: nft.id, nftName: nft.name, tier: nft.tier,
        tokenNumber: tokenNum, tokenId,
        emoji: nft.emoji, color: nft.color, accentColor: nft.accentColor,
        bgGradient: nft.bgGradient,
        wallet: state.wallet,
        purchasedAt: now.toISOString(),
        priceJPY: nft.priceJPY, priceETH: nft.priceETH, priceUSDT: nft.priceUSDT,
        apr: nft.apr, quarterlyRewardUSDT: nft.quarterlyRewardUSDT,
        rewardDates, stakedAt: null, status: 'purchased',
        txHash, distributions: [],
    };
    const all = JSON.parse(localStorage.getItem(STORAGE.PURCHASES) || '[]');
    all.unshift(purchase);
    localStorage.setItem(STORAGE.PURCHASES, JSON.stringify(all));
    state.purchases.unshift(purchase);
    // Activity log
    const actLog = JSON.parse(localStorage.getItem(STORAGE.ACTIVITY) || '[]');
    actLog.unshift({
        type: 'purchase', nftEmoji: nft.emoji, nftName: `${nft.name} #${String(tokenNum).padStart(3, '0')}`,
        priceJPY: nft.priceJPY, priceETH: nft.priceETH, buyer: state.wallet, txHash, timestamp: now.toISOString()
    });
    localStorage.setItem(STORAGE.ACTIVITY, JSON.stringify(actLog.slice(0, 200)));
    // Update modal
    updateProcessingModal('🎉', '購入完了！', `${nft.name} ${tokenId} があなたのウォレットに届きました！`);
    document.getElementById('purchaseTxHash').style.display = 'block';
    document.getElementById('purchaseTxHash').textContent = `Tx: ${txHash.slice(0, 22)}...`;
    document.getElementById('purchaseCloseBtn').style.display = 'block';
    renderMarketplace();
    updateNavBadges();
    showToast('success', '🎉', `${nft.name} ${tokenId} の購入が完了！`);
}

function openProcessingModal(desc) {
    const modal = document.getElementById('purchaseModal');
    setText('purchaseAnimation', '⏳'); setText('purchaseTitle', '取引を処理中...'); setText('purchaseDesc', desc);
    document.getElementById('purchaseTxHash').style.display = 'none';
    document.getElementById('purchaseCloseBtn').style.display = 'none';
    modal.classList.add('open'); document.body.style.overflow = 'hidden';
}
function updateProcessingModal(icon, title, desc) {
    setText('purchaseAnimation', icon); setText('purchaseTitle', title); setText('purchaseDesc', desc);
}
function closePurchaseModal() {
    document.getElementById('purchaseModal')?.classList.remove('open');
    document.body.style.overflow = '';
}

// ─────────────────────────────────────
//  MY COLLECTION
// ─────────────────────────────────────
function renderMyCollection() {
    const grid = document.getElementById('collectionGrid');
    const empty = document.getElementById('collectionEmpty');
    const noWallet = document.getElementById('collectionNoWallet');
    if (!grid) return;
    if (!state.wallet) {
        grid.innerHTML = ''; empty?.classList.add('hidden'); noWallet?.classList.remove('hidden'); return;
    }
    noWallet?.classList.add('hidden');
    if (state.purchases.length === 0) { grid.innerHTML = ''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    const nftMap = Object.fromEntries(getEffectiveCatalog().map(n => [n.id, n]));
    grid.innerHTML = state.purchases.map(p => {
        const def = nftMap[p.nftType] || {};
        const distCount = (p.distributions || []).length;
        const nextReward = p.rewardDates?.[distCount] || '受取済/完了';
        const isStaked = p.status === 'staked';
        return `
    <div class="collection-card">
      <div class="collection-card-img" style="background:${p.bgGradient || def.bgGradient};">
        <div class="collection-emoji">${p.emoji}</div>
        ${isStaked ? `<div class="staked-badge">🔒 運用中</div>` : ''}
      </div>
      <div class="collection-card-body">
        <div class="collection-card-name">${p.nftName}</div>
        <div class="collection-token-id">${p.tokenId}</div>
        <div class="collection-meta">
          <span class="meta-chip" style="color:${p.accentColor || def.accentColor};">${p.apr}% APR</span>
          <span class="meta-chip" style="color:#10b981;">+${p.quarterlyRewardUSDT.toLocaleString()} USDT/Q</span>
        </div>
        <div class="collection-dates">
          <div><span class="cdate-label">購入日</span><span class="cdate-val">${new Date(p.purchasedAt).toLocaleDateString('ja-JP')}</span></div>
          <div><span class="cdate-label">次回報酬日</span><span class="cdate-val">${nextReward}</span></div>
        </div>
      </div>
    </div>`;
    }).join('');
}

// ─────────────────────────────────────
//  STAKING
// ─────────────────────────────────────
function renderStakingPage() {
    updateStakingStats();
    renderMyStakingCards();
}

function updateStakingStats() {
    const staked = state.purchases.filter(p => p.status === 'staked');
    const yearReward = state.purchases.reduce((s, p) => s + p.quarterlyRewardUSDT * 4, 0);
    const qReward = staked.reduce((s, p) => s + p.quarterlyRewardUSDT, 0);
    setText('stkMyNFTs', state.purchases.length);
    setText('stkStakedNFTs', staked.length);
    setText('stkYearReward', yearReward.toLocaleString() + ' USDT');
    setText('stkQReward', qReward.toLocaleString() + ' USDT');
}

function renderMyStakingCards() {
    const list = document.getElementById('stakingNFTList');
    const empty = document.getElementById('stakingEmpty');
    const noWallet = document.getElementById('stakingNoWallet');
    if (!list) return;
    if (!state.wallet) {
        list.innerHTML = ''; empty?.classList.add('hidden'); noWallet?.classList.remove('hidden'); return;
    }
    noWallet?.classList.add('hidden');
    if (state.purchases.length === 0) { list.innerHTML = ''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    const now = Date.now();
    list.innerHTML = state.purchases.map(p => {
        const isStaked = p.status === 'staked';
        const distCount = (p.distributions || []).length;
        const nextDate = p.rewardDates?.[distCount] || null;
        const isDue = nextDate && new Date(nextDate).getTime() <= now;
        const distHtml = (p.distributions || []).length > 0
            ? `<div class="reward-history">${(p.distributions || []).map(d => `
            <div class="rh-row"><span>${d.rewardDate}</span><span style="color:#10b981;">${d.amountUSDT.toLocaleString()} USDT ✅</span></div>`).join('')}</div>`
            : '';
        return `
    <div class="staking-card ${isStaked ? 'is-staked' : ''}" data-id="${p.id}" data-apr="${p.apr}">
      <div class="sc-badge" style="background:${p.accentColor || '#666'}18;border:1px solid ${p.accentColor || '#666'}40;color:${p.accentColor || '#aaa'};">
        <div class="sc-num">${p.apr}%</div><div class="sc-lbl">APR</div>
      </div>
      <div class="sc-info">
        <div class="sc-title">${p.nftName} <span class="sc-token">${p.tokenId}</span></div>
        <div class="sc-meta">
          <span>📅 購入: ${new Date(p.purchasedAt).toLocaleDateString('ja-JP')}</span>
          ${isStaked ? `<span>🔒 運用開始: ${new Date(p.stakedAt).toLocaleDateString('ja-JP')}</span>` : ''}
          ${nextDate ? `<span style="${isDue ? 'color:#f59e0b;font-weight:700;' : ''}">🗓️ 次回報酬日: ${nextDate}${isDue ? ' (配布待ち)' : ''}</span>` : '<span>🗓️ 全報酬配布完了</span>'}
        </div>
        ${distHtml}
      </div>
      <div class="sc-right">
        <div class="sc-usdt">${p.quarterlyRewardUSDT.toLocaleString()}</div>
        <div class="sc-usdt-lbl">USDT/四半期</div>
        ${isStaked
                ? `<div class="stake-badge-active">🔒 運用中</div>`
                : `<button class="btn btn-primary btn-sm" style="width:100%;margin-top:8px;" onclick="stakeNFT('${p.id}')">🔒 ステーキング開始</button>`}
      </div>
    </div>`;
    }).join('');
}

function stakeNFT(purchaseId) {
    const all = JSON.parse(localStorage.getItem(STORAGE.PURCHASES) || '[]');
    const p = all.find(x => x.id === purchaseId);
    if (!p) return;
    p.status = 'staked';
    p.stakedAt = new Date().toISOString();
    localStorage.setItem(STORAGE.PURCHASES, JSON.stringify(all));
    const lp = state.purchases.find(x => x.id === purchaseId);
    if (lp) { lp.status = 'staked'; lp.stakedAt = p.stakedAt; }
    renderMyStakingCards();
    updateStakingStats();
    showToast('success', '🔒', `${p.nftName} をステーキングしました！四半期ごとにUSDT報酬が配布されます`);
}

// ─────────────────────────────────────
//  ACTIVITY
// ─────────────────────────────────────
function renderActivity() {
    const list = document.getElementById('activityList');
    if (!list) return;
    const log = JSON.parse(localStorage.getItem(STORAGE.ACTIVITY) || '[]');
    if (log.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-title">アクティビティはありません</div></div>';
        return;
    }
    list.innerHTML = log.map(item => `
  <div class="activity-row">
    <div class="activity-emoji">${item.nftEmoji}</div>
    <div class="activity-details">
      <div class="activity-name">${item.nftName}</div>
      <div class="activity-meta">💳 購入 • ${shortAddr(item.buyer)}</div>
    </div>
    <div class="activity-price"><span class="text-gradient">¥${(item.priceJPY || 0).toLocaleString()}</span></div>
    <div class="activity-time">${getTimeAgo(new Date(item.timestamp))}</div>
  </div>`).join('');
}

// ─────────────────────────────────────
//  PAGE NAVIGATION
// ─────────────────────────────────────
function showPage(page) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const el = document.getElementById(`page-${page}`);
    const nav = document.getElementById(`nav-${page}`);
    if (el) el.classList.add('active');
    if (nav) nav.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'marketplace') { reloadPurchases(); renderMarketplace(); }
    if (page === 'collection') { reloadPurchases(); renderMyCollection(); }
    if (page === 'staking') { reloadPurchases(); renderStakingPage(); }
    if (page === 'activity') renderActivity();
}

function updateNavBadges() {
    const count = state.purchases.length;
    const el = document.getElementById('collectionBadge');
    if (el) { el.textContent = count; el.style.display = count > 0 ? 'inline-flex' : 'none'; }
}

// ─────────────────────────────────────
//  WALLET
// ─────────────────────────────────────
function openWalletModal() {
    if (state.wallet) { showDisconnectToast(); return; }
    document.getElementById('walletModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeWalletModal(e) {
    const modal = document.getElementById('walletModal');
    if (!e || e.target === modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
}
async function connectWallet(type) {
    closeWalletModal();
    showToast('info', '🔄', `${getWalletName(type)} に接続中...`);
    try {
        let address;
        if (type === 'metamask' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            address = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0];
        } else {
            address = await new Promise(resolve => {
                setTimeout(() => {
                    const h = () => Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
                    resolve(`0x${h()}${h()}${h()}${h()}${h()}`);
                }, 1200);
            });
        }
        state.wallet = address; state.walletType = type;
        localStorage.setItem(STORAGE.WALLET, JSON.stringify({ address, type }));
        reloadPurchases();
        updateWalletUI(); updateNavBadges(); renderMarketplace();
        showToast('success', '✅', `ウォレット接続完了！ ${shortAddr(address)}`);
    } catch (err) { showToast('error', '❌', `接続失敗: ${err.message || 'エラーが発生しました'}`); }
}
function disconnectWallet() {
    state.wallet = null; state.walletType = null; state.purchases = [];
    localStorage.removeItem(STORAGE.WALLET);
    updateWalletUI(); updateNavBadges(); renderMarketplace(); showPage('marketplace');
    showToast('info', '🔌', 'ウォレットを切断しました');
}
function updateWalletUI() {
    const btn = document.getElementById('connectWalletBtn');
    const text = document.getElementById('walletBtnText');
    if (!btn) return;
    if (state.wallet) {
        btn.classList.add('connected');
        const dot = btn.querySelector('.wallet-dot') || (() => {
            const d = document.createElement('span'); d.className = 'wallet-dot'; btn.prepend(d); return d;
        })();
        text.textContent = shortAddr(state.wallet);
    } else {
        btn.classList.remove('connected');
        btn.querySelector('.wallet-dot')?.remove();
        text.textContent = 'ウォレット接続';
    }
}
function showDisconnectToast() {
    showToast('info', '🦊', `接続中: ${shortAddr(state.wallet)} — <button onclick="disconnectWallet()" style="color:var(--accent-pink);font-weight:700;background:none;border:none;cursor:pointer;margin-left:4px;">切断</button>`, 8000);
}
function getWalletName(t) { return { metamask: 'MetaMask', walletconnect: 'WalletConnect', coinbase: 'Coinbase Wallet' }[t] || t; }

// ─────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────
function setText(id, val) { const e = document.getElementById(id); if (e) e.textContent = val; }
function shortAddr(a) { return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : ''; }
function getTimeAgo(date) {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return `${s}秒前`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}分前`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}時間前`;
    return `${Math.floor(h / 24)}日前`;
}
function setupScrollEffect() {
    const nb = document.getElementById('navbar');
    window.addEventListener('scroll', () => nb?.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
}
function showToast(type, icon, message, duration = 4000) {
    const c = document.getElementById('toastContainer'); if (!c) return;
    const t = document.createElement('div'); t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    c.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, duration);
}
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePurchaseConfirmModal(); closePurchaseModal(); closeWalletModal(); }
});
