/**
 * AL Açaí - Main Frontend Application Logic
 */

const WHATSAPP_NUMBER = "5586999128202";
let currentSelectedSize = '';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Header scroll background effect
    const header = document.getElementById('site-header');
    window.addEventListener('scroll', () => {
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 16);
        }
    });

    // Close modal listener
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCustomizer);
    }

    const modalOverlay = document.getElementById('customizer-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeCustomizer();
        });
    }

    // Subscribe to store API changes
    window.storeAPI.subscribe((data) => {
        renderUI(data);
    });

    // Initial Render
    renderUI(window.storeAPI.getData());
}

function renderUI(data) {
    renderCoposGrid(data.sizes, data.photos);
    renderBuilderOptions(data.toppings);
    renderDeliveryOptions(data.deliveryLocations);
    updateOrderSummary();
}

function renderCoposGrid(sizes, photos) {
    const coposGrid = document.getElementById('copos-grid');
    if (!coposGrid || !sizes) return;

    coposGrid.innerHTML = sizes.map(s => {
        const hasPromo = s.promoPrice !== null && s.promoPrice !== undefined && s.promoPrice < s.price;
        const currentPrice = hasPromo ? s.promoPrice : s.price;

        const photoUrl = s.photo || '';
        
        let imgHtml = '';
        if (photoUrl) {
            imgHtml = `<img src="${photoUrl}" alt="Açaí ${s.size}" class="copo-img">`;
        } else {
            // Elegant SVG representation
            imgHtml = `
                <svg viewBox="0 0 100 120" class="copo-img" fill="none" stroke="var(--lime)" stroke-width="2" style="width: 100px; height: 100px;">
                    <path d="M18 15 L82 15 L72 105 L28 105 Z" fill="#58218B" stroke="var(--lime)" stroke-width="2" />
                    <ellipse cx="50" cy="15" rx="32" ry="8" fill="#7832B6" stroke="var(--lime)" stroke-width="1.5" />
                    <ellipse cx="50" cy="13" rx="26" ry="6" fill="#FF3366" />
                </svg>
            `;
        }

        return `
            <div class="copo-card" onclick="openCustomizer('${s.size}')">
                ${s.badge ? `<div class="badge-card">${s.badge}</div>` : ''}
                <div class="copo-card-top">
                    <div class="copo-img-wrapper">
                        ${imgHtml}
                    </div>
                    <div class="copo-details">
                        <h3>Açaí ${s.size}</h3>
                        <div class="price">R$ ${currentPrice.toFixed(2).replace('.', ',')}</div>
                    </div>
                </div>
                <div class="copo-card-bottom">
                    <button class="btn-select">Escolher Adicionais</button>
                </div>
            </div>
        `;
    }).join('');
}

window.openCustomizer = function(size) {
    currentSelectedSize = size;
    
    const modal = document.getElementById('customizer-modal');
    if (modal) modal.classList.add('active');

    const modalTitle = document.getElementById('modal-selected-size');
    if (modalTitle) modalTitle.textContent = `Açaí ${size}`;

    // Reset inputs inside modal
    document.querySelectorAll('.adicional').forEach(el => el.checked = false);
    const obs = document.getElementById('obs');
    if (obs) obs.value = '';
    const bairro = document.getElementById('bairro');
    if (bairro) bairro.value = '';
    const endereco = document.getElementById('endereco');
    if (endereco) endereco.value = '';
    const pagamento = document.getElementById('pagamento');
    if (pagamento) pagamento.value = '';

    updateOrderSummary();
};

window.closeCustomizer = function() {
    const modal = document.getElementById('customizer-modal');
    if (modal) modal.classList.remove('active');
};

function renderBuilderOptions(toppings) {
    if (toppings) {
        renderToppingCategory('coberturas-container', toppings.coberturas || []);
        renderToppingCategory('frutas-container', toppings.frutas || []);
        renderToppingCategory('completamentos-container', toppings.completamentos || []);
    }

    // Attach Event Listeners inside customizer
    const allInputs = document.querySelectorAll('.adicional');
    allInputs.forEach(el => {
        el.removeEventListener('change', updateOrderSummary);
        el.addEventListener('change', updateOrderSummary);
    });

    const obs = document.getElementById('obs');
    if (obs) {
        obs.removeEventListener('input', updateOrderSummary);
        obs.addEventListener('input', updateOrderSummary);
    }

    const sendBtn = document.getElementById('send-order');
    if (sendBtn) {
        sendBtn.onclick = sendWhatsAppOrder;
    }
}

