/* =============================================
   NFT MARKETPLACE — admin.js v2
   ============================================= */
'use strict';

// ─────────────────────────────────────
//  STORAGE KEYS
// ─────────────────────────────────────
const SK = {
    PURCHASES: 'nftm_purchases',
    SUPPLY: 'nftm_nft_supply',
    NFT_CONFIG: 'nftm_nft_config',
};

// ─────────────────────────────────────
//  DEFAULTS
// ─────────────────────────────────────
const NFT_DEFAULTS = {
    silver: { maxSupply: 100, priceJPY: 500000, apr: 18, emoji: '🥈', name: 'Silver NFT', tier: 'SILVER', accentColor: '#CBD5E1' },
    gold: { maxSupply: 100, priceJPY: 1000000, apr: 30, emoji: '🥇', name: 'Gold NFT', tier: 'GOLD', accentColor: '#FCD34D' },
    platina: { maxSupply: 50, priceJPY: 2000000, apr: 36, emoji: '💎', name: 'Platina NFT', tier: 'PLATINA', accentColor: '#DDD6FE' },
};

const PAGE_TITLES = {
    dashboard: 'ダッシュボード',
    'nft-config': 'NFT設定',
    purchases: '購入履歴',
    rewards: '報酬配布',
    settings: '設定',
};

// ─────────────────────────────────────
//  INIT
// ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    loadNFTConfig();
    renderDashboard();
    updateAllBadges();
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); link.click(); } });
    });
});

// ─────────────────────────────────────
//  CLOCK
// ─────────────────────────────────────
function startClock() {
    const el = document.getElementById('topbarTime');
    const tick = () => { if (el) el.textContent = new Date().toLocaleTimeString('ja-JP'); };
    tick(); setInterval(tick, 1000);
}

// ─────────────────────────────────────
//  PAGE NAVIGATION
// ─────────────────────────────────────
function showPage(page) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.getElementById(`nav-${page}`);
    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');
    setText('topbarTitle', PAGE_TITLES[page] || page);
    if (page === 'dashboard') renderDashboard();
    if (page === 'nft-config') renderNFTConfigPage();
    if (page === 'purchases') renderPurchasesPage();
    if (page === 'rewards') renderRewardsPage();
}

// ─────────────────────────────────────
//  NFT CONFIG
// ─────────────────────────────────────
function getNFTConfig() {
    const saved = localStorage.getItem(SK.NFT_CONFIG);
    if (saved) return JSON.parse(saved);
    return {
        silver: { maxSupply: 100, priceJPY: 500000, apr: 18, ethJpy: 400000, usdtJpy: 150 },
        gold: { maxSupply: 100, priceJPY: 1000000, apr: 30, ethJpy: 400000, usdtJpy: 150 },
        platina: { maxSupply: 50, priceJPY: 2000000, apr: 36, ethJpy: 400000, usdtJpy: 150 },
        ethJpy: 400000,
        usdtJpy: 150,
    };
}

function loadNFTConfig() {
    const cfg = getNFTConfig();
    const supply = getSupply();
    ['silver', 'gold', 'platina'].forEach(id => {
        const c = cfg[id] || {};
        setVal(`${id}MaxSupply`, c.maxSupply || NFT_DEFAULTS[id].maxSupply);
        setVal(`${id}PriceJPY`, c.priceJPY || NFT_DEFAULTS[id].priceJPY);
        setVal(`${id}APR`, c.apr || NFT_DEFAULTS[id].apr);
        const sold = supply[id]?.sold || 0;
        setText(`${id}SoldBadge`, `販売済み: ${sold} 枚`);
    });
    setVal('cfgEthJpy', cfg.ethJpy || 400000);
    setVal('cfgUsdtJpy', cfg.usdtJpy || 150);
    updateConfigPreviews();
}

function saveNFTConfig() {
    const supply = getSupply();
    const ethJpy = parseInt(getVal('cfgEthJpy')) || 400000;
    const usdtJpy = parseInt(getVal('cfgUsdtJpy')) || 150;
    const cfg = { ethJpy, usdtJpy };
    let valid = true;
    ['silver', 'gold', 'platina'].forEach(id => {
        const max = parseInt(getVal(`${id}MaxSupply`));
        const price = parseInt(getVal(`${id}PriceJPY`));
        const apr = parseFloat(getVal(`${id}APR`));
        const sold = supply[id]?.sold || 0;
        if (max < sold) {
            showToast('error', '❌', `${NFT_DEFAULTS[id].name}: 最大発行枚数は販売済み枚数(${sold})以上にしてください`);
            valid = false; return;
        }
        cfg[id] = { maxSupply: max, priceJPY: price, apr, ethJpy, usdtJpy };
    });
    if (!valid) return;
    localStorage.setItem(SK.NFT_CONFIG, JSON.stringify(cfg));
    showToast('success', '💾', 'NFT設定を保存しました');
    updateConfigPreviews();
}

