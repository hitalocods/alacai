/**
 * AL Açaí - Data & API Layer
 * Gerencia persistência local (localStorage) e sincronização com a API REST
 */

const STORAGE_KEY = 'al_acai_store_v2';

const DEFAULT_DATA = {
    sizes: [
        { id: "size-300", size: "300 ml", price: 14, promoPrice: null, popular: false },
        { id: "size-400", size: "400 ml", price: 17, promoPrice: null, popular: false },
        { id: "size-500", size: "500 ml", price: 20, promoPrice: 16.90, popular: true, badge: "Mais Pedido · 15% OFF" },
        { id: "size-770", size: "770 ml", price: 27, promoPrice: null, popular: false }
    ],
    promotions: [
        {
            id: "promo-1",
            title: "Super Promoção 500ml",
            description: "Leve o copo de 500ml de R$ 20 por apenas R$ 16,90 com 7 adicionais inclusos!",
            discount: "15% OFF",
            active: true,
            badge: "OFERTA DO DIA",
            targetSize: "500 ml"
        },
        {
            id: "promo-2",
            title: "Combo Casal / Amigos",
            description: "Na compra de 2 copos de 770ml, ganhe cobertura de Nutella extra!",
            discount: "BRINDE ESPECIAL",
            active: true,
            badge: "COMBO",
            targetSize: "770 ml"
        }
    ],
    photos: {
        heroCup: "",
        logo: "",
        promoBanner: ""
    },
    freeLimit: 7,
    extraPrice: 1.00,
    deliveryLocations: [
        { id: "bairro-1", name: "Centro", fee: 5 },
        { id: "bairro-2", name: "Teresina Sul", fee: 6 },
        { id: "bairro-3", name: "Cabral", fee: 7 },
        { id: "bairro-4", name: "São Cristóvão", fee: 8 },
        { id: "bairro-5", name: "Pedro II", fee: 6 },
        { id: "bairro-6", name: "Fátima", fee: 5 },
        { id: "bairro-7", name: "Ininga", fee: 7 },
        { id: "bairro-8", name: "Jóquei Clube", fee: 8 },
        { id: "bairro-9", name: "Satélite", fee: 9 },
        { id: "bairro-10", name: "PIB", fee: 6 },
        { id: "bairro-11", name: "Morada Nova", fee: 7 },
        { id: "bairro-12", name: "Dirceu Arcoverde", fee: 8 },
        { id: "bairro-13", name: "São Pedro", fee: 5 },
        { id: "bairro-14", name: "Matadouro", fee: 6 },
        { id: "bairro-15", name: "Vera Cruz", fee: 7 }
    ],
    orders: [],
    expenses: [],
    toppings: {
        coberturas: [
            { id: "cob-1", name: "Leite condensado", color: "#FBF2E4", icon: "🥛" },
            { id: "cob-2", name: "Chocolate", color: "#6B3B1F", icon: "🍫" },
            { id: "cob-3", name: "Morango (cobertura)", color: "#FF6F86", icon: "🍓" },
            { id: "cob-4", name: "Doce de Leite", color: "#D48B38", icon: "🍯" }
        ],
        frutas: [
            { id: "fru-1", name: "Morango", color: "#FF6F86", icon: "🍓" },
            { id: "fru-2", name: "Cereja", color: "#C4133C", icon: "🍒" },
            { id: "fru-3", name: "Uva", color: "#6B3FA0", icon: "🍇" },
            { id: "fru-4", name: "Kiwi", color: "#8FBF3F", icon: "🥝" },
            { id: "fru-5", name: "Banana", color: "#F2B705", icon: "🍌" },
            { id: "fru-6", name: "Manga", color: "#FF9F1C", icon: "🥭" }
        ],
        completamentos: [
            { id: "comp-1", name: "M&M", color: "#FF6F86", icon: "🍬" },
            { id: "comp-2", name: "Jujuba", color: "#F2B705", icon: "🍬" },
            { id: "comp-3", name: "Nutella", color: "#6B3B1F", icon: "🍫", isNew: true },
            { id: "comp-4", name: "Paçoca", color: "#C68A4E", icon: "🥥" },
            { id: "comp-5", name: "Granulado", color: "#3A2318", icon: "✨" },
            { id: "comp-6", name: "Amendoim", color: "#C9986B", icon: "🥜" },
            { id: "comp-7", name: "Leite em pó", color: "#FBF2E4", icon: "🥛" },
            { id: "comp-8", name: "Ovomaltine", color: "#8A5A2B", icon: "🍫" },
            { id: "comp-9", name: "Farinha láctea", color: "#EDEAE0", icon: "🥣" },
            { id: "comp-10", name: "Flocos de arroz", color: "#EDEAE0", icon: "🍚" },
            { id: "comp-11", name: "Flocos de chocolate", color: "#4A2A16", icon: "🍫" },
            { id: "comp-12", name: "Gota de chocolate", color: "#2E1810", icon: "🍫" },
            { id: "comp-13", name: "Tubinho", color: "#FF6F86", icon: "🍦", isNew: true }
        ]
    }
};

class StoreAPI {
    constructor() {
        this.listeners = [];
        this.data = this.loadLocalData();
        this.checkBackendServer();
    }

