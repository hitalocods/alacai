/**
 * AL Açaí - Admin CRUD Management Module
 */

document.addEventListener('DOMContentLoaded', () => {
    initAdminModal();
});

function showToast(msg) {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-toast';
        toast.className = 'admin-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function initAdminModal() {
    const modalOverlay = document.getElementById('admin-modal-overlay');
    const closeBtn = document.getElementById('admin-close');
    const adminTriggers = document.querySelectorAll('.btn-admin-trigger');

    adminTriggers.forEach(btn => {
        btn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
            renderAdminData();
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.classList.remove('active');
        });
    }

    // Keyboard shortcut: Ctrl + Shift + A
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            e.preventDefault();
            modalOverlay.classList.toggle('active');
            if (modalOverlay.classList.contains('active')) renderAdminData();
        }
    });

    // Tab switching
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.dataset.tab;
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Form Submissions
    initDashboard();
    initPriceForm();
    initPromoForm();
    initPhotosForm();
    initToppingsForm();
    initDeliveryForm();
    initMobileMenu();

    const resetBtn = document.getElementById('admin-reset-data');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja restaurar os dados originais do cardápio?')) {
                window.storeAPI.resetToDefaults();
                renderAdminData();
                showToast('Dados restaurados com sucesso!');
            }
        });
    }
}

function renderAdminData() {
    const data = window.storeAPI.getData();
    renderDashboard(data);
    renderPriceTable(data.sizes);
    renderPromoTable(data.promotions);
    renderPhotosFormValues(data.photos);
    renderToppingsTable(data.toppings);
    renderDeliveryTable(data.deliveryLocations);
}

function renderDashboard(data) {
    // Calculate stats
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const orders = data.orders || [];
    const expenses = data.expenses || [];

    // Daily profit
    const dailyOrders = orders.filter(o => new Date(o.date).toDateString() === today);
    const dailyProfit = dailyOrders.reduce((sum, o) => sum + o.value, 0);

    // Weekly profit
    const weeklyOrders = orders.filter(o => new Date(o.date) >= weekAgo);
    const weeklyProfit = weeklyOrders.reduce((sum, o) => sum + o.value, 0);

    // Monthly profit
    const monthlyOrders = orders.filter(o => new Date(o.date) >= monthStart);
    const monthlyProfit = monthlyOrders.reduce((sum, o) => sum + o.value, 0);

    // Monthly expenses
    const monthlyExpenses = expenses.filter(e => new Date(e.date) >= monthStart);
    const monthlyExpensesTotal = monthlyExpenses.reduce((sum, e) => sum + e.value, 0);

    // Update stat cards
    const dailyEl = document.getElementById('stat-daily');
    if (dailyEl) dailyEl.textContent = `R$ ${dailyProfit.toFixed(2).replace('.', ',')}`;

    const weeklyEl = document.getElementById('stat-weekly');
    if (weeklyEl) weeklyEl.textContent = `R$ ${weeklyProfit.toFixed(2).replace('.', ',')}`;

    const monthlyEl = document.getElementById('stat-monthly');
    if (monthlyEl) monthlyEl.textContent = `R$ ${monthlyProfit.toFixed(2).replace('.', ',')}`;

    const expensesEl = document.getElementById('stat-expenses');
    if (expensesEl) expensesEl.textContent = `R$ ${monthlyExpensesTotal.toFixed(2).replace('.', ',')}`;

    // Render orders table
    const ordersBody = document.getElementById('table-orders-body');
    if (ordersBody) {
        ordersBody.innerHTML = '';
        const recentOrders = orders.slice(-10).reverse();
        recentOrders.forEach(order => {
            const date = new Date(order.date);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                <td>${order.size}</td>
                <td>R$ ${order.value.toFixed(2).replace('.', ',')}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')">Excluir</button>
                </td>
            `;
            ordersBody.appendChild(tr);
        });
    }

    // Render expenses table
    const expensesBody = document.getElementById('table-expenses-body');
    if (expensesBody) {
        expensesBody.innerHTML = '';
        const recentExpenses = expenses.slice(-10).reverse();
        recentExpenses.forEach(expense => {
            const date = new Date(expense.date);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date.toLocaleDateString('pt-BR')}</td>
                <td>${expense.description}</td>
                <td>R$ ${expense.value.toFixed(2).replace('.', ',')}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteExpense('${expense.id}')">Excluir</button>
                </td>
            `;
            expensesBody.appendChild(tr);
        });
    }
}

window.deleteOrder = function(id) {
    if (confirm('Deseja excluir este pedido?')) {
        window.storeAPI.deleteOrder(id);
        renderAdminData();
        showToast('Pedido excluído!');
    }
};

window.deleteExpense = function(id) {
    if (confirm('Deseja excluir esta despesa?')) {
        window.storeAPI.deleteExpense(id);
        renderAdminData();
        showToast('Despesa excluída!');
    }
};

