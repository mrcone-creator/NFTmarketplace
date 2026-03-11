/* =============================================
   NFT MARKETPLACE — app.js
   User-facing: wallet connection, NFT display,
   purchase flow, collection management
   ============================================= */

'use strict';

// ──────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────
const CONFIG = {
    ETH_TO_JPY: 400000,   // 1 ETH ≈ ¥400,000 (demo rate)
    TX_SIMULATE_MS: 3000, // Simulated transaction time
    STORAGE_KEY_WALLET: 'nftm_wallet',
    STORAGE_KEY_OWNED: 'nftm_owned',
    STORAGE_KEY_ACTIVITY: 'nftm_activity',
    STORAGE_KEY_LIKES: 'nftm_likes',
    ADMIN_NFTS_KEY: 'nftm_admin_nfts',
};

// ──────────────────────────────────────────
// STATE
// ──────────────────────────────────────────
let state = {
    wallet: null,
    walletType: null,
    allNFTs: [],
    filteredNFTs: [],
    activeCategory: 'all',
    activeSort: 'newest',
    selectedNFT: null,
    ownedNFTs: [],
    activityLog: [],
    likedNFTs: [],
    isPurchasing: false,
};

// ──────────────────────────────────────────
// DEFAULT NFT DATA (demo NFTs)
// ──────────────────────────────────────────
const DEFAULT_NFTS = [
    {
        id: 'nft-001',
        name: 'Cosmic Genesis #001',
        emoji: '🌌',
        bgClass: 'nft-bg-5',
        category: 'art',
        price: 0.85,
        description: '宇宙の誕生を表現した幻想的なデジタルアート。無限の可能性と創造のエネルギーを閉じ込めた唯一無二の作品。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Legendary' },
            { type: 'Edition', value: '#001 / 001' },
            { type: 'Chain', value: 'Ethereum' },
            { type: 'Style', value: 'Cosmic' },
        ],
        likes: 248,
        featured: true,
        createdAt: '2026-03-01',
    },
    {
        id: 'nft-002',
        name: 'Neural Dreams #007',
        emoji: '🧠',
        bgClass: 'nft-bg-9',
        category: 'art',
        price: 0.32,
        description: 'AIと人間の意識が融合した次世代デジタルアート。ニューラルネットワークの美しさを視覚化した作品。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Epic' },
            { type: 'Edition', value: '#007 / 100' },
            { type: 'Chain', value: 'Ethereum' },
            { type: 'Style', value: 'Cyberpunk' },
        ],
        likes: 134,
        featured: false,
        createdAt: '2026-03-02',
    },
    {
        id: 'nft-003',
        name: 'Ocean Protocol #003',
        emoji: '🌊',
        bgClass: 'nft-bg-4',
        category: 'art',
        price: 0.18,
        description: '深海の神秘と生命のエネルギーを表現したアート。変化し続ける海原の美しさを永遠に閉じ込めた作品。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Rare' },
            { type: 'Edition', value: '#003 / 500' },
            { type: 'Chain', value: 'Ethereum' },
            { type: 'Style', value: 'Nature' },
        ],
        likes: 89,
        featured: false,
        createdAt: '2026-03-02',
    },
    {
        id: 'nft-004',
        name: 'Dragon Warrior #012',
        emoji: '🐉',
        bgClass: 'nft-bg-7',
        category: 'collectible',
        price: 0.55,
        description: '伝説のドラゴン戦士コレクション。古代の魔力を宿した12体限定のプレミアムコレクタブル。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Epic' },
            { type: 'Edition', value: '#012 / 100' },
            { type: 'Chain', value: 'Ethereum' },
            { type: 'Power', value: '9500' },
        ],
        likes: 201,
        featured: false,
        createdAt: '2026-03-03',
    },
    {
        id: 'nft-005',
        name: 'Crystal Phoenix #001',
        emoji: '🔮',
        bgClass: 'nft-bg-3',
        category: 'collectible',
        price: 1.2,
        description: '不死鳥の魂を閉じ込めたクリスタル。再生と光をテーマにした最高位コレクタブル。全世界1体限定。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Mythic' },
            { type: 'Edition', value: '#001 / 001' },
            { type: 'Chain', value: 'Ethereum' },
            { type: 'Power', value: 'MAX' },
        ],
        likes: 432,
        featured: false,
        createdAt: '2026-03-03',
    },
    {
        id: 'nft-006',
        name: 'Synthwave Beat #042',
        emoji: '🎵',
        bgClass: 'nft-bg-2',
        category: 'music',
        price: 0.12,
        description: '80年代シンセウェイブの魂を現代に蘇らせたオリジナル楽曲NFT。所有者限定の音楽体験。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Uncommon' },
            { type: 'Edition', value: '#042 / 1000' },
            { type: 'Length', value: '3:42' },
            { type: 'Genre', value: 'Synthwave' },
        ],
        likes: 67,
        featured: false,
        createdAt: '2026-03-04',
    },
    {
        id: 'nft-007',
        name: 'Pixel Sword #099',
        emoji: '⚔️',
        bgClass: 'nft-bg-6',
        category: 'gaming',
        price: 0.08,
        description: '伝説のゲームアイテムNFT。メタバース内で実際に使用可能な究極の剣。レベルキャップ解除付き。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Rare' },
            { type: 'ATK', value: '+999' },
            { type: 'Type', value: 'Weapon' },
            { type: 'Game Ready', value: 'Yes' },
        ],
        likes: 156,
        featured: false,
        createdAt: '2026-03-04',
    },
    {
        id: 'nft-008',
        name: 'Galaxy Cat #888',
        emoji: '😸',
        bgClass: 'nft-bg-1',
        category: 'collectible',
        price: 0.25,
        description: '銀河を旅する謎の宇宙猫コレクション。888体限定のジェネラティブNFT。各猫は唯一無二の特徴を持つ。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Rare' },
            { type: 'Edition', value: '#888 / 888' },
            { type: 'Hat', value: 'Space Helmet' },
            { type: 'Eyes', value: 'Cyber' },
        ],
        likes: 178,
        featured: false,
        createdAt: '2026-03-05',
    },
    {
        id: 'nft-009',
        name: 'Neon Forest #014',
        emoji: '🌳',
        bgClass: 'nft-bg-10',
        category: 'art',
        price: 0.22,
        description: 'サイバーパンク都市の中に残る自然の聖域。ネオンの光と緑の命が共存する幻想的な風景画。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Uncommon' },
            { type: 'Edition', value: '#014 / 200' },
            { type: 'Setting', value: 'Cyberpunk' },
            { type: 'Resolution', value: '8K' },
        ],
        likes: 93,
        featured: false,
        createdAt: '2026-03-06',
    },
    {
        id: 'nft-010',
        name: 'Sound Wave #021',
        emoji: '🎹',
        bgClass: 'nft-bg-8',
        category: 'music',
        price: 0.38,
        description: 'クラシックとエレクトロニックの融合。AIが生成したハーモニーに人間のメロディが乗る革新的な音楽NFT。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Epic' },
            { type: 'Edition', value: '#021 / 50' },
            { type: 'Length', value: '5:17' },
            { type: 'Genre', value: 'Classical/EDM' },
        ],
        likes: 112,
        featured: false,
        createdAt: '2026-03-06',
    },
    {
        id: 'nft-011',
        name: 'Mech Titan #003',
        emoji: '🤖',
        bgClass: 'nft-bg-2',
        category: 'gaming',
        price: 0.65,
        description: '最強のメカコレクション第3弾。完全カスタマイズ可能なメタバース用巨大ロボット。限定シリアル入り。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Legendary' },
            { type: 'DEF', value: '+5000' },
            { type: 'Type', value: 'Mech' },
            { type: 'Skill', value: 'Titan Blast' },
        ],
        likes: 265,
        featured: false,
        createdAt: '2026-03-07',
    },
    {
        id: 'nft-012',
        name: 'Astral Temple #002',
        emoji: '🏛️',
        bgClass: 'nft-bg-6',
        category: 'art',
        price: 0.44,
        description: '古代文明と星の神殿が融合した神秘的アート。時空を超えた巡礼者たちの聖地を描いた壮大な作品。',
        creator: 'NFT Marketplace Official',
        properties: [
            { type: 'Rarity', value: 'Epic' },
            { type: 'Edition', value: '#002 / 30' },
            { type: 'Era', value: 'Timeless' },
            { type: 'Dimension', value: '3D' },
        ],
        likes: 147,
        featured: false,
        createdAt: '2026-03-08',
    },
];

