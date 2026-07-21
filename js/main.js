// ============================================
// Punto de entrada principal
// ============================================

import { initMenu } from './menu.js';
import { updateClock, initTheme, initKeyboardShortcuts, initGlobalSearch } from './config.js';

// Importar todos los módulos
import DashboardModule from './modules/dashboard.js';
import PigsModule from './modules/pigs.js';
import SowsModule from './modules/sows.js';
import BoarsModule from './modules/boars.js';
import BreedingModule from './modules/breeding.js';
import GestationModule from './modules/gestation.js';
import FarrowingModule from './modules/farrowing.js';
import WeaningModule from './modules/weaning.js';
import PigletsModule from './modules/piglets.js';
import VaccinationModule from './modules/vaccination.js';
import MedicineModule from './modules/medicine.js';
import FeedingModule from './modules/feeding.js';
import InventoryModule from './modules/inventory.js';
import SalesModule from './modules/sales.js';
import PurchasesModule from './modules/purchases.js';
import ReportsModule from './modules/reports.js';
import StatisticsModule from './modules/statistics.js';
import BackupModule from './modules/backup.js';

// Mapa de módulos
const modules = {
    dashboard: DashboardModule,
    pigs: PigsModule,
    sows: SowsModule,
    boars: BoarsModule,
    breeding: BreedingModule,
    gestation: GestationModule,
    farrowing: FarrowingModule,
    weaning: WeaningModule,
    piglets: PigletsModule,
    vaccination: VaccinationModule,
    medicine: MedicineModule,
    feeding: FeedingModule,
    inventory: InventoryModule,
    sales: SalesModule,
    purchases: PurchasesModule,
    reports: ReportsModule,
    statistics: StatisticsModule,
    backup: BackupModule,
};

let currentModuleInstance = null;

/**
 * Inicializa la aplicación
 */
function init() {
    updateClock();
    setInterval(updateClock, 30000);
    
    initTheme();
    initKeyboardShortcuts();
    initGlobalSearch();
    
    // Inicializar menú
    initMenu((moduleName) => {
        loadModule(moduleName);
    });
    
    // Cargar dashboard por defecto
    loadModule('dashboard');
}

/**
 * Carga un módulo
 */
async function loadModule(moduleName) {
    const container = document.getElementById('moduleContainer');
    
    if (!container) return;
    
    // Limpiar contenedor
    container.innerHTML = '<div class="text-center mt-3"><p>Cargando módulo...</p></div>';
    
    const ModuleClass = modules[moduleName];
    
    if (!ModuleClass) {
        container.innerHTML = '<p class="text-center mt-3">Módulo no encontrado</p>';
        return;
    }
    
    try {
        // Instanciar y renderizar
        currentModuleInstance = new ModuleClass(container);
        await currentModuleInstance.render();
    } catch (error) {
        console.error(`Error loading module ${moduleName}:`, error);
        container.innerHTML = `<p class="text-center mt-3" style="color:var(--danger)">Error al cargar el módulo: ${error.message}</p>`;
    }
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

export { loadModule, modules };