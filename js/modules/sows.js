import { dbSows } from '../database.js';
import { showToast, confirmDialog, formatDate } from '../utils.js';
import CONFIG from '../config.js';
import Sow from '../models/sow.js';

export default class SowsModule {
    constructor(container) { this.container = container; this.currentPage = 1; this.searchTerm = ''; }
    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">🐖 Madres (Cerdas)</h2>
            <div class="toolbar">
                <input type="text" id="sowSearch" class="form-control" placeholder="🔍 Buscar..." style="width:200px">
                <select id="sowStatusFilter" class="form-control">
                    <option value="">Todos los estados</option>
                    ${CONFIG.SOW_REPRODUCTIVE_STATUS.map(s => `<option>${s}</option>`).join('')}
                </select>
                <button id="btnNewSow" class="btn btn-primary">➕ Nueva Cerda</button>
            </div>
            <div id="sowsTableContainer" class="table-container"></div>
            <div id="sowsPagination" class="pagination"></div>`;
        this.setupEvents();
        this.loadData();
    }
    setupEvents() {
        document.getElementById('btnNewSow')?.addEventListener('click', () => this.showForm());
        document.getElementById('sowSearch')?.addEventListener('input', (e) => { this.searchTerm = e.target.value; this.currentPage = 1; this.loadData(); });
        document.getElementById('sowStatusFilter')?.addEventListener('change', () => { this.currentPage = 1; this.loadData(); });
    }
    async loadData() {
        const status = document.getElementById('sowStatusFilter')?.value || '';
        let data = dbSows.getAll();
        if (this.searchTerm) data = dbSows.search(this.searchTerm);
        if (status) data = data.filter(s => s.reproductiveStatus === status);
        const pageSize = CONFIG.PAGE_SIZE;
        const total = data.length;
        const pages = Math.ceil(total/pageSize);
        const start = (this.currentPage-1)*pageSize;
        const items = data.slice(start, start+pageSize);
        this.renderTable(items);
        this.renderPagination(pages);
    }
    renderTable(items) {
        const c = document.getElementById('sowsTableContainer');
        if (!c) return;
        c.innerHTML = `<table><thead><tr><th>Número</th><th>Nombre</th><th>Raza</th><th>Estado Rep.</th><th>Partos</th><th>Último Parto</th><th>Acciones</th></tr></thead>
        <tbody>${items.map(s => `<tr>
            <td>${s.number}</td><td>${s.name||'-'}</td><td>${s.breed}</td>
            <td><span class="badge badge-info">${s.reproductiveStatus}</span></td>
            <td>${s.parityNumber}</td><td>${formatDate(s.lastFarrowingDate)}</td>
            <td><button class="btn btn-sm edit-sow" data-id="${s.id}">✏️</button>
            <button class="btn btn-sm btn-danger delete-sow" data-id="${s.id}">🗑️</button></td>
        </tr>`).join('')}</tbody></table>`;
        c.querySelectorAll('.edit-sow').forEach(b => b.addEventListener('click', (e) => this.showForm(dbSows.findById(e.target.dataset.id))));
        c.querySelectorAll('.delete-sow').forEach(b => b.addEventListener('click', async (e) => {
            if (await confirmDialog('Eliminar cerda', '¿Confirmar?')) { dbSows.delete(e.target.dataset.id); showToast('Eliminada','success'); this.loadData(); }
        }));
    }
    renderPagination(total) {
        const c = document.getElementById('sowsPagination'); if (!c || total<=1) { c&&(c.innerHTML=''); return; }
        let h = `<button ${this.currentPage===1?'disabled':''} data-p="${this.currentPage-1}">«</button>`;
        for (let i=1;i<=total;i++) h += `<button class="${i===this.currentPage?'active':''}" data-p="${i}">${i}</button>`;
        h += `<button ${this.currentPage===total?'disabled':''} data-p="${this.currentPage+1}">»</button>`;
        c.innerHTML = h;
        c.querySelectorAll('button[data-p]').forEach(b => b.addEventListener('click', (e) => { this.currentPage = parseInt(e.target.dataset.p); this.loadData(); }));
    }
    showForm(data=null) {
        const sow = data || new Sow();
        import('../utils.js').then(({openModal})=>{
            openModal(data?'Editar Cerda':'Nueva Cerda', `
                <div class="form-row"><div class="form-group"><label>Número</label><input id="sNum" class="form-control" value="${sow.number}"></div>
                <div class="form-group"><label>Nombre</label><input id="sName" class="form-control" value="${sow.name||''}"></div></div>
                <div class="form-row"><div class="form-group"><label>Raza</label><select id="sBreed" class="form-control">${CONFIG.BREEDS.map(b=>`<option ${b===sow.breed?'selected':''}>${b}</option>`)}</select></div>
                <div class="form-group"><label>Estado Rep.</label><select id="sStatus" class="form-control">${CONFIG.SOW_REPRODUCTIVE_STATUS.map(s=>`<option ${s===sow.reproductiveStatus?'selected':''}>${s}</option>`)}</select></div></div>
                <div class="form-row"><div class="form-group"><label>Fecha Primer Celo</label><input type="date" id="sHeat" class="form-control" value="${sow.firstHeatDate||''}"></div>
                <div class="form-group"><label>Nº Partos</label><input type="number" id="sParity" class="form-control" value="${sow.parityNumber}"></div></div>
            `, ()=>{
                sow.number = document.getElementById('sNum').value;
                sow.name = document.getElementById('sName').value;
                sow.breed = document.getElementById('sBreed').value;
                sow.reproductiveStatus = document.getElementById('sStatus').value;
                sow.firstHeatDate = document.getElementById('sHeat').value;
                sow.parityNumber = parseInt(document.getElementById('sParity').value)||0;
                if (!sow.number) { showToast('Número requerido','error'); return; }
                if (sow.id && dbSows.findById(sow.id)) dbSows.update(sow.id, sow);
                else dbSows.insert(sow);
                showToast('Cerda guardada','success');
                this.loadData();
            });
        });
    }
}