/* =============================================
   NFT MARKETPLACE — admin.js
   Admin panel: NFT minting, management,
   sales analytics, settings
   ============================================= */

'use strict';

// ──────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────
const ADMIN_CONFIG = {
    ETH_TO_JPY: 400000,
    ADMIN_NFTS_KEY: 'nftm_admin_nfts',
    STORAGE_KEY_OWNED: 'nftm_owned',
    STORAGE_KEY_ACTIVITY: 'nftm_activity',
    SETTINGS_KEY: 'nftm_settings',
};

// ──────────────────────────────────────────
// STATE
// ──────────────────────────────────────────
let adminState = {
    nfts: [],          // admin-created NFTs
    settings: {},
    deleteTargetId: null,
    selectedEmoji: '🎨',
    selectedBgClass: 'nft-bg-1',
};

// ──────────────────────────────────────────
// EMOJI & GRADIENT OPTIONS
// ──────────────────────────────────────────
const EMOJI_OPTIONS = [
    '🎨', '🌌', '🧠', '🌊', '🐉', '🔮', '🎵', '⚔️', '😸', '🌳',
    '🎹', '🤖', '🏛️', '🦄', '🌈', '🔥', '💎', '⭐', '🌙', '☀️',
    '🦋', '🐺', '🦁', '🐬', '🦅', '🌺', '🍄', '💫', '⚡', '🎭',
    '🎪', '🎡', '🏆', '🎯', '🎲', '🃏', '🖼️', '🗿', '🔱', '👑',
    '💀', '🌀', '🎆', '🎇', '🧿', '🫧', '🪄', '🧬', '🔬', '🌍',
];

const GRADIENT_OPTIONS = [
    { class: 'nft-bg-1', style: 'linear-gradient(135deg,#1a1a2e,#533483)' },
    { class: 'nft-bg-2', style: 'linear-gradient(135deg,#0f0c29,#24243e)' },
    { class: 'nft-bg-3', style: 'linear-gradient(135deg,#1f1c2c,#928dab)' },
    { class: 'nft-bg-4', style: 'linear-gradient(135deg,#093028,#237a57)' },
    { class: 'nft-bg-5', style: 'linear-gradient(135deg,#3a1c71,#ffaf7b)' },
    { class: 'nft-bg-6', style: 'linear-gradient(135deg,#000428,#004e92)' },
    { class: 'nft-bg-7', style: 'linear-gradient(135deg,#2c3e50,#fd746c)' },
    { class: 'nft-bg-8', style: 'linear-gradient(135deg,#243b55,#141e30)' },
    { class: 'nft-bg-9', style: 'linear-gradient(135deg,#4a00e0,#8e2de2)' },
    { class: 'nft-bg-10', style: 'linear-gradient(135deg,#11998e,#38ef7d)' },
];

// ──────────────────────────────────────────
// INITIALIZE
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadAdminData();
    initEmojiPicker();
    initGradientPicker();
    setupPreviewListeners();
    startClock();
    renderDashboard();
    renderNFTTable();
    renderSales();
    renderAdminActivity();
    updateBadge();
    loadSettings();
});

function loadAdminData() {
    adminState.nfts = JSON.parse(localStorage.getItem(ADMIN_CONFIG.ADMIN_NFTS_KEY) || '[]');
}

function saveAdminData() {
    localStorage.setItem(ADMIN_CONFIG.ADMIN_NFTS_KEY, JSON.stringify(adminState.nfts));
}

// ──────────────────────────────────────────
// CLOCK
// ──────────────────────────────────────────
function startClock() {
    const el = document.getElementById('topbarTime');
    function tick() {
        if (el) el.textContent = new Date().toLocaleTimeString('ja-JP');
    }
    tick();
    setInterval(tick, 1000);
}

// ──────────────────────────────────────────
// PAGE NAVIGATION
// ──────────────────────────────────────────
const PAGE_TITLES = {
    dashboard: 'ダッシュボード',
    nfts: 'NFT管理',
    mint: 'NFT発行',
    sales: '売上管理',
    activity: 'アクティビティ',
    settings: '設定',
};

function showPage(page) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.getElementById(`nav-${page}`);
    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    document.getElementById('topbarTitle').textContent = PAGE_TITLES[page] || page;

    // Refresh data on page switch
    if (page === 'dashboard') renderDashboard();
    if (page === 'nfts') renderNFTTable();
    if (page === 'sales') renderSales();
    if (page === 'activity') renderAdminActivity();
    if (page === 'staking') initAdminStakingPage();
}