// ──────────────────────────────────────────
// INITIALIZE
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    mergeAdminNFTs();
    renderNFTs();
    setupFeaturedNFT();
    updateStats();
    setupScrollEffect();
    setupActivePage();
    animateCounters();
});

function loadFromStorage() {
    const savedWallet = localStorage.getItem(CONFIG.STORAGE_KEY_WALLET);
    if (savedWallet) {
        const walletData = JSON.parse(savedWallet);
        state.wallet = walletData.address;
        state.walletType = walletData.type;
        updateWalletUI();
    }

    const savedOwned = localStorage.getItem(CONFIG.STORAGE_KEY_OWNED);
    state.ownedNFTs = savedOwned ? JSON.parse(savedOwned) : [];

    const savedActivity = localStorage.getItem(CONFIG.STORAGE_KEY_ACTIVITY);
    state.activityLog = savedActivity ? JSON.parse(savedActivity) : [];

    const savedLikes = localStorage.getItem(CONFIG.STORAGE_KEY_LIKES);
    state.likedNFTs = savedLikes ? JSON.parse(savedLikes) : [];
}

function mergeAdminNFTs() {
    // Load NFTs published by admin
    const adminNFTs = JSON.parse(localStorage.getItem(CONFIG.ADMIN_NFTS_KEY) || '[]');
    const publishedAdminNFTs = adminNFTs
        .filter(n => n.status === 'published')
        .map(n => ({
            id: n.id,
            name: n.name,
            emoji: n.emoji || '🎨',
            bgClass: n.bgClass || 'nft-bg-1',
            category: n.category || 'art',
            price: parseFloat(n.price) || 0,
            description: n.description || '',
            creator: 'NFT Marketplace Official',
            properties: n.properties || [],
            likes: n.likes || 0,
            featured: n.featured || false,
            createdAt: n.createdAt || new Date().toISOString().slice(0, 10),
        }));

    // Merge: admin NFTs first (most recent), then defaults
    const adminIds = new Set(publishedAdminNFTs.map(n => n.id));
    const filteredDefaults = DEFAULT_NFTS.filter(n => !adminIds.has(n.id));
    state.allNFTs = [...publishedAdminNFTs, ...filteredDefaults];
    state.filteredNFTs = [...state.allNFTs];
}

