window.onerror = function(msg, url, line) {
    console.error("Admin Error: " + msg + " | L:" + line);
};
console.log("⚡ Admin v4.0: Thunder Purple Single-Click Flow Active");

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

const SUPABASE_URL = "https://mdmjyvxrozxrxwmasnuq.supabase.co";
let dbClient = null;

// DOM refs
const overlay       = document.getElementById('config-overlay');
const adminKeyInput = document.getElementById('adminKeyInput');
const saveKeyBtn    = document.getElementById('saveKeyBtn');
const dateFilter    = document.getElementById('dateFilter');
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

dateFilter.addEventListener('change', loadData);
btnRefresh.addEventListener('click', loadData);
if (btnDeploy) btnDeploy.addEventListener('click', triggerVercelDeploy);
btnLogout.addEventListener('click', () => {
    localStorage.removeItem('vitrine_admin_role_key');
    window.location.reload();
});

const storedKey = localStorage.getItem('vitrine_admin_role_key');
if (storedKey) {
    overlay.classList.add('hidden');
    initSupabase(storedKey);
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
    if (!key) { alert("Por favor, cole a Service Role Key primeiro!"); return; }
    localStorage.setItem('vitrine_admin_role_key', key);
    overlay.classList.add('hidden');
    initSupabase(key);
});

function initSupabase(key) {
    try {
        dbClient = window.supabase.createClient(SUPABASE_URL, key);
        connStatus.textContent = "● Conectado";
        connStatus.classList.add("connected");
        loadData();
        setupRealtime();
    } catch(e) {
        alert("Erro ao conectar. Verifique a chave.");
        localStorage.removeItem('vitrine_admin_role_key');
        overlay.classList.remove('hidden');
    }
}

// ─── Helper ────────────────────────────────────────
function getStartAndEndOfDay(dateString) {
    return {
        start: new Date(dateString + 'T00:00:00-03:00').toISOString(),
        end:   new Date(dateString + 'T23:59:59.999-03:00').toISOString()
    };
}