function renderToppingCategory(containerId, list) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = list.map(item => `
        <label class="topping">
            <input type="checkbox" value="${item.name}" class="adicional">
            <span>
                ${item.icon ? `<span class="icon">${item.icon}</span>` : ''}
                ${item.name}
                ${item.isNew ? `<span class="novo">Novo</span>` : ''}
            </span>
        </label>
    `).join('');
}

function renderDeliveryOptions(locations) {
    const bairroSelect = document.getElementById('bairro');
    if (!bairroSelect || !locations) return;

    const currentSelection = bairroSelect.value;
    bairroSelect.innerHTML = '<option value="">Selecione seu bairro</option>';
    
    locations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc.id;
        option.textContent = `${loc.name} - R$ ${loc.fee.toFixed(2).replace('.', ',')}`;
        if (loc.id === currentSelection) option.selected = true;
        bairroSelect.appendChild(option);
    });

    bairroSelect.removeEventListener('change', updateOrderSummary);
    bairroSelect.addEventListener('change', updateOrderSummary);
}

function updateOrderSummary() {
    const store = window.storeAPI.getData();
    const FREE_LIMIT = store.freeLimit || 7;
    const EXTRA_PRICE = store.extraPrice || 1.0;

    const sizeObj = store.sizes.find(s => s.size === currentSelectedSize);
    const hasPromo = sizeObj && sizeObj.promoPrice !== null && sizeObj.promoPrice !== undefined && sizeObj.promoPrice < sizeObj.price;
    const basePrice = sizeObj ? (hasPromo ? sizeObj.promoPrice : sizeObj.price) : 0;

    const selectedAdicionais = Array.from(document.querySelectorAll('.adicional:checked'));
    const totalSelected = selectedAdicionais.length;
    const extraCount = Math.max(0, totalSelected - FREE_LIMIT);
    const extraTotal = extraCount * EXTRA_PRICE;
    
    // Delivery fee calculation
    const bairroSelect = document.getElementById('bairro');
    const selectedBairroId = bairroSelect ? bairroSelect.value : '';
    const deliveryLocation = store.deliveryLocations ? store.deliveryLocations.find(l => l.id === selectedBairroId) : null;
    const deliveryFee = deliveryLocation ? deliveryLocation.fee : 0;
    
    const finalTotal = basePrice + extraTotal + deliveryFee;

    // Summary List
    const summaryList = document.getElementById('summary-list');
    if (summaryList) {
        summaryList.innerHTML = '';
        if (sizeObj) {
            const li = document.createElement('li');
            li.innerHTML = `<span>Açaí ${sizeObj.size}</span><span>R$ ${basePrice.toFixed(2).replace('.', ',')}</span>`;
            summaryList.appendChild(li);
        }
        if (selectedAdicionais.length > 0) {
            const li = document.createElement('li');
            const itemsStr = selectedAdicionais.map(a => a.value).join(', ');
            li.innerHTML = `<span style="font-size: 13px; color: var(--cream-muted); display: block; max-width: 220px; word-wrap: break-word; text-align: left;">Adicionais: ${itemsStr}</span>`;
            summaryList.appendChild(li);
        }
        if (extraCount > 0) {
            const li = document.createElement('li');
            li.innerHTML = `<span>Extras (${extraCount})</span><span>+R$ ${extraTotal.toFixed(2).replace('.', ',')}</span>`;
            summaryList.appendChild(li);
        }
        if (deliveryLocation) {
            const li = document.createElement('li');
            li.innerHTML = `<span>Entrega (${deliveryLocation.name})</span><span>R$ ${deliveryFee.toFixed(2).replace('.', ',')}</span>`;
            summaryList.appendChild(li);
        }
    }

    // Total Price Update
    const totalPriceEl = document.getElementById('total-price');
    if (totalPriceEl) {
        totalPriceEl.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
    }

    // Free Toppings Meter Update
    const freeMeter = document.getElementById('free-meter');
    if (freeMeter) {
        freeMeter.classList.toggle('over', extraCount > 0);
        if (extraCount > 0) {
            freeMeter.innerHTML = `<strong>${FREE_LIMIT}</strong> de ${FREE_LIMIT} grátis usados · <strong>+${extraCount}</strong> extra(s) (+R$ ${extraTotal.toFixed(2).replace('.', ',')})`;
        } else {
            freeMeter.innerHTML = `<strong>${totalSelected}</strong> de ${FREE_LIMIT} adicionais grátis usados`;
        }
        
        if (totalSelected === FREE_LIMIT) {
            freeMeter.style.background = 'rgba(212, 241, 55, 0.2)';
            freeMeter.style.border = '1px solid var(--lime)';
        } else {
            freeMeter.style.background = '';
            freeMeter.style.border = '';
        }
    }

    // SVG Bowl Sprinkles Animation
    const sprinkles = document.querySelectorAll('.sprinkle');
    sprinkles.forEach((s, idx) => {
        s.classList.toggle('on', idx < totalSelected);
    });

    // Topping Counts
    const compCount = document.getElementById('comp-count');
    if (compCount) {
        compCount.textContent = `${totalSelected} selecionado${totalSelected === 1 ? '' : 's'}`;
    }
}