// ──────────────────────────────────────────
// FEATURED NFT
// ──────────────────────────────────────────
function setupFeaturedNFT() {
    const featured = state.allNFTs.find(n => n.featured) || state.allNFTs[0];
    if (!featured) return;

    const imgEl = document.getElementById('featuredNFTImg');
    const emojiEl = document.getElementById('featuredNFTEmoji');
    const nameEl = document.getElementById('featuredNFTName');
    const creatorEl = document.getElementById('featuredNFTCreator');
    const priceEl = document.getElementById('featuredNFTPrice');
    const priceUsdEl = document.getElementById('featuredNFTPriceUSD');

    if (imgEl) { imgEl.className = `featured-nft-img ${featured.bgClass}`; }
    if (emojiEl) emojiEl.textContent = featured.emoji;
    if (nameEl) nameEl.textContent = featured.name;
    if (creatorEl) creatorEl.textContent = `by ${featured.creator}`;
    if (priceEl) priceEl.textContent = `${featured.price.toFixed(2)} ETH`;
    if (priceUsdEl) priceUsdEl.textContent = `≈ ¥ ${Math.round(featured.price * CONFIG.ETH_TO_JPY).toLocaleString()}`;

    // store for hero click
    window._featuredNFT = featured;
}

function openFeaturedNFT() {
    if (window._featuredNFT) openNFTModal(window._featuredNFT);
}

// ──────────────────────────────────────────
// STATS ANIMATION
// ──────────────────────────────────────────
function updateStats() {
    const nftCount = state.allNFTs.length;
    const userCount = Math.max(state.ownedNFTs.length > 0 ? 1 : 0, 128);
    document.getElementById('stat-nfts').dataset.target = nftCount;
    document.getElementById('stat-users').dataset.target = userCount;
}

function animateCounters() {
    const counters = document.querySelectorAll('[data-target]');
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target, 10);
        const duration = 1500;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            counter.textContent = Math.round(current).toLocaleString();
            if (current >= target) clearInterval(timer);
        }, 16);
    });
}

// ──────────────────────────────────────────
// NFT RENDERING
// ──────────────────────────────────────────
function renderNFTs(nfts = state.filteredNFTs) {
    const grid = document.getElementById('nftGrid');
    const empty = document.getElementById('emptyState');
    if (!grid) return;

    if (nfts.length === 0) {
        grid.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    empty?.classList.add('hidden');

    grid.innerHTML = nfts.map(nft => createNFTCardHTML(nft)).join('');

    // Attach click events
    grid.querySelectorAll('.nft-card[data-id]').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.nft-like-btn')) return;
            const id = card.dataset.id;
            const nft = state.allNFTs.find(n => n.id === id);
            if (nft) openNFTModal(nft);
        });
    });

    grid.querySelectorAll('.nft-like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            toggleLike(id, btn);
        });
    });
}

function createNFTCardHTML(nft) {
    const isOwned = state.ownedNFTs.includes(nft.id);
    const isLiked = state.likedNFTs.includes(nft.id);
    const priceJPY = Math.round(nft.price * CONFIG.ETH_TO_JPY).toLocaleString();
    const rarityColors = {
        Mythic: '#ec4899',
        Legendary: '#f59e0b',
        Epic: '#a855f7',
        Rare: '#06b6d4',
        Uncommon: '#10b981',
        Common: '#94a3b8',
    };
    const rarity = nft.properties?.find(p => p.type === 'Rarity')?.value || 'Common';
    const rarityColor = rarityColors[rarity] || '#94a3b8';

    return `
    <div class="nft-card" role="listitem" data-id="${nft.id}" tabindex="0"
         onkeydown="if(event.key==='Enter')this.click()">
      <div class="nft-card-img ${nft.bgClass}">
        <span class="nft-emoji">${nft.emoji}</span>
        <div class="nft-category-badge" style="color:${rarityColor}; border-color:${rarityColor}40;">
          ${rarity}
        </div>
        <button class="nft-like-btn ${isLiked ? 'liked' : ''}" data-id="${nft.id}" aria-label="お気に入り" title="お気に入り">
          ${isLiked ? '❤️' : '🤍'}
        </button>
        <div class="nft-card-overlay">
          <button class="btn btn-primary btn-sm" style="pointer-events:all;">
            ${isOwned ? '✅ 所有中' : '💎 詳細を見る'}
          </button>
        </div>
      </div>
      <div class="nft-card-body">
        <div class="nft-card-name" title="${nft.name}">${nft.name}</div>
        <div class="nft-card-creator">by ${nft.creator}</div>
        <div class="nft-card-footer">
          <div class="nft-price-block">
            <div class="price-label">価格</div>
            <div class="nft-price-eth">${nft.price.toFixed(3)} ETH</div>
            <div class="nft-price-usd">¥ ${priceJPY}</div>
          </div>
          ${isOwned
            ? '<span style="font-size:0.75rem; color:var(--accent-green); font-weight:700;">✅ 所有中</span>'
            : `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();quickBuy('${nft.id}')">購入</button>`
        }
        </div>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────
// FILTER & SORT
// ──────────────────────────────────────────
function setCategory(cat, tabEl) {
    state.activeCategory = cat;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
    applyFilters();
}

function filterNFTs() { applyFilters(); }
function sortNFTs() {
    state.activeSort = document.getElementById('sortSelect').value;
    applyFilters();
}

function applyFilters() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
    let results = state.allNFTs.filter(nft => {
        const matchCat = state.activeCategory === 'all' || nft.category === state.activeCategory;
        const matchSearch = !query ||
            nft.name.toLowerCase().includes(query) ||
            nft.description.toLowerCase().includes(query) ||
            nft.category.toLowerCase().includes(query);
        return matchCat && matchSearch;
    });

    // Sort
    switch (state.activeSort) {
        case 'price-asc': results.sort((a, b) => a.price - b.price); break;
        case 'price-desc': results.sort((a, b) => b.price - a.price); break;
        case 'popular': results.sort((a, b) => b.likes - a.likes); break;
        case 'newest':
        default:
            results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    }

    state.filteredNFTs = results;
    renderNFTs(results);
}

