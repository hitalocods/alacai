/**
 * AL Açaí - Data & API Layer
 * Gerencia persistência local (localStorage) e sincronização com a API REST
 */

const STORAGE_KEY = 'al_acai_store_v3';

const DEFAULT_DATA = {
    sizes: [
        { id: "size-300", size: "300 ml", price: 14, promoPrice: null, popular: false, photo: "acai.jpg" },
        { id: "size-400", size: "400 ml", price: 17, promoPrice: null, popular: false, photo: "acai.jpg" },
        { id: "size-500", size: "500 ml", price: 20, promoPrice: null, popular: true, badge: "Mais Pedido", photo: "acai.jpg" },
        { id: "size-770", size: "770 ml", price: 27, promoPrice: null, popular: false, photo: "acai.jpg" }
    ],
    promotions: [
        {
            id: "promo-1",
            title: "Açaí 500ml",
            description: "Copo de 500ml por R$ 20,00 com 7 adicionais inclusos!",
            discount: "DESTAQUE",
            active: false,
            badge: "MAIS PEDIDO",
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
        logo: "logo.jpeg",
        promoBanner: ""
    },
    freeLimit: 7,
    extraPrice: 1.00,
    deliveryLocations: [
        { id: "bairro-1", name: "Santa Cruz", fee: 0 },
        { id: "bairro-2", name: "Promorar", fee: 0 },
        { id: "bairro-3", name: "Parque Piauí", fee: 0 },
        { id: "bairro-4", name: "Betinho", fee: 0 },
        { id: "bairro-5", name: "Santa Fe", fee: 0 },
        { id: "bairro-6", name: "Km 7", fee: 0 },
        { id: "bairro-7", name: "Planalto Santa Fe", fee: 0 },
        { id: "bairro-8", name: "Areias", fee: 0 },
        { id: "bairro-9", name: "Vila Angélica", fee: 0 },
        { id: "bairro-10", name: "Afonso gil", fee: 0 },
        { id: "bairro-11", name: "Vila Carolina", fee: 0 },
        { id: "bairro-12", name: "São José", fee: 0 },
        { id: "bairro-13", name: "Paraíso", fee: 0 },
        { id: "bairro-14", name: "Parque Vitória", fee: 0 }
    ],
    orders: [],
    expenses: [],
    toppings: {
        coberturas: [
            { id: "cob-1", name: "Leite condensado", color: "#FBF2E4", icon: "🥛", image: "img/leite-condensado.jpg" },
            { id: "cob-2", name: "Chocolate", color: "#6B3B1F", icon: "🍫", image: "img/cobertura-chocolate.jpg" },
            { id: "cob-3", name: "Morango (cobertura)", color: "#FF6F86", icon: "🍓", image: "img/cobertura-morango.jpg" }
        ],
        frutas: [
            { id: "fru-1", name: "Morango", color: "#FF6F86", icon: "🍓", image: "img/fruta-morango.jpg" },
            { id: "fru-2", name: "Cereja", color: "#C4133C", icon: "🍒", image: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?auto=format&fit=crop&w=150&h=150&q=80" },
            { id: "fru-3", name: "Uva", color: "#6B3FA0", icon: "🍇", image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=150&h=150&q=80" },
            { id: "fru-4", name: "Kiwi", color: "#8FBF3F", icon: "🥝", image: "img/fruta-kiwi.jpg" },
            { id: "fru-5", name: "Banana", color: "#F2B705", icon: "🍌", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=150&h=150&q=80" }
        ],
        completamentos: [
            { id: "comp-1", name: "M&M", color: "#FF6F86", icon: "🍬", image: "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=150&h=150&q=80" },
            { id: "comp-2", name: "Jujuba", color: "#F2B705", icon: "🍬", image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=150&h=150&q=80" },
            { id: "comp-3", name: "Nutella", color: "#6B3B1F", icon: "🍫", isNew: true, image: "img/Nutella.jpg" },
            { id: "comp-4", name: "Paçoca", color: "#C68A4E", icon: "🥥", image: "img/pacoca.jpg" },
            { id: "comp-5", name: "Granulado", color: "#3A2318", icon: "✨", image: "img/granulado.jpg" },
            { id: "comp-6", name: "Amendoim", color: "#C9986B", icon: "🥜", image: "img/amendoim.jpg" },
            { id: "comp-7", name: "Leite em pó", color: "#FBF2E4", icon: "🥛", image: "img/leite-em-po.jpg" },
            { id: "comp-8", name: "Ovomaltine", color: "#8A5A2B", icon: "🍫", image: "img/ovomaltine.jpg" },
            { id: "comp-9", name: "Farinha láctea", color: "#EDEAE0", icon: "🥣", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&h=150&q=80" },
            { id: "comp-10", name: "Flocos de arroz", color: "#EDEAE0", icon: "🍚", image: "img/flocos-arroz.jpg" },
            { id: "comp-11", name: "Flocos de chocolate", color: "#4A2A16", icon: "🍫", image: "img/flocos-chocolate.jpg" },
            { id: "comp-12", name: "Gota de chocolate", color: "#2E1810", icon: "🍫", image: "img/gotas-chocolate.jpg" },
            { id: "comp-13", name: "Tubinho", color: "#FF6F86", icon: "🍦", isNew: true, image: "img/tubinho.jpg" }
        ]
    },
    inventory: [
        { id: "inv-size-300", name: "Copo 300 ml (unidades)", qty: 150, minQty: 20, unit: "unidades", linkedItem: "size-300" },
        { id: "inv-size-400", name: "Copo 400 ml (unidades)", qty: 120, minQty: 20, unit: "unidades", linkedItem: "size-400" },
        { id: "inv-size-500", name: "Copo 500 ml (unidades)", qty: 200, minQty: 30, unit: "unidades", linkedItem: "size-500" },
        { id: "inv-size-770", name: "Copo 770 ml (unidades)", qty: 80, minQty: 15, unit: "unidades", linkedItem: "size-770" },
        { id: "inv-nutella", name: "Nutella (Potes)", qty: 12, minQty: 3, unit: "potes", linkedItem: "comp-3" },
        { id: "inv-leite-po", name: "Leite em pó (kg)", qty: 10, minQty: 2, unit: "kg", linkedItem: "comp-7" },
        { id: "inv-morango", name: "Morango (Bandejas)", qty: 25, minQty: 5, unit: "bandejas", linkedItem: "fru-1" }
    ]
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
                let needsSave = false;
                const mergedPhotos = {};
                for (const key in DEFAULT_DATA.photos) {
                    if (parsed.photos && parsed.photos[key]) {
                        mergedPhotos[key] = parsed.photos[key];
                    } else {
                        mergedPhotos[key] = DEFAULT_DATA.photos[key];
                        needsSave = true;
                    }
                }
                const mergedData = { ...DEFAULT_DATA, ...parsed, photos: mergedPhotos, inventory: parsed.inventory || DEFAULT_DATA.inventory };
                if (needsSave) {
                    try {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
                    } catch (e) {
                        console.error('Erro ao salvar no localStorage:', e);
                    }
                }
                return mergedData;
            }
        } catch (e) {
            console.warn('Erro ao carregar localStorage, usando dados padrão:', e);
        }
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
                    const mergedPhotos = {};
                    for (const key in DEFAULT_DATA.photos) {
                        mergedPhotos[key] = (remoteData.photos && remoteData.photos[key]) ? remoteData.photos[key] : DEFAULT_DATA.photos[key];
                    }
                    this.data = { ...DEFAULT_DATA, ...remoteData, photos: mergedPhotos, inventory: remoteData.inventory || DEFAULT_DATA.inventory };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
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

        // Decrement Stock
        let inventory = [...(this.data.inventory || [])];
        
        // 1. Decrement Cup size
        const sizeObj = this.data.sizes.find(s => s.size === orderObj.size);
        if (sizeObj) {
            inventory = inventory.map(item => {
                if (item.linkedItem === sizeObj.id) {
                    return { ...item, qty: Math.max(0, item.qty - 1) };
                }
                return item;
            });
        }

        // 2. Decrement Toppings
        if (orderObj.toppings && Array.isArray(orderObj.toppings)) {
            const allToppingsList = [
                ...(this.data.toppings.coberturas || []),
                ...(this.data.toppings.frutas || []),
                ...(this.data.toppings.completamentos || [])
            ];
            orderObj.toppings.forEach(toppingName => {
                const topping = allToppingsList.find(t => t.name === toppingName);
                if (topping) {
                    inventory = inventory.map(item => {
                        if (item.linkedItem === topping.id) {
                            return { ...item, qty: Math.max(0, item.qty - 1) };
                        }
                        return item;
                    });
                }
            });
        }

        const newData = { ...this.data, orders, inventory };
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

    // CRUD: Inventory
    saveInventoryItem(itemObj) {
        const inventory = [...(this.data.inventory || [])];
        if (!itemObj.id) itemObj.id = 'inv-' + Date.now();

        const idx = inventory.findIndex(i => i.id === itemObj.id);
        if (idx >= 0) {
            inventory[idx] = { ...inventory[idx], ...itemObj };
        } else {
            inventory.push(itemObj);
        }

        const newData = { ...this.data, inventory };
        this.saveLocalData(newData);
        return itemObj;
    }

    deleteInventoryItem(id) {
        const inventory = (this.data.inventory || []).filter(i => i.id !== id);
        const newData = { ...this.data, inventory };
        this.saveLocalData(newData);
    }

    resetToDefaults() {
        this.saveLocalData(DEFAULT_DATA);
    }
}

window.storeAPI = new StoreAPI();
