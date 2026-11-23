const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const cors = require('cors');

const app = express();
const PORT = 3001;
const ARQUIVO_JSON = path.join(__dirname, 'estoque.json');

app.use(cors());
app.use(express.json());

// ==================== ARQUIVOS ESTÁTICOS ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

// ==================== HELPERS JSON ====================
async function lerEstoque() {
    try {
        const dados = await fs.readFile(ARQUIVO_JSON, 'utf-8');
        return JSON.parse(dados);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await salvarEstoque([]);
            return [];
        }
        throw err;
    }
}

async function salvarEstoque(lista) {
    await fs.writeFile(ARQUIVO_JSON, JSON.stringify(lista, null, 2), 'utf-8');
}

// ==================== ROTAS DO ESTOQUE ====================

// 1. Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
    const produtos = await lerEstoque();
    res.json(produtos);
});

// 2. Adicionar produto X
app.post('/api/produtos', async (req, res) => {
    const { nome, categoria = 'Geral', quantidade = 0, valorUnitario = 0 } = req.body;

    const nomeLimpo = (nome || '').trim();
    const qtd = Number(quantidade);
    const valor = Number(valorUnitario);

    if (!nomeLimpo) {
        return res.status(400).json({ erro: 'O nome do produto é obrigatório.' });
    }
    if (!Number.isFinite(qtd) || qtd < 0) {
        return res.status(400).json({ erro: 'Quantidade inválida.' });
    }
    if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({ erro: 'Valor em R$ inválido.' });
    }

    const produtos = await lerEstoque();
    const novoProduto = {
        id: Date.now().toString(),
        nome: nomeLimpo,
        categoria: (categoria || 'Geral').trim(),
        quantidade: qtd,
        valorUnitario: valor,
        atualizadoEm: new Date().toISOString()
    };

    produtos.push(novoProduto);
    await salvarEstoque(produtos);
    res.status(201).json(novoProduto);
});

// 3. Editar produto (valor em R$, quantidade, nome ou categoria)
app.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, categoria, quantidade, valorUnitario } = req.body;

    const produtos = await lerEstoque();
    const index = produtos.findIndex((p) => p.id === id);

    if (index === -1) {
        return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    if (nome !== undefined) {
        const nomeLimpo = String(nome).trim();
        if (!nomeLimpo) return res.status(400).json({ erro: 'Nome não pode ficar vazio.' });
        produtos[index].nome = nomeLimpo;
    }

    if (categoria !== undefined) {
        produtos[index].categoria = String(categoria).trim() || 'Geral';
    }

    if (quantidade !== undefined) {
        const qtd = Number(quantidade);
        if (!Number.isFinite(qtd) || qtd < 0) {
            return res.status(400).json({ erro: 'Quantidade inválida.' });
        }
        produtos[index].quantidade = qtd;
    }

    if (valorUnitario !== undefined) {
        const valor = Number(valorUnitario);
        if (!Number.isFinite(valor) || valor < 0) {
            return res.status(400).json({ erro: 'Valor em R$ inválido.' });
        }
        produtos[index].valorUnitario = valor;
    }

    produtos[index].atualizadoEm = new Date().toISOString();
    await salvarEstoque(produtos);
    res.json(produtos[index]);
});

// 4. Remover produto
app.delete('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const produtos = await lerEstoque();
    const filtrados = produtos.filter((p) => p.id !== id);

    if (filtrados.length === produtos.length) {
        return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    await salvarEstoque(filtrados);
    res.json({ ok: true });
});

app.listen(PORT, () => console.log(`📦 Estoque rodando em http://localhost:${PORT}`));