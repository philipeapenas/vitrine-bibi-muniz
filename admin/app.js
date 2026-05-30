window.onerror = function(msg, url, line) {
    console.error("Admin Error: " + msg + " | L:" + line);
};
console.log("⚡ Admin v5.0: Multi-Model Active");

// ─── Multi-Model State ───
let currentModelSlug = null;

function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

let dbClient = null;

// DOM refs
const overlay       = document.getElementById('config-overlay');
const adminKeyInput = document.getElementById('adminKeyInput');
const saveKeyBtn    = document.getElementById('saveKeyBtn');
const dateFilter    = document.getElementById('dateFilter');
const filterMode    = document.getElementById('filterMode');
const dateStart     = document.getElementById('dateStart');
const dateEnd       = document.getElementById('dateEnd');
const dateInputGroup = document.getElementById('dateInputGroup');
const rangeInputGroup = document.getElementById('rangeInputGroup');
const btnRefresh    = document.getElementById('refreshBtn');
const btnDeploy     = document.getElementById('deployBtn');
const btnLogout     = document.getElementById('logoutBtn');
const connStatus    = document.getElementById('conn-status');
const mainSidebar   = document.getElementById('mainSidebar');

// Sidebar Toggle (Thunder Focus)
if (mainSidebar) {
    mainSidebar.addEventListener('click', (e) => {
        // Only toggle if clicking the header or a specific toggle button (optional)
        // For now, let's make it smarter: toggle on logo click
        if (e.target.closest('.sidebar-header')) {
            mainSidebar.classList.toggle('collapsed');
        }
    });
}

dateFilter.value = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
dateStart.value = dateFilter.value;
dateEnd.value = dateFilter.value;

filterMode.addEventListener('change', () => {
    const isCustom = filterMode.value === 'custom';
    const isTodayOrYesterday = filterMode.value === 'today' || filterMode.value === 'yesterday';
    
    dateInputGroup.style.display = isTodayOrYesterday ? 'block' : 'none';
    rangeInputGroup.style.display = isCustom ? 'flex' : 'none';

    if (filterMode.value === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter.value = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    } else if (filterMode.value === 'today') {
        dateFilter.value = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    }

    loadData();
});

dateFilter.addEventListener('change', loadData);
dateStart.addEventListener('change', loadData);
dateEnd.addEventListener('change', loadData);
btnRefresh.addEventListener('click', loadData);
if (btnDeploy) btnDeploy.addEventListener('click', triggerVercelDeploy);
btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('vitrine_admin_token');
    window.location.reload();
});

const storedKey = sessionStorage.getItem('vitrine_admin_token');
if (storedKey) {
    overlay.classList.add('hidden');
    initSupabase(storedKey);
}

// ─── Multi-Model: Selector & Nova Modelo ───
const modelSelector = document.getElementById('modelSelector');
const btnNewModel   = document.getElementById('btnNewModel');

modelSelector.addEventListener('change', () => {
    currentModelSlug = modelSelector.value;
    if (currentModelSlug && dbClient) {
        loadData();
        loadProfileData();
        loadOffersData();
        loadThankyouData();
    }
});

btnNewModel.addEventListener('click', createNewModel);

async function createNewModel() {
    if (!dbClient) { alert('Conecte-se primeiro.'); return; }
    const slug = prompt('Slug da nova modelo (ex: novamodelo, sem espacos ou acentos):');
    if (!slug || !/^[a-z0-9_-]+$/i.test(slug)) {
        alert('Slug invalido. Use apenas letras, numeros, hifens e underscores.');
        return;
    }
    const name = prompt('Nome da modelo (ex: Nova Modelo):');
    if (!name) return;

    try {
        const { error } = await dbClient.from('site_profile').insert([{
            slug: slug.toLowerCase(),
            creator_name: name,
            creator_handle: '@' + slug.toLowerCase()
        }]);
        if (error) throw error;
        alert('Modelo "' + name + '" criada com sucesso!');
        await loadModels();
        modelSelector.value = slug.toLowerCase();
        currentModelSlug = slug.toLowerCase();
        loadProfileData();
    } catch (e) {
        alert('Erro ao criar modelo: ' + e.message);
    }
}

