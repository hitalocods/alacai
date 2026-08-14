const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper: read data
function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Erro ao ler data.json:', err);
    }
    return null;
}

// Helper: write data
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Erro ao salvar em data.json:', err);
        return false;
    }
}

// GET entire store state
app.get('/api/data', (req, res) => {
    const data = readData();
    if (!data) return res.status(500).json({ error: 'Erro ao carregar dados' });
    res.json(data);
});

// POST update entire store state
app.post('/api/data', (req, res) => {
    const newData = req.body;
    if (writeData(newData)) {
        res.json({ success: true, message: 'Dados salvos com sucesso', data: newData });
    } else {
        res.status(500).json({ error: 'Erro ao salvar dados' });
    }
});

// CRUD Sizes / Prices
app.post('/api/prices', (req, res) => {
    const store = readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    const newSize = req.body;
    if (!newSize.id) newSize.id = 'size-' + Date.now();
    
    const index = store.sizes.findIndex(s => s.id === newSize.id);
    if (index >= 0) {
        store.sizes[index] = newSize;
    } else {
        store.sizes.push(newSize);
    }

    if (writeData(store)) {
        res.json({ success: true, size: newSize, sizes: store.sizes });
    } else {
        res.status(500).json({ error: 'Erro ao salvar tamanho' });
    }
});

app.delete('/api/prices/:id', (req, res) => {
    const store = readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    const id = req.params.id;
    store.sizes = store.sizes.filter(s => s.id !== id);

    if (writeData(store)) {
        res.json({ success: true, sizes: store.sizes });
    } else {
        res.status(500).json({ error: 'Erro ao deletar tamanho' });
    }
});

// CRUD Promotions
app.post('/api/promotions', (req, res) => {
    const store = readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    const promo = req.body;
    if (!promo.id) promo.id = 'promo-' + Date.now();

    const index = store.promotions.findIndex(p => p.id === promo.id);
    if (index >= 0) {
        store.promotions[index] = promo;
    } else {
        store.promotions.push(promo);
    }

    if (writeData(store)) {
        res.json({ success: true, promotion: promo, promotions: store.promotions });
    } else {
        res.status(500).json({ error: 'Erro ao salvar promoção' });
    }
});

app.delete('/api/promotions/:id', (req, res) => {
    const store = readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    const id = req.params.id;
    store.promotions = store.promotions.filter(p => p.id !== id);

    if (writeData(store)) {
        res.json({ success: true, promotions: store.promotions });
    } else {
        res.status(500).json({ error: 'Erro ao deletar promoção' });
    }
});

// UPDATE Photos
app.put('/api/photos', (req, res) => {
    const store = readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    store.photos = { ...store.photos, ...req.body };

    if (writeData(store)) {
        res.json({ success: true, photos: store.photos });
    } else {
        res.status(500).json({ error: 'Erro ao salvar fotos' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor AL Açaí rodando na porta ${PORT}`);
    console.log(`📍 Acesse: http://localhost:${PORT}`);
});
