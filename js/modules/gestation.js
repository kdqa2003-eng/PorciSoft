// ============================================
// Módulo: Lechones
// ============================================

import { dbPigs, dbVaccinations } from '../database.js';
import { showToast, confirmDialog, formatDate, calculateAge } from '../utils.js';
import CONFIG from '../config.js';

export default class PigletsModule {
    constructor(container) {
        this.container = container;
        this.currentPage = 1;
        this.searchTerm = '';
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">🐣 Lechones</h2>
            <div class="toolbar">
                <input type="text" id="pigletSearch" class="form-control" placeholder="🔍 Buscar..." style="width:200px">
                <button id="btnExportPiglets" class="btn btn-outline">📥 Exportar CSV</button>
            </div>
            <div id="pigletsTableContainer" class="table-container"></div>
            <div id="pigletsPagination" class="pagination"></div>
        `;
        document.getElementById('pigletSearch')?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        document.getElementById('btnExportPiglets')?.addEventListener('click', () => {
            import('../utils.js').then(({ exportToCSV }) => {
                exportToCSV(dbPigs.find(p => p.origin === 'nacimiento'), 'lechones.csv');
            });
        });
        this.loadData();
    }

    loadData() {
        // Consideramos lechones a los animales nacidos en la granja con edad < 60 días (o todos los nacidos)
        let data = dbPigs.find(p => p.origin === 'nacimiento');
        if (this.searchTerm) {
            data = data.filter(p => Object.values(p).some(v => String(v).toLowerCase().includes(this.searchTerm.toLowerCase())));
        }
        // Ordenar por fecha nacimiento descendente
        data.sort((a, b) => new Date(b.birthDate) - new Date(a.birthDate));
        const pageSize = CONFIG.PAGE_SIZE;
        const total = data.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (this.currentPage - 1) * pageSize;
        const items = data.slice(start, start + pageSize);
        this.renderTable(items);
        this.renderPagination(totalPages);
    }

    renderTable(items) {
        const c = document.getElementById('pigletsTableContainer');
        if (!c) return;
        c.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Número</th><th>Sexo</th><th>Raza</th><th>Fecha Nac.</th><th>Edad</th>
                        <th>Peso (kg)</th><th>Estado</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(p => `
                        <tr>
                            <td>${p.number}</td>
                            <td>${p.sex === 'macho' ? '♂️' : '♀️'}</td>
                            <td>${p.breed}</td>
                            <td>${formatDate(p.birthDate)}</td>
                            <td>${calculateAge(p.birthDate)}</td>
                            <td>${p.currentWeight || '-'}</td>
                            <td><span class="badge badge-${p.status === 'activo' ? 'success' : 'secondary'}">${p.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline vaccinate-piglet" data-id="${p.id}">💉</button>
                                <button class="btn btn-sm btn-info weigh-piglet" data-id="${p.id}">⚖️</button>
                                <button class="btn btn-sm btn-warning sell-piglet" data-id="${p.id}">💰</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        // Eventos
        c.querySelectorAll('.vaccinate-piglet').forEach(b => b.addEventListener('click', (e) => this.vaccinatePiglet(e.target.dataset.id)));
        c.querySelectorAll('.weigh-piglet').forEach(b => b.addEventListener('click', (e) => this.weighPiglet(e.target.dataset.id)));
        c.querySelectorAll('.sell-piglet').forEach(b => b.addEventListener('click', (e) => this.sellPiglet(e.target.dataset.id)));
    }

    renderPagination(total) { /* igual */ }

    async vaccinatePiglet(pigId) {
        const pig = dbPigs.findById(pigId);
        if (!pig) return;
        import('../utils.js').then(({ openModal }) => {
            openModal('Registrar Vacuna', `
                <p>Animal: ${pig.number}</p>
                <div class="form-group"><label>Vacuna</label><select id="vacType" class="form-control">${CONFIG.VACCINES.map(v => `<option>${v}</option>`).join('')}</select></div>
                <div class="form-row">
                    <div class="form-group"><label>Fecha</label><input type="date" id="vacDate" class="form-control" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="form-group"><label>Próxima dosis</label><input type="date" id="vacNext" class="form-control"></div>
                </div>
                <div class="form-group"><label>Veterinario</label><input type="text" id="vacVet" class="form-control"></div>
            `, () => {
                const vaccine = document.getElementById('vacType').value;
                const date = document.getElementById('vacDate').value;
                const next = document.getElementById('vacNext').value;
                const vet = document.getElementById('vacVet').value;
                if (!vaccine) { showToast('Selecciona vacuna', 'error'); return; }
                const vac = {
                    animalId: pig.id,
                    animalType: 'pig',
                    vaccine,
                    date,
                    nextDoseDate: next,
                    veterinarian: vet
                };
                dbVaccinations.insert(vac);
                showToast('Vacuna registrada', 'success');
            });
        });
    }

    async weighPiglet(pigId) {
        const pig = dbPigs.findById(pigId);
        if (!pig) return;
        import('../utils.js').then(({ openModal }) => {
            openModal('Registrar Peso', `
                <p>Animal: ${pig.number} - Peso actual: ${pig.currentWeight || '?'} kg</p>
                <div class="form-group"><label>Nuevo peso (kg)</label><input type="number" step="0.1" id="newWeight" class="form-control"></div>
            `, () => {
                const weight = parseFloat(document.getElementById('newWeight').value);
                if (isNaN(weight)) { showToast('Peso inválido', 'error'); return; }
                dbPigs.update(pig.id, { currentWeight: weight });
                showToast('Peso actualizado', 'success');
                this.loadData();
            });
        });
    }

    async sellPiglet(pigId) {
        const pig = dbPigs.findById(pigId);
        if (!pig) return;
        import('../utils.js').then(({ openModal }) => {
            openModal('Vender Lechón', `
                <p>Animal: ${pig.number}</p>
                <div class="form-row">
                    <div class="form-group"><label>Peso venta (kg)</label><input type="number" step="0.1" id="sellWeight" class="form-control" value="${pig.currentWeight || ''}"></div>
                    <div class="form-group"><label>Precio/kg</label><input type="number" step="0.01" id="sellPriceKg" class="form-control"></div>
                </div>
                <div class="form-group"><label>Cliente</label><input type="text" id="sellClient" class="form-control"></div>
            `, () => {
                const weight = parseFloat(document.getElementById('sellWeight').value);
                const priceKg = parseFloat(document.getElementById('sellPriceKg').value);
                const client = document.getElementById('sellClient').value;
                if (!weight || !priceKg) { showToast('Completa peso y precio', 'error'); return; }
                const total = weight * priceKg;
                // Actualizar animal
                dbPigs.update(pig.id, { status: 'vendido', currentWeight: weight });
                // Registrar venta
                import('../database.js').then(({ dbSales }) => {
                    dbSales.insert({
                        animalId: pig.id,
                        client,
                        weight,
                        pricePerKg: priceKg,
                        totalPrice: total,
                        date: new Date().toISOString().split('T')[0],
                        paymentMethod: 'efectivo'
                    });
                    showToast(`Vendido por ${total.toFixed(2)}`, 'success');
                    this.loadData();
                });
            });
        });
    }
}