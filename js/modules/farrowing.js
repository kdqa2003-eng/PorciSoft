import { dbLitters, dbPigs, dbSows } from '../database.js';
import { showToast, formatDate, generateId } from '../utils.js';
import CONFIG from '../config.js';
import Litter from '../models/litter.js';
import Pig from '../models/pig.js';

export default class FarrowingModule {
    constructor(container) { this.container = container; this.currentPage = 1; }
    async render() {
        this.container.innerHTML = `<h2>🐽 Partos</h2>
        <div class="toolbar"><button id="btnNewFarrowing" class="btn btn-primary">➕ Registrar Parto</button></div>
        <div id="farrowingsTableContainer" class="table-container"></div><div id="farrowingsPagination" class="pagination"></div>`;
        document.getElementById('btnNewFarrowing')?.addEventListener('click', ()=>this.showForm());
        this.loadData();
    }
    async loadData() {
        const data = dbLitters.sort('farrowingDate','desc');
        const ps=CONFIG.PAGE_SIZE, total=data.length, pages=Math.ceil(total/ps);
        const items=data.slice((this.currentPage-1)*ps, this.currentPage*ps);
        this.renderTable(items); this.renderPagination(pages);
    }
    renderTable(items) {
        const c = document.getElementById('farrowingsTableContainer');
        c.innerHTML = `<table><thead><tr><th>Fecha</th><th>Madre</th><th>Nacidos vivos</th><th>Muertos</th><th>Destetados</th><th>Acciones</th></tr></thead>
        <tbody>${items.map(l=>{
            const sow = dbSows.findById(l.sowId);
            return `<tr><td>${formatDate(l.farrowingDate)}</td><td>${sow?.number||'-'}</td><td>${l.bornAlive}</td><td>${l.stillborn}</td><td>${l.weanedCount}</td>
            <td><button class="btn btn-sm edit-litter" data-id="${l.id}">✏️</button></td></tr>`;
        }).join('')}</tbody></table>`;
    }
    renderPagination(total){ /* idéntico */ }
    showForm(data=null){
        const litter = data || new Litter();
        const sows = dbSows.getAll();
        import('../utils.js').then(({openModal})=>{
            openModal(data?'Editar Parto':'Registrar Parto',`
                <div class="form-group"><label>Madre</label><select id="lSow" class="form-control">${sows.map(s=>`<option value="${s.id}" ${s.id===litter.sowId?'selected':''}>${s.number}</option>`)}</select></div>
                <div class="form-row">
                    <div class="form-group"><label>Fecha Parto</label><input type="date" id="lDate" class="form-control" value="${litter.farrowingDate||''}"></div>
                    <div class="form-group"><label>Hora</label><input type="time" id="lTime" class="form-control" value="${litter.farrowingTime||''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Nacidos vivos</label><input type="number" id="lAlive" class="form-control" value="${litter.bornAlive||0}"></div>
                    <div class="form-group"><label>Muertos</label><input type="number" id="lDead" class="form-control" value="${litter.stillborn||0}"></div>
                    <div class="form-group"><label>Momificados</label><input type="number" id="lMumm" class="form-control" value="${litter.mummified||0}"></div>
                </div>
                <div class="form-group"><label>Peso promedio (kg)</label><input type="number" step="0.1" id="lAvgWeight" class="form-control" value="${litter.avgBirthWeight||''}"></div>
                <div class="form-check"><input type="checkbox" id="lCreatePiglets" checked> Crear lechones automáticamente</div>
            `, ()=>{
                litter.sowId = document.getElementById('lSow').value;
                litter.farrowingDate = document.getElementById('lDate').value;
                litter.farrowingTime = document.getElementById('lTime').value;
                litter.bornAlive = parseInt(document.getElementById('lAlive').value)||0;
                litter.stillborn = parseInt(document.getElementById('lDead').value)||0;
                litter.mummified = parseInt(document.getElementById('lMumm').value)||0;
                litter.avgBirthWeight = parseFloat(document.getElementById('lAvgWeight').value)||0;
                const createPiglets = document.getElementById('lCreatePiglets').checked;
                
                // Actualizar cerda
                const sow = dbSows.findById(litter.sowId);
                if(sow) {
                    sow.lastFarrowingDate = litter.farrowingDate;
                    sow.parityNumber = (sow.parityNumber||0) + 1;
                    sow.totalBornAlive += litter.bornAlive;
                    sow.totalStillborn += litter.stillborn;
                    sow.totalMummified += litter.mummified;
                    dbSows.update(sow.id, sow);
                }
                
                if (litter.id && dbLitters.findById(litter.id)) {
                    dbLitters.update(litter.id, litter);
                } else {
                    litter.id = generateId();
                    dbLitters.insert(litter);
                }
                
                // Crear lechones
                if (createPiglets && litter.bornAlive > 0 && sow) {
                    for (let i=0; i<litter.bornAlive; i++) {
                        const piglet = new Pig({
                            number: `${sow.number}-${litter.parityNumber}-${i+1}`,
                            sex: Math.random() > 0.5 ? 'macho' : 'hembra',
                            breed: sow.breed,
                            birthDate: litter.farrowingDate,
                            birthWeight: litter.avgBirthWeight,
                            currentWeight: litter.avgBirthWeight,
                            motherId: sow.id,
                            fatherId: litter.fatherId,
                            origin: 'nacimiento',
                            status: 'activo',
                            batch: sow.batch || ''
                        });
                        dbPigs.insert(piglet);
                        litter.pigletIds.push(piglet.id);
                    }
                    dbLitters.update(litter.id, { pigletIds: litter.pigletIds });
                }
                showToast('Parto registrado y lechones creados','success');
                this.loadData();
            });
        });
    }
}