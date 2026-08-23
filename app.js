/**
 * AL Açaí - Main Frontend Application Logic
 */

const WHATSAPP_NUMBER = "5586999128202";
let currentSelectedSize = '';

// Preços fixos promocionais da Quinta Maluca
const QUINTA_MALUCA_PRICES = {
    '300 ml': 12,
    '400 ml': 15,
    '500 ml': 18,
    '770 ml': 25
};

function isQuintaMaluca() {
    // Retorna true se hoje for quinta-feira (getDay() === 4)
    return new Date().getDay() === 4;
}

function getEffectiveSizePrice(sizeObj) {
    if (!sizeObj) return { basePrice: 0, originalPrice: 0, isPromo: false, promoLabel: '' };

    const isThu = isQuintaMaluca();
    if (isThu && QUINTA_MALUCA_PRICES[sizeObj.size] !== undefined) {
        return {
            basePrice: QUINTA_MALUCA_PRICES[sizeObj.size],
            originalPrice: sizeObj.price,
            isPromo: true,
            promoLabel: 'Quinta Maluca'
        };
    }

    if (sizeObj.promoPrice !== null && sizeObj.promoPrice !== undefined && sizeObj.promoPrice < sizeObj.price) {
        return {
            basePrice: sizeObj.promoPrice,
            originalPrice: sizeObj.price,
            isPromo: true,
            promoLabel: 'Promoção'
        };
    }

    return {
        basePrice: sizeObj.price,
        originalPrice: sizeObj.price,
        isPromo: false,
        promoLabel: ''
    };
}

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
    renderQuintaMalucaBanner();
    renderCoposGrid(data.sizes, data.photos);
    renderBuilderOptions(data.toppings);
    renderDeliveryOptions(data.deliveryLocations);
    updateOrderSummary();
}

function renderQuintaMalucaBanner() {
    const bannerContainer = document.getElementById('quinta-maluca-banner-container');
    if (!bannerContainer) return;

    if (isQuintaMaluca()) {
        bannerContainer.innerHTML = `
            <div class="quinta-maluca-banner">
                <div class="qmb-glow"></div>
                <div class="qmb-content">
                    <div class="qmb-badge">🔥 HOJE É QUINTA MALUCA! 🔥</div>
                    <div class="qmb-title">Preços Especiais em Todos os Copos</div>
                    <div class="qmb-desc">300ml por R$ 12,00 • 400ml por R$ 15,00 • 500ml por R$ 18,00 • 770ml por R$ 25,00</div>
                </div>
            </div>
        `;
        bannerContainer.style.display = 'block';
    } else {
        bannerContainer.innerHTML = '';
        bannerContainer.style.display = 'none';
    }
}