// ──────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────
function renderDashboard() {
    const allActivity = JSON.parse(localStorage.getItem(ADMIN_CONFIG.STORAGE_KEY_ACTIVITY) || '[]');
    const published = adminState.nfts.filter(n => n.status === 'published').length;
    const totalSales = allActivity
        .filter(a => a.type === 'purchase')
        .reduce((sum, a) => sum + (a.price || 0), 0);

    setText('statTotalNFTs', adminState.nfts.length);
    setText('statTotalSales', totalSales.toFixed(3));
    setText('statPublished', published);
    setText('badgeNFTs', adminState.nfts.length);

    renderSalesChart(allActivity);
    renderDashActivity(allActivity);
    renderDashNFTTable();
}

function renderSalesChart(activity) {
    const chart = document.getElementById('salesChart');
    if (!chart) return;

    // Last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            date: d.toISOString().slice(0, 10),
            amount: 0,
        });
    }

    // Add demo data
    const demoData = [0.85, 0.32, 1.2, 0.55, 0.18, 0.65, 0.38];
    days.forEach((d, i) => {
        d.amount += demoData[i] || 0;
    });

    activity.filter(a => a.type === 'purchase').forEach(a => {
        const aDate = a.timestamp?.slice(0, 10);
        const dayEntry = days.find(d => d.date === aDate);
        if (dayEntry) dayEntry.amount += a.price || 0;
    });

    const max = Math.max(...days.map(d => d.amount), 0.01);

    chart.innerHTML = days.map(d => `
    <div class="chart-bar-group">
      <div style="flex:1; display:flex; align-items:flex-end; width:100%;">
        <div class="chart-bar" style="height:${Math.max(8, (d.amount / max) * 160)}px;"
             title="${d.label}: ${d.amount.toFixed(3)} ETH"></div>
      </div>
      <div class="chart-label">${d.label}</div>
    </div>
  `).join('');
}

function renderDashActivity(activity) {
    const feed = document.getElementById('dashActivity');
    if (!feed) return;

    const demoItems = [
        { type: 'mint', label: '🎨 Cosmic Genesis #001 を発行しました', time: '2分前' },
        { type: 'sale', label: '💰 Dragon Warrior #012 が購入されました', time: '15分前' },
        { type: 'list', label: '🏷️ Crystal Phoenix #001 を公開しました', time: '1時間前' },
    ];

    const userItems = activity.slice(0, 2).map(a => ({
        type: 'sale',
        label: `💰 ${a.nftName} が購入されました`,
        time: getTimeAgo(new Date(a.timestamp)),
    }));

    const combined = [...userItems, ...demoItems].slice(0, 5);

    feed.innerHTML = combined.map(item => `
    <div class="activity-item">
      <span class="activity-dot ${item.type}"></span>
      <span class="activity-body">${item.label}</span>
      <span class="activity-time">${item.time}</span>
    </div>
  `).join('');
}

function renderDashNFTTable() {
    const tbody = document.getElementById('dashNFTTableBody');
    if (!tbody) return;

    const recent = [...adminState.nfts]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">NFTがありません。まず発行してください。</td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(nft => nftTableRow(nft)).join('');
}

// ──────────────────────────────────────────
// NFT TABLE
// ──────────────────────────────────────────
function renderNFTTable(nfts = null) {
    const tbody = document.getElementById('nftTableBody');
    if (!tbody) return;

    const data = nfts !== null ? nfts : adminState.nfts;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
      NFTがありません。<button class="btn btn-primary btn-sm" onclick="showPage('mint')" style="margin-left:8px;">✨ 発行する</button>
    </td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(nft => nftTableRow(nft, true)).join('');
}