/* --- TAB 1: PREÇOS & TAMANHOS --- */
function initPriceForm() {
    const form = document.getElementById('form-price');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('price-id').value;
        const size = document.getElementById('price-size').value.trim();
        const price = parseFloat(document.getElementById('price-val').value);
        const promoPriceVal = document.getElementById('price-promo-val').value;
        const promoPrice = promoPriceVal ? parseFloat(promoPriceVal) : null;
        const badge = document.getElementById('price-badge').value.trim();

        if (!size || isNaN(price)) {
            alert('Preencha o tamanho e o preço corretamente!');
            return;
        }

        window.storeAPI.savePrice({
            id: id || undefined,
            size,
            price,
            promoPrice,
            popular: !!badge,
            badge: badge || undefined
        });

        form.reset();
        document.getElementById('price-id').value = '';
        renderAdminData();
        showToast('Preço salvo com sucesso!');
    });
}

function renderPriceTable(sizes) {
    const tbody = document.getElementById('table-prices-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    sizes.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.size}</strong> ${s.badge ? `<span class="badge badge-berry">${s.badge}</span>` : ''}</td>
            <td>R$ ${s.price.toFixed(2)}</td>
            <td>${s.promoPrice ? `R$ ${s.promoPrice.toFixed(2)}` : '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-edit" onclick="editPrice('${s.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePrice('${s.id}')">Excluir</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editPrice = function(id) {
    const data = window.storeAPI.getData();
    const sizeObj = data.sizes.find(s => s.id === id);
    if (!sizeObj) return;

    document.getElementById('price-id').value = sizeObj.id;
    document.getElementById('price-size').value = sizeObj.size;
    document.getElementById('price-val').value = sizeObj.price;
    document.getElementById('price-promo-val').value = sizeObj.promoPrice || '';
    document.getElementById('price-badge').value = sizeObj.badge || '';
    showToast(`Editando ${sizeObj.size}`);
};

window.deletePrice = function(id) {
    if (confirm('Deseja excluir este tamanho?')) {
        window.storeAPI.deletePrice(id);
        renderAdminData();
        showToast('Tamanho excluído!');
    }
};

/* --- TAB 2: PROMOÇÕES --- */
function initPromoForm() {
    const form = document.getElementById('form-promo');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('promo-id').value;
        const title = document.getElementById('promo-title').value.trim();
        const description = document.getElementById('promo-desc').value.trim();
        const discount = document.getElementById('promo-discount').value.trim();
        const targetSize = document.getElementById('promo-target').value.trim();
        const badge = document.getElementById('promo-badge').value.trim();

        if (!title || !discount) {
            alert('Preencha ao menos o título e a tag de desconto!');
            return;
        }

        window.storeAPI.savePromotion({
            id: id || undefined,
            title,
            description,
            discount,
            targetSize,
            badge: badge || 'PROMO',
            active: true
        });

        form.reset();
        document.getElementById('promo-id').value = '';
        renderAdminData();
        showToast('Promoção salva!');
    });
}

function renderPromoTable(promotions) {
    const tbody = document.getElementById('table-promos-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    promotions.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${p.title}</strong><br>
                <small style="color: var(--cream-muted)">${p.description}</small>
            </td>
            <td><span class="badge badge-berry">${p.discount}</span></td>
            <td>${p.active ? '<span class="badge badge-lime">ATIVA</span>' : 'INATIVA'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-edit" onclick="togglePromo('${p.id}')">${p.active ? 'Pausar' : 'Ativar'}</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePromo('${p.id}')">Excluir</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.togglePromo = function(id) {
    window.storeAPI.togglePromotion(id);
    renderAdminData();
    showToast('Status da promoção alterado!');
};

window.deletePromo = function(id) {
    if (confirm('Excluir esta promoção?')) {
        window.storeAPI.deletePromotion(id);
        renderAdminData();
        showToast('Promoção removida!');
    }
};

/* --- TAB 3: FOTOS & IMAGENS --- */
function initPhotosForm() {
    const form = document.getElementById('form-photos');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const heroCup = document.getElementById('photo-hero').value.trim();
        const logo = document.getElementById('photo-logo').value.trim();
        const promoBanner = document.getElementById('photo-banner').value.trim();

        window.storeAPI.updatePhotos({ heroCup, logo, promoBanner });
        showToast('Imagens atualizadas!');
    });
}

function renderPhotosFormValues(photos) {
    if (!photos) return;
    if (document.getElementById('photo-hero')) document.getElementById('photo-hero').value = photos.heroCup || '';
    if (document.getElementById('photo-logo')) document.getElementById('photo-logo').value = photos.logo || '';
    if (document.getElementById('photo-banner')) document.getElementById('photo-banner').value = photos.promoBanner || '';
}

/* --- TAB 4: ADICIONAIS & INGREDIENTES --- */
function initToppingsForm() {
    const form = document.getElementById('form-topping');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('topping-category').value;
        const name = document.getElementById('topping-name').value.trim();
        const color = document.getElementById('topping-color').value;
        const icon = document.getElementById('topping-icon').value.trim();
        const isNew = document.getElementById('topping-new').checked;

        if (!name) {
            alert('Insira o nome do adicional!');
            return;
        }

        window.storeAPI.saveTopping(category, { name, color, icon, isNew });
        form.reset();
        renderAdminData();
        showToast('Adicional adicionado!');
    });
}