async function loadModels() {
    if (!dbClient) return;
    try {
        const { data } = await dbClient.from('site_profile').select('slug,creator_name').order('slug', { ascending: true });
        modelSelector.innerHTML = '';
        if (!data || !data.length) {
            modelSelector.innerHTML = '<option value="">Nenhuma modelo</option>';
            return;
        }
        data.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.slug;
            opt.textContent = m.creator_name + ' (' + m.slug + ')';
            modelSelector.appendChild(opt);
        });
        // Seleciona a primeira por padrao
        if (!currentModelSlug) {
            currentModelSlug = data[0].slug;
        }
        modelSelector.value = currentModelSlug;
    } catch (e) {
        console.error('loadModels:', e);
    }
}

// Debounce para deploy automático
let deployTimer = null;

async function triggerVercelDeploy() {
    if (!btnDeploy || !dbClient) return;
    
    try {
        const { data: profile } = await dbClient.from('site_profile').select('vercel_deploy_hook_url').eq('id', 1).single();
        const hookUrl = profile?.vercel_deploy_hook_url;
        
        if (!hookUrl) {
            alert("Vercel Deploy Hook não configurado! Vá em 'Identidade & Perfil' e insira a URL do Hook.");
            return;
        }

        btnDeploy.disabled = true;
        btnDeploy.classList.add('syncing');
        
        // Fase 1: Sincronização de Banco
        btnDeploy.innerHTML = `Sincronizando Banco...`;
        await Promise.all([
            persistProfileData(),
            persistStatsData(),
            persistThankyouData()
        ]);

        // Fase 2: Trigger Vercel
        btnDeploy.innerHTML = `Publicando...`;
        const res = await fetch(hookUrl, { method: 'POST' });
        if (res.ok) {
            btnDeploy.innerHTML = '✅ Iniciado!';
            setTimeout(() => {
                btnDeploy.disabled = false;
                btnDeploy.classList.remove('syncing');
                btnDeploy.classList.remove('pending');
                btnDeploy.innerHTML = 'Confirmar & Publicar Site';
            }, 5000);
        } else {
            throw new Error("Falha no trigger da Vercel");
        }
    } catch(e) {
        console.error("Erro no deploy:", e);
        btnDeploy.innerHTML = '❌ Erro de Sincronização';
        alert("Erro ao publicar: " + e.message);
        setTimeout(() => {
            btnDeploy.disabled = false;
            btnDeploy.classList.remove('syncing');
            btnDeploy.innerHTML = 'Confirmar & Publicar Site';
        }, 3000);
    }
}

function setPending() {
    if (btnDeploy) {
        btnDeploy.classList.add('pending');
    }
}

saveKeyBtn.addEventListener('click', () => {
    const key = adminKeyInput.value.trim();
    if (!key) { alert("Por favor, digite a senha do admin primeiro!"); return; }
    sessionStorage.setItem('vitrine_admin_token', key);
    overlay.classList.add('hidden');
    initSupabase(key);
});

async function initSupabase(key) {
    dbClient = window.createAdminClient(key);

    // Valida a senha contra o servidor antes de revelar o painel.
    const { error } = await dbClient.from('site_profile').select('slug').limit(1);
    if (error && error.status === 401) {
        dbClient = null;
        alert("Senha do admin invalida.");
        sessionStorage.removeItem('vitrine_admin_token');
        overlay.classList.remove('hidden');
        connStatus.textContent = "● Desconectado";
        connStatus.classList.remove("connected");
        return;
    }

    connStatus.textContent = "● Conectado";
    connStatus.classList.add("connected");

    // Carregar lista de modelos primeiro
    await loadModels();

    // Carga Global
    loadGlobalSettings();
    loadData();
    loadProfileData();
    loadOffersData();
    loadThankyouData();

    setupRealtime();
}