function nftTableRow(nft, showRarity = false) {
    const rarity = nft.properties?.find(p => p.type === 'Rarity')?.value || '—';
    const rarityColors = {
        Mythic: '#ec4899', Legendary: '#f59e0b', Epic: '#a855f7',
        Rare: '#06b6d4', Uncommon: '#10b981', Common: '#94a3b8',
    };
    const rc = rarityColors[rarity] || '#94a3b8';

    return `
    <tr>
      <td>
        <div class="table-nft-info">
          <div class="table-nft-thumb ${nft.bgClass}">${nft.emoji}</div>
          <div>
            <div class="table-nft-name">${escHtml(nft.name)}</div>
            <div class="table-nft-id">${nft.id}</div>
          </div>
        </div>
      </td>
      <td>${getCategoryLabel(nft.category)}</td>
      ${showRarity ? `<td><span style="color:${rc}; font-weight:700; font-size:0.8rem;">${rarity}</span></td>` : ''}
      <td><span class="font-mono">${parseFloat(nft.price).toFixed(3)}</span> ETH</td>
      <td>${statusBadge(nft.status)}</td>
      <td style="color:var(--text-muted); font-size:0.78rem;">${nft.createdAt}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="openEditModal('${nft.id}')" title="編集">✏️</button>
          ${nft.status === 'published'
            ? `<button class="btn btn-warning btn-sm btn-icon" onclick="togglePublish('${nft.id}','draft')" title="下書きに戻す">📝</button>`
            : `<button class="btn btn-success btn-sm btn-icon" onclick="togglePublish('${nft.id}','published')" title="公開する">✅</button>`
        }
          <button class="btn btn-danger btn-sm btn-icon" onclick="openDeleteModal('${nft.id}')" title="削除">🗑️</button>
        </div>
      </td>
    </tr>
  `;
}

function filterNFTTable() {
    const query = document.getElementById('nftSearchInput')?.value.toLowerCase() || '';
    const status = document.getElementById('nftStatusFilter')?.value || 'all';

    const filtered = adminState.nfts.filter(nft => {
        const matchStatus = status === 'all' || nft.status === status;
        const matchQ = !query || nft.name.toLowerCase().includes(query) || nft.id.includes(query);
        return matchStatus && matchQ;
    });

    renderNFTTable(filtered);
}

// ──────────────────────────────────────────
// EMOJI PICKER
// ──────────────────────────────────────────
function initEmojiPicker() {
    const grid = document.getElementById('emojiGrid');
    if (!grid) return;

    grid.innerHTML = EMOJI_OPTIONS.map(e => `
    <div class="emoji-opt ${e === adminState.selectedEmoji ? 'selected' : ''}"
         onclick="selectEmoji('${e}')" role="button" tabindex="0"
         onkeydown="if(event.key==='Enter')selectEmoji('${e}')"
         aria-label="${e}">${e}</div>
  `).join('');
}

function selectEmoji(emoji) {
    adminState.selectedEmoji = emoji;
    document.getElementById('mintEmoji').value = emoji;
    document.getElementById('selectedEmojiPreview').textContent = emoji;
    document.querySelectorAll('.emoji-opt').forEach(el => {
        el.classList.toggle('selected', el.textContent === emoji);
    });
    updatePreview();
    toggleEmojiPicker(false);
}

function toggleEmojiPicker(force) {
    const panel = document.getElementById('emojiPickerPanel');
    if (!panel) return;
    const show = force !== undefined ? force : panel.style.display === 'none';
    panel.style.display = show ? 'block' : 'none';
}

// ──────────────────────────────────────────
// GRADIENT PICKER
// ──────────────────────────────────────────
function initGradientPicker() {
    const picker = document.getElementById('gradientPicker');
    if (!picker) return;

    picker.innerHTML = GRADIENT_OPTIONS.map(g => `
    <div class="gradient-opt ${g.class === adminState.selectedBgClass ? 'selected' : ''}"
         style="background: ${g.style};"
         onclick="selectGradient('${g.class}')"
         role="button" tabindex="0"
         onkeydown="if(event.key==='Enter')selectGradient('${g.class}')"
         title="${g.class}"></div>
  `).join('');
}

function selectGradient(bgClass) {
    adminState.selectedBgClass = bgClass;
    document.getElementById('mintBgClass').value = bgClass;
    document.querySelectorAll('.gradient-opt').forEach(el => {
        el.classList.toggle('selected', el.title === bgClass);
    });
    updatePreview();
}

// ──────────────────────────────────────────
// LIVE PREVIEW
// ──────────────────────────────────────────
function setupPreviewListeners() {
    ['mintName', 'mintPrice', 'mintCategory'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updatePreview);
        document.getElementById(id)?.addEventListener('change', updatePreview);
    });

    document.getElementById('mintPrice')?.addEventListener('input', function () {
        const val = parseFloat(this.value) || 0;
        const jpy = Math.round(val * ADMIN_CONFIG.ETH_TO_JPY).toLocaleString();
        setText('mintPriceJPY', `≈ ¥ ${jpy}`);
        updatePreview();
    });
}