// ──────────────────────────────────────────
// LIKES
// ──────────────────────────────────────────
function toggleLike(nftId, btn) {
    const idx = state.likedNFTs.indexOf(nftId);
    if (idx === -1) {
        state.likedNFTs.push(nftId);
        btn.classList.add('liked');
        btn.textContent = '❤️';
    } else {
        state.likedNFTs.splice(idx, 1);
        btn.classList.remove('liked');
        btn.textContent = '🤍';
    }
    localStorage.setItem(CONFIG.STORAGE_KEY_LIKES, JSON.stringify(state.likedNFTs));
}

// ──────────────────────────────────────────
// NFT DETAIL MODAL
// ──────────────────────────────────────────
function openNFTModal(nft) {
    state.selectedNFT = nft;
    const modal = document.getElementById('nftModal');
    const isOwned = state.ownedNFTs.includes(nft.id);
    const priceJPY = Math.round(nft.price * CONFIG.ETH_TO_JPY).toLocaleString();

    // Set content
    document.getElementById('modalImgSide').className = `modal-img-side ${nft.bgClass}`;
    document.getElementById('modalEmoji').textContent = nft.emoji;
    document.getElementById('modalNFTName').textContent = nft.name;
    document.getElementById('modalNFTCreator').textContent = `by ${nft.creator}`;
    document.getElementById('modalPriceETH').textContent = `${nft.price.toFixed(4)} ETH`;
    document.getElementById('modalPriceUSD').textContent = `≈ ¥ ${priceJPY}`;
    document.getElementById('modalDescription').textContent = nft.description;

    // Properties
    const propsEl = document.getElementById('modalProperties');
    if (propsEl && nft.properties) {
        propsEl.innerHTML = nft.properties.map(p => `
      <div class="property-chip">
        <div class="prop-type">${p.type}</div>
        <div class="prop-value">${p.value}</div>
      </div>
    `).join('');
    }

    // Buy button state
    const buyBtn = document.getElementById('modalBuyBtn');
    const buyBtnText = document.getElementById('buyBtnText');
    const statusMsg = document.getElementById('buyStatusMsg');
    if (isOwned) {
        buyBtn.disabled = true;
        buyBtnText.textContent = '✅ 所有済み';
        if (statusMsg) statusMsg.textContent = 'このNFTはすでに所有しています';
    } else if (!state.wallet) {
        buyBtn.disabled = false;
        buyBtnText.textContent = '🦊 ウォレットを接続して購入';
        if (statusMsg) statusMsg.textContent = 'ウォレット接続が必要です';
    } else {
        buyBtn.disabled = false;
        buyBtnText.textContent = `💎 ${nft.price.toFixed(4)} ETH で購入`;
        if (statusMsg) statusMsg.textContent = '';
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeNFTModal() {
    document.getElementById('nftModal').classList.remove('open');
    document.body.style.overflow = '';
    state.selectedNFT = null;
}

function closeModal(e) {
    if (e.target === document.getElementById('nftModal')) closeNFTModal();
}

// Quick buy from card button
function quickBuy(nftId) {
    const nft = state.allNFTs.find(n => n.id === nftId);
    if (nft) {
        openNFTModal(nft);
        // if wallet already connected, directly show purchase
        if (state.wallet) {
            setTimeout(() => buyNFT(), 100);
        }
    }
}

// ──────────────────────────────────────────
// WALLET CONNECTION
// ──────────────────────────────────────────
function openWalletModal() {
    if (state.wallet) {
        // Already connected → show disconnect option
        showDisconnectToast();
        return;
    }
    document.getElementById('walletModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeWalletModal(e) {
    const modal = document.getElementById('walletModal');
    if (!e || e.target === modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

async function connectWallet(type) {
    closeWalletModal();

    // Show connecting state
    showToast('info', '🔄', `${getWalletName(type)} に接続中...`);

    try {
        let address;

        if (type === 'metamask') {
            if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
                // Real MetaMask connection
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                address = accounts[0];
            } else {
                // Simulate for demo
                address = await simulateWalletConnect(type);
            }
        } else {
            // Simulate other wallets
            address = await simulateWalletConnect(type);
        }

        state.wallet = address;
        state.walletType = type;

        localStorage.setItem(CONFIG.STORAGE_KEY_WALLET, JSON.stringify({ address, type }));
        updateWalletUI();
        renderNFTs();
        showToast('success', '✅', `ウォレット接続完了！ ${shortAddr(address)}`);

        // Also update NFT modal if open
        if (state.selectedNFT) {
            openNFTModal(state.selectedNFT);
        }

    } catch (err) {
        showToast('error', '❌', `接続失敗: ${err.message || 'エラーが発生しました'}`);
    }
}

function simulateWalletConnect(type) {
    return new Promise(resolve => {
        setTimeout(() => {
            // Generate a fake Ethereum address for demo
            const hex = () => Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
            const addr = `0x${hex()}${hex()}${hex()}${hex()}${hex()}`;
            resolve(addr);
        }, 1200);
    });
}

function disconnectWallet() {
    state.wallet = null;
    state.walletType = null;
    localStorage.removeItem(CONFIG.STORAGE_KEY_WALLET);
    updateWalletUI();
    renderNFTs();
    showPage('marketplace');
    showToast('info', '🔌', 'ウォレットを切断しました');
}

function updateWalletUI() {
    const btn = document.getElementById('connectWalletBtn');
    const textEl = document.getElementById('walletBtnText');
    if (!btn) return;

    if (state.wallet) {
        btn.classList.add('connected');
        const dot = btn.querySelector('.wallet-dot') || (() => {
            const d = document.createElement('span');
            d.className = 'wallet-dot';
            btn.prepend(d);
            return d;
        })();
        textEl.textContent = shortAddr(state.wallet);
    } else {
        btn.classList.remove('connected');
        const dot = btn.querySelector('.wallet-dot');
        if (dot) dot.remove();
        textEl.textContent = 'ウォレット接続';
    }
}

function showDisconnectToast() {
    showToast('info', '🦊', `接続中: ${shortAddr(state.wallet)} — <button onclick="disconnectWallet()" style="color:var(--accent-pink); font-weight:700; background:none; border:none; cursor:pointer; margin-left:4px;">切断</button>`, 8000);
}

function getWalletName(type) {
    return { metamask: 'MetaMask', walletconnect: 'WalletConnect', coinbase: 'Coinbase Wallet' }[type] || type;
}

function shortAddr(addr) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

// ──────────────────────────────────────────
// BUY NFT
// ──────────────────────────────────────────
function buyNFT() {
    const nft = state.selectedNFT;
    if (!nft) return;

    if (!state.wallet) {
        closeNFTModal();
        openWalletModal();
        return;
    }

    if (state.ownedNFTs.includes(nft.id)) {
        showToast('info', 'ℹ️', 'このNFTはすでに所有しています');
        return;
    }

    if (state.isPurchasing) return;
    state.isPurchasing = true;

    closeNFTModal();
    openPurchaseModal(nft);
}

function openPurchaseModal(nft) {
    const modal = document.getElementById('purchaseModal');
    document.getElementById('purchaseAnimation').textContent = '⏳';
    document.getElementById('purchaseTitle').textContent = '取引を処理中...';
    document.getElementById('purchaseDesc').textContent =
        `${nft.name} (${nft.price.toFixed(4)} ETH) の購入を処理しています`;
    document.getElementById('purchaseTxHash').style.display = 'none';
    document.getElementById('purchaseCloseBtn').style.display = 'none';

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Simulate blockchain transaction
    let step = 0;
    const steps = [
        { time: 800, icon: '🔄', title: 'トランザクション送信中...', desc: 'ウォレットから取引を送信しています' },
        { time: 1800, icon: '⛓️', title: 'ブロックチェーン確認中...', desc: 'Ethereumネットワークで承認を待っています' },
        { time: 3000, icon: '✅', title: '購入完了！', desc: `${nft.name} があなたのウォレットに届きました` },
    ];

    function runStep() {
        if (step >= steps.length) return;
        const s = steps[step];
        setTimeout(() => {
            document.getElementById('purchaseAnimation').textContent = s.icon;
            document.getElementById('purchaseTitle').textContent = s.title;
            document.getElementById('purchaseDesc').textContent = s.desc;
            if (step === steps.length - 1) {
                finalizePurchase(nft);
            } else {
                step++;
                runStep();
            }
        }, step === 0 ? 0 : steps[step - 1].time);
        step++;
    }
    runStep();
}

function finalizePurchase(nft) {
    // Add to owned
    if (!state.ownedNFTs.includes(nft.id)) {
        state.ownedNFTs.push(nft.id);
        localStorage.setItem(CONFIG.STORAGE_KEY_OWNED, JSON.stringify(state.ownedNFTs));
    }

    // Generate fake tx hash
    const txHash = '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)).join('');

    // Add to activity log
    const activity = {
        id: crypto.randomUUID?.() || Date.now().toString(),
        type: 'purchase',
        nftId: nft.id,
        nftName: nft.name,
        nftEmoji: nft.emoji,
        price: nft.price,
        buyer: state.wallet,
        txHash,
        timestamp: new Date().toISOString(),
    };
    state.activityLog.unshift(activity);
    localStorage.setItem(CONFIG.STORAGE_KEY_ACTIVITY, JSON.stringify(state.activityLog));

    // Update TX Hash display
    const txEl = document.getElementById('purchaseTxHash');
    txEl.textContent = `TX: ${txHash.slice(0, 30)}...`;
    txEl.style.display = 'block';
    document.getElementById('purchaseCloseBtn').style.display = 'inline-flex';

    state.isPurchasing = false;
    renderNFTs();
    showToast('success', '🎉', `${nft.name} の購入が完了しました！`);
}

function closePurchaseModal(e) {
    const modal = document.getElementById('purchaseModal');
    if (!e || e.target === modal || !e.target.closest) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// ──────────────────────────────────────────
// MY COLLECTION PAGE
// ──────────────────────────────────────────
function renderCollection() {
    const grid = document.getElementById('collectionGrid');
    const empty = document.getElementById('collectionEmpty');
    const noWallet = document.getElementById('collectionNoWallet');

    if (!state.wallet) {
        noWallet?.classList.remove('hidden');
        empty?.classList.add('hidden');
        if (grid) grid.innerHTML = '';
        return;
    }
    noWallet?.classList.add('hidden');

    const ownedNFTObjects = state.ownedNFTs
        .map(id => state.allNFTs.find(n => n.id === id))
        .filter(Boolean);

    if (ownedNFTObjects.length === 0) {
        empty?.classList.remove('hidden');
        if (grid) grid.innerHTML = '';
        return;
    }
    empty?.classList.add('hidden');
    if (grid) grid.innerHTML = ownedNFTObjects.map(nft => createNFTCardHTML(nft)).join('');

    grid?.querySelectorAll('.nft-card[data-id]').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.nft-like-btn')) return;
            const id = card.dataset.id;
            const nft = state.allNFTs.find(n => n.id === id);
            if (nft) openNFTModal(nft);
        });
    });
}

// ──────────────────────────────────────────
// ACTIVITY PAGE
// ──────────────────────────────────────────
function renderActivity() {
    const list = document.getElementById('activityList');
    if (!list) return;

    // Combine with demo activity
    const demoActivity = [
        { nftEmoji: '🌌', nftName: 'Cosmic Genesis #001', price: 0.85, type: 'sale', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { nftEmoji: '🐉', nftName: 'Dragon Warrior #012', price: 0.55, type: 'sale', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { nftEmoji: '🔮', nftName: 'Crystal Phoenix #001', price: 1.2, type: 'list', timestamp: new Date(Date.now() - 14400000).toISOString() },
        { nftEmoji: '🤖', nftName: 'Mech Titan #003', price: 0.65, type: 'sale', timestamp: new Date(Date.now() - 28800000).toISOString() },
    ];

    const combined = [...state.activityLog, ...demoActivity]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (combined.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-title">アクティビティはありません</div></div>';
        return;
    }

    list.innerHTML = combined.map(item => {
        const typeLabel = item.type === 'purchase' ? '購入' : item.type === 'list' ? '出品' : '販売';
        const typeIcon = item.type === 'purchase' ? '💳' : item.type === 'list' ? '🏷️' : '💰';
        const timeAgo = getTimeAgo(new Date(item.timestamp));
        return `
      <div class="activity-row">
        <div class="activity-emoji">${item.nftEmoji}</div>
        <div class="activity-details">
          <div class="activity-name">${item.nftName}</div>
          <div class="activity-meta">${typeIcon} ${typeLabel}</div>
        </div>
        <div class="activity-price"><span class="text-gradient">${item.price.toFixed(3)} ETH</span></div>
        <div class="activity-time">${timeAgo}</div>
      </div>
    `;
    }).join('');
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

// ──────────────────────────────────────────
// PAGE NAVIGATION
// ──────────────────────────────────────────
function showPage(page) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const el = document.getElementById(`page-${page}`);
    const nav = document.getElementById(`nav-${page}`);
    if (el) el.classList.add('active');
    if (nav) nav.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'collection') renderCollection();
    if (page === 'activity') renderActivity();
    if (page === 'staking') initStakingPage();
}

function setupActivePage() {
    // Listen for hash changes
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.replace('#', '') || 'marketplace';
        showPage(hash);
    });
}