// ─── Analytics ─────────────────────────────────────
async function loadData() {
    if (!dbClient) return;
    btnRefresh.style.opacity = '0.5';
    const { start, end } = getStartAndEndOfDay(dateFilter.value);

    try {
        const [{ data: tracking }, { data: trans }] = await Promise.all([
            dbClient.from('tracking_events').select('event_type, utm_term, created_at').gte('created_at', start).lte('created_at', end),
            dbClient.from('transactions').select('*').gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false })
        ]);

        let pageviews = 0, clicks = 0, userCheckout = 0, clickTelegram = 0;
        const checkoutEvents = [];

        (tracking || []).forEach(t => {
            if (t.event_type === 'pageview') pageviews++;
            if (t.event_type === 'click' || t.event_type === 'click_dispatch') clicks++;
            if (t.event_type === 'user_checkout' || t.event_type === 'click_checkout') {
                userCheckout++;
                checkoutEvents.push({
                    created_at: t.created_at,
                    event: 'user_checkout',
                    sale_code: t.utm_term || 'organico',
                    plan_name: 'Checkout Iniciado',
                    plan_value: 0
                });
            }
            if (t.event_type === 'click_segredo') clickTelegram++;
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

        // ─── Transações ─────────────────────────────────────
        let joined = 0, created = 0, approved = 0;
        (trans || []).forEach(t => {
            if (t.event === 'user_joined')      joined++;
            if (t.event === 'payment_created')  created++;
            if (t.event === 'payment_approved') approved++;
        });

        const elJoined   = document.getElementById('kpi-user-joined');
        const elCreated  = document.getElementById('kpi-pay-created');
        const elApproved = document.getElementById('kpi-pay-approved');

        if (elJoined)   animateValue(elJoined, 0, joined, 1000);
        if (elCreated)  animateValue(elCreated, 0, created, 1000);
        if (elApproved) animateValue(elApproved, 0, approved, 1000);

        const merged = [...(trans || []), ...checkoutEvents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        renderTable(merged);
    } catch(e) {
        console.error(e);
    } finally {
        btnRefresh.style.opacity = '1';
    }
}

function renderTable(transactions) {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';
    
    // Filtro mais robusto de eventos operacionais
    const items = transactions.filter(t => 
        ['user_checkout', 'payment_created', 'payment_approved', 'user_joined'].includes(t.event)
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
        else if (t.event === 'payment_created') 
            stBadge = '<span class="status-badge pending">○ Pendente</span>';
        else if (t.event === 'user_checkout') 
            stBadge = '<span class="status-badge initiated">⚡ Iniciado</span>';
        else 
            stBadge = `<span class="status-badge">${t.event}</span>`;

        // Operação ID Styling
        const saleCode = t.sale_code || 'organico';
        const opIdClass = saleCode === 'organico' ? 'op-id organico' : 'op-id';
        const opIdHtml = `<span class="${opIdClass}">${saleCode}</span>`;

        const val = t.plan_value ? `R$ ${(t.plan_value/100).toFixed(2).replace('.', ',')}` : '-';
        
        tr.innerHTML = `
            <td>${tm}</td>
            <td>${stBadge}</td>
            <td>${t.customer_username || t.customer_chat_id || '-'}</td>
            <td>${opIdHtml}</td>
            <td>${t.plan_name || '-'}</td>
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
        if (btn.dataset.tab === 'tab-vitrine')    { loadLinksData(); loadCarouselPhotos(); }

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
        const { data } = await dbClient.from('site_profile').select('*').eq('id', 1).single();
        if (!data) return;
        document.getElementById('iptCreatorName').value   = data.creator_name    || '';
        document.getElementById('iptCreatorHandle').value = data.creator_handle  || '';
        document.getElementById('iptLocation').value      = data.location        || '';
        document.getElementById('iptInstaUrl').value      = data.instagram_url   || '';
        document.getElementById('iptFBPixel').value       = data.facebook_pixel_id || '';
        document.getElementById('iptBioFull').value       = data.bio_full        || '';
        document.getElementById('iptBioShort').value      = data.bio_short       || data.bio_full || '';
        document.getElementById('iptPulseEnabled').checked = data.pulse_enabled !== false;
        if (data.profile_picture_url) document.getElementById('thumbProfile').style.backgroundImage = `url('${data.profile_picture_url}')`;
        if (data.banner_image_url)    document.getElementById('thumbBanner').style.backgroundImage  = `url('${data.banner_image_url}')`;
        // Stats
        document.getElementById('iptStatLikes').value   = data.stat_likes   || '245K';
        document.getElementById('iptStatPosts').value   = data.stat_posts   || '3.166 Postagens';
        document.getElementById('iptStatMedias').value  = data.stat_medias  || '3.387 Mídias';
        document.getElementById('iptStatImages').value  = data.stat_images  || '1.6K';
        document.getElementById('iptStatVideos').value  = data.stat_videos  || '1.8K';
        document.getElementById('iptVercelHook').value  = data.vercel_deploy_hook_url || '';
    } catch(e) { console.error("loadProfileData:", e); }
}

async function persistProfileData(showFeedback = false) {
    if (!dbClient) return;
    try {
        const { data: cur } = await dbClient.from('site_profile').select('profile_picture_url, banner_image_url').eq('id', 1).single();
        const picUrl    = (await uploadFile('fileProfilePic', 'profile')) || cur?.profile_picture_url || '';
        const bannerUrl = (await uploadFile('fileBannerPic', 'banner'))  || cur?.banner_image_url    || '';

        const bioFull = document.getElementById('iptBioFull').value;
        const { error, count } = await dbClient.from('site_profile').update({
            creator_name:        document.getElementById('iptCreatorName').value,
            creator_handle:      document.getElementById('iptCreatorHandle').value,
            location:            document.getElementById('iptLocation').value,
            instagram_url:       document.getElementById('iptInstaUrl').value,
            facebook_pixel_id:   document.getElementById('iptFBPixel').value,
            profile_picture_url: picUrl,
            banner_image_url:    bannerUrl,
            bio_full:            bioFull,
            bio_short:           document.getElementById('iptBioShort').value,
            vercel_deploy_hook_url: document.getElementById('iptVercelHook').value,
            updated_at:          new Date()
        }, { count: 'exact' }).eq('id', 1);

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

// Auto-salvar Pulse Toggle
document.getElementById('iptPulseEnabled').addEventListener('change', async (e) => {
    if (!dbClient) return;
    try {
        const { error } = await dbClient.from('site_profile').update({
            pulse_enabled: e.target.checked,
            updated_at: new Date()
        }).eq('id', 1);
        if (error) throw error;
        setPending();
        // Feedback visual sutil (opcional)
        console.log("Pulse updated:", e.target.checked);
    } catch(e) { 
        alert("Erro ao salvar animação: " + e.message);
        e.target.checked = !e.target.checked; // Reverter em caso de erro
    }
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
            updated_at:   new Date()
        }).eq('id', 1);
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
        const { data } = await dbClient.from('site_profile').select('thankyou_title,thankyou_message,thankyou_btn_text,thankyou_btn_url,banner_image_url').eq('id', 1).single();
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
        }).eq('id', 1);
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
        const { data } = await dbClient.from('site_offers').select('*').order('created_at', { ascending: true });
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
            active:         document.getElementById('iptOfferActive').value === 'true'
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

// ─── Vitrine Links (Botões da Vitrine) ───────────────
let linksSortable = null;

async function loadLinksData() {
    if (!dbClient) return;
    try {
        const { data } = await dbClient.from('site_links').select('*').order('sort_order', { ascending: true });
        const tbody = document.getElementById('linksTableBody');
        tbody.innerHTML = '';
        if (!data?.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhum botão cadastrado ainda. Clique em "Adicionar Botão".</td></tr>';
            return;
        }

        data.forEach((link) => {
            const tr = document.createElement('tr');
            tr.dataset.id = link.id;
            const activeTag = link.active !== false
                ? '<span class="tag approved">Visível</span>'
                : '<span class="tag created">Oculto</span>';
            const shortUrl = link.url ? (link.url.length > 45 ? link.url.slice(0, 45) + '…' : link.url) : '-';
            
            tr.innerHTML = `
                <td>
                    <div class="link-drag-handle" title="Arraste para reordenar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 9l7-7 7 7M5 15l7 7 7-7"/></svg>
                    </div>
                </td>
                <td><strong>${link.title}</strong></td>
                <td style="font-size:0.8rem; color:var(--text-secondary);">${shortUrl}</td>
                <td>${activeTag}</td>
                <td class="text-center" style="display:flex; gap:8px; justify-content:center;">
                    <button onclick="editLink(${link.id})" style="background:var(--input-bg); color:var(--text-primary); border:1px solid var(--border-color); padding:6px 14px; border-radius:6px; cursor:pointer; font-size:0.8rem;">Editar</button>
                    <button onclick="deleteLink(${link.id})" style="background:rgba(239,68,68,0.1); color:var(--danger); border:1px solid rgba(239,68,68,0.2); padding:6px 14px; border-radius:6px; cursor:pointer; font-size:0.8rem;">Remover</button>
                </td>`;
            tbody.appendChild(tr);
        });

        // Inicializa ou reinicializa Sortable para a tabela
        if (linksSortable) linksSortable.destroy();
        linksSortable = new Sortable(tbody, {
            animation: 350,
            handle: '.link-drag-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            onEnd: async () => {
                const items = Array.from(tbody.querySelectorAll('tr'));
                const updates = items.map((el, index) => ({
                    id: el.dataset.id,
                    sort_order: index
                }));

                // Salva a nova ordem de forma sequencial ou batch
                for (const update of updates) {
                    await dbClient.from('site_links').update({ sort_order: update.sort_order }).eq('id', update.id);
                }
                console.log('Ordem dos links sincronizada');
                setPending();
            }
        });

    } catch(e) { console.error('loadLinksData:', e); }
}

let editingLinkId = null;

document.getElementById('btnNewLink').addEventListener('click', () => {
    editingLinkId = null;
    document.getElementById('linkForm').reset();
    document.getElementById('lblLinkEditorTitle').textContent = 'Novo Botão';
    document.getElementById('linkEditor').style.display = 'block';
    document.getElementById('linkEditor').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btnCancelLink').addEventListener('click', () => {
    document.getElementById('linkEditor').style.display = 'none';
});

document.getElementById('linkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Salvando...';
    try {
        const payload = {
            title:      document.getElementById('iptLinkTitle').value,
            url:        document.getElementById('iptLinkUrl').value,
            active:     document.getElementById('iptLinkActive').value === 'true',
            updated_at: new Date()
        };
        if (editingLinkId) {
            await dbClient.from('site_links').update(payload).eq('id', editingLinkId);
        } else {
            // Calcula sort_order máximo + 1
            const { data: existing } = await dbClient.from('site_links').select('sort_order').order('sort_order', { ascending: false }).limit(1);
            payload.sort_order = existing?.length ? (existing[0].sort_order || 0) + 1 : 1;
            await dbClient.from('site_links').insert([payload]);
        }
        document.getElementById('linkEditor').style.display = 'none';
        loadLinksData();
        setPending();
    } catch(e) { alert('Erro: ' + e.message); }
    finally { btn.textContent = 'Salvar Botão'; }
});

window.editLink = async (id) => {
    const { data } = await dbClient.from('site_links').select('*').eq('id', id).single();
    if (!data) return;
    editingLinkId = id;
    document.getElementById('iptLinkTitle').value  = data.title;
    document.getElementById('iptLinkUrl').value    = data.url || '';
    document.getElementById('iptLinkActive').value = String(data.active !== false);
    document.getElementById('lblLinkEditorTitle').textContent = 'Editar Botão';
    document.getElementById('linkEditor').style.display = 'block';
    document.getElementById('linkEditor').scrollIntoView({ behavior: 'smooth' });
};

window.deleteLink = async (id) => {
    if (confirm('Remover este botão da vitrine?')) {
        await dbClient.from('site_links').delete().eq('id', id);
        loadLinksData();
        setPending();
    }
};

// ─── Carrossel da Vitrine (Gerenciamento Avançado) ────────────
let carouselSortable = null;

function formatSPDate(isoDate) {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function loadCarouselPhotos() {
    if (!dbClient) return;
    const grid = document.getElementById('carouselGrid');
    if (!grid) return;
    grid.innerHTML = '<div id="carouselLoading" style="color:var(--text-secondary); font-size:0.85rem; grid-column:1/-1; padding:16px 0;">Carregando fotos...</div>';

    try {
        // Busca da tabela ordenada
        const { data, error } = await dbClient
            .from('carousel_photos')
            .select('*')
            .order('sort_order', { ascending: true });
            
        if (error) throw error;

        grid.innerHTML = '';
        if (!data || !data.length) {
            grid.innerHTML = '<div style="color:var(--text-secondary); font-size:0.85rem; grid-column:1/-1; padding:16px 0;">Nenhuma foto adicionada. Clique em "Adicionar Fotos".</div>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'carousel-card';
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="carousel-drag-handle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 9l7-7 7 7M5 15l7 7 7-7"/></svg>
                </div>
                <button onclick="deleteCarouselPhoto('${item.id}', '${item.storage_path}')" class="carousel-delete-btn" title="Remover">✕</button>
                <img src="${item.public_url}" alt="Carousel Photo" loading="lazy">
                <div class="carousel-info">
                    <div class="carousel-date">Atualizado: ${formatSPDate(item.updated_at)}</div>
                </div>
            `;
            grid.appendChild(card);
        });

        // Inicializa ou reinicializa o Sortable
        if (carouselSortable) carouselSortable.destroy();
        carouselSortable = new Sortable(grid, {
            animation: 350,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            handle: '.carousel-card',
            onEnd: async () => {
                const items = Array.from(grid.querySelectorAll('.carousel-card'));
                const updates = items.map((el, index) => ({
                    id: el.dataset.id,
                    sort_order: index,
                    updated_at: new Date().toISOString()
                }));

                // Salva a nova ordem no banco
                for (const update of updates) {
                    await dbClient.from('carousel_photos').update({ sort_order: update.sort_order }).eq('id', update.id);
                }
                console.log('Ordem salva com sucesso');
                setPending();
            }
        });

    } catch(e) {
        grid.innerHTML = `<div style="color:var(--danger); font-size:0.85rem; grid-column:1/-1; padding:16px 0;">Erro ao carregar: ${e.message}</div>`;
        console.error('loadCarouselPhotos:', e);
    }
}

