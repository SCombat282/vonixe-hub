// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://awzbaxxqfxtgrpwxdekg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__7upea4Dp9jXS0yNsi77Ug_-5xb5SvV';
let supabaseClient = null;

function getSupabase() {
    if (supabaseClient) return supabaseClient;
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabaseClient;
    }
    return null;
}

let games = [];
let luaLoaderCode = 'loadstring(game:HttpGet("https://vonixehub.com/raw"))()';
let gamesSupported = '25+';

// --- MONETIZATION CONFIG ---
let monetizationEnabled = false;
let freeKeyLink = '';
let premiumKeyLink = '';

async function loadSiteData() {
    const supabase = getSupabase();
    if (!supabase) {
        console.error('Supabase Library NOT LOADED yet! Retrying in 500ms...');
        setTimeout(loadSiteData, 500);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('hub_settings')
            .select('*')
            .single();

        if (data) {
            if (data.games) games = data.games;
            if (data.lua_loader) luaLoaderCode = data.lua_loader;
            if (data.games_supported) gamesSupported = data.games_supported;
            
            // Monetization
            monetizationEnabled = data.monetization_enabled || false;
            freeKeyLink = data.free_key_link || '';
            premiumKeyLink = data.premium_key_link || '';
            
            // Inject Site Script if provided
            if (data.lootlabs_site_script && monetizationEnabled) {
                const scriptContainer = document.createElement('div');
                scriptContainer.innerHTML = data.lootlabs_site_script;
                const scripts = scriptContainer.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    document.head.appendChild(newScript);
                });
            }

            renderGames();
            updateLuaUI();
            updateStatsUI();
        }
        if (error) throw error;
    } catch (e) {
        console.error('Database load error:', e);
        renderGames();
    }
}

function updateStatsUI() {
    const gamesEl = document.getElementById('games-count');
    if (gamesEl) gamesEl.textContent = gamesSupported;
}

function updateLuaUI() {
    const codeEl = document.querySelector('.script-loader-v2 code');
    if (codeEl) codeEl.textContent = luaLoaderCode;
}

async function fetchDiscordMembers() {
    const discordEl = document.getElementById('discord-count');
    if (!discordEl) return;

    const INVITE_CODE = 'k7W9xEytP8';
    try {
        const response = await fetch(`https://discord.com/api/v9/invites/${INVITE_CODE}?with_counts=true`);
        const data = await response.json();
        
        if (data.approximate_member_count) {
            const total = data.approximate_member_count;
            discordEl.textContent = total >= 1000 ? (total/1000).toFixed(1) + 'K' : total;
        }
    } catch (e) {
        discordEl.textContent = '150+';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSiteData();
    fetchDiscordMembers();
    
    const copyBtn = document.getElementById('copy-script');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(luaLoaderCode).then(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> COPIED!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> COPY';
                }, 2000);
            });
        });
    }

    const searchInput = document.getElementById('game-search');
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                renderGames(e.target.value);
            }, 150);
        });
    }

    // Navbar "GET SCRIPT" Link
    const getScriptLink = document.querySelector('a[href="#getscript"]');
    if (getScriptLink) {
        getScriptLink.addEventListener('click', (e) => {
            e.preventDefault();
            showKeySystem();
        });
    }
});

function renderGames(filter = '') {
    const container = document.getElementById('game-container');
    if (!container) return;

    container.innerHTML = '';
    const filteredGames = games.filter(game => 
        game.title.toLowerCase().includes(filter.toLowerCase())
    );

    filteredGames.forEach((game, index) => {
        const card = document.createElement('div');
        card.className = 'game-card-v2 glass-card animate-fade';
        card.style.animationDelay = `${index * 0.05}s`;

        const getStatusIcon = (status) => {
            if (status === 'WORKING') return 'bolt';
            if (status === 'PATCHED') return 'triangle-exclamation';
            return 'power-off';
        };

        const icon = getStatusIcon(game.status);
        card.innerHTML = `
            <div class="card-v2-glow"></div>
            <div class="card-header">
                <span class="game-id">${(index + 1).toString().padStart(2, '0')}</span>
                <span class="badge badge-${game.status.toLowerCase()}">
                    <i class="fa-solid fa-${icon}"></i> ${game.status}
                </span>
            </div>
            <h3 class="game-title-v2">${game.title}</h3>
            <div class="features-tags-v2">
                ${(game.tags || []).map(tag => `<span class="feature-tag-v2">${tag}</span>`).join('')}
            </div>
            <div class="card-v2-action">
                <span>VIEW SCRIPT</span>
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        `;

        card.addEventListener('click', () => {
            showGameDetail(games.indexOf(game));
        });

        container.appendChild(card);
    });
}

function showGameDetail(index) {
    const game = games[index];
    if (!game) return;

    hideAllSections();
    document.getElementById('game-detail').style.display = 'block';

    document.getElementById('detail-title').textContent = game.title.toUpperCase();
    const statusEl = document.getElementById('detail-status');
    const statusIcon = (game.status === 'WORKING' ? 'bolt' : (game.status === 'PATCHED' ? 'triangle-exclamation' : 'power-off'));
    statusEl.innerHTML = `<i class="fa-solid fa-${statusIcon}"></i> ${game.status}`;
    statusEl.className = `badge badge-${game.status.toLowerCase()}`;
    
    document.getElementById('info-status').innerHTML = `<i class="fa-solid fa-${statusIcon}"></i> ${game.status}`;
    document.getElementById('info-status').className = `badge badge-${game.status.toLowerCase()}`;
    document.getElementById('info-platform').textContent = game.platform || 'ROBLOX';

    const featureContainer = document.getElementById('detail-features');
    featureContainer.innerHTML = '';
    (game.features || []).forEach(f => {
        const item = document.createElement('div');
        item.className = 'feature-item';
        const iconName = typeof f === 'object' ? (f.icon || 'circle-check') : 'circle-check';
        const text = typeof f === 'object' ? f.text : f;
        item.innerHTML = `<i class="fa-solid fa-${iconName}"></i> ${text}`;
        featureContainer.appendChild(item);
    });

    window.scrollTo(0, 0);
}

function showKeySystem() {
    hideAllSections();
    document.getElementById('key-system').style.display = 'block';
    window.scrollTo(0, 0);
}

function hideAllSections() {
    const sections = ['scripts', 'hero-v2', 'stats-card-v2', 'getscript', 'game-detail', 'key-system'];
    sections.forEach(id => {
        const el = document.getElementById(id) || document.querySelector('.' + id);
        if (el) el.style.display = 'none';
    });
}

function backToMain() {
    hideAllSections();
    document.getElementById('scripts').style.display = 'grid';
    document.querySelector('.hero-v2').style.display = 'block';
    document.querySelector('.stats-card-v2').style.display = 'flex';
    document.getElementById('getscript').style.display = 'block';
}

function handleFreeKey() {
    window.open(freeKeyLink || 'https://jnkie.com/get-key/vonixe-hub', '_blank');
}

function handlePremiumKey() {
    // Premium bypasses ads usually, but let's just open it
    window.open(premiumKeyLink || 'https://discord.gg/k7W9xEytP8', '_blank');
}