    loadLocalData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...DEFAULT_DATA, ...parsed };
            }
        } catch (e) {
            console.warn('Erro ao carregar localStorage, usando dados padrão:', e);
        }
        this.saveLocalData(DEFAULT_DATA);
        return { ...DEFAULT_DATA };
    }

    saveLocalData(data) {
        this.data = data;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
        }
        this.notify();
        this.syncToBackend(data);
    }

    async checkBackendServer() {
        try {
            const res = await fetch('/api/data');
            if (res.ok) {
                const remoteData = await res.json();
                if (remoteData && remoteData.sizes) {
                    this.data = remoteData;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
                    this.notify();
                }
            }
        } catch (err) {
            // Servidor backend estático ou não ativo, usando localStorage
        }
    }

    async syncToBackend(data) {
        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (err) {
            // Ignora falha silenciosamente caso seja hospedagem estática
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.data));
    }

    getData() {
        return this.data;
    }

    // CRUD: Preços e Tamanhos
    savePrice(sizeObj) {
        const sizes = [...this.data.sizes];
        if (!sizeObj.id) sizeObj.id = 'size-' + Date.now();
        
        const idx = sizes.findIndex(s => s.id === sizeObj.id);
        if (idx >= 0) {
            sizes[idx] = sizeObj;
        } else {
            sizes.push(sizeObj);
        }

        const newData = { ...this.data, sizes };
        this.saveLocalData(newData);
        return sizeObj;
    }

    deletePrice(id) {
        const sizes = this.data.sizes.filter(s => s.id !== id);
        const newData = { ...this.data, sizes };
        this.saveLocalData(newData);
    }

    // CRUD: Promoções
    savePromotion(promoObj) {
        const promotions = [...this.data.promotions];
        if (!promoObj.id) promoObj.id = 'promo-' + Date.now();

        const idx = promotions.findIndex(p => p.id === promoObj.id);
        if (idx >= 0) {
            promotions[idx] = promoObj;
        } else {
            promotions.push(promoObj);
        }

        const newData = { ...this.data, promotions };
        this.saveLocalData(newData);
        return promoObj;
    }

    deletePromotion(id) {
        const promotions = this.data.promotions.filter(p => p.id !== id);
        const newData = { ...this.data, promotions };
        this.saveLocalData(newData);
    }

    togglePromotion(id) {
        const promotions = this.data.promotions.map(p => {
            if (p.id === id) return { ...p, active: !p.active };
            return p;
        });
        const newData = { ...this.data, promotions };
        this.saveLocalData(newData);
    }

    // CRUD: Fotos
    updatePhotos(photosObj) {
        const photos = { ...this.data.photos, ...photosObj };
        const newData = { ...this.data, photos };
        this.saveLocalData(newData);
    }

    // CRUD: Adicionais
    saveTopping(category, toppingObj) {
        if (!this.data.toppings[category]) return;
        const categoryList = [...this.data.toppings[category]];
        if (!toppingObj.id) toppingObj.id = category.slice(0, 3) + '-' + Date.now();

        const idx = categoryList.findIndex(t => t.id === toppingObj.id);
        if (idx >= 0) {
            categoryList[idx] = toppingObj;
        } else {
            categoryList.push(toppingObj);
        }

        const toppings = { ...this.data.toppings, [category]: categoryList };
        const newData = { ...this.data, toppings };
        this.saveLocalData(newData);
    }

    deleteTopping(category, id) {
        if (!this.data.toppings[category]) return;
        const categoryList = this.data.toppings[category].filter(t => t.id !== id);
        const toppings = { ...this.data.toppings, [category]: categoryList };
        const newData = { ...this.data, toppings };
        this.saveLocalData(newData);
    }

    // CRUD: Bairros de Entrega
    saveDeliveryLocation(locationObj) {
        const deliveryLocations = [...this.data.deliveryLocations];
        if (!locationObj.id) locationObj.id = 'bairro-' + Date.now();

        const idx = deliveryLocations.findIndex(l => l.id === locationObj.id);
        if (idx >= 0) {
            deliveryLocations[idx] = locationObj;
        } else {
            deliveryLocations.push(locationObj);
        }

        const newData = { ...this.data, deliveryLocations };
        this.saveLocalData(newData);
        return locationObj;
    }

    deleteDeliveryLocation(id) {
        const deliveryLocations = this.data.deliveryLocations.filter(l => l.id !== id);
        const newData = { ...this.data, deliveryLocations };
        this.saveLocalData(newData);
    }

    // CRUD: Orders
    saveOrder(orderObj) {
        const orders = [...this.data.orders];
        if (!orderObj.id) orderObj.id = 'order-' + Date.now();

        orders.push(orderObj);
        const newData = { ...this.data, orders };
        this.saveLocalData(newData);
        return orderObj;
    }

    deleteOrder(id) {
        const orders = this.data.orders.filter(o => o.id !== id);
        const newData = { ...this.data, orders };
        this.saveLocalData(newData);
    }

    // CRUD: Expenses
    saveExpense(expenseObj) {
        const expenses = [...this.data.expenses];
        if (!expenseObj.id) expenseObj.id = 'expense-' + Date.now();

        expenses.push(expenseObj);
        const newData = { ...this.data, expenses };
        this.saveLocalData(newData);
        return expenseObj;
    }

    deleteExpense(id) {
        const expenses = this.data.expenses.filter(e => e.id !== id);
        const newData = { ...this.data, expenses };
        this.saveLocalData(newData);
    }

    resetToDefaults() {
        this.saveLocalData(DEFAULT_DATA);
    }
}

window.storeAPI = new StoreAPI();
