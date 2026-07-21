import { dbBreedings, dbSows, dbBoars } from '../database.js';
import { showToast, confirmDialog, formatDate } from '../utils.js';
import CONFIG from '../config.js';
import Breeding from '../models/breeding.js';

export default class BreedingModule {
    constructor(container) { this.container = container; this.currentPage = 1; }
    async render() {
        this.container.innerHTML = `<h2>💕 Servicios / Montas</h2>
        <div class="toolbar"><button id="btnNewBreeding" class="btn btn-primary">➕ Nuevo Servicio</button></div>
        <div id="breedingsTableContainer" class="table-container"></div><div id="breedingsPagination" class="pagination"></div>`;
        document.getElementById('btnNewBreeding')?.addEventListener('click', ()=>this.showForm());
        this.loadData();
    }
    async loadData() {
        const data = dbBreedings.sort('serviceDate', 'desc');
        const ps=CONFIG.PAGE_SIZE, total=data.length, pages=Math.ceil(total/ps);
        const items=data.slice((this.currentPage-1)*ps, this.currentPage*ps);
        this.renderTable(items); this.renderPagination(pages);
    }
    renderTable(items) {
        const c = document.getElementById('breedingsTableContainer');
        c.innerHTML = `<table><thead><tr><th>Fecha</th><th>Cerda</th><th>Verraco</th><th>Tipo</th><th>Resultado</th><th>Acciones</th></tr></thead>
        <tbody>${items.map(br=>{
            const sow = dbSows.findById(br.sowId); const boar = dbBoars.findById(br.boarId);
            return `<tr><td>${formatDate(br.serviceDate)}</td><td>${sow?.number||'-'}</td><td>${boar?.number||'-'}</td><td>${br.type}</td><td>${br.result}</td>
            <td><button class="btn btn-sm edit-breeding" data-id="${br.id}">✏️</button></td></tr>`;
        }).join('')}</tbody></table>`;
        c.querySelectorAll('.edit-breeding').forEach(b=>b.addEventListener('click',(e)=>this.showForm(dbBreedings.findById(e.target.dataset.id))));
    }
    renderPagination(total){ /* idéntico */ }
    showForm(data=null){
        const breeding = data || new Breeding();
        const sows = dbSows.getAll(); const boars = dbBoars.getAll();
        import('../utils.js').then(({openModal})=>{
            openModal(data?'Editar Servicio':'Nuevo Servicio',`
                <div class="form-row">
                    <div class="form-group"><label>Cerda</label><select id="brSow" class="form-control">${sows.map(s=>`<option value="${s.id}" ${s.id===breeding.sowId?'selected':''}>${s.number}</option>`)}</select></div>
                    <div class="form-group"><label>Verraco</label><select id="brBoar" class="form-control">${boars.map(b=>`<option value="${b.id}" ${b.id===breeding.boarId?'selected':''}>${b.number}</option>`)}</select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Fecha Servicio</label><input type="date" id="brDate" class="form-control" value="${breeding.serviceDate||''}"></div>
                    <div class="form-group"><label>Tipo</label><select id="brType" class="form-control">${CONFIG.BREEDING_TYPES.map(t=>`<option ${t===breeding.type?'selected':''}>${t}</option>`)}</select></div>
                </div>
                <div class="form-group"><label>Resultado</label><select id="brResult" class="form-control"><option value="pendiente" ${breeding.result==='pendiente'?'selected':''}>Pendiente</option><option value="preñada" ${breeding.result==='preñada'?'selected':''}>Preñada</option><option value="vacia" ${breeding.result==='vacia'?'selected':''}>Vacía</option></select></div>
                <div class="form-group"><label>Observaciones</label><textarea id="brObs" class="form-control">${breeding.observations||''}</textarea></div>
            `, ()=>{
                breeding.sowId = document.getElementById('brSow').value;
                breeding.boarId = document.getElementById('brBoar').value;
                breeding.serviceDate = document.getElementById('brDate').value;
                breeding.type = document.getElementById('brType').value;
                breeding.result = document.getElementById('brResult').value;
                breeding.observations = document.getElementById('brObs').value;
                // Calcular fechas automáticas
                if(breeding.serviceDate){
                    const calc = new Breeding().calculateDates(breeding.serviceDate);
                    breeding.returnDate = calc.returnDate;
                    breeding.expectedFarrowingDate = calc.expectedFarrowingDate;
                }
                if(breeding.id && dbBreedings.findById(breeding.id)) dbBreedings.update(breeding.id, breeding);
                else dbBreedings.insert(breeding);
                showToast('Servicio guardado','success'); this.loadData();
            });
        });
    }
}