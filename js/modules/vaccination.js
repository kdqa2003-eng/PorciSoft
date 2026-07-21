// ============================================
// Módulo: Vacunación
// ============================================

import { dbVaccinations, dbPigs, dbSows, dbBoars } from '../database.js';
import { showToast, confirmDialog, formatDate } from '../utils.js';
import CONFIG from '../config.js';

export default class VaccinationModule {
    constructor(container) {
        this.container = container;
        this.currentPage = 1;
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">💉 Vacunación</h2>
            <div class="toolbar">
                <button id="btnNewVaccination" class="btn btn-primary">➕ Nueva Vacunación</button>
            </div>
            <div id="vaccTableContainer" class="table-container"></div>
            <div id="vaccPagination" class="pagination"></div>
        `;
        document.getElementById('btnNewVaccination')?.addEventListener('click', () => this.showForm());
        this.loadData();
    }

    loadData() {
        const data = dbVaccinations.sort('date', 'desc');
        const pageSize = CONFIG.PAGE_SIZE;
        const total = data.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (this.currentPage - 1) * pageSize;
        const items = data.slice(start, start + pageSize);
        this.renderTable(items);
        this.renderPagination(totalPages);
    }

    renderTable(items) {
        const c = document.getElementById('vaccTableContainer');
        if (!c) return;
        c.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th><th>Animal</th><th>Vacuna</th><th>Lote</th>
                        <th>Veterinario</th><th>Próxima Dosis</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(v => {
                        let animal = dbPigs.findById(v.animalId) || dbSows.findById(v.animalId) || dbBoars.findById(v.animalId);
                        return `
                            <tr>
                                <td>${formatDate(v.date)}</td>
                                <td>${animal ? animal.number : '-'}</td>
                                <td>${v.vaccine}</td>
                                <td>${v.batch || '-'}</td>
                                <td>${v.veterinarian || '-'}</td>
                                <td>${formatDate(v.nextDoseDate)}</td>
                                <td>
                                    <button class="btn btn-sm edit-vacc" data-id="${v.id}">✏️</button>
                                    <button class="btn btn-sm btn-danger delete-vacc" data-id="${v.id}">🗑️</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        c.querySelectorAll('.edit-vacc').forEach(b => b.addEventListener('click', (e) => this.showForm(dbVaccinations.findById(e.target.dataset.id))));
        c.querySelectorAll('.delete-vacc').forEach(b => b.addEventListener('click', async (e) => {
            if (await confirmDialog('Eliminar', '¿Seguro?')) {
                dbVaccinations.delete(e.target.dataset.id);
                showToast('Eliminada', 'success');
                this.loadData();
            }
        }));
    }

    renderPagination(total) { /* igual */ }

    showForm(data = null) {
        const vacc = data || {};
        // Obtener lista de animales (todos)
        const allAnimals = [...dbPigs.getAll(), ...dbSows.getAll(), ...dbBoars.getAll()];
        import('../utils.js').then(({ openModal }) => {
            openModal(data ? 'Editar Vacunación' : 'Nueva Vacunación', `
                <div class="form-group"><label>Animal</label>
                    <select id="vAnimal" class="form-control">
                        <option value="">Seleccione...</option>
                        ${allAnimals.map(a => `<option value="${a.id}" ${a.id === vacc.animalId ? 'selected' : ''}>${a.number} (${a.constructor?.name || 'animal'})</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Vacuna</label><select id="vVaccine" class="form-control">${CONFIG.VACCINES.map(v => `<option ${v === vacc.vaccine ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Lote</label><input type="text" id="vBatch" class="form-control" value="${vacc.batch || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Fecha</label><input type="date" id="vDate" class="form-control" value="${vacc.date || ''}"></div>
                    <div class="form-group"><label>Próxima Dosis</label><input type="date" id="vNext" class="form-control" value="${vacc.nextDoseDate || ''}"></div>
                </div>
                <div class="form-group"><label>Veterinario</label><input type="text" id="vVet" class="form-control" value="${vacc.veterinarian || ''}"></div>
                <div class="form-group"><label>Observaciones</label><textarea id="vObs" class="form-control">${vacc.observations || ''}</textarea></div>
            `, () => {
                const animalId = document.getElementById('vAnimal').value;
                if (!animalId) { showToast('Seleccione animal', 'error'); return; }
                const obj = {
                    animalId,
                    animalType: 'pig', // simplificado
                    vaccine: document.getElementById('vVaccine').value,
                    batch: document.getElementById('vBatch').value,
                    date: document.getElementById('vDate').value,
                    nextDoseDate: document.getElementById('vNext').value,
                    veterinarian: document.getElementById('vVet').value,
                    observations: document.getElementById('vObs').value
                };
                if (vacc.id && dbVaccinations.findById(vacc.id)) dbVaccinations.update(vacc.id, obj);
                else dbVaccinations.insert(obj);
                showToast('Vacunación guardada', 'success');
                this.loadData();
            });
        });
    }
}