function renderCoposGrid(sizes, photos) {
    const coposGrid = document.getElementById('copos-grid');
    if (!coposGrid || !sizes) return;

    const isThu = isQuintaMaluca();

    coposGrid.innerHTML = sizes.map(s => {
        const priceInfo = getEffectiveSizePrice(s);
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

        // Badge determination
        let badgeHtml = '';
        if (isThu && QUINTA_MALUCA_PRICES[s.size] !== undefined) {
            badgeHtml = `<div class="badge-card badge-quinta-maluca">🔥 Quinta Maluca</div>`;
        } else if (s.badge) {
            badgeHtml = `<div class="badge-card">${s.badge}</div>`;
        }

        // Price formatting with strikethrough if promo
        let priceHtml = '';
        if (priceInfo.isPromo) {
            priceHtml = `
                <div class="copo-price-wrap">
                    <span class="old-price">R$ ${priceInfo.originalPrice.toFixed(2).replace('.', ',')}</span>
                    <span class="price promo-price">R$ ${priceInfo.basePrice.toFixed(2).replace('.', ',')}</span>
                </div>
            `;
        } else {
            priceHtml = `
                <div class="copo-price-wrap">
                    <span class="price">R$ ${priceInfo.basePrice.toFixed(2).replace('.', ',')}</span>
                </div>
            `;
        }

        return `
            <div class="copo-card ${priceInfo.isPromo ? 'promo-active' : ''}" onclick="openCustomizer('${s.size}')">
                ${badgeHtml}
                <div class="copo-card-top">
                    <div class="copo-img-wrapper">
                        ${imgHtml}
                    </div>
                    <div class="copo-details">
                        <h3>Açaí ${s.size}</h3>
                        ${priceHtml}
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

    const store = window.storeAPI.getData();
    const sizeObj = store.sizes ? store.sizes.find(s => s.size === size) : null;
    const priceInfo = getEffectiveSizePrice(sizeObj);

    const modalTitle = document.getElementById('modal-selected-size');
    if (modalTitle) {
        if (priceInfo.isPromo) {
            modalTitle.innerHTML = `Açaí ${size} <span class="modal-promo-tag">(${priceInfo.promoLabel} - R$ ${priceInfo.basePrice.toFixed(2).replace('.', ',')})</span>`;
        } else {
            modalTitle.textContent = `Açaí ${size}`;
        }
    }

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

    container.innerHTML = list.map(item => {
        let visualHtml = '';
        if (item.image) {
            visualHtml = `
                <div class="topping-thumb-wrap">
                    <img src="${item.image}" alt="${item.name}" class="topping-thumb" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <span class="topping-fallback-icon" style="display:none;">${item.icon || '✨'}</span>
                </div>
            `;
        } else if (item.icon) {
            visualHtml = `<div class="topping-thumb-wrap"><span class="icon">${item.icon}</span></div>`;
        } else {
            visualHtml = `<div class="topping-thumb-wrap"><span class="dot" style="background:${item.color || 'var(--lime)'}"></span></div>`;
        }

        return `
            <label class="topping">
                <input type="checkbox" value="${item.name}" class="adicional">
                <span class="topping-content">
                    ${visualHtml}
                    <span class="topping-name">${item.name}</span>
                    ${item.isNew ? `<span class="novo">Novo</span>` : ''}
                    <span class="topping-check-icon">✓</span>
                </span>
            </label>
        `;
    }).join('');
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
    const priceInfo = getEffectiveSizePrice(sizeObj);
    const basePrice = priceInfo.basePrice;

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

    // Summary List (Carrinho Visual)
    const summaryList = document.getElementById('summary-list');
    if (summaryList) {
        summaryList.innerHTML = '';
        
        const allToppingsList = [
            ...(store.toppings?.coberturas || []),
            ...(store.toppings?.frutas || []),
            ...(store.toppings?.completamentos || [])
        ];

        // 1. Item do Copo de Açaí
        if (sizeObj) {
            const liCup = document.createElement('li');
            liCup.className = 'summary-cup-row';
            const cupPhoto = sizeObj.photo || 'acai.jpg';
            
            let priceContent = `<span>R$ ${basePrice.toFixed(2).replace('.', ',')}</span>`;
            if (priceInfo.isPromo) {
                priceContent = `<span><s class="summary-old-price">R$ ${priceInfo.originalPrice.toFixed(2).replace('.', ',')}</s> <strong style="color: var(--lime);">R$ ${priceInfo.basePrice.toFixed(2).replace('.', ',')}</strong></span>`;
            }

            liCup.innerHTML = `
                <div class="summary-cup-left">
                    <img src="${cupPhoto}" alt="Açaí ${sizeObj.size}" class="summary-cup-thumb">
                    <div>
                        <div class="summary-cup-title">Açaí ${sizeObj.size}</div>
                        ${priceInfo.isPromo ? `<span class="summary-promo-badge">${priceInfo.promoLabel}</span>` : ''}
                    </div>
                </div>
                ${priceContent}
            `;
            summaryList.appendChild(liCup);
        }

        // 2. Lista de Adicionais com Fotos
        if (selectedAdicionais.length > 0) {
            const liToppings = document.createElement('li');
            liToppings.className = 'summary-toppings-box';

            const chipsHtml = selectedAdicionais.map((inputEl, idx) => {
                const name = inputEl.value;
                const topObj = allToppingsList.find(t => t.name === name);
                const isExtra = idx >= FREE_LIMIT;
                const imgSrc = topObj?.image || '';
                const icon = topObj?.icon || '✨';

                let imgHtml = '';
                if (imgSrc) {
                    imgHtml = `<img src="${imgSrc}" class="summary-chip-img" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                               <span class="summary-chip-fallback" style="display:none;">${icon}</span>`;
                } else {
                    imgHtml = `<span class="summary-chip-fallback">${icon}</span>`;
                }

                return `
                    <div class="summary-topping-chip ${isExtra ? 'chip-extra' : 'chip-free'}">
                        ${imgHtml}
                        <span class="summary-chip-name">${name}</span>
                        <span class="summary-chip-tag">${isExtra ? '+R$ 1,00' : 'Grátis'}</span>
                        <button type="button" class="summary-chip-del" onclick="removeToppingByName('${name.replace(/'/g, "\\'")}')" title="Remover adicional">&times;</button>
                    </div>
                `;
            }).join('');

            liToppings.innerHTML = `
                <div class="summary-toppings-header">
                    <span>Adicionais Selecionados (${totalSelected}):</span>
                </div>
                <div class="summary-chips-grid">
                    ${chipsHtml}
                </div>
            `;
            summaryList.appendChild(liToppings);
        }

        // 3. Extras caso ultrapasse o limite
        if (extraCount > 0) {
            const li = document.createElement('li');
            li.className = 'summary-extra-row';
            li.innerHTML = `<span>Adicionais Extras (${extraCount})</span><span style="color: var(--gold); font-weight: 800;">+R$ ${extraTotal.toFixed(2).replace('.', ',')}</span>`;
            summaryList.appendChild(li);
        }

        // 4. Taxa de Entrega
        if (deliveryLocation) {
            const li = document.createElement('li');
            li.className = 'summary-delivery-row';
            li.innerHTML = `<span>Entrega (${deliveryLocation.name})</span><span>R$ ${deliveryFee.toFixed(2).replace('.', ',')}</span>`;
            summaryList.appendChild(li);
        }
    }

    window.removeToppingByName = function(toppingName) {
        const checkbox = Array.from(document.querySelectorAll('.adicional:checked')).find(el => el.value === toppingName);
        if (checkbox) {
            checkbox.checked = false;
            updateOrderSummary();
        }
    };

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
    const priceInfo = getEffectiveSizePrice(sizeObj);
    const basePrice = priceInfo.basePrice;
    
    const extraTotal = extraCount * EXTRA_PRICE;
    const deliveryFee = deliveryLocation ? deliveryLocation.fee : 0;
    const total = basePrice + extraTotal + deliveryFee;

    const paymentIcons = {
        'Pix': '⚡ Pix',
        'Cartão de Crédito': '💳 Cartão de Crédito',
        'Cartão de Débito': '💳 Cartão de Débito',
        'Dinheiro': '💵 Dinheiro'
    };
    const paymentFormatted = paymentIcons[pagamento] || `💳 ${pagamento}`;

    const deliveryFeeFormatted = deliveryFee > 0 
        ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` 
        : 'Grátis';

    const cupLine = priceInfo.isPromo
        ? `▫️ ${currentSelectedSize} (R$ ${basePrice.toFixed(2).replace('.', ',')}) 🔥 *Promoção ${priceInfo.promoLabel}*`
        : `▫️ ${currentSelectedSize} (R$ ${basePrice.toFixed(2).replace('.', ',')})`;

    const lines = [
        `🟣 *AL AÇAÍ • NOVO PEDIDO* 🟣`,
        `━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `🥤 *TAMANHO DO COPO*`,
        cupLine,
        ``,
        `🍧 *ADICIONAIS (${selectedAdicionais.length})*`
    ];

    if (selectedAdicionais.length > 0) {
        selectedAdicionais.forEach(ad => {
            lines.push(`▫️ ${ad}`);
        });
    } else {
        lines.push(`▫️ _Nenhum adicional selecionado_`);
    }

    if (extraCount > 0) {
        lines.push(``);
        lines.push(`⚠️ *Adicionais Extras:* ${extraCount}x (+R$ ${(extraCount * EXTRA_PRICE).toFixed(2).replace('.', ',')})`);
    }

    if (obs) {
        lines.push(``);
        lines.push(`📝 *Observação:*`);
        lines.push(`_${obs}_`);
    }

    lines.push(``);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🛵 *DADOS PARA ENTREGA*`);
    lines.push(`▫️ *Endereço:* ${endereco}`);
    lines.push(`▫️ *Bairro:* ${deliveryLocation ? deliveryLocation.name : 'Não informado'}`);
    lines.push(`▫️ *Taxa de Entrega:* ${deliveryFeeFormatted}`);
    lines.push(`▫️ *Pagamento:* ${paymentFormatted}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💰 *VALOR TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_Aguardando confirmação..._ 💜`);

    const fullMessage = lines.join('\n');

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
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fullMessage)}`, '_blank');
}