// ─── Helper ────────────────────────────────────────
function getCalculatedRange() {
    const mode = filterMode.value;
    const now = new Date();
    const tz = 'America/Sao_Paulo';

    let start, end;

    if (mode === 'today' || mode === 'yesterday') {
        const d = dateFilter.value;
        start = new Date(d + 'T00:00:00-03:00');
        end = new Date(d + 'T23:59:59.999-03:00');
    } 
    else if (mode === 'week') {
        // Semana Atual (Domingo a Sábado)
        const day = now.getDay();
        const diff = now.getDate() - day;
        start = new Date(now.setDate(diff));
        start.setHours(0,0,0,0);
        
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23,59,59,999);
    }
    else if (mode === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0,0,0,0);
        
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23,59,59,999);
    }
    else if (mode === 'custom') {
        start = new Date(dateStart.value + 'T00:00:00-03:00');
        end = new Date(dateEnd.value + 'T23:59:59.999-03:00');
    }

    return {
        start: start.toISOString(),
        end: end.toISOString()
    };
}

// ─── Analytics ─────────────────────────────────────
async function loadData() {
    if (!dbClient) return;
    btnRefresh.style.opacity = '0.5';
    const { start, end } = getCalculatedRange();

    try {
        const [{ data: tracking }, { data: trans }] = await Promise.all([
            dbClient.from('tracking_events').select('*').eq('model_slug', currentModelSlug).gte('created_at', start).lte('created_at', end),
            dbClient.from('transactions').select('*').eq('model_slug', currentModelSlug).gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false })
        ]);

        let pageviews = 0, clicks = 0, userCheckout = 0, clickTelegram = 0;
        
        // ─── KPIs desduplicados por client_id (contagem precisa) ───
        const checkoutVisitSet = new Set();
        const pixGeneratedSet  = new Set();
        const approvedSet      = new Set();
        const joinedSet        = new Set();

        // ─── Histórico: TODAS as ações sem merge ───
        const allActions = [];

        (tracking || []).forEach(t => {
            if (t.event_type === 'pageview') pageviews++;
            if (t.event_type === 'click' || t.event_type === 'click_dispatch') clicks++;
            if (t.event_type === 'click_segredo') clickTelegram++;
            if (['user_checkout', 'click_checkout'].includes(t.event_type)) userCheckout++;

            // KPI: Visitantes únicos do checkout (desduplicado)
            if (t.event_type === 'checkout_visit') {
                const key = t.client_id || ('cv_' + t.id);
                checkoutVisitSet.add(key);
            }

            // Adicionar ao histórico (cada ação = uma linha)
            allActions.push({
                created_at: t.created_at,
                event: t.event_type === 'click_checkout' ? 'user_checkout' : t.event_type,
                sale_code: t.sale_code || t.utm_term || 'organico',
                plan_name: t.plan_name || '',
                plan_value: Number(t.plan_value || 0),
                client_id: t.client_id || null,
                _source: 'tracking'
            });
        });

        const totalClicks = userCheckout + clickTelegram + clicks;

        // ─── KPIs Linha 1 (Tráfego Geral) ──────────────────
        const elPageviews = document.getElementById('kpi-pageviews');
        const elClicks    = document.getElementById('kpi-clicks');
        const elCtr       = document.getElementById('kpi-ctr');

        if (elPageviews) animateValue(elPageviews, 0, pageviews, 1000);
        if (elClicks)    animateValue(elClicks, 0, totalClicks, 1000);
        if (elCtr) {
            const ctr = pageviews > 0 ? ((totalClicks / pageviews) * 100).toFixed(1) : '0.0';
            elCtr.textContent = ctr + '%';
        }

        // ─── Transações: cada uma é uma ação independente ──────────────────
        (trans || []).forEach(t => {
            // KPIs desduplicados por client_id
            const key = t.client_id || ('tx_' + t.id);
            if (t.event === 'click_generate_pix' || t.status === 'Pix gerado') {
                pixGeneratedSet.add(key);
            }
            if (t.event === 'payment_approved' || t.status === 'paid') {
                approvedSet.add(key);
            }
            if (t.event === 'user_joined') {
                joinedSet.add(key);
            }

            // Adicionar ao histórico (cada transação = uma linha)
            allActions.push({
                ...t,
                _source: 'transaction'
            });
        });

        // ─── KPIs Linha 2 (Funil de Conversão) ──────────────────
        const checkoutVisits = checkoutVisitSet.size;
        const created  = pixGeneratedSet.size;
        const approved = approvedSet.size;
        const joined   = joinedSet.size;

        const elJoined          = document.getElementById('kpi-user-joined');
        const elCreated         = document.getElementById('kpi-pay-created');
        const elApproved        = document.getElementById('kpi-pay-approved');
        const elCheckoutVisits  = document.getElementById('kpi-checkout-visits');

        if (elJoined)         animateValue(elJoined, 0, joined, 1000);
        if (elCreated)        animateValue(elCreated, 0, created, 1000);
        if (elApproved)       animateValue(elApproved, 0, approved, 1000);
        if (elCheckoutVisits) animateValue(elCheckoutVisits, 0, checkoutVisits, 1000);

        // ─── KPI P2: Taxa de Conversão do Checkout ──────────────────
        const elConvCheckout    = document.getElementById('kpi-conv-checkout');
        const elConvCheckoutSub = document.getElementById('kpi-conv-checkout-sub');
        if (elConvCheckout) {
            const convRate = checkoutVisits > 0 ? ((approved / checkoutVisits) * 100).toFixed(1) : null;
            elConvCheckout.textContent = convRate !== null ? convRate + '%' : '—';
        }
        if (elConvCheckoutSub) {
            elConvCheckoutSub.textContent = `${approved} aprovados / ${checkoutVisits} visitantes`;
        }

        // Ordenar TUDO por horário (mais recente primeiro)
        allActions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        renderTable(allActions);
    } catch(e) {
        console.error(e);
    } finally {
        btnRefresh.style.opacity = '1';
    }
}

