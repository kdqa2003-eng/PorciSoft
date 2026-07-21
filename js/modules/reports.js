// ============================================
// Módulo: Reportes (Exportaciones)
// ============================================

import { dbPigs, dbSows, dbBoars, dbBreedings, dbLitters, dbVaccinations, dbMedicines, dbFeedings, dbInventory, dbSales, dbPurchases } from '../database.js';
import { exportToCSV, exportToJSON, printContent, showToast, formatDate } from '../utils.js';

export default class ReportsModule {
    constructor(container) {
        this.container = container;
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">📄 Reportes</h2>
            <div class="dashboard-cards">
                ${this.createCard('🐷', 'Animales', 'exportAnimals')}
                ${this.createCard('🐖', 'Cerdas', 'exportSows')}
                ${this.createCard('🐗', 'Verracos', 'exportBoars')}
                ${this.createCard('💕', 'Servicios', 'exportBreedings')}
                ${this.createCard('🐽', 'Partos', 'exportLitters')}
                ${this.createCard('💉', 'Vacunaciones', 'exportVaccinations')}
                ${this.createCard('💊', 'Medicamentos', 'exportMedicines')}
                ${this.createCard('🌾', 'Alimentos', 'exportFeedings')}
                ${this.createCard('📦', 'Inventario', 'exportInventory')}
                ${this.createCard('💰', 'Ventas', 'exportSales')}
                ${this.createCard('🛒', 'Compras', 'exportPurchases')}
            </div>
            <div class="mt-3">
                <button id="btnPrintAll" class="btn btn-secondary">🖨️ Imprimir resumen general</button>
            </div>
        `;
        this.setupEvents();
    }

    createCard(icon, label, exportId) {
        return `
            <div class="stat-card" data-export="${exportId}">
                <div class="stat-icon blue">${icon}</div>
                <div class="stat-info">
                    <p>${label}</p>
                    <small>Exportar CSV / JSON / Imprimir</small>
                </div>
            </div>
        `;
    }

    setupEvents() {
        this.container.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const exportId = card.dataset.export;
                this.handleExport(exportId);
            });
        });
        document.getElementById('btnPrintAll')?.addEventListener('click', () => this.printSummary());
    }

    handleExport(type) {
        let data = [];
        let filename = 'reporte';
        switch (type) {
            case 'exportAnimals': data = dbPigs.getAll(); filename = 'animales'; break;
            case 'exportSows': data = dbSows.getAll(); filename = 'cerdas'; break;
            case 'exportBoars': data = dbBoars.getAll(); filename = 'verracos'; break;
            case 'exportBreedings': data = dbBreedings.getAll(); filename = 'servicios'; break;
            case 'exportLitters': data = dbLitters.getAll(); filename = 'partos'; break;
            case 'exportVaccinations': data = dbVaccinations.getAll(); filename = 'vacunaciones'; break;
            case 'exportMedicines': data = dbMedicines.getAll(); filename = 'medicamentos'; break;
            case 'exportFeedings': data = dbFeedings.getAll(); filename = 'alimentos'; break;
            case 'exportInventory': data = dbInventory.getAll(); filename = 'inventario'; break;
            case 'exportSales': data = dbSales.getAll(); filename = 'ventas'; break;
            case 'exportPurchases': data = dbPurchases.getAll(); filename = 'compras'; break;
        }
        if (data.length === 0) {
            showToast('No hay datos para exportar', 'warning');
            return;
        }
        // Mostrar opciones
        import('../utils.js').then(({ openModal }) => {
            openModal('Exportar ' + filename, `
                <p>Seleccione formato:</p>
                <button class="btn btn-primary export-csv">CSV</button>
                <button class="btn btn-success export-json">JSON</button>
                <button class="btn btn-secondary export-print">Imprimir</button>
            `, () => {}); // El cierre del modal no hace nada
            setTimeout(() => {
                document.querySelector('.export-csv')?.addEventListener('click', () => exportToCSV(data, `${filename}.csv`));
                document.querySelector('.export-json')?.addEventListener('click', () => exportToJSON(data, `${filename}.json`));
                document.querySelector('.export-print')?.addEventListener('click', () => {
                    let html = `<h2>${filename}</h2><table><tr>${Object.keys(data[0]).map(k => `<th>${k}</th>`).join('')}</tr>`;
                    data.forEach(row => html += `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`);
                    html += '</table>';
                    printContent(html);
                });
            }, 200);
        });
    }

    printSummary() {
        const totalPigs = dbPigs.count(p => p.status === 'activo');
        const totalSows = dbSows.count();
        const totalBoars = dbBoars.count();
        const pregnant = dbSows.count(s => s.reproductiveStatus === 'preñada');
        const salesTotal = dbSales.getAll().reduce((sum, s) => sum + (s.totalPrice || 0), 0);
        const html = `
            <h2>Resumen General - PorciSoft Pro</h2>
            <p>Fecha: ${formatDate(new Date(), 'long')}</p>
            <table>
                <tr><td>Animales activos</td><td>${totalPigs}</td></tr>
                <tr><td>Madres</td><td>${totalSows}</td></tr>
                <tr><td>Verracos</td><td>${totalBoars}</td></tr>
                <tr><td>Preñadas</td><td>${pregnant}</td></tr>
                <tr><td>Total ventas</td><td>${salesTotal.toFixed(2)}</td></tr>
            </table>
        `;
        printContent(html);
    }
}