// ──────────────────────────────────────────
// SCROLL EFFECT
// ──────────────────────────────────────────
function setupScrollEffect() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar?.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
}

// ──────────────────────────────────────────
// TOAST NOTIFICATIONS
// ──────────────────────────────────────────
function showToast(type, icon, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

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
        closeNFTModal();
        closeWalletModal();
        closePurchaseModal();
    }
});

// ══════════════════════════════════════════════════════
//  STAKING SYSTEM
// ══════════════════════════════════════════════════════

/* ── Constants ── */
const STAKING_CONFIG = {
    ETH_TO_USDT: 3000,          // demo rate
    STORAGE_KEY: 'nftm_stakes',
    CONFIG_KEY: 'nftm_staking_config',
};

const DEFAULT_APR_TIERS = [
    { apr: 18, label: 'ベーシック', icon: '🔵', minAmount: 0.1, color: '#06b6d4' },
    { apr: 24, label: 'スタンダード', icon: '🟣', minAmount: 0.5, color: '#a855f7' },
    { apr: 30, label: 'プレミアム', icon: '🩷', minAmount: 1.0, color: '#ec4899' },
    { apr: 36, label: 'VIP', icon: '⭐', minAmount: 2.0, color: '#f59e0b' },
];

const DEFAULT_PERIODS = [
    { months: 6, label: '半年' },
    { months: 12, label: '1年' },
    { months: 24, label: '2年' },
    { months: 36, label: '3年' },
    { months: 60, label: '5年' },
];

