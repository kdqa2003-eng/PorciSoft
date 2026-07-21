// ============================================
// Utilidades generales
// ============================================

/**
 * Genera un ID único
 */
export function generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Formatea una fecha a string local
 */
export function formatDate(date, format = 'short') {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const opts = {
        short: { year: 'numeric', month: '2-digit', day: '2-digit' },
        long: { year: 'numeric', month: 'long', day: 'numeric' },
        full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        iso: undefined
    };
    
    if (format === 'iso') {
        return d.toISOString().split('T')[0];
    }
    
    return d.toLocaleDateString('es-ES', opts[format] || opts.short);
}

/**
 * Calcula días entre dos fechas
 */
export function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2 || new Date());
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Suma días a una fecha
 */
export function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

/**
 * Formatea moneda
 */
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency
    }).format(amount || 0);
}

/**
 * Formatea número
 */
export function formatNumber(num, decimals = 0) {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num || 0);
}

/**
 * Calcula edad en meses/días
 */
export function calculateAge(birthDate) {
    if (!birthDate) return '-';
    const days = daysBetween(birthDate);
    if (days < 60) return `${days} días`;
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return `${months}m ${remainingDays}d`;
}

/**
 * Debounce para búsquedas
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Muestra una notificación toast
 */
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Confirmación modal
 */
export function confirmDialog(title, message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = `<p>${message}</p>`;
        overlay.classList.remove('hidden');
        
        const cleanup = () => {
            overlay.classList.add('hidden');
            confirmBtn.removeEventListener('click', onConfirm);
        };
        
        const onConfirm = () => {
            cleanup();
            resolve(true);
        };
        
        confirmBtn.addEventListener('click', onConfirm);
        
        // También resolver con false al cerrar
        const closeBtn = overlay.querySelector('.modal-close');
        const onCancel = () => { cleanup(); resolve(false); };
        closeBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) { onCancel(); }
        });
    });
}

/**
 * Abre modal genérico
 */
export function openModal(title, contentHTML, onConfirm) {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = contentHTML;
    overlay.classList.remove('hidden');
    
    const cleanup = () => {
        overlay.classList.add('hidden');
        confirmBtn.removeEventListener('click', handler);
    };
    
    const handler = () => {
        if (onConfirm) onConfirm();
        cleanup();
    };
    
    confirmBtn.addEventListener('click', handler);
}

/**
 * Cierra el modal
 */
export function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

// Exponer closeModal globalmente para el onclick en HTML
window.closeModal = closeModal;

/**
 * Exporta datos a CSV
 */
export function exportToCSV(data, filename = 'export.csv') {
    if (!data || !data.length) {
        showToast('No hay datos para exportar', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const values = headers.map(h => {
            const val = row[h] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
}

/**
 * Exporta a JSON
 */
export function exportToJSON(data, filename = 'export.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, filename);
}

/**
 * Descarga un blob
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Archivo ${filename} descargado`, 'success');
}

/**
 * Imprime contenido HTML
 */
export function printContent(html) {
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
        <html>
        <head>
            <title>Impresión - PorciSoft Pro</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                th { background: #1e293b; color: white; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>${html}</body>
        </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
}

/**
 * Obtiene valor de un campo del DOM
 */
export function getFieldValue(selector) {
    const el = document.querySelector(selector);
    return el ? el.value : '';
}

/**
 * Validación básica de formulario
 */
export function validateRequired(formData, fields) {
    const errors = [];
    for (const field of fields) {
        if (!formData[field] || String(formData[field]).trim() === '') {
            errors.push(`El campo "${field}" es obligatorio`);
        }
    }
    return errors;
}

/**
 * Scroll to top
 */
export function scrollToTop() {
    document.getElementById('moduleContainer')?.scrollTo(0, 0);
}

export default {
    generateId, formatDate, daysBetween, addDays, formatCurrency,
    formatNumber, calculateAge, debounce, showToast, confirmDialog,
    openModal, closeModal, exportToCSV, exportToJSON, printContent,
    getFieldValue, validateRequired, scrollToTop
};