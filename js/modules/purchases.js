// ============================================
// Módulo: Compras
// ============================================

import { dbPurchases } from '../database.js';
import { showToast, confirmDialog, formatDate, formatCurrency } from '../utils.js';
import CONFIG from '../config.js';

export default class PurchasesModule {
    constructor(container) {
        this.container = container;
        this.currentPage = 1;
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">🛒 Compras</h2>
            <div class="toolbar">
                <button id="btnNewPurchase" class="btn btn-primary">➕ Nueva Compra</button>
            </div>
            <div id="purchTableContainer" class="table-container"></div>
            <div id="purchPagination" class="pagination"></div>
        `;
        document.getElementById('btnNewPurchase')?.addEventListener('click', () => this.showForm());
        this.loadData();
    }

    loadData() {
        const data = dbPurchases.getAll().sort((a,b) => new Date(b.date) - new Date(a.date));
        const pageSize = CONFIG.PAGE_SIZE;
        const total = data.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (this.currentPage - 1) * pageSize;
        const items = data.slice(start, start + pageSize);
        this.renderTable(items);
        this.renderPagination(totalPages);
    }

    renderTable(items) {
        const c = document.getElementById('purchTableContainer');
        if (!c) return;
        c.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th><th>Proveedor</th><th>Productos</th><th>Total</th><th>Factura</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(p => `
                        <tr>
                            <td>${formatDate(p.date)}</td>
                            <td>${p.supplier || '-'}</td>
                            <td>${p.products ? p.products.length : 0} ítems</td>
                            <td>${formatCurrency(p.total)}</td>
                            <td>${p.invoice || '-'}</td>
                            <td>
                                <button class="btn btn-sm edit-purch" data-id="${p.id}">✏️</button>
                                <button class="btn btn-sm btn-danger delete-purch" data-id="${p.id}">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        c.querySelectorAll('.edit-purch').forEach(b => b.addEventListener('click', (e) => this.showForm(dbPurchases.findById(e.target.dataset.id))));
        c.querySelectorAll('.delete-purch').forEach(b => b.addEventListener('click', async (e) => {
            if (await confirmDialog('Eliminar', '¿Seguro?')) {
                dbPurchases.delete(e.target.dataset.id);
                showToast('Compra eliminada', 'success');
                this.loadData();
            }
        }));
    }

    renderPagination(total) { /* igual */ }

    showForm(data = null) {
        const purchase = data || { products: [] };
        import('../utils.js').then(({ openModal }) => {
            openModal(data ? 'Editar Compra' : 'Nueva Compra', `
                <div class="form-row">
                    <div class="form-group"><label>Fecha</label><input type="date" id="pDate" class="form-control" value="${purchase.date || ''}"></div>
                    <div class="form-group"><label>Proveedor</label><input type="text" id="pSupplier" class="form-control" value="${purchase.supplier || ''}"></div>
                </div>
                <div class="form-group"><label>Factura</label><input type="text" id="pInvoice" class="form-control" value="${purchase.invoice || ''}"></div>
                <div class="form-group"><label>Productos (JSON simplificado)</label><textarea id="pProducts" class="form-control">${JSON.stringify(purchase.products, null, 2)}</textarea></div>
                <div class="form-group"><label>Total</label><input type="number" step="0.01" id="pTotal" class="form-control" value="${purchase.total || 0}"></div>
            `, () => {
                let products = [];
                try {
                    products = JSON.parse(document.getElementById('pProducts').value || '[]');
                } catch(e) { showToast('Formato JSON inválido', 'error'); return; }
                const obj = {
                    date: document.getElementById('pDate').value,
                    supplier: document.getElementById('pSupplier').value,
                    invoice: document.getElementById('pInvoice').value,
                    products,
                    total: parseFloat(document.getElementById('pTotal').value) || 0
                };
                if (purchase.id && dbPurchases.findById(purchase.id)) dbPurchases.update(purchase.id, obj);
                else dbPurchases.insert(obj);
                showToast('Compra guardada', 'success');
                this.loadData();
            });
        });
    }
}