import { dbBoars } from '../database.js';
import { showToast, confirmDialog, formatDate } from '../utils.js';
import CONFIG from '../config.js';
import Boar from '../models/boar.js';

export default class BoarsModule {
    constructor(container) { this.container = container; this.currentPage = 1; this.searchTerm = ''; }
    async render() {
        this.container.innerHTML = `<h2>🐗 Verracos</h2>
        <div class="toolbar"><input type="text" id="boarSearch" class="form-control" placeholder="Buscar..."><button id="btnNewBoar" class="btn btn-primary">➕ Nuevo Verraco</button></div>
        <div id="boarsTableContainer" class="table-container"></div><div id="boarsPagination" class="pagination"></div>`;
        document.getElementById('btnNewBoar')?.addEventListener('click', ()=>this.showForm());
        document.getElementById('boarSearch')?.addEventListener('input', (e)=>{this.searchTerm=e.target.value;this.currentPage=1;this.loadData();});
        this.loadData();
    }
    async loadData() {
        let data = dbBoars.getAll(); if(this.searchTerm) data = dbBoars.search(this.searchTerm);
        const ps=CONFIG.PAGE_SIZE, total=data.length, pages=Math.ceil(total/ps);
        const items=data.slice((this.currentPage-1)*ps, this.currentPage*ps);
        this.renderTable(items); this.renderPagination(pages);
    }
    renderTable(items) {
        const c = document.getElementById('boarsTableContainer');
        c.innerHTML = `<table><thead><tr><th>Número</th><th>Raza</th><th>Línea Gen.</th><th>Disponibilidad</th><th>Servicios</th><th>Acciones</th></tr></thead>
        <tbody>${items.map(b=>`<tr><td>${b.number}</td><td>${b.breed}</td><td>${b.geneticLine||'-'}</td><td>${b.availability}</td><td>${b.totalServices}</td>
        <td><button class="btn btn-sm edit-boar" data-id="${b.id}">✏️</button><button class="btn btn-sm btn-danger delete-boar" data-id="${b.id}">🗑️</button></td></tr>`).join('')}</tbody></table>`;
        c.querySelectorAll('.edit-boar').forEach(b=>b.addEventListener('click',(e)=>this.showForm(dbBoars.findById(e.target.dataset.id))));
        c.querySelectorAll('.delete-boar').forEach(b=>b.addEventListener('click',async(e)=>{if(await confirmDialog('Eliminar','¿Seguro?')){dbBoars.delete(e.target.dataset.id);showToast('Eliminado','success');this.loadData();}}));
    }
    renderPagination(total){ /* idéntico a anteriores */ }
    showForm(data=null){
        const boar = data || new Boar();
        import('../utils.js').then(({openModal})=>{
            openModal(data?'Editar Verraco':'Nuevo Verraco',`
                <div class="form-row"><div class="form-group"><label>Número</label><input id="bNum" class="form-control" value="${boar.number}"></div>
                <div class="form-group"><label>Raza</label><select id="bBreed" class="form-control">${CONFIG.BREEDS.map(b=>`<option ${b===boar.breed?'selected':''}>${b}</option>`)}</select></div></div>
                <div class="form-row"><div class="form-group"><label>Línea Genética</label><input id="bLine" class="form-control" value="${boar.geneticLine||''}"></div>
                <div class="form-group"><label>Disponibilidad</label><select id="bAvail" class="form-control">${['disponible','ocupado','descanso','descartado'].map(s=>`<option ${s===boar.availability?'selected':''}>${s}</option>`)}</select></div></div>
                <div class="form-group"><label>Observaciones</label><textarea id="bObs" class="form-control">${boar.observations||''}</textarea></div>
            `, ()=>{
                boar.number = document.getElementById('bNum').value;
                boar.breed = document.getElementById('bBreed').value;
                boar.geneticLine = document.getElementById('bLine').value;
                boar.availability = document.getElementById('bAvail').value;
                boar.observations = document.getElementById('bObs').value;
                if(!boar.number){showToast('Número requerido','error');return;}
                if(boar.id && dbBoars.findById(boar.id)) dbBoars.update(boar.id, boar);
                else dbBoars.insert(boar);
                showToast('Verraco guardado','success'); this.loadData();
            });
        });
    }
}