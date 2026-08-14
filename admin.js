/**
 * AL Açaí - Admin Dashboard Control Panel Module
 */

document.addEventListener('DOMContentLoaded', () => {
    initAdminPanel();
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

function initAdminPanel() {
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

    // Initialize all forms
    initDashboard();
    initInventoryForm();
    initPriceForm();
    initPromoForm();
    initPhotosForm();
    initToppingsForm();
    initDeliveryForm();

    // Toppings Filter Select Listener
    const toppingFilterSelect = document.getElementById('topping-category-select');
    if (toppingFilterSelect) {
        toppingFilterSelect.addEventListener('change', renderFilteredToppings);
    }

    const resetBtn = document.getElementById('admin-reset-data');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja restaurar os dados originais do cardápio e estoque?')) {
                window.storeAPI.resetToDefaults();
                renderAdminData();
                showToast('Dados restaurados com sucesso!');
            }
        });
    }

    // Initial render
    renderAdminData();
}

function renderAdminData() {
    const data = window.storeAPI.getData();
    
    // 1. Populate dynamic manual order form selects & checklist
    const orderSizeSelect = document.getElementById('order-size');
    if (orderSizeSelect && data.sizes) {
        const prevSizeVal = orderSizeSelect.value;
        orderSizeSelect.innerHTML = data.sizes.map(s => `<option value="${s.size}">${s.size}</option>`).join('');
        if (prevSizeVal) orderSizeSelect.value = prevSizeVal;
    }

    const orderToppingsList = document.getElementById('order-toppings-list');
    if (orderToppingsList && data.toppings) {
        const allToppings = [
            ...(data.toppings.coberturas || []),
            ...(data.toppings.frutas || []),
            ...(data.toppings.completamentos || [])
        ];
        orderToppingsList.innerHTML = allToppings.map(t => `
            <label class="topping-check-item">
                <input type="checkbox" name="order-toppings" value="${t.name}">
                <span>${t.icon || '🍧'} ${t.name}</span>
            </label>
        `).join('');
    }

    // 2. Populate promo target select
    const promoTargetSelect = document.getElementById('promo-target');
    if (promoTargetSelect && data.sizes) {
        const prevVal = promoTargetSelect.value;
        promoTargetSelect.innerHTML = `<option value="">Nenhum tamanho</option>` + data.sizes.map(s => `<option value="${s.size}">${s.size}</option>`).join('');
        if (prevVal) promoTargetSelect.value = prevVal;
    }

    // 3. Populate inventory linked items select
    const invLinkSelect = document.getElementById('inventory-link');
    if (invLinkSelect && data.sizes && data.toppings) {
        const prevVal = invLinkSelect.value;
        let html = '<option value="">Nenhum vínculo</option>';
        html += '<optgroup label="Tamanhos de Copos">';
        data.sizes.forEach(s => {
            html += `<option value="${s.id}">Copo: ${s.size}</option>`;
        });
        html += '</optgroup><optgroup label="Adicionais">';
        const allToppings = [
            ...(data.toppings.coberturas || []),
            ...(data.toppings.frutas || []),
            ...(data.toppings.completamentos || [])
        ];
        allToppings.forEach(t => {
            html += `<option value="${t.id}">Adicional: ${t.name}</option>`;
        });
        html += '</optgroup>';
        invLinkSelect.innerHTML = html;
        if (prevVal) invLinkSelect.value = prevVal;
    }

    // 4. Call individual render methods
    renderDashboard(data);
    renderInventory(data);
    renderPriceTable(data.sizes);
    renderPromoTable(data.promotions);
    renderPhotosFormValues(data.photos);
    renderToppingsTable(data.toppings);
    renderDeliveryTable(data.deliveryLocations);
}

