const API_URL = `${window.location.origin}/api/produtos`;
const STORAGE_KEY = 'controle_estoque_backup';

let produtos = [];

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// ==================== CARREGAR DADOS ====================
async function carregarProdutos() {
    try {
        const res = await fetch(API_URL);
        produtos = await res.json();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(produtos));
    } catch (err) {
        // Se o servidor estiver offline, lê do localStorage
        produtos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }
    renderizarTabela();
}

// ==================== RENDERIZAR PLANILHA ====================
function renderizarTabela() {
    const tbody = document.getElementById('tabelaEstoqueBody');
    const totalGeralEl = document.getElementById('totalGeralEstoque');
    tbody.innerHTML = '';

    let totalGeral = 0;

    produtos.forEach((p) => {
        const subtotal = p.quantidade * p.valorUnitario;
        totalGeral += subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nome}</td>
            <td>${p.categoria}</td>
            <td>
                <input type="number" min="0" step="1" value="${p.quantidade}"
                    onchange="editarProduto('${p.id}', 'quantidade', this.value)">
            </td>
            <td>
                <input type="number" min="0" step="0.01" value="${p.valorUnitario.toFixed(2)}"
                    onchange="editarProduto('${p.id}', 'valorUnitario', this.value)">
            </td>
            <td><strong>${formatarMoeda(subtotal)}</strong></td>
            <td>
                <button onclick="removerProduto('${p.id}')">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (totalGeralEl) {
        totalGeralEl.innerText = formatarMoeda(totalGeral);
    }
}

// ==================== AÇÕES CRUD ====================
async function adicionarProduto() {
    const nome = document.getElementById('nomeInput').value.trim();
    const categoria = document.getElementById('categoriaInput').value.trim() || 'Geral';
    const quantidade = parseFloat(document.getElementById('qtdInput').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('valorInput').value) || 0;

    if (!nome) return alert('Digite o nome do produto!');

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, categoria, quantidade, valorUnitario })
    });

    const dados = await res.json();
    if (!res.ok) return alert(dados.erro || 'Erro ao adicionar');

    document.getElementById('nomeInput').value = '';
    document.getElementById('qtdInput').value = '';
    document.getElementById('valorInput').value = '';

    await carregarProdutos();
}

async function editarProduto(id, campo, valor) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: Number(valor) })
    });

    const dados = await res.json();
    if (!res.ok) {
        alert(dados.erro || 'Erro ao atualizar');
        return carregarProdutos();
    }

    await carregarProdutos();
}

async function removerProduto(id) {
    if (!confirm('Remover este produto do estoque?')) return;

    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Erro ao remover produto');

    await carregarProdutos();
}

carregarProdutos();