function renderTable(transactions) {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';
    
    // Filtro robusto de eventos operacionais (sem merge, mostra cada ação)
    const items = transactions.filter(t => 
        ['checkout_visit', 'user_checkout', 'click_plan', 'click_generate_pix', 'payment_created', 'payment_approved', 'user_joined'].includes(t.event)
        || t.status === 'Pix gerado'
        || t.status === 'paid'
    );

    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Aguardando operações...</td></tr>';
        return;
    }

    items.forEach(t => {
        const tr = document.createElement('tr');
        const tm = new Date(t.created_at).toLocaleTimeString('pt-BR', { 
            timeZone: 'America/Sao_Paulo', 
            hour: '2-digit', minute: '2-digit' 
        });

        // Thunder Status Badges (v2.1)
        let stBadge = '';
        if (t.event === 'payment_approved') 
            stBadge = '<span class="status-badge success">● Aprovado</span>';
        else if (t.status === 'Pix gerado' || t.event === 'click_generate_pix') 
            stBadge = '<span class="status-badge pix-trigger">💎 Gerar PIX</span>';
        else if (t.event === 'payment_created') 
            stBadge = '<span class="status-badge pending">○ Pendente</span>';
        else if (t.event === 'user_checkout' || t.event === 'click_checkout') 
            stBadge = '<span class="status-badge initiated">⚡ Iniciado</span>';
        else if (t.event === 'click_plan') 
            stBadge = '<span class="status-badge plan">⚡ Clique Plano</span>';
        else if (t.event === 'checkout_visit') 
            stBadge = '<span class="status-badge lead">⚡ Lead Inscrito</span>';
        else if (t.event === 'user_joined') 
            stBadge = '<span class="status-badge initiated">🤖 Bot Telegram</span>';
        else if (t.event === 'pageview') 
            stBadge = '<span class="status-badge">👁️ Visitou</span>';
        else 
            stBadge = `<span class="status-badge">${t.event || t.event_type || 'Operação'}</span>`;

        // Operação ID Styling
        const saleCode = t.sale_code || 'organico';
        const opIdClass = saleCode === 'organico' ? 'op-id organico' : 'op-id';
        const opIdHtml = `<span class="${opIdClass}">${saleCode}</span>`;

        // Exibição do Plano e Valor (Ultra Resiliente)
        const planName = t.plan_name || (t.plan ? t.plan.replace(/_/g, ' ').toUpperCase() : '-');
        const displayValue = Number(t.plan_value || t.value || t.planValue || 0);
        const val = displayValue > 0 ? `R$ ${(displayValue/100).toFixed(2).replace('.', ',')}` : '-';
        
        // Debug para o console do admin (v8)
        if (displayValue === 0 && (t.event === 'click_generate_pix' || t.status === 'Pix gerado')) {
            console.log("⚠️ Registro sem valor encontrado:", t);
        }

        // Column CLIENTE logic: Prefer username, then email, then client_id prefix
        const customer = t.customer_username || t.customer_email || (t.client_id ? `Guest_${t.client_id.substring(0,5)}` : '-');

        tr.innerHTML = `
            <td>${tm}</td>
            <td>${stBadge}</td>
            <td>${customer}</td>
            <td>${opIdHtml}</td>
            <td>${planName}</td>
            <td>${val}</td>
        `;
        tbody.appendChild(tr);
    });
}

