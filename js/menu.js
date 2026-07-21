// ============================================
// Gestión del menú lateral
// ============================================

const menuItems = [
    { section: 'Principal' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', module: 'dashboard' },
    
    { section: 'Animales' },
    { id: 'pigs', label: 'Registro de Animales', icon: '🐷', module: 'pigs' },
    { id: 'sows', label: 'Madres (Cerdas)', icon: '🐖', module: 'sows' },
    { id: 'boars', label: 'Verracos', icon: '🐗', module: 'boars' },
    
    { section: 'Reproducción' },
    { id: 'breeding', label: 'Servicios / Montas', icon: '💕', module: 'breeding' },
    { id: 'gestation', label: 'Gestación', icon: '🤰', module: 'gestation' },
    { id: 'farrowing', label: 'Partos', icon: '🐽', module: 'farrowing' },
    { id: 'weaning', label: 'Destetes', icon: '🍼', module: 'weaning' },
    { id: 'piglets', label: 'Lechones', icon: '🐣', module: 'piglets' },
    
    { section: 'Sanidad' },
    { id: 'vaccination', label: 'Vacunación', icon: '💉', module: 'vaccination' },
    { id: 'medicine', label: 'Medicamentos', icon: '💊', module: 'medicine' },
    
    { section: 'Alimentación' },
    { id: 'feeding', label: 'Alimentación', icon: '🌾', module: 'feeding' },
    
    { section: 'Inventario' },
    { id: 'inventory', label: 'Inventario', icon: '📦', module: 'inventory' },
    
    { section: 'Comercial' },
    { id: 'sales', label: 'Ventas', icon: '💰', module: 'sales' },
    { id: 'purchases', label: 'Compras', icon: '🛒', module: 'purchases' },
    
    { section: 'Análisis' },
    { id: 'reports', label: 'Reportes', icon: '📄', module: 'reports' },
    { id: 'statistics', label: 'Estadísticas', icon: '📈', module: 'statistics' },
    
    { section: 'Sistema' },
    { id: 'backup', label: 'Respaldos', icon: '💾', module: 'backup' },
];

let currentModule = 'dashboard';
let onModuleChangeCallback = null;

/**
 * Inicializa el menú
 */
export function initMenu(onModuleChange) {
    onModuleChangeCallback = onModuleChange;
    renderMenu();
    setupMenuEvents();
    navigateTo('dashboard');
}

/**
 * Renderiza el menú
 */
function renderMenu() {
    const menuList = document.getElementById('menuList');
    menuList.innerHTML = '';
    
    menuItems.forEach(item => {
        if (item.section) {
            const sectionEl = document.createElement('li');
            sectionEl.className = 'menu-section-title';
            sectionEl.textContent = item.section;
            menuList.appendChild(sectionEl);
        } else {
            const li = document.createElement('li');
            li.className = 'menu-item';
            li.innerHTML = `
                <a class="menu-link" data-module="${item.module}" data-id="${item.id}">
                    <span class="menu-icon">${item.icon}</span>
                    <span>${item.label}</span>
                </a>
            `;
            menuList.appendChild(li);
        }
    });
}

/**
 * Configura eventos del menú
 */
function setupMenuEvents() {
    // Toggle menú
    document.getElementById('toggleMenu')?.addEventListener('click', () => {
        document.getElementById('sideMenu').classList.toggle('closed');
    });
    
    // Clics en items del menú
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const module = e.currentTarget.dataset.module;
            if (module) navigateTo(module);
        });
    });
}

/**
 * Navega a un módulo
 */
export function navigateTo(moduleName) {
    currentModule = moduleName;
    
    // Actualizar clase active
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.toggle('active', link.dataset.module === moduleName);
    });
    
    // Llamar callback
    if (onModuleChangeCallback) {
        onModuleChangeCallback(moduleName);
    }
    
    // En móvil, cerrar menú
    if (window.innerWidth <= 768) {
        document.getElementById('sideMenu').classList.add('closed');
    }
}

/**
 * Obtiene el módulo actual
 */
export function getCurrentModule() {
    return currentModule;
}

export { menuItems };
export default { initMenu, navigateTo, getCurrentModule, menuItems };