function sendWhatsAppOrder() {
    if (!currentSelectedSize) {
        alert('Por favor, selecione um tamanho de copo.');
        return;
    }

    const store = window.storeAPI.getData();
    const FREE_LIMIT = store.freeLimit || 7;
    const EXTRA_PRICE = store.extraPrice || 1.0;

    const selectedAdicionais = Array.from(document.querySelectorAll('.adicional:checked')).map(a => a.value);
    const extraCount = Math.max(0, selectedAdicionais.length - FREE_LIMIT);
    const obsField = document.getElementById('obs');
    const obs = obsField ? obsField.value.trim() : '';

    // Delivery info
    const bairroSelect = document.getElementById('bairro');
    const selectedBairroId = bairroSelect ? bairroSelect.value : '';
    const deliveryLocation = store.deliveryLocations ? store.deliveryLocations.find(l => l.id === selectedBairroId) : null;
    
    if (!selectedBairroId) {
        alert('Por favor, selecione seu bairro para entrega.');
        return;
    }

    const enderecoField = document.getElementById('endereco');
    const endereco = enderecoField ? enderecoField.value.trim() : '';
    
    const pagamentoSelect = document.getElementById('pagamento');
    const pagamento = pagamentoSelect ? pagamentoSelect.value : '';

    if (!endereco) {
        alert('Por favor, informe seu endereço completo.');
        return;
    }

    if (!pagamento) {
        alert('Por favor, selecione a forma de pagamento.');
        return;
    }

    const sizeObj = store.sizes.find(s => s.size === currentSelectedSize);
    const hasPromo = sizeObj && sizeObj.promoPrice !== null && sizeObj.promoPrice !== undefined && sizeObj.promoPrice < sizeObj.price;
    const basePrice = sizeObj ? (hasPromo ? sizeObj.promoPrice : sizeObj.price) : 0;
    
    const extraTotal = extraCount * EXTRA_PRICE;
    const deliveryFee = deliveryLocation ? deliveryLocation.fee : 0;
    const total = basePrice + extraTotal + deliveryFee;

    let msg = `✨ *Novo Pedido - AL Açaí* ✨%0A%0A`;
    msg += `🥤 *Tamanho:* ${currentSelectedSize} (R$ ${basePrice.toFixed(2).replace('.', ',')})%0A`;
    
    if (selectedAdicionais.length > 0) {
        msg += `🍧 *Adicionais (${selectedAdicionais.length}):*%0A - ${selectedAdicionais.join('%0A - ')}%0A`;
    } else {
        msg += `🍧 *Adicionais:* Nenhum%0A`;
    }

    if (extraCount > 0) {
        msg += `⚠️ *Adicionais Extras:* ${extraCount} (+R$ ${ (extraCount * EXTRA_PRICE).toFixed(2).replace('.', ',') })%0A`;
    }

    if (obs) {
        msg += `📝 *Observação:* ${encodeURIComponent(obs)}%0A`;
    }

    msg += `%0A🏠 *Endereço:* ${encodeURIComponent(endereco)}%0A`;
    msg += `📍 *Bairro:* ${deliveryLocation ? deliveryLocation.name : 'Não informado'}%0A`;
    msg += `🛵 *Taxa de Entrega:* R$ ${deliveryFee.toFixed(2).replace('.', ',')}%0A`;
    msg += `💳 *Forma de Pagamento:* ${pagamento}%0A`;
    msg += `%0A💰 *Total:* R$ ${total.toFixed(2).replace('.', ',')}`;

    // Salva o pedido para registrar estatísticas e dar baixa no estoque
    try {
        window.storeAPI.saveOrder({
            value: total,
            size: currentSelectedSize,
            toppings: selectedAdicionais,
            date: new Date().toISOString()
        });
    } catch (e) {
        console.error('Erro ao salvar pedido para controle de estoque:', e);
    }

    closeCustomizer();
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}
