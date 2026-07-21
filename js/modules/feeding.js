// ============================================
// Módulo: Alimentación
// ============================================

import { dbFeedings } from '../database.js';
import { showToast, confirmDialog, formatDate, formatCurrency } from '../utils.js';
import CONFIG from '../config.js';

export default class FeedingModule {
    constructor(container) {
        this.container = container;
        this.currentPage = 1;
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">🌾 Alimentación</h2>
            <div class="toolbar">
                <button id="btnNewFeed" class="btn btn-primary">➕ Registrar Alimento</button>
                <button id="btnAddStock" class="btn btn-outline">📥 Añadir Stock</button>
            </div>
            <div id="feedTableContainer" class="table-container"></div>
            <div id="feedPagination" class="pagination"></div>
        `;
        document.getElementById('btnNewFeed')?.addEventListener('click', () => this.showForm());
        document.getElementById('btnAddStock')?.addEventListener('click', () => this.showStockForm());
        this.loadData();
    }

    loadData() {
        const data = dbFeedings.getAll();
        const pageSize = CONFIG.PAGE_SIZE;
        const total = data.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (this.currentPage - 1) * pageSize;
        const items = data.slice(start, start + pageSize);
        this.renderTable(items);
        this.renderPagination(totalPages);
    }

    renderTable(items) {
        const c = document.getElementById('feedTableContainer');
        if (!c) return;
        c.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Tipo</th><th>Proveedor</th><th>Costo/Unidad</th><th>Stock</th>
                        <th>Stock Mín.</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(f => `
                        <tr>
                            <td>${f.feedType || ''}</td>
                            <td>${f.supplier || '-'}</td>
                            <td>${formatCurrency(f.costPerUnit)}</td>
                            <td class="${f.stock <= f.minStock ? 'text-danger' : ''}">${f.stock} ${f.unit || 'kg'}</td>
                            <td>${f.minStock}</td>
                            <td>
                                <button class="btn btn-sm edit-feed" data-id="${f.id}">✏️</button>
                                <button class="btn btn-sm btn-danger delete-feed" data-id="${f.id}">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        c.querySelectorAll('.edit-feed').forEach(b => b.addEventListener('click', (e) => this.showForm(dbFeedings.findById(e.target.dataset.id))));
        c.querySelectorAll('.delete-feed').forEach(b => b.addEventListener('click', async (e) => {
            if (await confirmDialog('Eliminar', '¿Seguro?')) {
                dbFeedings.delete(e.target.dataset.id);
                showToast('Eliminado', 'success');
                this.loadData();
            }
        }));
    }

    renderPagination(total) { /* igual */ }

    showForm(data = null) {
        const feed = data || {};
        import('../utils.js').then(({ openModal }) => {
            openModal(data ? 'Editar Alimento' : 'Nuevo Alimento', `
                <div class="form-row">
                    <div class="form-group"><label>Tipo</label><select id="fType" class="form-control">${CONFIG.FEED_TYPES.map(t => `<option ${t === feed.feedType ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Proveedor</label><input type="text" id="fSupplier" class="form-control" value="${feed.supplier || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Costo/Unidad</label><input type="number" step="0.01" id="fCost" class="form-control" value="${feed.costPerUnit || 0}"></div>
                    <div class="form-group"><label>Stock Mínimo</label><input type="number" id="fMinStock" class="form-control" value="${feed.minStock || 50}"></div>
                </div>
                <div class="form-group"><label>Stock Inicial</label><input type="number" id="fStock" class="form-control" value="${feed.stock || 0}"></div>
            `, () => {
                const obj = {
                    feedType: document.getElementById('fType').value,
                    supplier: document.getElementById('fSupplier').value,
                    costPerUnit: parseFloat(document.getElementById('fCost').value) || 0,
                    minStock: parseInt(document.getElementById('fMinStock').value) || 50,
                    stock: parseInt(document.getElementById('fStock').value) || 0,
                    unit: 'kg'
                };
                if (feed.id && dbFeedings.findById(feed.id)) dbFeedings.update(feed.id, obj);
                else dbFeedings.insert(obj);
                showToast('Alimento guardado', 'success');
                this.loadData();
            });
        });
    }

    showStockForm() {
        const feeds = dbFeedings.getAll();
        if (feeds.length === 0) {
            showToast('No hay alimentos registrados', 'warning');
            return;
        }
        import('../utils.js').then(({ openModal }) => {
            openModal('Añadir Stock', `
                <div class="form-group"><label>Alimento</label>
                    <select id="stockFeedId" class="form-control">${feeds.map(f => `<option value="${f.id}">${f.feedType} (Stock: ${f.stock})</option>`).join('')}</select>
                </div>
                <div class="form-group"><label>Cantidad a añadir</label><input type="number" id="stockQty" class="form-control" min="1"></div>
            `, () => {
                const id = document.getElementById('stockFeedId').value;
                const qty = parseInt(document.getElementById('stockQty').value) || 0;
                if (qty <= 0) { showToast('Cantidad inválida', 'error'); return; }
                const feed = dbFeedings.findById(id);
                if (feed) {
                    feed.stock += qty;
                    dbFeedings.update(id, { stock: feed.stock });
                    showToast(`Stock actualizado (${feed.stock})`, 'success');
                    this.loadData();
                }
            });
        });
    }
}