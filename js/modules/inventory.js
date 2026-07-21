// ============================================
// Módulo: Inventario General
// ============================================

import { dbInventory } from '../database.js';
import { showToast, confirmDialog, formatDate } from '../utils.js';
import CONFIG from '../config.js';

export default class InventoryModule {
    constructor(container) {
        this.container = container;
        this.currentPage = 1;
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">📦 Inventario</h2>
            <div class="toolbar">
                <button id="btnNewItem" class="btn btn-primary">➕ Nuevo Ítem</button>
            </div>
            <div id="invTableContainer" class="table-container"></div>
            <div id="invPagination" class="pagination"></div>
        `;
        document.getElementById('btnNewItem')?.addEventListener('click', () => this.showForm());
        this.loadData();
    }

    loadData() {
        const data = dbInventory.getAll();
        const pageSize = CONFIG.PAGE_SIZE;
        const total = data.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (this.currentPage - 1) * pageSize;
        const items = data.slice(start, start + pageSize);
        this.renderTable(items);
        this.renderPagination(totalPages);
    }

    renderTable(items) {
        const c = document.getElementById('invTableContainer');
        if (!c) return;
        c.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th><th>Categoría</th><th>Cantidad</th><th>Costo</th>
                        <th>Proveedor</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(i => `
                        <tr>
                            <td>${i.name || ''}</td>
                            <td>${i.category || ''}</td>
                            <td>${i.quantity || 0}</td>
                            <td>${i.cost || 0}</td>
                            <td>${i.supplier || '-'}</td>
                            <td>
                                <button class="btn btn-sm edit-inv" data-id="${i.id}">✏️</button>
                                <button class="btn btn-sm btn-danger delete-inv" data-id="${i.id}">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        c.querySelectorAll('.edit-inv').forEach(b => b.addEventListener('click', (e) => this.showForm(dbInventory.findById(e.target.dataset.id))));
        c.querySelectorAll('.delete-inv').forEach(b => b.addEventListener('click', async (e) => {
            if (await confirmDialog('Eliminar', '¿Seguro?')) {
                dbInventory.delete(e.target.dataset.id);
                showToast('Eliminado', 'success');
                this.loadData();
            }
        }));
    }

    renderPagination(total) { /* igual */ }

    showForm(data = null) {
        const item = data || {};
        import('../utils.js').then(({ openModal }) => {
            openModal(data ? 'Editar Ítem' : 'Nuevo Ítem', `
                <div class="form-row">
                    <div class="form-group"><label>Nombre</label><input type="text" id="iName" class="form-control" value="${item.name || ''}"></div>
                    <div class="form-group"><label>Categoría</label>
                        <select id="iCat" class="form-control">
                            <option value="herramienta" ${item.category === 'herramienta' ? 'selected' : ''}>Herramienta</option>
                            <option value="equipo" ${item.category === 'equipo' ? 'selected' : ''}>Equipo</option>
                            <option value="material" ${item.category === 'material' ? 'selected' : ''}>Material</option>
                            <option value="otro" ${item.category === 'otro' ? 'selected' : ''}>Otro</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Cantidad</label><input type="number" id="iQty" class="form-control" value="${item.quantity || 0}"></div>
                    <div class="form-group"><label>Costo</label><input type="number" step="0.01" id="iCost" class="form-control" value="${item.cost || 0}"></div>
                </div>
                <div class="form-group"><label>Proveedor</label><input type="text" id="iSupplier" class="form-control" value="${item.supplier || ''}"></div>
            `, () => {
                const obj = {
                    name: document.getElementById('iName').value,
                    category: document.getElementById('iCat').value,
                    quantity: parseInt(document.getElementById('iQty').value) || 0,
                    cost: parseFloat(document.getElementById('iCost').value) || 0,
                    supplier: document.getElementById('iSupplier').value
                };
                if (item.id && dbInventory.findById(item.id)) dbInventory.update(item.id, obj);
                else dbInventory.insert(obj);
                showToast('Ítem guardado', 'success');
                this.loadData();
            });
        });
    }
}