function updateConfigPreviews() {
    ['silver', 'gold', 'platina'].forEach(id => {
        const price = parseInt(getVal(`${id}PriceJPY`)) || NFT_DEFAULTS[id].priceJPY;
        const apr = parseFloat(getVal(`${id}APR`)) || NFT_DEFAULTS[id].apr;
        const ethJpy = parseInt(getVal('cfgEthJpy')) || 400000;
        const usdtJpy = parseInt(getVal('cfgUsdtJpy')) || 150;
        const qReward = Math.round(price * apr / 100 / 4 / usdtJpy);
        const priceETH = (price / ethJpy).toFixed(4);
        const el = document.getElementById(`${id}Preview`);
        if (el) el.innerHTML = `
      <div class="config-preview-row">
        <span>ETH相当:</span><strong>${priceETH} ETH</strong>
        <span>四半期報酬:</span><strong style="color:#10b981;">${qReward.toLocaleString()} USDT</strong>
        <span>年間報酬:</span><strong style="color:#10b981;">${(qReward * 4).toLocaleString()} USDT</strong>
      </div>`;
    });
}

['silver', 'gold', 'platina'].forEach(id => {
    document.addEventListener('DOMContentLoaded', () => {
        ['MaxSupply', 'PriceJPY', 'APR'].forEach(field => {
            document.getElementById(`${id}${field}`)?.addEventListener('input', updateConfigPreviews);
        });
        document.getElementById('cfgEthJpy')?.addEventListener('input', updateConfigPreviews);
        document.getElementById('cfgUsdtJpy')?.addEventListener('input', updateConfigPreviews);
    });
});

function renderNFTConfigPage() {
    loadNFTConfig();
}

// ─────────────────────────────────────
//  SUPPLY
// ─────────────────────────────────────
function getSupply() {
    const s = localStorage.getItem(SK.SUPPLY);
    return s ? JSON.parse(s) : { silver: { sold: 0 }, gold: { sold: 0 }, platina: { sold: 0 } };
}