function setupRealtime() {
    if (!dbClient) return;
    dbClient.channel('dashboard-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tracking_events' }, () => setTimeout(loadData, 500))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => setTimeout(loadData, 500))
        // UPDATE: captura confirmações de pagamento do webhook-pix.js em tempo real
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions' }, () => setTimeout(loadData, 500))
        .subscribe();
}

// ─── Sidebar Navigation ─────────────────────────────
const tabsBtns    = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabsBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.style.display = 'none');
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).style.display = 'block';

        if (btn.dataset.tab === 'tab-appearance') { loadProfileData(); }
        if (btn.dataset.tab === 'tab-offers')     loadOffersData();
        if (btn.dataset.tab === 'tab-thankyou')   loadThankyouData();
        if (btn.dataset.tab === 'tab-vitrine')    { loadProfileData(); }

        // Auto-close sidebar on mobile
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    });
});

// ─── Helpers para Upload ─────────────────────────────
function previewFile(inputId, thumbId) {
    document.getElementById(inputId).addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById(thumbId).style.backgroundImage = `url('${ev.target.result}')`;
        };
        reader.readAsDataURL(file);
    });
}
previewFile('fileProfilePic', 'thumbProfile');
previewFile('fileBannerPic', 'thumbBanner');

async function uploadFile(inputId, filename) {
    const input = document.getElementById(inputId);
    if (!input.files.length) return null;
    const file = input.files[0];
    const ext  = file.name.split('.').pop();
    const name = `${filename}-${Date.now()}.${ext}`;
    const { error } = await dbClient.storage.from('site_assets').upload(name, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = dbClient.storage.from('site_assets').getPublicUrl(name);
    return publicUrl;
}

// ─── Perfil ──────────────────────────────────────────
async function loadProfileData() {
    if (!dbClient) return;
    try {
        const { data } = await dbClient.from('site_profile').select('*').eq('slug', currentModelSlug).single();
        if (!data) return;
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal('iptCreatorName', data.creator_name || '');
        setVal('iptCreatorHandle', data.creator_handle || '');
        setVal('iptLocation', data.location || '');
        setVal('iptInstaUrl', data.instagram_url || '');
        setVal('iptFBPixel', data.facebook_pixel_id || '');
        setVal('iptBioFull', data.bio_full || '');
        setVal('iptBioShort', data.bio_short || data.bio_full || '');
        setVal('iptMainBtnText', data.main_button_text || 'Ver conteúdo exclusivo');
        setVal('iptMainBtnUrl', data.main_button_url || '');
        
        const thumbP = document.getElementById('thumbProfile');
        const thumbB = document.getElementById('thumbBanner');
        if (data.profile_picture_url && thumbP) thumbP.style.backgroundImage = `url('${data.profile_picture_url}')`;
        if (data.banner_image_url && thumbB) thumbB.style.backgroundImage  = `url('${data.banner_image_url}')`;
        
        // Stats
        setVal('iptStatLikes', data.stat_likes || '245K');
        setVal('iptStatPosts', data.stat_posts || '3.166 Postagens');
        setVal('iptStatMedias', data.stat_medias || '3.387 Mídias');
        setVal('iptStatImages', data.stat_images || '1.6K');
        setVal('iptStatVideos', data.stat_videos || '1.8K');
        setVal('iptStatPaidVideos', data.stat_paid_videos || '147 Vídeos');
        setVal('iptVercelHook', data.vercel_deploy_hook_url || '');
    } catch(e) { console.error("loadProfileData:", e); }
}

async function persistProfileData(showFeedback = false) {
    if (!dbClient) return;
    try {
        const { data: cur } = await dbClient.from('site_profile').select('profile_picture_url, banner_image_url').eq('slug', currentModelSlug).single();
        const picUrl    = (await uploadFile('fileProfilePic', 'profile')) || cur?.profile_picture_url || '';
        const bannerUrl = (await uploadFile('fileBannerPic', 'banner'))  || cur?.banner_image_url    || '';

        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : undefined; };
        
        const updatePayload = {
            profile_picture_url: picUrl,
            banner_image_url:    bannerUrl,
            updated_at:          new Date()
        };
        
        const fields = [
            ['creator_name', 'iptCreatorName'],
            ['creator_handle', 'iptCreatorHandle'],
            ['location', 'iptLocation'],
            ['instagram_url', 'iptInstaUrl'],
            ['facebook_pixel_id', 'iptFBPixel'],
            ['bio_full', 'iptBioFull'],
            ['bio_short', 'iptBioShort'],
            ['vercel_deploy_hook_url', 'iptVercelHook'],
            ['main_button_text', 'iptMainBtnText'],
            ['main_button_url', 'iptMainBtnUrl']
        ];
        
        for (const [key, id] of fields) {
            const val = getVal(id);
            if (val !== undefined) updatePayload[key] = val;
        }

        const { error, count } = await dbClient.from('site_profile').update(updatePayload, { count: 'exact' }).eq('slug', currentModelSlug);

        if (error) throw error;
        if (count === 0) throw new Error("Chave sem permissão de escrita");
        if (showFeedback) alert("✅ Perfil salvo!");
        return true;
    } catch(e) {
        if (showFeedback) alert("Erro Perfil: " + e.message);
        throw e;
    }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Salvando...';
    try {
        await persistProfileData(true);
        setPending();
    } finally { btn.innerHTML = 'Salvar Identidade'; }
});