function updatePreview() {
    const name = document.getElementById('mintName')?.value || 'NFT名が表示されます';
    const price = parseFloat(document.getElementById('mintPrice')?.value) || 0;
    const category = document.getElementById('mintCategory')?.value || '';
    const emoji = adminState.selectedEmoji;
    const bgClass = adminState.selectedBgClass;

    setText('previewName', name);
    setText('previewCategory', getCategoryLabel(category));
    setText('previewPrice', price > 0 ? `${price.toFixed(3)} ETH` : '— ETH');

    const thumb = document.getElementById('previewThumb');
    if (thumb) {
        thumb.className = `${bgClass}`;
        thumb.style.cssText = 'width:64px;height:64px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;';
        thumb.textContent = emoji;
    }
}

// ──────────────────────────────────────────
// PROPERTIES
// ──────────────────────────────────────────
function addProperty(type = '', value = '') {
    const list = document.getElementById('propertiesList');
    if (!list) return;

    const id = Date.now();
    const row = document.createElement('div');
    row.className = 'form-row';
    row.id = `prop-${id}`;
    row.style.gap = '8px';
    row.innerHTML = `
    <input type="text" class="form-input prop-type" placeholder="タイプ (例: Rarity)" value="${escHtml(type)}" />
    <input type="text" class="form-input prop-value" placeholder="値 (例: Legendary)" value="${escHtml(value)}" />
    <button type="button" class="btn btn-danger btn-icon btn-sm" onclick="document.getElementById('prop-${id}').remove()" style="flex-shrink:0;" title="削除">✕</button>
  `;
    list.appendChild(row);
}

function getProperties() {
    const rows = document.querySelectorAll('#propertiesList .form-row');
    const props = [];
    rows.forEach(row => {
        const type = row.querySelector('.prop-type')?.value.trim();
        const value = row.querySelector('.prop-value')?.value.trim();
        if (type && value) props.push({ type, value });
    });
    return props;
}

// ──────────────────────────────────────────
// MINT NFT
// ──────────────────────────────────────────
function submitMint(e) {
    e.preventDefault();
    if (!validateMintForm()) return;

    const btn = document.getElementById('mintSubmitBtn');
    const btnIcon = document.getElementById('mintSubmitIcon');
    const btnText = document.getElementById('mintSubmitText');

    btn.disabled = true;
    btnIcon.textContent = '⏳';
    btnText.textContent = '発行中...';

    // Simulate blockchain minting delay
    setTimeout(() => {
        const id = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const name = document.getElementById('mintName').value.trim();
        const price = parseFloat(document.getElementById('mintPrice').value);
        const category = document.getElementById('mintCategory').value;
        const rarity = document.getElementById('mintRarity').value;
        const description = document.getElementById('mintDescription').value.trim();
        const edition = document.getElementById('mintEdition').value.trim();
        const featured = document.getElementById('mintFeatured').checked;
        const status = document.getElementById('mintStatus').value;

        const properties = [
            { type: 'Rarity', value: rarity },
            ...(edition ? [{ type: 'Edition', value: edition }] : []),
            { type: 'Chain', value: 'Ethereum' },
            ...getProperties(),
        ];

        const newNFT = {
            id,
            name,
            emoji: adminState.selectedEmoji,
            bgClass: adminState.selectedBgClass,
            category,
            price,
            description,
            properties,
            featured,
            status,
            likes: 0,
            createdAt: new Date().toISOString().slice(0, 10),
        };

        adminState.nfts.unshift(newNFT);
        saveAdminData();

        // Log activity
        logActivity('mint', `✨ ${name} を発行しました (${price} ETH, ${status === 'published' ? '公開' : '下書き'})`);

        btn.disabled = false;
        btnIcon.textContent = '✨';
        btnText.textContent = 'NFTを発行する';

        resetMintForm();
        showToast('success', '🎉', `「${name}」を発行しました！`);
        updateBadge();
        renderDashboard();

        // Switch to NFT management page
        setTimeout(() => showPage('nfts'), 1200);
    }, 1800);
}

