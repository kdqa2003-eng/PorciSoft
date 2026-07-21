// ============================================
// Configuración global y funciones auxiliares
// ============================================

export const CONFIG = {
    APP_NAME: 'PorciSoft Pro',
    VERSION: '1.0.0',
    COMPANY: 'Mi Granja Porcina',
    CURRENCY: 'USD',
    TAX_RATE: 0.0,
    
    GESTATION_DAYS: 114,
    RETURN_TO_HEAT_DAYS: 21,
    WEANING_DAYS: 28,
    LACTATION_DAYS: 28,
    
    PIG_STATUS: ['activo', 'vendido', 'muerto', 'descartado'],
    SOW_REPRODUCTIVE_STATUS: ['vacia', 'servida', 'preñada', 'lactando', 'descanso', 'descartada'],
    BOAR_STATUS: ['disponible', 'ocupado', 'descanso', 'descartado'],
    
    BREEDING_TYPES: ['monta_natural', 'inseminacion_artificial'],
    SEX_TYPES: ['macho', 'hembra'],
    PIG_ORIGINS: ['nacimiento', 'compra', 'transferencia'],
    
    BREEDS: [
        'Landrace', 'Yorkshire', 'Duroc', 'Hampshire', 'Pietrain',
        'Berkshire', 'Chester White', 'Poland China', 'Spot',
        'Cruce comercial', 'Híbrido', 'Criollo', 'Otro'
    ],
    
    FEED_TYPES: [
        'Iniciador', 'Crecimiento', 'Engorde', 'Gestación',
        'Lactancia', 'Verracos', 'Lechones pre-iniciador', 'Suplemento'
    ],
    
    VACCINES: [
        'Peste Porcina Clásica', 'Aftosa', 'Parvovirosis', 'Leptospirosis',
        'Erisipela', 'Micoplasma', 'Circovirus', 'PRRS',
        'Rinitis Atrófica', 'Colibacilosis', 'Salmonelosis', 'Otra'
    ],
    
    WEIGHT_UNIT: 'kg',
    PAGE_SIZE: 20,
    
    STORAGE_KEYS: {
        PIGS: 'porcisoft_pigs',
        SOWS: 'porcisoft_sows',
        BOARS: 'porcisoft_boars',
        BREEDINGS: 'porcisoft_breedings',
        LITTERS: 'porcisoft_litters',
        VACCINATIONS: 'porcisoft_vaccinations',
        WEIGHTS: 'porcisoft_weights',
        FEEDINGS: 'porcisoft_feedings',
        INVENTORY: 'porcisoft_inventory',
        SALES: 'porcisoft_sales',
        PURCHASES: 'porcisoft_purchases',
        MEDICINES: 'porcisoft_medicines',
        SETTINGS: 'porcisoft_settings',
        BACKUPS: 'porcisoft_backups'
    }
};

/**
 * Actualiza el reloj en la barra superior
 */
export function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
}

/**
 * Inicializa el cambio de tema claro/oscuro
 */
export function initTheme() {
    const btn = document.getElementById('btnTheme');
    const html = document.documentElement;
    
    // Cargar tema guardado
    const saved = localStorage.getItem('porcisoft_theme') || 'light';
    html.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
    
    btn?.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('porcisoft_theme', next);
        updateThemeIcon(next);
    });
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('btnTheme');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/**
 * Atajos de teclado globales
 */
export function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+B: Respaldo rápido
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            import('./modules/backup.js').then(m => m.default?.quickBackup?.());
        }
        // Ctrl+F: Foco en búsqueda global
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('globalSearch')?.focus();
        }
        // Escape: cerrar modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalOverlay');
            if (modal && !modal.classList.contains('hidden')) {
                window.closeModal?.();
            }
        }
    });
}

/**
 * Búsqueda global (redirige al módulo correspondiente)
 */
export function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                // Por simplicidad, podríamos buscar en animales y mostrar resultados en un modal
                import('./database.js').then(({ dbPigs }) => {
                    const results = dbPigs.search(query);
                    if (results.length > 0) {
                        import('./utils.js').then(({ openModal, formatDate }) => {
                            let html = '<ul>';
                            results.slice(0, 10).forEach(p => {
                                html += `<li>🐷 ${p.number} - ${p.name || 'Sin nombre'} (${p.breed}) - ${formatDate(p.birthDate)}</li>`;
                            });
                            html += '</ul>';
                            openModal('Resultados de búsqueda', html);
                        });
                    } else {
                        import('./utils.js').then(({ showToast }) => showToast('Sin resultados', 'info'));
                    }
                });
            }
        }
    });
}

export default CONFIG;