/* ── State ── */
let staking = {
    selectedAPR: null,   // number
    selectedMonths: null,   // number
    stakes: [],     // array of stake objects
    adminConfig: null,   // loaded from localStorage
};

/* ── Initialize staking when page is shown ── */
function initStakingPage() {
    loadStakingData();
    renderAPRTiers();
    renderPeriodSelector();
    renderMyStakes();
    updateStakingStats();
    updateStakeCalc();
}

function loadStakingData() {
    staking.stakes = JSON.parse(localStorage.getItem(STAKING_CONFIG.STORAGE_KEY) || '[]');
    staking.adminConfig = JSON.parse(localStorage.getItem(STAKING_CONFIG.CONFIG_KEY) || 'null');
}

function saveStakingData() {
    localStorage.setItem(STAKING_CONFIG.STORAGE_KEY, JSON.stringify(staking.stakes));
}

/* ── APR Tiers ── */
function getAprTiers() {
    if (staking.adminConfig?.aprTiers) {
        return staking.adminConfig.aprTiers.filter(t => t.enabled !== false);
    }
    return DEFAULT_APR_TIERS;
}

function getPeriods() {
    if (staking.adminConfig?.periods) {
        return staking.adminConfig.periods.filter(p => p.enabled !== false);
    }
    return DEFAULT_PERIODS;
}

function getEthToUsdt() {
    return staking.adminConfig?.ethToUsdt || STAKING_CONFIG.ETH_TO_USDT;
}