function validateMintForm() {
    let valid = true;
    const fields = [
        { id: 'mintName', errId: 'errName', check: v => v.trim().length > 0 },
        { id: 'mintCategory', errId: 'errCategory', check: v => v !== '' },
        { id: 'mintRarity', errId: 'errRarity', check: v => v !== '' },
        { id: 'mintPrice', errId: 'errPrice', check: v => parseFloat(v) > 0 },
        { id: 'mintDescription', errId: 'errDescription', check: v => v.trim().length > 0 },
    ];

    fields.forEach(({ id, errId, check }) => {
        const input = document.getElementById(id);
        const errEl = document.getElementById(errId);
        const ok = check(input?.value || '');
        if (errEl) errEl.style.display = ok ? 'none' : 'block';
        if (!ok) valid = false;
    });

    return valid;
}

function resetMintForm() {
    document.getElementById('mintForm')?.reset();
    adminState.selectedEmoji = '🎨';
    adminState.selectedBgClass = 'nft-bg-1';
    document.getElementById('mintEmoji').value = '🎨';
    document.getElementById('mintBgClass').value = 'nft-bg-1';
    document.getElementById('selectedEmojiPreview').textContent = '🎨';
    document.getElementById('propertiesList').innerHTML = '';
    document.getElementById('mintPriceJPY').textContent = '≈ ¥ 0';
    initGradientPicker();
    initEmojiPicker();
    updatePreview();

    // Reset errors
    document.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
}