// ─────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────
function renderDashboard() {
    const all = JSON.parse(localStorage.getItem(SK.PURCHASES) || '[]');
    const cfg = getNFTConfig();
    const supply = getSupply();
    const totalSales = all.reduce((s, p) => s + (p.priceJPY || 0), 0);
    const staked = all.filter(p => p.status === 'staked').length;
    const pending = countPendingRewards(all);
    setText('dTotalPurchases', all.length);
    setText('dTotalSalesJPY', '¥' + totalSales.toLocaleString());
    setText('dTotalStaked', staked);
    setText('dPendingRewards', pending);

    // NFT Breakdown
    const bd = document.getElementById('dashNFTBreakdown');
    if (bd) {
        bd.innerHTML = ['silver', 'gold', 'platina'].map(id => {
            const def = NFT_DEFAULTS[id];
            const c = cfg[id] || {};
            const s = supply[id] || { sold: 0 };
            const max = c.maxSupply || def.maxSupply;
            const pct = Math.round((s.sold / max) * 100);
            const sold = all.filter(p => p.nftType === id).length;
            return `
      <div class="breakdown-row">
        <span class="breakdown-emoji">${def.emoji}</span>
        <div class="breakdown-info">
          <div class="breakdown-name">${def.name}</div>
          <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:${pct}%;background:${def.accentColor};"></div></div>
          <div class="breakdown-meta">${sold} / ${max} 枚 販売済み</div>
        </div>
        <div class="breakdown-stat">¥${((c.priceJPY || def.priceJPY) * sold).toLocaleString()}</div>
      </div>`;
        }).join('');
    }

    // Recent Purchases
    const rp = document.getElementById('dashRecentPurchases');
    if (rp) {
        const recent = all.slice(0, 5);
        if (recent.length === 0) { rp.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:24px;">購入データがありません</div>'; }
        else {
            rp.innerHTML = recent.map(p => `
      <div class="activity-item">
        <span class="activity-dot mint"></span>
        <span class="activity-body">${p.emoji} ${p.nftName} ${p.tokenId} — ${shortAddr(p.wallet)}</span>
        <span class="activity-time">${getTimeAgo(new Date(p.purchasedAt))}</span>
      </div>`).join('');
        }
    }
    updateAllBadges();
}

// ─────────────────────────────────────
//  PURCHASE HISTORY
// ─────────────────────────────────────
function renderPurchasesPage(data = null) {
    const all = data || JSON.parse(localStorage.getItem(SK.PURCHASES) || '[]');
    const tbody = document.getElementById('purchasesTableBody');
    if (!tbody) return;
    if (all.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted);">購入データがありません</td></tr>`;
        return;
    }
    const now = Date.now();
    tbody.innerHTML = all.map(p => {
        const distCount = (p.distributions || []).length;
        const nextDate = p.rewardDates?.[distCount] || null;
        const isDue = nextDate && new Date(nextDate).getTime() <= now;
        const statusBadge = p.status === 'staked'
            ? `<span class="status-badge published">🔒 運用中</span>`
            : `<span class="status-badge draft">📦 未運用</span>`;
        return `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.3rem;">${p.emoji}</span><strong>${p.nftName}</strong></div></td>
      <td><span class="font-mono" style="font-size:0.78rem;">${p.tokenId}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="font-mono" style="font-size:0.75rem;color:var(--text-muted);">${shortAddr(p.wallet)}</span>
          <button class="copy-addr-btn" onclick="copyToClipboard('${p.wallet}', this)" title="ウォレットアドレスをコピー">📋</button>
        </div>
      </td>
      <td style="font-size:0.8rem;">${formatDate(p.purchasedAt)}</td>
      <td><strong>¥${(p.priceJPY || 0).toLocaleString()}</strong><br><span style="font-size:0.7rem;color:var(--text-muted);">${p.priceETH} ETH</span></td>
      <td><span style="color:${aprColor(p.apr)};font-weight:700;">${p.apr}%</span></td>
      <td style="${isDue ? 'color:#f59e0b;font-weight:700;' : ''}font-size:0.8rem;">${nextDate || '完了'}${isDue ? ' ⚠️' : ''}</td>
      <td>${statusBadge}</td>
      <td style="font-size:0.8rem;">${distCount} 回 / ${p.rewardDates?.length || 0} 回</td>
    </tr>`;
    }).join('');
}

function filterPurchases() {
    const q = (document.getElementById('purchaseSearch')?.value || '').toLowerCase();
    const type = document.getElementById('purchaseTypeFilter')?.value || 'all';
    const all = JSON.parse(localStorage.getItem(SK.PURCHASES) || '[]');
    const filtered = all.filter(p => {
        const matchType = type === 'all' || p.nftType === type;
        const matchQ = !q || p.tokenId?.toLowerCase().includes(q) || p.wallet?.toLowerCase().includes(q) || p.nftName?.toLowerCase().includes(q);
        return matchType && matchQ;
    });
    renderPurchasesPage(filtered);
}