function renderAPRTiers() {
    const grid = document.getElementById('aprTiersGrid');
    if (!grid) return;

    const tiers = getAprTiers();

    grid.innerHTML = tiers.map(tier => `
        <div class="apr-tier-card ${staking.selectedAPR === tier.apr ? 'selected' : ''}"
             data-apr="${tier.apr}"
             onclick="selectAPR(${tier.apr})"
             role="button" tabindex="0"
             onkeydown="if(event.key==='Enter'||event.key===' ')selectAPR(${tier.apr})"
             aria-label="${tier.label} ${tier.apr}% APR">
            <span class="apr-tier-check">✓</span>
            <div class="apr-tier-icon">${tier.icon}</div>
            <div class="apr-tier-value">${tier.apr}%</div>
            <div class="apr-tier-apr-label">APR</div>
            <div class="apr-tier-name">${tier.label}</div>
            <div class="apr-tier-min">最小 ${tier.minAmount} ETH</div>
        </div>
    `).join('');
}

function selectAPR(aprValue) {
    staking.selectedAPR = aprValue;
    renderAPRTiers();   // re-render to update selected state
    const tier = getAprTiers().find(t => t.apr === aprValue);
    const selEl = document.getElementById('sSelAPR');
    if (selEl) selEl.textContent = `APR: ${aprValue}% (${tier?.label || ''})`;
    updateStakeCalc();
}

/* ── Period Selector ── */
function renderPeriodSelector() {
    const container = document.getElementById('periodSelector');
    if (!container) return;

    const periods = getPeriods();

    container.innerHTML = periods.map(p => `
        <button class="period-btn ${staking.selectedMonths === p.months ? 'active' : ''}"
                onclick="selectPeriod(${p.months}, '${p.label}')"
                aria-label="${p.label}">${p.label}</button>
    `).join('');
}

function selectPeriod(months, label) {
    staking.selectedMonths = months;
    renderPeriodSelector();
    const selEl = document.getElementById('sSelPeriod');
    if (selEl) selEl.textContent = `期間: ${label}`;
    updateStakeCalc();
}

/* ── Calculator ── */
function updateStakeCalc() {
    const ethRate = getEthToUsdt();
    const amountRaw = parseFloat(document.getElementById('stakeAmountInput')?.value) || 0;
    const apr = staking.selectedAPR;
    const months = staking.selectedMonths;
    const tier = getAprTiers().find(t => t.apr === apr);
    const minAmt = tier?.minAmount || 0;

    // Min amount warning
    const warnEl = document.getElementById('stakeMinWarning');
    const minSpan = document.getElementById('stakeMinAmt');
    if (warnEl && minSpan) {
        if (amountRaw > 0 && amountRaw < minAmt) {
            minSpan.textContent = minAmt;
            warnEl.style.display = 'block';
        } else {
            warnEl.style.display = 'none';
        }
    }

    // Calculations
    const principalUsdt = amountRaw * ethRate;
    const years = (months || 0) / 12;
    const rewardUsdt = principalUsdt * ((apr || 0) / 100) * years;
    const totalUsdt = principalUsdt + rewardUsdt;

    // Maturity date
    let maturityStr = '—';
    if (months) {
        const matDate = new Date();
        matDate.setMonth(matDate.getMonth() + months);
        maturityStr = matDate.toLocaleDateString('ja-JP');
    }

    // Update DOM
    setCalcVal('calcPrincipal', amountRaw > 0 ? fmtUsdt(principalUsdt) : '—');
    setCalcVal('calcAPR', apr ? `${apr}%` : '—');
    setCalcVal('calcPeriod', months ? getPeriods().find(p => p.months === months)?.label || '—' : '—');
    setCalcVal('calcReward', (amountRaw > 0 && apr && months) ? fmtUsdt(rewardUsdt) : '—');
    setCalcVal('calcTotal', (amountRaw > 0 && apr && months) ? fmtUsdt(totalUsdt) : '—');
    setCalcVal('calcMaturity', maturityStr);

    // Button state
    const btn = document.getElementById('submitStakeBtn');
    const hint = document.getElementById('stakeSubmitHint');
    const isValid = amountRaw >= minAmt && amountRaw > 0 && apr && months && state.wallet;
    if (btn) btn.disabled = !isValid;
    if (hint) {
        if (!state.wallet) hint.textContent = 'ウォレット接続が必要です';
        else if (!apr) hint.textContent = 'APRプランを選択してください';
        else if (!months) hint.textContent = '期間を選択してください';
        else if (amountRaw <= 0) hint.textContent = 'ステーキング額を入力してください';
        else if (amountRaw < minAmt) hint.textContent = `最小額は ${minAmt} ETH です`;
        else hint.textContent = `満期日: ${maturityStr}`;
    }
}

