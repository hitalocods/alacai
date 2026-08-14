/**
 * AL Açaí - Main Frontend Application Logic
 */

const WHATSAPP_NUMBER = "5586999128202";

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

    // Subscribe to store API changes
    window.storeAPI.subscribe((data) => {
        renderUI(data);
    });

    // Initial Render
    renderUI(window.storeAPI.getData());
}

function renderUI(data) {
    renderMenuGrid(data.sizes);
    renderBuilderOptions(data.sizes, data.toppings);
    renderDeliveryOptions(data.deliveryLocations);
    updateOrderSummary();
}

function renderHeroPhoto(photos) {
    const heroArtContainer = document.getElementById('hero-art-container');
    if (!heroArtContainer) return;

    if (photos && photos.heroCup) {
        heroArtContainer.innerHTML = `
            <img src="${photos.heroCup}" alt="Açaí AL Açaí" class="hero-img-custom float-cup">
        `;
    } else {
        heroArtContainer.innerHTML = `
            <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g class="spin-slow" opacity="0.45">
                    <circle cx="200" cy="200" r="188" fill="none" stroke="#9B51E0" stroke-width="1.5" stroke-dasharray="3 12" />
                </g>
                <g class="float-cup">
                    <ellipse cx="200" cy="335" rx="120" ry="16" fill="#19082B" opacity="0.5" />
                    <path d="M64 190 C64 280 130 322 200 322 C270 322 336 280 336 190 Z" fill="#42166B" />
                    <path d="M78 190 C78 268 138 308 200 308 C262 308 322 268 322 190 Z" fill="#58218B" />
                    <ellipse cx="200" cy="188" rx="132" ry="54" fill="#7832B6" />
                    <ellipse cx="200" cy="182" rx="120" ry="46" fill="#9B51E0" />
                    <circle cx="150" cy="168" r="9" fill="#FFB800" />
                    <circle cx="178" cy="150" r="7" fill="#FFB800" />
                    <circle cx="212" cy="160" r="9" fill="#FF3366" />
                    <circle cx="246" cy="176" r="7" fill="#FF3366" />
                    <circle cx="200" cy="140" r="6" fill="#FFF9EF" />
                    <path d="M120 156 Q200 118 280 156" stroke="#FFF9EF" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.9" />
                    <rect x="272" y="90" width="12" height="92" rx="6" fill="#EADBC8" transform="rotate(20 278 136)" />
                </g>
            </svg>
        `;
    }
}

function renderPromotions(promotions) {
    const promoContainer = document.getElementById('promo-grid-container');
    const promoSection = document.getElementById('promotions-section');
    if (!promoContainer || !promoSection) return;

    const activePromos = promotions ? promotions.filter(p => p.active) : [];
    if (activePromos.length === 0) {
        promoSection.style.display = 'none';
        return;
    }

    promoSection.style.display = 'block';
    promoContainer.innerHTML = activePromos.map(p => `
        <div class="promo-card">
            <div class="promo-top">
                <span class="badge badge-berry">${p.badge || 'OFERTA'}</span>
                <span style="color: var(--lime); font-weight: 800; font-size: 15px;">${p.discount}</span>
            </div>
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <button class="btn-promo-select" onclick="selectPromoTarget('${p.targetSize}')">
                Quero Aproveitar ➔
            </button>
        </div>
    `).join('');
}

window.selectPromoTarget = function(targetSize) {
    const sizeRadio = document.querySelector(`input[name="tamanho"][value="${targetSize}"]`);
    if (sizeRadio) {
        sizeRadio.checked = true;
        updateOrderSummary();
    }
    const builderSection = document.getElementById('pedido');
    if (builderSection) {
        builderSection.scrollIntoView({ behavior: 'smooth' });
    }
};