function exportPurchasesCSV() {
    const all = JSON.parse(localStorage.getItem(SK.PURCHASES) || '[]');
    if (all.length === 0) { showToast('info', '📋', 'エクスポートするデータがありません'); return; }
    const header = ['NFT種類', 'トークンID', 'ウォレット', '購入日', '購入金額(JPY)', 'ETH', 'APR', '四半期報酬(USDT)', 'ステータス', '配布回数'];
    const rows = all.map(p => [
        p.nftName, p.tokenId, p.wallet,
        new Date(p.purchasedAt).toLocaleDateString('ja-JP'),
        p.priceJPY, p.priceETH, p.apr + '%', p.quarterlyRewardUSDT,
        p.status, (p.distributions || []).length
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `nft_purchases_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('success', '📥', 'CSVをエクスポートしました');
}

// ─────────────────────────────────────
//  REWARD DISTRIBUTION
// ─────────────────────────────────────
function countPendingRewards(all) {
    const now = Date.now();
    return all.filter(p => {
        if (p.status !== 'staked') return false;
        const distCount = (p.distributions || []).length;
        const nextDate = p.rewardDates?.[distCount];
        return nextDate && new Date(nextDate).getTime() <= now;
    }).length;
}

function renderRewardsPage() {
    const all = JSON.parse(localStorage.getItem(SK.PURCHASES) || '[]');
    const now = Date.now();
    const pending = [];
    const distributed = [];

    all.forEach(p => {
        const distCount = (p.distributions || []).length;
        const nextDate = p.rewardDates?.[distCount];
        if (p.status === 'staked' && nextDate && new Date(nextDate).getTime() <= now) {
            pending.push({ purchase: p, rewardDate: nextDate, amountUSDT: p.quarterlyRewardUSDT });
        }
        (p.distributions || []).forEach(d => distributed.push({ purchase: p, ...d }));
    });
    distributed.sort((a, b) => new Date(b.distributedAt) - new Date(a.distributedAt));

    // Stats
    const pendingUSDT = pending.reduce((s, x) => s + (x.amountUSDT || 0), 0);
    const doneUSDT = distributed.reduce((s, x) => s + (x.amountUSDT || 0), 0);
    setText('rwPendingCount', pending.length);
    setText('rwPendingUSDT', pendingUSDT.toLocaleString() + ' USDT');
    setText('rwDoneCount', distributed.length);
    setText('rwDoneUSDT', doneUSDT.toLocaleString() + ' USDT');

    // Pending table
    const pendingBody = document.getElementById('pendingRewardsBody');
    if (pendingBody) {
        if (pending.length === 0) {
            pendingBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--text-muted);">配布待ちの報酬はありません ✅</td></tr>`;
        } else {
            pendingBody.innerHTML = pending.map(x => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:1.2rem;">${x.purchase.emoji}</span><strong>${x.purchase.nftName}</strong></div></td>
        <td><span class="font-mono" style="font-size:0.78rem;">${x.purchase.tokenId}</span></td>
        <td><span class="font-mono" style="font-size:0.75rem;color:var(--text-muted);">${shortAddr(x.purchase.wallet)}</span></td>
        <td style="color:#f59e0b;font-weight:700;">${x.rewardDate}</td>
        <td><strong style="color:#10b981;">${(x.amountUSDT || 0).toLocaleString()} USDT</strong></td>
        <td><button class="btn btn-primary btn-sm" onclick="distributeOne('${x.purchase.id}')">💰 配布実行</button></td>
      </tr>`).join('');
        }
    }

    // Distributed history
    const distBody = document.getElementById('distributedRewardsBody');
    if (distBody) {
        if (distributed.length === 0) {
            distBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--text-muted);">配布履歴がありません</td></tr>`;
        } else {
            distBody.innerHTML = distributed.map(d => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:8px;"><span>${d.purchase.emoji}</span><span>${d.purchase.nftName} ${d.purchase.tokenId}</span></div></td>
        <td><span class="font-mono" style="font-size:0.75rem;color:var(--text-muted);">${shortAddr(d.purchase.wallet)}</span></td>
        <td>${d.rewardDate}</td>
        <td style="font-size:0.78rem;color:var(--text-muted);">${formatDate(d.distributedAt)}</td>
        <td><strong style="color:#10b981;">${(d.amountUSDT || 0).toLocaleString()} USDT</strong></td>
      </tr>`).join('');
        }
    }
    updateAllBadges();
}

function distributeOne(purchaseId) {
    const all = JSON.parse(localStorage.getItem(SK.PURCHASES) || '[]');
    const p = all.find(x => x.id === purchaseId);
    if (!p) return;
    const distCount = (p.distributions || []).length;
    const rewardDate = p.rewardDates?.[distCount];
    if (!rewardDate) { showToast('info', 'ℹ️', '配布可能な報酬がありません'); return; }
    if (!p.distributions) p.distributions = [];
    p.distributions.push({ rewardDate, amountUSDT: p.quarterlyRewardUSDT, distributedAt: new Date().toISOString(), distributedBy: 'admin' });
    localStorage.setItem(SK.PURCHASES, JSON.stringify(all));
    showToast('success', '💰', `${p.nftName} ${p.tokenId} に ${p.quarterlyRewardUSDT.toLocaleString()} USDT を配布しました`);
    renderRewardsPage();
    updateAllBadges();
}

function distributeAll() {
    const all = JSON.parse(localStorage.getItem(SK.PURCHASES) || '[]');
    const now = Date.now();
    let count = 0, totalUSDT = 0;
    all.forEach(p => {
        const distCount = (p.distributions || []).length;
        const nextDate = p.rewardDates?.[distCount];
        if (p.status === 'staked' && nextDate && new Date(nextDate).getTime() <= now) {
            if (!p.distributions) p.distributions = [];
            p.distributions.push({ rewardDate: nextDate, amountUSDT: p.quarterlyRewardUSDT, distributedAt: new Date().toISOString(), distributedBy: 'admin' });
            count++; totalUSDT += p.quarterlyRewardUSDT;
        }
    });
    if (count === 0) { showToast('info', 'ℹ️', '配布待ちの報酬はありません'); return; }
    localStorage.setItem(SK.PURCHASES, JSON.stringify(all));
    showToast('success', '🚀', `${count}件の報酬配布完了！合計 ${totalUSDT.toLocaleString()} USDT`);
    renderRewardsPage();
    updateAllBadges();
}

// ─────────────────────────────────────
//  SETTINGS
// ─────────────────────────────────────
function resetAllPurchaseData() {
    if (!confirm('全ての購入・ステーキングデータを削除しますか？この操作は元に戻せません。')) return;
    localStorage.removeItem(SK.PURCHASES);
    showToast('info', '🗑️', '購入データをリセットしました');
    renderDashboard();
    updateAllBadges();
}
function resetSupply() {
    if (!confirm('NFT販売数をリセットしますか？')) return;
    localStorage.removeItem(SK.SUPPLY);
    showToast('info', '🗑️', '在庫数をリセットしました');
    renderDashboard();
}

// ─────────────────────────────────────
//  BADGES
// ─────────────────────────────────────
function updateAllBadges() {
    const all = JSON.parse(localStorage.getItem(SK.PURCHASES) || '[]');
    setText('badgePurchases', all.length);
    setText('badgePendingRewards', countPendingRewards(all));
}

// ─────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────
function setText(id, val) { const e = document.getElementById(id); if (e) e.textContent = val; }
function setVal(id, val) { const e = document.getElementById(id); if (e) e.value = val; }
function getVal(id) { return document.getElementById(id)?.value || ''; }
function shortAddr(a) { return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '—'; }
function aprColor(apr) { return { 18: '#94A3B8', 30: '#F59E0B', 36: '#A78BFA' }[apr] || '#aaa'; }
function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function getTimeAgo(date) {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return `${s}秒前`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}分前`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}時間前`;
    return `${Math.floor(h / 24)}日前`;
}
function showToast(type, icon, message, duration = 4000) {
    const c = document.getElementById('toastContainer'); if (!c) return;
    const t = document.createElement('div'); t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    c.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, duration);
}

// ─────────────────────────────────────
//  CLIPBOARD COPY
// ─────────────────────────────────────
function copyToClipboard(text, btn) {
    if (!text || text === '—') { showToast('error', '❌', 'コピーするアドレスがありません'); return; }
    navigator.clipboard.writeText(text).then(() => {
        if (btn) {
            const orig = btn.textContent;
            btn.textContent = '✅';
            btn.style.color = '#10b981';
            setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 2000);
        }
        showToast('success', '📋', `アドレスをコピーしました: ${text.slice(0, 10)}...`);
    }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); showToast('success', '📋', 'アドレスをコピーしました'); }
        catch { showToast('error', '❌', 'コピーに失敗しました'); }
        document.body.removeChild(ta);
    });
}

// ─────────────────────────────────────
//  PAYMENT RECEIVING ADDRESS
// ─────────────────────────────────────
const PA_KEY = 'nftm_payment_address';

function loadPaymentAddress() {
    const saved = localStorage.getItem(PA_KEY) || '';
    setVal('paymentAddress', saved);
    updatePaymentAddressCard(saved);
}

function savePaymentAddress() {
    const addr = getVal('paymentAddress').trim();
    if (!addr) { showToast('error', '❌', 'アドレスを入力してください'); return; }
    if (!addr.startsWith('0x') || addr.length < 42) {
        showToast('error', '❌', '有効なEthereumアドレスを入力してください（0xから始まる42文字）');
        return;
    }
    localStorage.setItem(PA_KEY, addr);
    updatePaymentAddressCard(addr);
    showToast('success', '💾', '受け取りアドレスを保存しました');
}

function updatePaymentAddressCard(addr) {
    const card = document.getElementById('paymentAddressCard');
    const display = document.getElementById('paymentAddressDisplay');
    if (!card || !display) return;
    if (addr) {
        display.textContent = addr;
        card.style.display = 'block';
    } else {
        card.style.display = 'none';
    }
}

function copyPaymentAddress() {
    const addr = getVal('paymentAddress').trim() || localStorage.getItem(PA_KEY) || '';
    if (!addr) { showToast('error', '❌', '受け取りアドレスが設定されていません'); return; }
    copyToClipboard(addr, null);
}

// Auto-load payment address when NFT config page is shown
const origRenderNFTConfigPage = window.renderNFTConfigPage || function () { };
function renderNFTConfigPage() {
    loadNFTConfig();
    loadPaymentAddress();
}