/* --- TAB 1: DASHBOARD --- */
function initDashboard() {
    // Populate filter year options
    const filterYearSelect = document.getElementById('filter-year');
    if (filterYearSelect && filterYearSelect.children.length === 0) {
        const currentYear = new Date().getFullYear();
        for (let y = 2025; y <= currentYear + 2; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            if (y === currentYear) opt.selected = true;
            filterYearSelect.appendChild(opt);
        }
    }

    // Set current month as default select
    const filterMonthSelect = document.getElementById('filter-month');
    if (filterMonthSelect && filterMonthSelect.value === 'all') {
        const currentMonth = new Date().getMonth(); // 0-11
        filterMonthSelect.value = currentMonth.toString();
    }

    // Add change listeners
    if (filterMonthSelect) {
        // Remove existing listener to prevent duplicate binding if init is called multiple times
        filterMonthSelect.removeEventListener('change', renderAdminData);
        filterMonthSelect.addEventListener('change', renderAdminData);
    }
    if (filterYearSelect) {
        filterYearSelect.removeEventListener('change', renderAdminData);
        filterYearSelect.addEventListener('change', renderAdminData);
    }

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

            // Gather manual order toppings
            const checkedBoxes = Array.from(document.querySelectorAll('input[name="order-toppings"]:checked'));
            const toppings = checkedBoxes.map(cb => cb.value);

            window.storeAPI.saveOrder({
                value,
                size,
                toppings,
                date: new Date().toISOString()
            });

            orderForm.reset();
            renderAdminData();
            showToast('Pedido registrado e estoque reduzido!');
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

function renderDashboard(data) {
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const filterMonthEl = document.getElementById('filter-month');
    const filterYearEl = document.getElementById('filter-year');
    const selectedMonth = filterMonthEl ? filterMonthEl.value : new Date().getMonth().toString();
    const selectedYear = filterYearEl ? parseInt(filterYearEl.value) : new Date().getFullYear();

    const orders = data.orders || [];
    const expenses = data.expenses || [];

    // Filter helper based on dropdown selection
    const filterBySelectedPeriod = (itemDateStr) => {
        const d = new Date(itemDateStr);
        const yearMatches = d.getFullYear() === selectedYear;
        const monthMatches = selectedMonth === 'all' || d.getMonth() === parseInt(selectedMonth);
        return yearMatches && monthMatches;
    };

    // Live Stats (Absolute relative periods)
    const dailyProfit = orders.filter(o => new Date(o.date).toDateString() === today).reduce((sum, o) => sum + o.value, 0);
    const weeklyProfit = orders.filter(o => new Date(o.date) >= weekAgo).reduce((sum, o) => sum + o.value, 0);

    // Selected Month/Year Stats
    const monthlyProfit = orders.filter(o => filterBySelectedPeriod(o.date)).reduce((sum, o) => sum + o.value, 0);
    const monthlyExpensesTotal = expenses.filter(e => filterBySelectedPeriod(e.date)).reduce((sum, e) => sum + e.value, 0);
    const netProfit = monthlyProfit - monthlyExpensesTotal;

    // Dynamically update labels based on selected month
    const monthsNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthText = selectedMonth === 'all' ? 'Mês' : monthsNames[parseInt(selectedMonth)];

    const updateLabel = (id, baseText) => {
        const el = document.getElementById(id);
        if (el) {
            const labelEl = el.previousElementSibling || el.parentElement.querySelector('.stat-label');
            if (labelEl) labelEl.textContent = `${baseText} (${monthText})`;
        }
    };
    updateLabel('stat-monthly', 'Faturamento');
    updateLabel('stat-expenses', 'Despesas');
    updateLabel('stat-net-profit', 'Lucro Líquido');

    // Dom updates
    if (document.getElementById('stat-daily')) document.getElementById('stat-daily').textContent = `R$ ${dailyProfit.toFixed(2).replace('.', ',')}`;
    if (document.getElementById('stat-weekly')) document.getElementById('stat-weekly').textContent = `R$ ${weeklyProfit.toFixed(2).replace('.', ',')}`;
    if (document.getElementById('stat-monthly')) document.getElementById('stat-monthly').textContent = `R$ ${monthlyProfit.toFixed(2).replace('.', ',')}`;
    if (document.getElementById('stat-expenses')) document.getElementById('stat-expenses').textContent = `R$ ${monthlyExpensesTotal.toFixed(2).replace('.', ',')}`;
    
    const netProfitEl = document.getElementById('stat-net-profit');
    if (netProfitEl) {
        netProfitEl.textContent = `R$ ${netProfit.toFixed(2).replace('.', ',')}`;
        if (netProfit < 0) {
            netProfitEl.style.color = 'var(--status-out)';
        } else {
            netProfitEl.style.color = 'var(--lime)';
        }
    }

    // Render tables
    const ordersBody = document.getElementById('table-orders-body');
    if (ordersBody) {
        const filteredOrders = orders.filter(o => filterBySelectedPeriod(o.date));
        ordersBody.innerHTML = filteredOrders.slice(-10).reverse().map(order => {
            const date = new Date(order.date);
            return `
                <tr>
                    <td>${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                    <td><strong>${order.size}</strong></td>
                    <td>R$ ${order.value.toFixed(2).replace('.', ',')}</td>
                    <td><button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')">Excluir</button></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="4" style="text-align:center;">Nenhum pedido neste período</td></tr>';
    }

    const expensesBody = document.getElementById('table-expenses-body');
    if (expensesBody) {
        const filteredExpenses = expenses.filter(e => filterBySelectedPeriod(e.date));
        expensesBody.innerHTML = filteredExpenses.slice(-10).reverse().map(expense => {
            const date = new Date(expense.date);
            return `
                <tr>
                    <td>${date.toLocaleDateString('pt-BR')}</td>
                    <td><strong>${expense.description}</strong></td>
                    <td>R$ ${expense.value.toFixed(2).replace('.', ',')}</td>
                    <td><button class="btn btn-sm btn-danger" onclick="deleteExpense('${expense.id}')">Excluir</button></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="4" style="text-align:center;">Nenhuma despesa neste período</td></tr>';
    }

    // Render Consolidated Cash Flow
    const cashflowBody = document.getElementById('table-cashflow-body');
    if (cashflowBody) {
        const cashFlowList = [
            ...orders.filter(o => filterBySelectedPeriod(o.date)).map(o => ({
                id: o.id,
                date: new Date(o.date),
                type: 'entry',
                desc: `Venda - Copo ${o.size}`,
                value: o.value
            })),
            ...expenses.filter(e => filterBySelectedPeriod(e.date)).map(e => ({
                id: e.id,
                date: new Date(e.date),
                type: 'expense',
                desc: `Despesa - ${e.description}`,
                value: e.value
            }))
        ];

        // Sort by date descending
        cashFlowList.sort((a, b) => b.date - a.date);

        cashflowBody.innerHTML = cashFlowList.slice(0, 15).map(item => {
            const dateStr = item.date.toLocaleDateString('pt-BR') + ' ' + item.date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            const typeBadge = item.type === 'entry' 
                ? `<span class="badge-cashflow entry">Receita</span>`
                : `<span class="badge-cashflow expense">Despesa</span>`;
            const valClass = item.type === 'entry' ? 'cashflow-entry' : 'cashflow-expense';
            const prefix = item.type === 'entry' ? '+' : '-';

            return `
                <tr>
                    <td>${dateStr}</td>
                    <td>${typeBadge}</td>
                    <td><strong>${item.desc}</strong></td>
                    <td class="${valClass}">${prefix} R$ ${item.value.toFixed(2).replace('.', ',')}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="4" style="text-align:center;">Nenhuma movimentação registrada neste período</td></tr>';
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

/* --- TAB 2: ESTOQUE --- */
function initInventoryForm() {
    const form = document.getElementById('form-inventory');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('inventory-id').value;
        const name = document.getElementById('inventory-name').value.trim();
        const qty = parseFloat(document.getElementById('inventory-qty').value);
        const minQty = parseFloat(document.getElementById('inventory-min-qty').value);
        const unit = document.getElementById('inventory-unit').value.trim();
        const linkedItem = document.getElementById('inventory-link').value;

        if (!name || isNaN(qty) || isNaN(minQty) || !unit) {
            alert('Preencha os campos de estoque corretamente!');
            return;
        }

        window.storeAPI.saveInventoryItem({
            id: id || undefined,
            name,
            qty,
            minQty,
            unit,
            linkedItem: linkedItem || null
        });

        form.reset();
        document.getElementById('inventory-id').value = '';
        document.getElementById('inventory-form-title').textContent = '➕ Cadastrar/Editar Item';
        renderAdminData();
        showToast('Item de estoque salvo!');
    });
}

function renderInventory(data) {
    const inventory = data.inventory || [];
    
    // Update dashboard summary
    if (document.getElementById('inv-stat-total')) document.getElementById('inv-stat-total').textContent = inventory.length;

    const alertCount = inventory.filter(item => item.qty <= item.minQty).length;
    const alertEl = document.getElementById('inv-stat-alert');
    if (alertEl) {
        alertEl.textContent = alertCount;
        alertEl.className = alertCount > 0 ? 'stat-value alarm-critical' : 'stat-value';
    }

    const tbody = document.getElementById('table-inventory-body');
    if (!tbody) return;

    tbody.innerHTML = inventory.map(item => {
        let statusBadge = '<span class="status-badge status-ok">OK</span>';
        if (item.qty === 0) {
            statusBadge = '<span class="status-badge status-out">Esgotado</span>';
        } else if (item.qty <= item.minQty) {
            statusBadge = '<span class="status-badge status-low">Crítico</span>';
        }

        let linkLabel = '';
        if (item.linkedItem) {
            const size = data.sizes.find(s => s.id === item.linkedItem);
            if (size) {
                linkLabel = `<br><span class="linked-badge">🔗 Copo ${size.size}</span>`;
            } else {
                const allToppings = [
                    ...(data.toppings.coberturas || []),
                    ...(data.toppings.frutas || []),
                    ...(data.toppings.completamentos || [])
                ];
                const topping = allToppings.find(t => t.id === item.linkedItem);
                if (topping) {
                    linkLabel = `<br><span class="linked-badge">🔗 Adic. ${topping.name}</span>`;
                }
            }
        }

        return `
            <tr>
                <td>
                    <strong>${item.name}</strong>
                    ${linkLabel}
                </td>
                <td><strong>${item.qty}</strong></td>
                <td>${item.minQty}</td>
                <td><small>${item.unit}</small></td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-edit" onclick="changeInventoryQty('${item.id}', 10)">+10</button>
                        <button class="btn btn-sm btn-edit" onclick="changeInventoryQty('${item.id}', -10)">-10</button>
                        <button class="btn btn-sm btn-edit" style="border-color: var(--lime); color: var(--lime);" onclick="editInventoryItem('${item.id}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteInventoryItem('${item.id}')">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="6" style="text-align:center;">Nenhum item cadastrado no estoque.</td></tr>';
}

window.changeInventoryQty = function(id, delta) {
    const data = window.storeAPI.getData();
    const item = data.inventory.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, parseFloat((item.qty + delta).toFixed(2)));
    window.storeAPI.saveInventoryItem({
        ...item,
        qty: newQty
    });
    renderAdminData();
    showToast(`Estoque ajustado: ${newQty} ${item.unit}`);
};

window.editInventoryItem = function(id) {
    const data = window.storeAPI.getData();
    const item = data.inventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById('inventory-id').value = item.id;
    document.getElementById('inventory-name').value = item.name;
    document.getElementById('inventory-qty').value = item.qty;
    document.getElementById('inventory-min-qty').value = item.minQty;
    document.getElementById('inventory-unit').value = item.unit;
    document.getElementById('inventory-link').value = item.linkedItem || '';

    document.getElementById('inventory-form-title').textContent = '✏️ Editar Item de Estoque';
    showToast(`Editando ${item.name}`);
};

window.deleteInventoryItem = function(id) {
    if (confirm('Deseja excluir este item do estoque?')) {
        window.storeAPI.deleteInventoryItem(id);
        renderAdminData();
        showToast('Item excluído do estoque!');
    }
};

/* --- TAB 3: PREÇOS & TAMANHOS --- */
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
        const photo = document.getElementById('price-photo').value.trim() || 'acai.jpg';

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
            badge: badge || undefined,
            photo
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
    tbody.innerHTML = sizes.map(s => `
        <tr>
            <td>
                <img src="${s.photo || 'acai.jpg'}" style="width:32px; height:32px; object-fit:contain; border-radius:4px; margin-right:8px; vertical-align:middle; background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle);">
                <strong>${s.size}</strong> ${s.badge ? `<span class="badge-pill">${s.badge}</span>` : ''}
            </td>
            <td>R$ ${s.price.toFixed(2)}</td>
            <td>${s.promoPrice ? `R$ ${s.promoPrice.toFixed(2)}` : '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-edit" onclick="editPrice('${s.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePrice('${s.id}')">Excluir</button>
                </div>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;">Nenhum preço cadastrado</td></tr>';
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
    document.getElementById('price-photo').value = sizeObj.photo || '';
    showToast(`Editando ${sizeObj.size}`);
};

window.deletePrice = function(id) {
    if (confirm('Deseja excluir este tamanho?')) {
        window.storeAPI.deletePrice(id);
        renderAdminData();
        showToast('Tamanho excluído!');
    }
};

/* --- TAB 4: PROMOÇÕES --- */
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
        const active = document.getElementById('promo-active').checked;

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
            active
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
    tbody.innerHTML = promotions.map(p => `
        <tr>
            <td>
                <strong>${p.title}</strong><br>
                <small style="color: var(--cream-muted)">${p.description}</small>
            </td>
            <td><span class="status-badge status-ok">${p.discount}</span></td>
            <td>${p.active ? '<span class="status-badge status-ok">ATIVA</span>' : '<span class="status-badge status-low">INATIVA</span>'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-edit" onclick="togglePromo('${p.id}')">${p.active ? 'Pausar' : 'Ativar'}</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePromo('${p.id}')">Excluir</button>
                </div>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;">Nenhuma promoção cadastrada</td></tr>';
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

/* --- TAB 5: FOTOS & IMAGENS --- */
function initPhotosForm() {
    const form = document.getElementById('form-photos');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const heroCup = document.getElementById('photo-hero').value.trim();
        const logo = document.getElementById('photo-logo').value.trim();
        const promoBanner = document.getElementById('photo-banner').value.trim();
        const cup300 = document.getElementById('photo-cup300').value.trim();
        const cup400 = document.getElementById('photo-cup400').value.trim();
        const cup500 = document.getElementById('photo-cup500').value.trim();
        const cup770 = document.getElementById('photo-cup770').value.trim();

        window.storeAPI.updatePhotos({ heroCup, logo, promoBanner, cup300, cup400, cup500, cup770 });
        showToast('Imagens atualizadas!');
    });
}

function renderPhotosFormValues(photos) {
    if (!photos) return;
    if (document.getElementById('photo-hero')) document.getElementById('photo-hero').value = photos.heroCup || '';
    if (document.getElementById('photo-logo')) document.getElementById('photo-logo').value = photos.logo || '';
    if (document.getElementById('photo-banner')) document.getElementById('photo-banner').value = photos.promoBanner || '';
    if (document.getElementById('photo-cup300')) document.getElementById('photo-cup300').value = photos.cup300 || '';
    if (document.getElementById('photo-cup400')) document.getElementById('photo-cup400').value = photos.cup400 || '';
    if (document.getElementById('photo-cup500')) document.getElementById('photo-cup500').value = photos.cup500 || '';
    if (document.getElementById('photo-cup770')) document.getElementById('photo-cup770').value = photos.cup770 || '';
}

/* --- TAB 6: ADICIONAIS & INGREDIENTES --- */
function initToppingsForm() {
    const form = document.getElementById('form-topping');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('topping-category-select').value;
        const name = document.getElementById('topping-name').value.trim();
        const color = document.getElementById('topping-color').value;
        const icon = document.getElementById('topping-icon').value.trim();
        const isNew = document.getElementById('topping-new').checked;

        if (!name || !icon) {
            alert('Preencha o nome e o emoji do adicional!');
            return;
        }

        window.storeAPI.saveTopping(category, { name, color, icon, isNew });
        form.reset();
        renderAdminData();
        showToast('Adicional adicionado!');
    });
}

function renderToppingsTable(toppings) {
    renderFilteredToppings();
}

function renderFilteredToppings() {
    const data = window.storeAPI.getData();
    const select = document.getElementById('topping-category-select');
    const container = document.getElementById('table-toppings-body');
    if (!container || !select || !data.toppings) return;

    const cat = select.value;
    const list = data.toppings[cat] || [];

    container.innerHTML = `
        <table class="crud-table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Cor</th>
                    <th>Ícone</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(item => `
                    <tr>
                        <td>
                            <strong>${item.name}</strong> 
                            ${item.isNew ? '<span class="status-badge status-ok" style="padding: 2px 6px; font-size: 10px;">Novo</span>' : ''}
                        </td>
                        <td>
                            <span style="display:inline-block; width:20px; height:20px; border-radius:50%; background:${item.color}; border:1px solid rgba(255,255,255,0.1)"></span>
                        </td>
                        <td>${item.icon || ''}</td>
                        <td>
                            <div class="action-btns">
                                <button class="btn btn-sm btn-danger" onclick="deleteToppingItem('${cat}', '${item.id}')">Excluir</button>
                            </div>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="4" style="text-align:center;">Nenhum item nesta categoria</td></tr>'}
            </tbody>
        </table>
    `;
}

window.deleteToppingItem = function(cat, id) {
    if (confirm('Remover este adicional?')) {
        window.storeAPI.deleteTopping(cat, id);
        renderAdminData();
        showToast('Adicional removido!');
    }
};

/* --- TAB 7: BAIRROS & TAXAS DE ENTREGA --- */
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
    tbody.innerHTML = locations.map(loc => `
        <tr>
            <td><strong>${loc.name}</strong></td>
            <td>R$ ${loc.fee.toFixed(2)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-edit" onclick="editDelivery('${loc.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDelivery('${loc.id}')">Excluir</button>
                </div>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="text-align:center;">Nenhum bairro cadastrado</td></tr>';
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

