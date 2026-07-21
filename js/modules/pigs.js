import { dbPigs } from '../database.js';
import { showToast, confirmDialog, formatDate, calculateAge } from '../utils.js';
import CONFIG from '../config.js';
import Pig from '../models/pig.js';

export default class PigsModule {
    constructor(container) {
        this.container = container;
        this.currentPage = 1;
        this.searchTerm = '';
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">🐷 Registro de Animales</h2>
            <div class="toolbar">
                <input type="text" id="pigSearch" class="form-control" placeholder="🔍 Buscar..." style="width:200px">
                <select id="pigStatusFilter" class="form-control">
                    <option value="">Todos los estados</option>
                    ${CONFIG.PIG_STATUS.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
                <button id="btnNewPig" class="btn btn-primary">➕ Nuevo Animal</button>
                <button id="btnExportPigs" class="btn btn-outline">📥 Exportar CSV</button>
            </div>
            <div id="pigsTableContainer" class="table-container"></div>
            <div id="pigsPagination" class="pagination"></div>
        `;
        
        this.setupEvents();
        await this.loadData();
    }

    setupEvents() {
        document.getElementById('btnNewPig')?.addEventListener('click', () => this.showForm());
        document.getElementById('pigSearch')?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        document.getElementById('pigStatusFilter')?.addEventListener('change', () => {
            this.currentPage = 1;
            this.loadData();
        });
        document.getElementById('btnExportPigs')?.addEventListener('click', () => {
            import('../utils.js').then(({ exportToCSV }) => exportToCSV(dbPigs.getAll(), 'animales.csv'));
        });
    }

    async loadData() {
        const statusFilter = document.getElementById('pigStatusFilter')?.value || '';
        let filtered = dbPigs.getAll();
        
        if (this.searchTerm) {
            filtered = dbPigs.search(this.searchTerm);
        }
        if (statusFilter) {
            filtered = filtered.filter(p => p.status === statusFilter);
        }
        
        const pageSize = CONFIG.PAGE_SIZE;
        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (this.currentPage - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);
        
        this.renderTable(items);
        this.renderPagination(totalPages);
    }

    renderTable(items) {
        const container = document.getElementById('pigsTableContainer');
        if (!container) return;
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Número</th><th>Arete</th><th>Nombre</th><th>Sexo</th><th>Raza</th>
                        <th>Fecha Nac.</th><th>Edad</th><th>Peso (kg)</th><th>Estado</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(p => `
                        <tr>
                            <td>${p.number}</td>
                            <td>${p.earTag || '-'}</td>
                            <td>${p.name || '-'}</td>
                            <td>${p.sex === 'macho' ? '♂️' : '♀️'}</td>
                            <td>${p.breed}</td>
                            <td>${formatDate(p.birthDate)}</td>
                            <td>${calculateAge(p.birthDate)}</td>
                            <td>${p.currentWeight || '-'}</td>
                            <td><span class="badge badge-${p.status === 'activo' ? 'success' : p.status === 'vendido' ? 'warning' : 'danger'}">${p.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline edit-pig" data-id="${p.id}">✏️</button>
                                <button class="btn btn-sm btn-danger delete-pig" data-id="${p.id}">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Eventos de botones
        container.querySelectorAll('.edit-pig').forEach(btn => btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            this.showForm(dbPigs.findById(id));
        }));
        container.querySelectorAll('.delete-pig').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (await confirmDialog('Eliminar animal', '¿Estás seguro?')) {
                dbPigs.delete(id);
                showToast('Animal eliminado', 'success');
                this.loadData();
            }
        }));
    }

    renderPagination(totalPages) {
        const container = document.getElementById('pigsPagination');
        if (!container || totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }
        
        let html = `<button ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">«</button>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        html += `<button ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">»</button>`;
        html += `<span class="pagination-info">Pág ${this.currentPage} de ${totalPages}</span>`;
        container.innerHTML = html;
        
        container.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadData();
                }
            });
        });
    }

    showForm(pigData = null) {
        const pig = pigData ? new Pig(pigData) : new Pig();
        const title = pigData ? 'Editar Animal' : 'Nuevo Animal';
        
        import('../utils.js').then(({ openModal }) => {
            openModal(title, this.getFormHTML(pig), () => {
                this.saveForm(pig);
            });
            // Llenar campos después de abrir
            setTimeout(() => this.fillForm(pig), 100);
        });
    }

    getFormHTML(pig) {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label class="required">Número</label>
                    <input type="text" id="pigNumber" class="form-control" value="${pig.number}">
                </div>
                <div class="form-group">
                    <label>Arete</label>
                    <input type="text" id="pigEarTag" class="form-control" value="${pig.earTag || ''}">
                </div>
                <div class="form-group">
                    <label>Chip RFID</label>
                    <input type="text" id="pigRfid" class="form-control" value="${pig.rfidChip || ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" id="pigName" class="form-control" value="${pig.name || ''}">
                </div>
                <div class="form-group">
                    <label class="required">Sexo</label>
                    <select id="pigSex" class="form-control">
                        ${CONFIG.SEX_TYPES.map(s => `<option value="${s}" ${pig.sex === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="required">Raza</label>
                    <select id="pigBreed" class="form-control">
                        ${CONFIG.BREEDS.map(b => `<option value="${b}" ${pig.breed === b ? 'selected' : ''}>${b}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Fecha Nacimiento</label>
                    <input type="date" id="pigBirthDate" class="form-control" value="${pig.birthDate || ''}">
                </div>
                <div class="form-group">
                    <label>Peso Nacimiento (kg)</label>
                    <input type="number" id="pigBirthWeight" class="form-control" value="${pig.birthWeight || ''}" step="0.1">
                </div>
                <div class="form-group">
                    <label>Peso Actual (kg)</label>
                    <input type="number" id="pigCurrentWeight" class="form-control" value="${pig.currentWeight || ''}" step="0.1">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Estado</label>
                    <select id="pigStatus" class="form-control">
                        ${CONFIG.PIG_STATUS.map(s => `<option value="${s}" ${pig.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Origen</label>
                    <select id="pigOrigin" class="form-control">
                        ${CONFIG.PIG_ORIGINS.map(o => `<option value="${o}" ${pig.origin === o ? 'selected' : ''}>${o}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Lote</label>
                    <input type="text" id="pigBatch" class="form-control" value="${pig.batch || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Observaciones</label>
                <textarea id="pigObservations" class="form-control">${pig.observations || ''}</textarea>
            </div>
        `;
    }

    fillForm(pig) {
        // Los valores ya están puestos en el HTML, pero por si acaso
    }

    saveForm(pig) {
        pig.number = document.getElementById('pigNumber')?.value || '';
        pig.earTag = document.getElementById('pigEarTag')?.value || '';
        pig.rfidChip = document.getElementById('pigRfid')?.value || '';
        pig.name = document.getElementById('pigName')?.value || '';
        pig.sex = document.getElementById('pigSex')?.value || 'macho';
        pig.breed = document.getElementById('pigBreed')?.value || '';
        pig.birthDate = document.getElementById('pigBirthDate')?.value || null;
        pig.birthWeight = parseFloat(document.getElementById('pigBirthWeight')?.value) || null;
        pig.currentWeight = parseFloat(document.getElementById('pigCurrentWeight')?.value) || null;
        pig.status = document.getElementById('pigStatus')?.value || 'activo';
        pig.origin = document.getElementById('pigOrigin')?.value || 'nacimiento';
        pig.batch = document.getElementById('pigBatch')?.value || '';
        pig.observations = document.getElementById('pigObservations')?.value || '';
        
        if (!pig.number) {
            showToast('El número es obligatorio', 'error');
            return;
        }
        
        if (pig.id && dbPigs.findById(pig.id)) {
            dbPigs.update(pig.id, pig);
            showToast('Animal actualizado', 'success');
        } else {
            dbPigs.insert(pig);
            showToast('Animal creado', 'success');
        }
        
        this.loadData();
    }
}