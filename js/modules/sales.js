// ============================================
// Módulo: Ventas
// ============================================

import { dbSales, dbPigs } from '../database.js';
import { showToast, confirmDialog, formatDate, formatCurrency } from '../utils.js';
import CONFIG from '../config.js';

export default class SalesModule {
    constructor(container) {
        this.container = container;
        this.currentPage = 1;
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">💰 Ventas</h2>
            <div class="toolbar">
                <button id="btnNewSale" class="btn btn-primary">➕ Nueva Venta</button>
            </div>
            <div id="salesTableContainer" class="table-container"></div>
            <div id="salesPagination" class="pagination"></div>
        `;
        document.getElementById('btnNewSale')?.addEventListener('click', () => this.showForm());
        this.loadData();
    }

    loadData() {
        const data = dbSales.getAll().sort((a,b) => new Date(b.date) - new Date(a.date));
        const pageSize = CONFIG.PAGE_SIZE;
        const total = data.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (this.currentPage - 1) * pageSize;
        const items = data.slice(start, start + pageSize);
        this.renderTable(items);
        this.renderPagination(totalPages);
    }

    renderTable(items) {
        const c = document.getElementById('salesTableContainer');
        if (!c) return;
        c.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th><th>Animal</th><th>Cliente</th><th>Peso (kg)</th>
                        <th>Precio/kg</th><th>Total</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(s => {
                        const pig = dbPigs.findById(s.animalId);
                        return `
                            <tr>
                                <td>${formatDate(s.date)}</td>
                                <td>${pig ? pig.number : '-'}</td>
                                <td>${s.client || '-'}</td>
                                <td>${s.weight}</td>
                                <td>${formatCurrency(s.pricePerKg)}</td>
                                <td>${formatCurrency(s.totalPrice)}</td>
                                <td>
                                    <button class="btn btn-sm edit-sale" data-id="${s.id}">✏️</button>
                                    <button class="btn btn-sm btn-danger delete-sale" data-id="${s.id}">🗑️</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        c.querySelectorAll('.edit-sale').forEach(b => b.addEventListener('click', (e) => this.showForm(dbSales.findById(e.target.dataset.id))));
        c.querySelectorAll('.delete-sale').forEach(b => b.addEventListener('click', async (e) => {
            if (await confirmDialog('Eliminar', '¿Seguro?')) {
                dbSales.delete(e.target.dataset.id);
                showToast('Venta eliminada', 'success');
                this.loadData();
            }
        }));
    }

    renderPagination(total) { /* igual */ }

    showForm(data = null) {
        const sale = data || {};
        const pigs = dbPigs.find(p => p.status === 'activo'); // solo activos
        import('../utils.js').then(({ openModal }) => {
            openModal(data ? 'Editar Venta' : 'Nueva Venta', `
                <div class="form-group"><label>Animal</label>
                    <select id="sAnimal" class="form-control">
                        <option value="">Seleccione...</option>
                        ${pigs.map(p => `<option value="${p.id}" ${p.id === sale.animalId ? 'selected' : ''}>${p.number} (${p.currentWeight || 0} kg)</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Fecha</label><input type="date" id="sDate" class="form-control" value="${sale.date || ''}"></div>
                    <div class="form-group"><label>Cliente</label><input type="text" id="sClient" class="form-control" value="${sale.client || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Peso (kg)</label><input type="number" step="0.1" id="sWeight" class="form-control" value="${sale.weight || ''}"></div>
                    <div class="form-group"><label>Precio/kg</label><input type="number" step="0.01" id="sPriceKg" class="form-control" value="${sale.pricePerKg || ''}"></div>
                </div>
                <div class="form-group"><label>Total</label><input type="number" step="0.01" id="sTotal" class="form-control" value="${sale.totalPrice || ''}" readonly></div>
                <div class="form-group"><label>Forma de pago</label>
                    <select id="sPayment" class="form-control">
                        <option value="efectivo" ${sale.paymentMethod === 'efectivo' ? 'selected' : ''}>Efectivo</option>
                        <option value="transferencia" ${sale.paymentMethod === 'transferencia' ? 'selected' : ''}>Transferencia</option>
                    </select>
                </div>
            `, () => {
                const animalId = document.getElementById('sAnimal').value;
                const weight = parseFloat(document.getElementById('sWeight').value) || 0;
                const priceKg = parseFloat(document.getElementById('sPriceKg').value) || 0;
                const total = weight * priceKg;
                document.getElementById('sTotal').value = total.toFixed(2);
                const obj = {
                    animalId,
                    client: document.getElementById('sClient').value,
                    date: document.getElementById('sDate').value,
                    weight,
                    pricePerKg: priceKg,
                    totalPrice: total,
                    paymentMethod: document.getElementById('sPayment').value
                };
                if (!animalId) { showToast('Seleccione animal', 'error'); return; }
                if (sale.id && dbSales.findById(sale.id)) dbSales.update(sale.id, obj);
                else dbSales.insert(obj);
                // Actualizar estado del animal
                dbPigs.update(animalId, { status: 'vendido', currentWeight: weight });
                showToast('Venta registrada', 'success');
                this.loadData();
            });
            // Calcular total automáticamente
            setTimeout(() => {
                document.getElementById('sWeight')?.addEventListener('input', calcTotal);
                document.getElementById('sPriceKg')?.addEventListener('input', calcTotal);
            }, 200);
            const calcTotal = () => {
                const w = parseFloat(document.getElementById('sWeight').value) || 0;
                const p = parseFloat(document.getElementById('sPriceKg').value) || 0;
                document.getElementById('sTotal').value = (w * p).toFixed(2);
            };
        });
    }
}