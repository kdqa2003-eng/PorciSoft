// ============================================
// Módulo: Respaldos
// ============================================

import { fullBackup, fullRestore, getBackupList } from '../database.js';
import { showToast, confirmDialog, formatDate, exportToJSON, generateId } from '../utils.js';

export default class BackupModule {
    constructor(container) {
        this.container = container;
    }

    async render() {
        const backups = getBackupList();
        this.container.innerHTML = `
            <h2 class="section-title">💾 Respaldos</h2>
            <div class="toolbar">
                <button id="btnCreateBackup" class="btn btn-primary">➕ Crear Respaldo</button>
                <button id="btnImportBackup" class="btn btn-outline">📥 Importar Respaldo</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>Fecha</th><th>Etiqueta</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                        ${backups.length === 0 ? '<tr><td colspan="3">No hay respaldos guardados</td></tr>' :
                        backups.map(b => `
                            <tr>
                                <td>${formatDate(b.timestamp, 'full')}</td>
                                <td>${b.label}</td>
                                <td>
                                    <button class="btn btn-sm btn-success restore-backup" data-id="${b.id}">🔄 Restaurar</button>
                                    <button class="btn btn-sm btn-info download-backup" data-id="${b.id}">📥 Descargar</button>
                                    <button class="btn btn-sm btn-danger delete-backup" data-id="${b.id}">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        this.setupEvents(backups);
    }

    setupEvents(backups) {
        document.getElementById('btnCreateBackup')?.addEventListener('click', async () => {
            if (await confirmDialog('Crear respaldo', '¿Deseas crear un respaldo completo ahora?')) {
                fullBackup();
                showToast('Respaldo creado exitosamente', 'success');
                this.render();
            }
        });
        document.getElementById('btnImportBackup')?.addEventListener('click', () => this.importBackup());
        
        this.container.querySelectorAll('.restore-backup').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const backup = backups.find(b => b.id === id);
            if (backup && await confirmDialog('Restaurar respaldo', 'Esto reemplazará todos los datos actuales. ¿Continuar?')) {
                if (fullRestore(backup.data)) {
                    showToast('Respaldo restaurado correctamente', 'success');
                } else {
                    showToast('Error al restaurar', 'error');
                }
            }
        }));
        this.container.querySelectorAll('.download-backup').forEach(btn => btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const backup = backups.find(b => b.id === id);
            if (backup) exportToJSON(backup.data, `respaldo_${backup.id}.json`);
        }));
        this.container.querySelectorAll('.delete-backup').forEach(btn => btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (await confirmDialog('Eliminar respaldo', '¿Seguro?')) {
                const list = getBackupList().filter(b => b.id !== id);
                localStorage.setItem('porcisoft_backups', JSON.stringify(list));
                showToast('Respaldo eliminado', 'success');
                this.render();
            }
        }));
    }

    importBackup() {
        // Usar un input file para cargar JSON
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backup = JSON.parse(event.target.result);
                    if (backup && backup.collections) {
                        fullRestore(backup);
                        showToast('Respaldo importado y restaurado', 'success');
                        this.render();
                    } else {
                        showToast('Formato de respaldo inválido', 'error');
                    }
                } catch (err) {
                    showToast('Error al leer archivo', 'error');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }
}