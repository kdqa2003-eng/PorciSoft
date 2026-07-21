// ============================================
// Módulo: Medicamentos (Inventario)
// ============================================

import { dbMedicines } from '../database.js';
import { showToast, confirmDialog, formatDate } from '../utils.js';
import CONFIG from '../config.js';

export default class MedicineModule {
    constructor(container) {
        this.container = container;
        this.currentPage = 1;
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">💊 Medicamentos</h2>
            <div class="toolbar">
                <button id="btnNewMedicine" class="btn btn-primary">➕ Nuevo Medicamento</button>
            </div>
            <div id="medTableContainer" class="table-container"></div>
            <div id="medPagination" class="pagination"></div>
        `;
        document.getElementById('btnNewMedicine')?.addEventListener('click', () => this.showForm());
        this.loadData();
    }

    loadData() {
        const data = dbMedicines.getAll();
        const pageSize = CONFIG.PAGE_SIZE;
        const total = data.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (this.currentPage - 1) * pageSize;
        const items = data.slice(start, start + pageSize);
        this.renderTable(items);
        this.renderPagination(totalPages);
    }

    renderTable(items) {
        const c = document.getElementById('medTableContainer');
        if (!c) return;
        c.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th><th>Cantidad</th><th>Costo</th><th>Proveedor</th>
                        <th>Vencimiento</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(m => `
                        <tr>
                            <td>${m.name || ''}</td>
                            <td>${m.quantity || 0}</td>
                            <td>${m.cost || 0}</td>
                            <td>${m.supplier || '-'}</td>
                            <td>${formatDate(m.expiryDate)}</td>
                            <td>
                                <button class="btn btn-sm edit-med" data-id="${m.id}">✏️</button>
                                <button class="btn btn-sm btn-danger delete-med" data-id="${m.id}">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        c.querySelectorAll('.edit-med').forEach(b => b.addEventListener('click', (e) => this.showForm(dbMedicines.findById(e.target.dataset.id))));
        c.querySelectorAll('.delete-med').forEach(b => b.addEventListener('click', async (e) => {
            if (await confirmDialog('Eliminar', '¿Seguro?')) {
                dbMedicines.delete(e.target.dataset.id);
                showToast('Eliminado', 'success');
                this.loadData();
            }
        }));
    }

    renderPagination(total) { /* igual */ }

    showForm(data = null) {
        const med = data || {};
        import('../utils.js').then(({ openModal }) => {
            openModal(data ? 'Editar Medicamento' : 'Nuevo Medicamento', `
                <div class="form-row">
                    <div class="form-group"><label>Nombre</label><input type="text" id="mName" class="form-control" value="${med.name || ''}"></div>
                    <div class="form-group"><label>Cantidad</label><input type="number" id="mQty" class="form-control" value="${med.quantity || 0}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Costo</label><input type="number" step="0.01" id="mCost" class="form-control" value="${med.cost || 0}"></div>
                    <div class="form-group"><label>Proveedor</label><input type="text" id="mSupplier" class="form-control" value="${med.supplier || ''}"></div>
                </div>
                <div class="form-group"><label>Fecha Vencimiento</label><input type="date" id="mExpiry" class="form-control" value="${med.expiryDate || ''}"></div>
            `, () => {
                const obj = {
                    name: document.getElementById('mName').value,
                    quantity: parseInt(document.getElementById('mQty').value) || 0,
                    cost: parseFloat(document.getElementById('mCost').value) || 0,
                    supplier: document.getElementById('mSupplier').value,
                    expiryDate: document.getElementById('mExpiry').value,
                    type: 'medicamento'
                };
                if (med.id && dbMedicines.findById(med.id)) dbMedicines.update(med.id, obj);
                else dbMedicines.insert(obj);
                showToast('Medicamento guardado', 'success');
                this.loadData();
            });
        });
    }
}