function renderToppingsTable(toppings) {
    const container = document.getElementById('admin-toppings-container');
    if (!container || !toppings) return;

    let html = '';
    ['coberturas', 'frutas', 'completamentos'].forEach(cat => {
        const list = toppings[cat] || [];
        html += `
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--lime); text-transform: uppercase; margin-bottom: 8px; font-size: 13px;">
                    ${cat.toUpperCase()} (${list.length})
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${list.map(item => `
                        <div style="background: var(--purple-950); padding: 6px 12px; border-radius: 999px; border: 1px solid var(--glass-border); display: inline-flex; align-items: center; gap: 8px; font-size: 13px;">
                            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; display: inline-block;"></span>
                            <span>${item.name}</span>
                            <button onclick="deleteToppingItem('${cat}', '${item.id}')" style="background: none; border: none; color: var(--berry); font-weight: bold; cursor: pointer;">&times;</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.deleteToppingItem = function(cat, id) {
    if (confirm('Remover este adicional?')) {
        window.storeAPI.deleteTopping(cat, id);
        renderAdminData();
        showToast('Adicional removido!');
    }
};

/* --- TAB 5: BAIRROS & TAXAS DE ENTREGA --- */
function initDeliveryForm() {
    const form = document.getElementById('form-delivery');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('delivery-id').value;
        const name = document.getElementById('delivery-name').value.trim();
        const fee = parseFloat(document.getElementById('delivery-fee').value);

        if (!name || isNaN(fee)) {
            alert('Preencha o nome do bairro e a taxa de entrega!');
            return;
        }

        window.storeAPI.saveDeliveryLocation({
            id: id || undefined,
            name,
            fee
        });

        form.reset();
        document.getElementById('delivery-id').value = '';
        renderAdminData();
        showToast('Bairro salvo com sucesso!');
    });
}

function renderDeliveryTable(locations) {
    const tbody = document.getElementById('table-delivery-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    locations.forEach(loc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${loc.name}</strong></td>
            <td>R$ ${loc.fee.toFixed(2)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-edit" onclick="editDelivery('${loc.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDelivery('${loc.id}')">Excluir</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editDelivery = function(id) {
    const data = window.storeAPI.getData();
    const loc = data.deliveryLocations.find(l => l.id === id);
    if (!loc) return;

    document.getElementById('delivery-id').value = loc.id;
    document.getElementById('delivery-name').value = loc.name;
    document.getElementById('delivery-fee').value = loc.fee;
    showToast(`Editando ${loc.name}`);
};

window.deleteDelivery = function(id) {
    if (confirm('Deseja excluir este bairro?')) {
        window.storeAPI.deleteDeliveryLocation(id);
        renderAdminData();
        showToast('Bairro excluído!');
    }
};

/* --- TAB 1: DASHBOARD --- */
function initDashboard() {
    const orderForm = document.getElementById('form-order');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const value = parseFloat(document.getElementById('order-value').value);
            const size = document.getElementById('order-size').value;

            if (isNaN(value) || value <= 0) {
                alert('Por favor, insira um valor válido.');
                return;
            }

            window.storeAPI.saveOrder({
                value,
                size,
                date: new Date().toISOString()
            });

            orderForm.reset();
            renderAdminData();
            showToast('Pedido registrado!');
        });
    }

    const expenseForm = document.getElementById('form-expense');
    if (expenseForm) {
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const description = document.getElementById('expense-desc').value.trim();
            const value = parseFloat(document.getElementById('expense-value').value);

            if (!description || isNaN(value) || value <= 0) {
                alert('Por favor, preencha todos os campos corretamente.');
                return;
            }

            window.storeAPI.saveExpense({
                description,
                value,
                date: new Date().toISOString()
            });

            expenseForm.reset();
            renderAdminData();
            showToast('Despesa registrada!');
        });
    }
}

function initMobileMenu() {
    const menuToggle = document.getElementById('admin-menu-toggle');
    const tabs = document.querySelector('.admin-tabs');

    if (menuToggle && tabs) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            tabs.classList.toggle('open');
        });

        // Close menu when clicking a tab
        tabs.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                tabs.classList.remove('open');
            });
        });
    }
}