function renderMenuGrid(sizes) {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid || !sizes) return;

    menuGrid.innerHTML = sizes.map(s => {
        const hasPromo = s.promoPrice !== null && s.promoPrice !== undefined && s.promoPrice < s.price;
        const currentPrice = hasPromo ? s.promoPrice : s.price;

        return `
            <div class="menu-card ${s.popular ? 'popular' : ''}">
                ${s.badge ? `<div class="badge-card">${s.badge}</div>` : ''}
                <div class="cup-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--purple-700)" stroke-width="2">
                        <path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/>
                        <line x1="6" y1="2" x2="6" y2="4"/>
                        <line x1="10" y1="2" x2="10" y2="4"/>
                        <line x1="14" y1="2" x2="14" y2="4"/>
                    </svg>
                </div>
                <div class="size">${s.size}</div>
                <div class="price-box">
                    ${hasPromo ? `<span class="old-price">R$ ${s.price.toFixed(2)}</span>` : ''}
                    <div class="price ${hasPromo ? 'promo' : ''}">R$ ${currentPrice.toFixed(2).replace('.', ',')}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderBuilderOptions(sizes, toppings) {
    const sizeContainer = document.getElementById('size-options');
    if (sizeContainer && sizes) {
        const currentChecked = document.querySelector('input[name="tamanho"]:checked')?.value || sizes[0]?.size;
        sizeContainer.innerHTML = sizes.map(s => {
            const hasPromo = s.promoPrice !== null && s.promoPrice !== undefined && s.promoPrice < s.price;
            const finalPrice = hasPromo ? s.promoPrice : s.price;
            const isChecked = s.size === currentChecked ? 'checked' : '';

            return `
                <label class="chip">
                    <input type="radio" name="tamanho" value="${s.size}" data-price="${finalPrice}" ${isChecked}>
                    <span>${s.size} · R$ ${finalPrice.toFixed(2).replace('.', ',')}</span>
                </label>
            `;
        }).join('');
    }

    if (toppings) {
        renderToppingCategory('coberturas-container', toppings.coberturas || []);
        renderToppingCategory('frutas-container', toppings.frutas || []);
        renderToppingCategory('completamentos-container', toppings.completamentos || []);
    }

    // Attach Event Listeners
    const allInputs = document.querySelectorAll('input[name="tamanho"], .adicional');
    allInputs.forEach(el => el.removeEventListener('change', updateOrderSummary));
    allInputs.forEach(el => el.addEventListener('change', updateOrderSummary));

    const obs = document.getElementById('obs');
    if (obs) {
        obs.removeEventListener('input', updateOrderSummary);
        obs.addEventListener('input', updateOrderSummary);
    }

    const sendBtn = document.getElementById('send-order');
    if (sendBtn) {
        sendBtn.onclick = sendWhatsAppOrder;
    }

    const mobileSendBtn = document.getElementById('mobile-send-order');
    if (mobileSendBtn) {
        mobileSendBtn.onclick = sendWhatsAppOrder;
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

    const sizeInput = document.querySelector('input[name="tamanho"]:checked');
    const selectedAdicionais = Array.from(document.querySelectorAll('.adicional:checked'));
    const totalSelected = selectedAdicionais.length;
    const extraCount = Math.max(0, totalSelected - FREE_LIMIT);

    const basePrice = sizeInput ? parseFloat(sizeInput.dataset.price) : 0;
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
        if (sizeInput) {
            const li = document.createElement('li');
            li.innerHTML = `<span>Açaí ${sizeInput.value}</span><span>R$ ${basePrice.toFixed(2).replace('.', ',')}</span>`;
            summaryList.appendChild(li);
        }
        if (selectedAdicionais.length > 0) {
            const li = document.createElement('li');
            const itemsStr = selectedAdicionais.map(a => a.value).join(', ');
            li.innerHTML = `<span>Adicionais (${selectedAdicionais.length})</span><span style="font-size:12.5px; max-width:180px;">${itemsStr}</span>`;
            summaryList.appendChild(li);
        }
        if (extraCount > 0) {
            const li = document.createElement('li');
            li.className = 'extra';
            li.innerHTML = `<span>+${extraCount} extra(s) fora da cota</span><span>+ R$ ${extraTotal.toFixed(2).replace('.', ',')}</span>`;
            summaryList.appendChild(li);
        }
        if (deliveryFee > 0 && deliveryLocation) {
            const li = document.createElement('li');
            li.innerHTML = `<span>Taxa de entrega (${deliveryLocation.name})</span><span>R$ ${deliveryFee.toFixed(2).replace('.', ',')}</span>`;
            summaryList.appendChild(li);
        }
    }

    // Total Elements
    const totalPriceEl = document.getElementById('total-price');
    if (totalPriceEl) {
        totalPriceEl.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
    }

    // Mobile Checkout Bar
    const mobileTotalVal = document.getElementById('mobile-total-val');
    if (mobileTotalVal) {
        mobileTotalVal.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
    }

    // Free Meter
    const freeMeter = document.getElementById('free-meter');
    if (freeMeter) {
        freeMeter.classList.toggle('over', extraCount > 0);
        if (extraCount > 0) {
            freeMeter.innerHTML = `<strong>${FREE_LIMIT}</strong> de ${FREE_LIMIT} grátis usados · <strong>+${extraCount}</strong> extra(s) (+R$ ${extraTotal.toFixed(2)})`;
        } else {
            freeMeter.innerHTML = `<strong>${totalSelected}</strong> de ${FREE_LIMIT} adicionais grátis usados`;
        }
    }

    // Warning when reaching 7 adicionais
    if (totalSelected === FREE_LIMIT) {
        freeMeter.style.background = 'rgba(212, 241, 55, 0.2)';
        freeMeter.style.border = '1px solid var(--lime)';
    } else {
        freeMeter.style.background = '';
        freeMeter.style.border = '';
    }

    // Topping Counts
    const compCount = document.getElementById('comp-count');
    if (compCount) {
        compCount.textContent = `${totalSelected} selecionado${totalSelected === 1 ? '' : 's'}`;
    }

    // SVG Bowl Sprinkles Animation
    const sprinkles = document.querySelectorAll('.sprinkle');
    sprinkles.forEach((s, idx) => {
        s.classList.toggle('on', idx < totalSelected);
    });
}

function sendWhatsAppOrder() {
    const sizeInput = document.querySelector('input[name="tamanho"]:checked');
    const hint = document.getElementById('hint');

    if (!sizeInput) {
        if (hint) hint.style.display = 'block';
        alert('Por favor, selecione um tamanho de copo.');
        return;
    }
    if (hint) hint.style.display = 'none';

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

    // Address and payment validation
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

    const basePrice = parseFloat(sizeInput.dataset.price);
    const extraTotal = extraCount * EXTRA_PRICE;
    const deliveryFee = deliveryLocation ? deliveryLocation.fee : 0;
    const total = basePrice + extraTotal + deliveryFee;

    let msg = `✨ *Novo Pedido - AL Açaí* ✨%0A%0A`;
    msg += `🥤 *Tamanho:* ${sizeInput.value} (R$ ${basePrice.toFixed(2).replace('.', ',')})%0A`;
    
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
            size: sizeInput.value,
            toppings: selectedAdicionais,
            date: new Date().toISOString()
        });
    } catch (e) {
        console.error('Erro ao salvar pedido para controle de estoque:', e);
    }

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
}
