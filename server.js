require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// PostgreSQL Setup
let pool;
let isDbConnected = false;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    pool.connect()
        .then(async (client) => {
            console.log('✅ Conectado ao banco de dados PostgreSQL com sucesso!');
            isDbConnected = true;
            client.release();
            await initDatabase();
        })
        .catch(err => {
            console.error('❌ Erro de conexão com o PostgreSQL, usando fallback para arquivo local:', err);
            isDbConnected = false;
        });
} else {
    console.log('ℹ️ DATABASE_URL não definida. Rodando com armazenamento em arquivo local.');
}

// Database Initialization
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS store_data (
                key VARCHAR(50) PRIMARY KEY,
                value JSONB NOT NULL
            );
        `);

        const res = await pool.query("SELECT value FROM store_data WHERE key = 'store_state'");
        if (res.rows.length === 0) {
            console.log('🐣 Inicializando tabela store_data com os dados do data.json...');
            let defaultData = null;
            if (fs.existsSync(DATA_FILE)) {
                try {
                    const raw = fs.readFileSync(DATA_FILE, 'utf8');
                    defaultData = JSON.parse(raw);
                } catch (e) {
                    console.error('Erro ao ler data.json padrão:', e);
                }
            }
            if (!defaultData) {
                defaultData = {
                    sizes: [],
                    promotions: [],
                    photos: { heroCup: "", logo: "", promoBanner: "" },
                    freeLimit: 7,
                    extraPrice: 1.00,
                    deliveryLocations: [],
                    orders: [],
                    expenses: [],
                    toppings: { coberturas: [], frutas: [], completamentos: [] }
                };
            }
            await pool.query("INSERT INTO store_data (key, value) VALUES ('store_state', $1)", [defaultData]);
            console.log('✅ Dados padrão inseridos com sucesso no PostgreSQL!');
        }
    } catch (err) {
        console.error('❌ Erro na inicialização do banco de dados:', err);
        isDbConnected = false;
    }
}

// Helper: read data
async function readData() {
    let localData = null;
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            localData = JSON.parse(raw);
        }
    } catch (err) {
        console.error('Erro ao ler data.json:', err);
    }

    if (isDbConnected) {
        try {
            const res = await pool.query("SELECT value FROM store_data WHERE key = 'store_state'");
            if (res.rows.length > 0) {
                const dbValue = res.rows[0].value;
                // Mescla as variáveis do banco com as do arquivo local para garantir novas propriedades (como o estoque e novas fotos)
                const mergedPhotos = {};
                const localPhotos = localData ? localData.photos : {};
                const dbPhotos = dbValue.photos || {};
                for (const key in localPhotos) {
                    mergedPhotos[key] = dbPhotos[key] ? dbPhotos[key] : localPhotos[key];
                }
                return { 
                    ...localData, 
                    ...dbValue, 
                    photos: mergedPhotos,
                    inventory: dbValue.inventory || (localData ? localData.inventory : []) 
                };
            }
        } catch (err) {
            console.error('Erro ao ler dados do PostgreSQL:', err);
        }
    }

    return localData;
}

// Helper: write data
async function writeData(data) {
    let success = false;

    if (isDbConnected) {
        try {
            await pool.query(`
                INSERT INTO store_data (key, value)
                VALUES ('store_state', $1)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
            `, [data]);
            success = true;
        } catch (err) {
            console.error('Erro ao salvar dados no PostgreSQL:', err);
        }
    }

    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        success = true;
    } catch (err) {
        console.error('Erro ao salvar em data.json (backup):', err);
    }

    return success;
}

// GET entire store state
app.get('/api/data', async (req, res) => {
    const data = await readData();
    if (!data) return res.status(500).json({ error: 'Erro ao carregar dados' });
    res.json(data);
});

// POST update entire store state
app.post('/api/data', async (req, res) => {
    const newData = req.body;
    if (await writeData(newData)) {
        res.json({ success: true, message: 'Dados salvos com sucesso', data: newData });
    } else {
        res.status(500).json({ error: 'Erro ao salvar dados' });
    }
});

// CRUD Sizes / Prices
app.post('/api/prices', async (req, res) => {
    const store = await readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    const newSize = req.body;
    if (!newSize.id) newSize.id = 'size-' + Date.now();

    const index = store.sizes.findIndex(s => s.id === newSize.id);
    if (index >= 0) {
        store.sizes[index] = newSize;
    } else {
        store.sizes.push(newSize);
    }

    if (await writeData(store)) {
        res.json({ success: true, size: newSize, sizes: store.sizes });
    } else {
        res.status(500).json({ error: 'Erro ao salvar tamanho' });
    }
});

app.delete('/api/prices/:id', async (req, res) => {
    const store = await readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    const id = req.params.id;
    store.sizes = store.sizes.filter(s => s.id !== id);

    if (await writeData(store)) {
        res.json({ success: true, sizes: store.sizes });
    } else {
        res.status(500).json({ error: 'Erro ao deletar tamanho' });
    }
});

// CRUD Promotions
app.post('/api/promotions', async (req, res) => {
    const store = await readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    const promo = req.body;
    if (!promo.id) promo.id = 'promo-' + Date.now();

    const index = store.promotions.findIndex(p => p.id === promo.id);
    if (index >= 0) {
        store.promotions[index] = promo;
    } else {
        store.promotions.push(promo);
    }

    if (await writeData(store)) {
        res.json({ success: true, promotion: promo, promotions: store.promotions });
    } else {
        res.status(500).json({ error: 'Erro ao salvar promoção' });
    }
});

app.delete('/api/promotions/:id', async (req, res) => {
    const store = await readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    const id = req.params.id;
    store.promotions = store.promotions.filter(p => p.id !== id);

    if (await writeData(store)) {
        res.json({ success: true, promotions: store.promotions });
    } else {
        res.status(500).json({ error: 'Erro ao deletar promoção' });
    }
});

// UPDATE Photos
app.put('/api/photos', async (req, res) => {
    const store = await readData();
    if (!store) return res.status(500).json({ error: 'Erro ao ler dados' });

    store.photos = { ...store.photos, ...req.body };

    if (await writeData(store)) {
        res.json({ success: true, photos: store.photos });
    } else {
        res.status(500).json({ error: 'Erro ao salvar fotos' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor AL Açaí rodando na porta ${PORT}`);
    console.log(`📍 Acesse: http://localhost:${PORT}`);
});