document.getElementById('fileCarousel').addEventListener('change', async (e) => {
    if (!dbClient) { alert('Conecte-se ao Supabase primeiro.'); return; }
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const label = e.target.closest('label');
    label.style.opacity = '0.6';
    label.style.pointerEvents = 'none';

    try {
        const { data: existing } = await dbClient.from('carousel_photos').select('id');
        const currentCount = existing?.length || 0;
        const maxNew = Math.max(0, 10 - currentCount); // Aumentado para 10 fotos no premium
        const toUpload = files.slice(0, maxNew);

        if (toUpload.length === 0) {
            alert('Limite de fotos atingido.');
            return;
        }

        // Busca o maior sort_order atual
        const { data: lastItem } = await dbClient.from('carousel_photos').select('sort_order').order('sort_order', { ascending: false }).limit(1);
        let nextOrder = lastItem?.length ? (lastItem[0].sort_order + 1) : 0;

        for (const file of toUpload) {
            const ext = file.name.split('.').pop();
            const storagePath = `carousel/bg-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            
            // 1. Upload no Storage
            const { error: uploadError } = await dbClient.storage.from('site_assets').upload(storagePath, file, { upsert: false });
            if (uploadError) throw uploadError;

            // 2. Pega URL pública
            const { data: { publicUrl } } = dbClient.storage.from('site_assets').getPublicUrl(storagePath);

            // 3. Insere na tabela
            await dbClient.from('carousel_photos').insert([{
                storage_path: storagePath,
                public_url: publicUrl,
                sort_order: nextOrder++
            }]);
        }

        await loadCarouselPhotos();
        setPending();
    } catch(err) {
        alert('Erro no upload: ' + err.message);
    } finally {
        label.style.opacity = '';
        label.style.pointerEvents = '';
        e.target.value = '';
    }
});

window.deleteCarouselPhoto = async (id, storagePath) => {
    if (!confirm(`Remover esta foto do carrossel?`)) return;
    try {
        // 1. Remove do Storage
        const { error: storageError } = await dbClient.storage.from('site_assets').remove([storagePath]);
        
        // 2. Remove da Tabela
        const { error: dbError } = await dbClient.from('carousel_photos').delete().eq('id', id);
        
        if (dbError) throw dbError;
        loadCarouselPhotos();
        setPending();
    } catch(e) {
        alert('Erro ao remover: ' + e.message);
    }
};

// ─── Auto-Detect Changes (Single-Click Flow) ────────
function setupAutoDetect() {
    const selector = 'input, textarea, select';
    document.querySelectorAll(selector).forEach(el => {
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