async function persistStatsData(showFeedback = false) {
    if (!dbClient) return;
    try {
        const { error } = await dbClient.from('site_profile').update({
            stat_likes:   document.getElementById('iptStatLikes').value,
            stat_posts:   document.getElementById('iptStatPosts').value,
            stat_medias:  document.getElementById('iptStatMedias').value,
            stat_images:  document.getElementById('iptStatImages').value,
            stat_videos:  document.getElementById('iptStatVideos').value,
            stat_paid_videos: document.getElementById('iptStatPaidVideos').value,
            updated_at:   new Date()
        }).eq('slug', currentModelSlug);
        if (error) throw error;
        if (showFeedback) alert("✅ Estatísticas salvas!");
        return true;
    } catch(e) {
        if (showFeedback) alert("Erro Stats: " + e.message);
        throw e;
    }
}

document.getElementById('statsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Salvando...';
    try {
        await persistStatsData(true);
        setPending();
    } finally { btn.innerHTML = 'Salvar Estatísticas'; }
});

// ─── Pós-Venda (Thank You Page) ──────────────────────
async function loadThankyouData() {
    if (!dbClient) return;
    try {
        const { data } = await dbClient.from('site_profile').select('thankyou_title,thankyou_message,thankyou_btn_text,thankyou_btn_url,banner_image_url').eq('slug', currentModelSlug).single();
        if (!data) return;
        document.getElementById('iptThxTitle').value   = data.thankyou_title    || 'Pagamento Aprovado!';
        document.getElementById('iptThxMessage').value = data.thankyou_message  || 'Obrigada! O seu acesso VIP exclusivo acabou de ser liberado.';
        document.getElementById('iptThxBtnText').value = data.thankyou_btn_text || 'Acessar Grupo VIP';
        document.getElementById('iptThxBtnUrl').value  = data.thankyou_btn_url  || 'https://t.me/seu_grupo_vip';

        // Atualiza preview
        updatePreview(data);
    } catch(e) { console.error("loadThankyouData:", e); }
}