function setCalcVal(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function fmtUsdt(val) {
    return `${Math.round(val).toLocaleString()} USDT`;
}

/* ── Submit Stake ── */
function submitStake() {
    if (!state.wallet) { openWalletModal(); return; }

    const amountEth = parseFloat(document.getElementById('stakeAmountInput')?.value);
    const apr = staking.selectedAPR;
    const months = staking.selectedMonths;
    const tier = getAprTiers().find(t => t.apr === apr);
    const ethRate = getEthToUsdt();

    if (!amountEth || !apr || !months || amountEth < (tier?.minAmount || 0)) return;

    const btn = document.getElementById('submitStakeBtn');
    const btnText = document.getElementById('submitStakeText');
    btn.disabled = true;
    btnText.textContent = '⏳ 処理中...';

    setTimeout(() => {
        const now = new Date();
        const matDate = new Date(now);
        matDate.setMonth(matDate.getMonth() + months);

        const principalUsdt = amountEth * ethRate;
        const years = months / 12;
        const rewardUsdt = principalUsdt * (apr / 100) * years;
        const totalUsdt = principalUsdt + rewardUsdt;

        const txHash = '0x' + Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)).join('');

        const stake = {
            id: `stake-${Date.now()}`,
            wallet: state.wallet,
            amountEth,
            apr,
            months,
            periodLabel: getPeriods().find(p => p.months === months)?.label || `${months}ヶ月`,
            principalUsdt,
            rewardUsdt,
            totalUsdt,
            startDate: now.toISOString(),
            maturityDate: matDate.toISOString(),
            txHash,
            status: 'active',
        };

        staking.stakes.unshift(stake);
        saveStakingData();

        btn.disabled = false;
        btnText.textContent = '💰 ステーキングする';

        // Reset form
        document.getElementById('stakeAmountInput').value = '';
        staking.selectedAPR = null;
        staking.selectedMonths = null;
        renderAPRTiers();
        renderPeriodSelector();
        document.getElementById('sSelAPR').textContent = 'APR: 未選択';
        document.getElementById('sSelPeriod').textContent = '期間: 未選択';
        updateStakeCalc();
        renderMyStakes();
        updateStakingStats();

        showToast('success', '🎉', `ステーキング完了！満期に ${fmtUsdt(totalUsdt)} を受け取ります`);

        // Scroll to my stakes
        document.getElementById('myStakesList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 2000);
}

/* ── My Stakes ── */
function renderMyStakes() {
    const list = document.getElementById('myStakesList');
    const empty = document.getElementById('myStakesEmpty');
    const noWallet = document.getElementById('myStakesNoWallet');
    if (!list) return;

    if (!state.wallet) {
        list.innerHTML = '';
        empty?.classList.add('hidden');
        noWallet?.classList.remove('hidden');
        return;
    }

    noWallet?.classList.add('hidden');

    const myStakes = staking.stakes.filter(s => s.wallet === state.wallet);

    if (myStakes.length === 0) {
        list.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    empty?.classList.add('hidden');

    const now = Date.now();

    list.innerHTML = myStakes.map(stake => {
        const start = new Date(stake.startDate).getTime();
        const end = new Date(stake.maturityDate).getTime();
        const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        const matured = now >= end;
        const isClaimed = stake.status === 'claimed';

        let statusClass, statusLabel;
        if (isClaimed) { statusClass = 'stake-status-claimed'; statusLabel = '✅ 受取済み'; }
        else if (matured) { statusClass = 'stake-status-matured'; statusLabel = '🏆 満期'; }
        else { statusClass = 'stake-status-active'; statusLabel = '🟢 運用中'; }

        const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
        const matDateStr = new Date(stake.maturityDate).toLocaleDateString('ja-JP');

        return `
        <div class="stake-card" data-apr="${stake.apr}" data-id="${stake.id}">
            <div class="stake-apr-badge">
                <div class="sab-num">${stake.apr}%</div>
                <div class="sab-txt">APR</div>
            </div>
            <div class="stake-info">
                <div class="stake-info-title">${parseFloat(stake.amountEth).toFixed(3)} ETH ステーキング — ${stake.periodLabel}</div>
                <div class="stake-info-meta">
                    <span>📅 ${new Date(stake.startDate).toLocaleDateString('ja-JP')}</span>
                    <span>🏁 満期: ${matDateStr}</span>
                    ${!isClaimed && !matured ? `<span>⏳ 残り ${daysLeft}日</span>` : ''}
                </div>
                <div class="stake-progress-bar">
                    <div class="stake-progress-fill" style="width:${progress}%;"></div>
                </div>
                <span class="stake-status ${statusClass}">${statusLabel}</span>
            </div>
            <div class="stake-rewards">
                <div class="stake-reward-label">受取予定 USDT</div>
                <div class="stake-reward-usdt">${Math.round(stake.totalUsdt).toLocaleString()}</div>
                <div class="stake-reward-sub">報酬 +${Math.round(stake.rewardUsdt).toLocaleString()}</div>
                ${(matured && !isClaimed)
                ? `<button class="btn btn-success btn-sm" style="margin-top:8px; font-size:0.78rem;" onclick="claimStake('${stake.id}')">💰 受取る</button>`
                : ''
            }
            </div>
        </div>
        `;
    }).join('');
}

/* ── Claim Reward ── */
function claimStake(stakeId) {
    const stake = staking.stakes.find(s => s.id === stakeId);
    if (!stake || stake.status === 'claimed') return;

    const btn = document.querySelector(`[data-id="${stakeId}"] button`);
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 処理中...'; }

    setTimeout(() => {
        stake.status = 'claimed';
        stake.claimedAt = new Date().toISOString();
        saveStakingData();
        renderMyStakes();
        updateStakingStats();
        showToast('success', '💰', `${Math.round(stake.totalUsdt).toLocaleString()} USDT を受け取りました！`);
    }, 1500);
}

/* ── Stats ── */
function updateStakingStats() {
    const all = staking.stakes;
    const tvl = all.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.amountEth || 0), 0);
    const totalRewards = all.reduce((sum, s) => sum + (s.totalUsdt || 0), 0);
    const stakerCount = new Set(all.map(s => s.wallet)).size;

    setCalcVal('sTVL', tvl.toFixed(3));
    setCalcVal('sTotalRewards', Math.round(totalRewards).toLocaleString());
    setCalcVal('sStakerCount', stakerCount);
}