// ──────────────────────────────────────────
// EDIT NFT
// ──────────────────────────────────────────
function openEditModal(id) {
    const nft = adminState.nfts.find(n => n.id === id);
    if (!nft) return;

    document.getElementById('editId').value = id;
    document.getElementById('editName').value = nft.name;
    document.getElementById('editPrice').value = nft.price;
    document.getElementById('editCategory').value = nft.category;
    document.getElementById('editStatus').value = nft.status;
    document.getElementById('editDescription').value = nft.description || '';

    document.getElementById('editModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeEditModal(e) {
    const modal = document.getElementById('editModal');
    if (!e || e.target === modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function submitEdit(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('editId').value;
    const nft = adminState.nfts.find(n => n.id === id);
    if (!nft) return;

    nft.name = document.getElementById('editName').value.trim();
    nft.price = parseFloat(document.getElementById('editPrice').value);
    nft.category = document.getElementById('editCategory').value;
    nft.status = document.getElementById('editStatus').value;
    nft.description = document.getElementById('editDescription').value.trim();

    saveAdminData();
    logActivity('edit', `✏️ ${nft.name} を編集しました`);
    closeEditModal();
    renderNFTTable();
    renderDashboard();
    showToast('success', '💾', '変更を保存しました');
}

// ──────────────────────────────────────────
// TOGGLE PUBLISH
// ──────────────────────────────────────────
function togglePublish(id, newStatus) {
    const nft = adminState.nfts.find(n => n.id === id);
    if (!nft) return;
    nft.status = newStatus;
    saveAdminData();
    logActivity(newStatus === 'published' ? 'list' : 'archive',
        newStatus === 'published' ? `✅ ${nft.name} を公開しました` : `📝 ${nft.name} を下書きに戻しました`);
    renderNFTTable();
    renderDashboard();
    showToast('success', newStatus === 'published' ? '✅' : '📝',
        newStatus === 'published' ? `${nft.name} を公開しました` : `${nft.name} を下書きに戻しました`);
}

// ──────────────────────────────────────────
// DELETE NFT
// ──────────────────────────────────────────
function openDeleteModal(id) {
    const nft = adminState.nfts.find(n => n.id === id);
    if (!nft) return;
    adminState.deleteTargetId = id;
    setText('deleteNFTEmoji', nft.emoji);
    setText('deleteNFTName', nft.name);
    document.getElementById('deleteModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal(e) {
    const modal = document.getElementById('deleteModal');
    if (!e || e.target === modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        adminState.deleteTargetId = null;
    }
}

function confirmDelete() {
    const id = adminState.deleteTargetId;
    if (!id) return;

    const nft = adminState.nfts.find(n => n.id === id);
    adminState.nfts = adminState.nfts.filter(n => n.id !== id);
    saveAdminData();

    logActivity('archive', `🗑️ ${nft?.name || id} を削除しました`);
    closeDeleteModal();
    renderNFTTable();
    renderDashboard();
    updateBadge();
    showToast('info', '🗑️', `${nft?.name || 'NFT'} を削除しました`);
}

// ──────────────────────────────────────────
// SALES PAGE
// ──────────────────────────────────────────
function renderSales() {
    const allActivity = JSON.parse(localStorage.getItem(ADMIN_CONFIG.STORAGE_KEY_ACTIVITY) || '[]');
    const purchases = allActivity.filter(a => a.type === 'purchase');
    const totalEth = purchases.reduce((s, a) => s + (a.price || 0), 0);

    setText('salesTotalEth', totalEth.toFixed(4));
    setText('salesTotalJpy', Math.round(totalEth * ADMIN_CONFIG.ETH_TO_JPY / 10000).toLocaleString());
    setText('salesCount', purchases.length);
    setText('salesAvg', purchases.length ? (totalEth / purchases.length).toFixed(3) : '0.00');

    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;

    if (purchases.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px; color:var(--text-muted);">取引履歴がありません</td></tr>`;
        return;
    }

    tbody.innerHTML = purchases.map(a => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.3rem;">${a.nftEmoji || '🎨'}</span>
          <span style="font-weight:600; font-size:0.875rem;">${escHtml(a.nftName || '—')}</span>
        </div>
      </td>
      <td style="font-family:var(--font-mono); font-size:0.78rem; color:var(--text-muted);">${shortAddr(a.buyer)}</td>
      <td style="font-family:var(--font-mono); font-weight:700;">${(a.price || 0).toFixed(4)}</td>
      <td style="color:var(--text-muted); font-size:0.82rem;">¥${Math.round((a.price || 0) * ADMIN_CONFIG.ETH_TO_JPY).toLocaleString()}</td>
      <td style="color:var(--text-muted); font-size:0.78rem;">${formatDate(a.timestamp)}</td>
      <td style="font-family:var(--font-mono); font-size:0.68rem; color:var(--text-muted); max-width:120px; overflow:hidden; text-overflow:ellipsis;">${(a.txHash || '').slice(0, 18)}...</td>
    </tr>
  `).join('');
}

// ──────────────────────────────────────────
// ACTIVITY PAGE
// ──────────────────────────────────────────
function renderAdminActivity() {
    const feed = document.getElementById('adminActivityFeed');
    if (!feed) return;

    const activity = JSON.parse(localStorage.getItem('nftm_admin_activity') || '[]');

    if (activity.length === 0) {
        feed.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-muted);">アクティビティはありません</div>`;
        return;
    }

    const typeMap = { mint: 'mint', list: 'list', edit: 'mint', archive: 'archive', sale: 'sale' };
    feed.innerHTML = activity.map(item => `
    <div class="activity-item">
      <span class="activity-dot ${typeMap[item.type] || 'mint'}"></span>
      <span class="activity-body">${escHtml(item.label)}</span>
      <span class="activity-time">${getTimeAgo(new Date(item.timestamp))}</span>
    </div>
  `).join('');
}

function logActivity(type, label) {
    const log = JSON.parse(localStorage.getItem('nftm_admin_activity') || '[]');
    log.unshift({ type, label, timestamp: new Date().toISOString() });
    localStorage.setItem('nftm_admin_activity', JSON.stringify(log.slice(0, 200)));
}

function clearActivity() {
    if (!confirm('アクティビティログをクリアしますか？')) return;
    localStorage.removeItem('nftm_admin_activity');
    renderAdminActivity();
    showToast('info', '🗑️', 'アクティビティログをクリアしました');
}

// ──────────────────────────────────────────
// SETTINGS
// ──────────────────────────────────────────
function loadSettings() {
    const saved = JSON.parse(localStorage.getItem(ADMIN_CONFIG.SETTINGS_KEY) || '{}');
    adminState.settings = saved;

    if (saved.ethRate) document.getElementById('ethRate').value = saved.ethRate;
    if (saved.market === false) document.getElementById('toggleMarket').checked = false;
    if (saved.purchase === false) document.getElementById('togglePurchase').checked = false;
    if (saved.featured === false) document.getElementById('toggleFeatured').checked = false;
}

function saveSetting(key, value) {
    adminState.settings[key] = value;
    localStorage.setItem(ADMIN_CONFIG.SETTINGS_KEY, JSON.stringify(adminState.settings));
    showToast('success', '⚙️', '設定を保存しました');
}

function resetAllNFTs() {
    if (!confirm('管理者発行のNFTをすべて削除しますか？この操作は元に戻せません。')) return;
    adminState.nfts = [];
    saveAdminData();
    updateBadge();
    renderDashboard();
    renderNFTTable();
    showToast('info', '🗑️', 'NFTデータをリセットしました');
}

function clearPurchaseData() {
    if (!confirm('購入・所有データをすべてクリアしますか？')) return;
    localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEY_OWNED);
    localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEY_ACTIVITY);
    showToast('info', '🗑️', '購入データをクリアしました');
}

// ──────────────────────────────────────────
// BADGE
// ──────────────────────────────────────────
function updateBadge() {
    setText('badgeNFTs', adminState.nfts.length);
    setText('statTotalNFTs', adminState.nfts.length);
    setText('statPublished', adminState.nfts.filter(n => n.status === 'published').length);
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function shortAddr(addr) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—';
}

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}秒前`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
}

function getCategoryLabel(cat) {
    return { art: '🖼️ アート', collectible: '🏆 コレクタブル', music: '🎵 ミュージック', gaming: '🎮 ゲーミング' }[cat] || '—';
}

function statusBadge(status) {
    const map = {
        published: '<span class="status-badge published">● 公開中</span>',
        draft: '<span class="status-badge draft">● 下書き</span>',
        archived: '<span class="status-badge archived">● アーカイブ</span>',
    };
    return map[status] || `<span class="status-badge">${status}</span>`;
}

// ──────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────
function showToast(type, icon, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ──────────────────────────────────────────
// KEYBOARD ACCESSIBILITY
// ──────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEditModal();
        closeDeleteModal();
    }
});

// ──────────────────────────────────────────
// SIDEBAR KEYBOARD
// ──────────────────────────────────────────
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            link.click();
        }
    });
});

// ══════════════════════════════════════════════════════
//  ADMIN STAKING MANAGEMENT
// ══════════════════════════════════════════════════════

const ADMIN_STAKING_KEY = 'nftm_staking_config';
const ADMIN_STAKES_KEY = 'nftm_stakes';

const DEFAULT_ADMIN_APR_TIERS = [
    { apr: 18, label: 'ベーシック', minAmount: 0.1, enabled: true },
    { apr: 24, label: 'スタンダード', minAmount: 0.5, enabled: true },
    { apr: 30, label: 'プレミアム', minAmount: 1.0, enabled: true },
    { apr: 36, label: 'VIP', minAmount: 2.0, enabled: true },
];

const DEFAULT_ADMIN_PERIODS = [
    { months: 6, label: '半年', enabled: true },
    { months: 12, label: '1年', enabled: true },
    { months: 24, label: '2年', enabled: true },
    { months: 36, label: '3年', enabled: true },
    { months: 60, label: '5年', enabled: true },
];

let adminStakingConfig = null;

function loadAdminStakingConfig() {
    const saved = localStorage.getItem(ADMIN_STAKING_KEY);
    adminStakingConfig = saved ? JSON.parse(saved) : {
        aprTiers: DEFAULT_ADMIN_APR_TIERS.map(t => ({ ...t })),
        periods: DEFAULT_ADMIN_PERIODS.map(p => ({ ...p })),
        ethToUsdt: 3000,
    };
}

function saveStakingConfig() {
    // Read APR tier states from DOM
    adminStakingConfig.aprTiers.forEach(tier => {
        const cb = document.getElementById(`aprCheck_${tier.apr}`);
        const minInp = document.getElementById(`aprMin_${tier.apr}`);
        if (cb) tier.enabled = cb.checked;
        if (minInp) tier.minAmount = parseFloat(minInp.value) || tier.minAmount;
    });

    // Read period states from DOM
    adminStakingConfig.periods.forEach(p => {
        const cb = document.getElementById(`periodCheck_${p.months}`);
        if (cb) p.enabled = cb.checked;
    });

    // ETH/USDT rate
    const rateInp = document.getElementById('adminEthUsdt');
    if (rateInp) adminStakingConfig.ethToUsdt = parseFloat(rateInp.value) || 3000;

    localStorage.setItem(ADMIN_STAKING_KEY, JSON.stringify(adminStakingConfig));
    showToast('success', '💾', 'ステーキング設定を保存しました');
    updateStakingBadge();
}

function initAdminStakingPage() {
    loadAdminStakingConfig();
    renderAprConfigTable();
    renderPeriodConfigTable();
    renderAdminStakes();
    updateAdminStakingStats();
    const rateInp = document.getElementById('adminEthUsdt');
    if (rateInp) rateInp.value = adminStakingConfig.ethToUsdt;
}

function renderAprConfigTable() {
    const tbody = document.getElementById('aprConfigTable');
    if (!tbody) return;

    tbody.innerHTML = adminStakingConfig.aprTiers.map(tier => `
        <tr>
            <td><strong style="color:${aprColor(tier.apr)}; font-family:var(--font-mono);">${tier.apr}%</strong></td>
            <td>${tier.label}</td>
            <td>
                <input type="number" id="aprMin_${tier.apr}" class="form-input"
                    style="width:90px; padding:4px 8px; font-size:0.8rem;"
                    value="${tier.minAmount}" min="0.001" step="0.001" />
            </td>
            <td>
                <label class="toggle" style="transform:scale(0.85); display:inline-block;">
                    <input type="checkbox" id="aprCheck_${tier.apr}" ${tier.enabled ? 'checked' : ''} />
                    <span class="toggle-track"></span>
                </label>
            </td>
        </tr>
    `).join('');
}

function renderPeriodConfigTable() {
    const tbody = document.getElementById('periodConfigTable');
    if (!tbody) return;

    tbody.innerHTML = adminStakingConfig.periods.map(p => `
        <tr>
            <td><strong>${p.label}</strong></td>
            <td style="font-family:var(--font-mono); color:var(--text-muted);">${p.months}ヶ月</td>
            <td>
                <label class="toggle" style="transform:scale(0.85); display:inline-block;">
                    <input type="checkbox" id="periodCheck_${p.months}" ${p.enabled ? 'checked' : ''} />
                    <span class="toggle-track"></span>
                </label>
            </td>
        </tr>
    `).join('');
}

function renderAdminStakes() {
    const tbody = document.getElementById('adminStakesTable');
    if (!tbody) return;

    const stakes = JSON.parse(localStorage.getItem(ADMIN_STAKES_KEY) || '[]');

    if (stakes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:28px; color:var(--text-muted);">ステーキングデータがありません</td></tr>`;
        return;
    }

    const now = Date.now();
    tbody.innerHTML = stakes.map(s => {
        const matured = now >= new Date(s.maturityDate).getTime();
        const isClaimed = s.status === 'claimed';
        let badge;
        if (isClaimed) badge = `<span class="status-badge archived">✅ 受取済み</span>`;
        else if (matured) badge = `<span class="status-badge" style="background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.25);">🏆 満期</span>`;
        else badge = `<span class="status-badge published">🟢 運用中</span>`;

        return `
        <tr>
            <td style="font-family:var(--font-mono); font-size:0.78rem; color:var(--text-muted);">${shortAddr(s.wallet)}</td>
            <td><strong style="color:${aprColor(s.apr)};">${s.apr}%</strong></td>
            <td>${s.periodLabel}</td>
            <td style="font-family:var(--font-mono);">${parseFloat(s.amountEth).toFixed(3)}</td>
            <td style="font-family:var(--font-mono); color:#10b981;">${Math.round(s.rewardUsdt).toLocaleString()}</td>
            <td style="font-family:var(--font-mono); font-weight:700;">${Math.round(s.totalUsdt).toLocaleString()}</td>
            <td>${badge}</td>
            <td style="font-size:0.78rem; color:var(--text-muted);">${new Date(s.maturityDate).toLocaleDateString('ja-JP')}</td>
        </tr>`;
    }).join('');
}

function updateAdminStakingStats() {
    const stakes = JSON.parse(localStorage.getItem(ADMIN_STAKES_KEY) || '[]');
    const tvl = stakes.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.amountEth || 0), 0);
    const totalRewards = stakes.reduce((sum, s) => sum + (s.totalUsdt || 0), 0);
    const stakerCount = new Set(stakes.map(s => s.wallet)).size;

    setText('aStkTVL', tvl.toFixed(3));
    setText('aStkRewards', Math.round(totalRewards).toLocaleString());
    setText('aStkCount', stakes.length);
    setText('aStkStakers', stakerCount);
    updateStakingBadge();
}

function updateStakingBadge() {
    const stakes = JSON.parse(localStorage.getItem(ADMIN_STAKES_KEY) || '[]');
    setText('badgeStakingCount', stakes.length);
}

function aprColor(apr) {
    return { 18: '#06b6d4', 24: '#a855f7', 30: '#ec4899', 36: '#f59e0b' }[apr] || '#94a3b8';
}