function updatePreview(data) {
    if (data.banner_image_url) document.getElementById('prevBanner').style.backgroundImage = `url('${data.banner_image_url}')`;
    const title   = data.thankyou_title    || document.getElementById('iptThxTitle').value;
    const message = data.thankyou_message  || document.getElementById('iptThxMessage').value;
    const btnText = data.thankyou_btn_text || document.getElementById('iptThxBtnText').value;
    const btnUrl  = data.thankyou_btn_url  || document.getElementById('iptThxBtnUrl').value;
    if (title)   document.getElementById('prevTitle').textContent   = title;
    if (message) document.getElementById('prevMessage').textContent = message;
    if (btnText) document.getElementById('prevBtn').textContent     = btnText;
    if (btnUrl)  document.getElementById('prevBtn').href            = btnUrl;
}

// Live preview ao digitar
['iptThxTitle','iptThxMessage','iptThxBtnText','iptThxBtnUrl'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => updatePreview({}));
});

async function persistThankyouData(showFeedback = false) {
    if (!dbClient) return;
    try {
        const { error } = await dbClient.from('site_profile').update({
            thankyou_title:    document.getElementById('iptThxTitle').value,
            thankyou_message:  document.getElementById('iptThxMessage').value,
            thankyou_btn_text: document.getElementById('iptThxBtnText').value,
            thankyou_btn_url:  document.getElementById('iptThxBtnUrl').value,
            updated_at:        new Date()
        }).eq('slug', currentModelSlug);
        if (error) throw error;
        if (showFeedback) alert("✅ Pós-Venda salvo!");
        return true;
    } catch(e) {
        if (showFeedback) alert("Erro Pós-Venda: " + e.message);
        throw e;
    }
}

document.getElementById('thankyouForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Salvando...';
    try {
        await persistThankyouData(true);
        setPending();
    } finally { btn.innerHTML = 'Salvar Pós-Venda'; }
});

// ─── Ofertas ─────────────────────────────────────────
async function loadOffersData() {
    if (!dbClient) return;
    try {
        const { data } = await dbClient.from('site_offers').select('*').eq('model_slug', currentModelSlug).order('created_at', { ascending: true });
        const tbody = document.getElementById('offersTableBody');
        tbody.innerHTML = '';
        if (!data?.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma oferta cadastrada.</td></tr>';
            return;
        }
        data.forEach(offer => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code style="color:var(--accent); font-size:0.85em;">${offer.id}</code></td>
                <td><strong>${offer.name}</strong></td>
                <td>R$ ${(offer.value_cents/100).toFixed(2).replace('.',',')}</td>
                <td>${offer.is_promotion ? `<span class="tag approved">SIM — ${offer.discount_label||''}</span>` : '<span class="tag created">Não</span>'}</td>
                <td class="text-center" style="display:flex; gap:8px; justify-content:center;">
                    <button onclick="editOffer('${offer.id}')" style="background:var(--input-bg); color:var(--text-primary); border:1px solid var(--border-color); padding:6px 14px; border-radius:6px; cursor:pointer; font-size:0.8rem;">Editar</button>
                    <button onclick="deleteOffer('${offer.id}')" style="background:rgba(239,68,68,0.1); color:var(--danger); border:1px solid rgba(239,68,68,0.2); padding:6px 14px; border-radius:6px; cursor:pointer; font-size:0.8rem;">Remover</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) { console.error(e); }
}

let editingOfferId = null;

document.getElementById('btnNewOffer').addEventListener('click', () => {
    editingOfferId = null;
    document.getElementById('offerForm').reset();
    document.getElementById('iptOfferId').disabled = false;
    document.getElementById('lblOfferEditorTitle').textContent = 'Nova Oferta';
    document.getElementById('offerEditor').style.display = 'block';
    document.getElementById('offerEditor').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btnCancelOffer').addEventListener('click', () => {
    document.getElementById('offerEditor').style.display = 'none';
});

document.getElementById('offerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Salvando...';
    try {
        const { error } = await dbClient.from('site_offers').upsert({
            id:             editingOfferId || document.getElementById('iptOfferId').value,
            name:           document.getElementById('iptOfferName').value,
            url:            document.getElementById('iptOfferUrl').value,
            value_cents:    parseInt(document.getElementById('iptOfferValue').value, 10),
            is_promotion:   document.getElementById('iptOfferPromo').value === 'true',
            discount_label: document.getElementById('iptOfferPromoLbl').value,
            active:         document.getElementById('iptOfferActive').value === 'true',
            model_slug:     currentModelSlug
        });
        if (error) throw error;
        document.getElementById('offerEditor').style.display = 'none';
        loadOffersData();
        setPending();
    } catch(e) { alert("Erro: " + e.message); }
    finally { btn.textContent = 'Salvar Oferta'; }
});

window.editOffer = async (id) => {
    const { data } = await dbClient.from('site_offers').select('*').eq('id', id).single();
    if (!data) return;
    editingOfferId = id;
    document.getElementById('iptOfferId').value       = data.id;
    document.getElementById('iptOfferId').disabled    = true;
    document.getElementById('iptOfferName').value     = data.name;
    document.getElementById('iptOfferUrl').value      = data.url || '';
    document.getElementById('iptOfferValue').value    = data.value_cents;
    document.getElementById('iptOfferPromo').value    = String(data.is_promotion);
    document.getElementById('iptOfferPromoLbl').value = data.discount_label || '';
    document.getElementById('iptOfferActive').value   = String(data.active);
    document.getElementById('lblOfferEditorTitle').textContent = 'Editar Oferta';
    document.getElementById('offerEditor').style.display = 'block';
    document.getElementById('offerEditor').scrollIntoView({ behavior: 'smooth' });
};

window.deleteOffer = async (id) => {
    if (confirm(`Apagar oferta "${id}"?`)) {
        await dbClient.from('site_offers').delete().eq('id', id);
        loadOffersData();
        setPending();
    }
};

// ─── Configuração Global de Pagamento ────────────
async function loadGlobalSettings() {
    if (!dbClient) return;
    try {
        const { data } = await dbClient.from('global_settings').select('pushinpay_token').eq('id', 1).single();
        if (data) {
            document.getElementById('iptGlobalPushinPay').value = data.pushinpay_token || '';
        }
    } catch(e) { console.error("loadGlobalSettings:", e); }
}

document.getElementById('globalSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!dbClient) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = 'Salvando...';
    try {
        const token = document.getElementById('iptGlobalPushinPay').value;
        const { error } = await dbClient.from('global_settings').upsert({ id: 1, pushinpay_token: token });
        if (error) throw error;
        setPending();
    } catch(err) {
        alert('Erro ao salvar Token Global: ' + err.message);
    } finally {
        btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Salvar Token Global';
    }
});

// ─── Vitrine Única (Botão) ────────────
document.getElementById('vitrineBtnForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!dbClient) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = 'Salvando...';
    try {
        const text = document.getElementById('iptMainBtnText').value;
        const url = document.getElementById('iptMainBtnUrl').value;
        const { error } = await dbClient.from('site_profile').update({
            main_button_text: text,
            main_button_url: url,
            updated_at: new Date()
        }).eq('slug', currentModelSlug);
        if (error) throw error;
        setPending();
    } catch(err) {
        alert('Erro ao salvar Botão da Vitrine: ' + err.message);
    } finally {
        btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Salvar Botão';
    }
});

// ─── Auto-Detect Changes (Single-Click Flow) ────────
function setupAutoDetect() {
    const selector = 'input, textarea, select';
    document.querySelectorAll(selector).forEach(el => {
        // Ignorar elementos de filtro do dashboard (analíticos)
        if (el.closest('.dashboard-controls')) return;
        
        el.addEventListener('input', setPending);
        el.addEventListener('change', setPending);
    });
}
// Chamar após carregamento inicial
setTimeout(setupAutoDetect, 2000);

// ─── MOBILE MENU SYSTEM ───
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    
    // Create overlay if not exists
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    mobileBtn?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.add('active');
        document.querySelector('.sidebar-overlay').classList.add('active');
    });

    overlay.addEventListener('click', closeSidebar);
});

function closeSidebar() {
    document.querySelector('.sidebar')?.classList.remove('active');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
}
