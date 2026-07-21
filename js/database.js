// ============================================
// Simulador de base de datos JSON en localStorage
// ============================================

import CONFIG from './config.js';
import { generateId } from './utils.js';

class Database {
    constructor(storageKey) {
        this.storageKey = storageKey;
        this.data = this.load();
    }

    /**
     * Carga datos del localStorage
     */
    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error(`Error loading ${this.storageKey}:`, e);
            return [];
        }
    }

    /**
     * Guarda datos en localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data, null, 2));
            return true;
        } catch (e) {
            console.error(`Error saving ${this.storageKey}:`, e);
            return false;
        }
    }

    /**
     * Inserta un nuevo registro
     */
    insert(record) {
        const newRecord = {
            ...record,
            id: record.id || generateId(),
            created_at: record.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.data.push(newRecord);
        this.save();
        return newRecord;
    }

    /**
     * Inserta múltiples registros
     */
    insertMany(records) {
        const inserted = records.map(r => this.insert(r));
        return inserted;
    }

    /**
     * Actualiza un registro por ID
     */
    update(id, updates) {
        const index = this.data.findIndex(r => r.id === id);
        if (index === -1) return null;
        
        this.data[index] = {
            ...this.data[index],
            ...updates,
            id: this.data[index].id, // No permitir cambiar ID
            updated_at: new Date().toISOString()
        };
        this.save();
        return this.data[index];
    }

    /**
     * Elimina un registro por ID
     */
    delete(id) {
        const index = this.data.findIndex(r => r.id === id);
        if (index === -1) return false;
        
        this.data.splice(index, 1);
        this.save();
        return true;
    }

    /**
     * Elimina múltiples registros por condición
     */
    deleteMany(predicate) {
        const toDelete = this.data.filter(predicate);
        this.data = this.data.filter(r => !predicate(r));
        this.save();
        return toDelete.length;
    }

    /**
     * Busca un registro por ID
     */
    findById(id) {
        return this.data.find(r => r.id === id) || null;
    }

    /**
     * Busca registros por criterio
     */
    find(predicate = null) {
        if (!predicate) return [...this.data];
        return this.data.filter(predicate);
    }

    /**
     * Filtra con múltiples condiciones
     */
    filter(filters = {}) {
        return this.data.filter(record => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === null || value === undefined || value === '') return true;
                if (typeof value === 'string') {
                    return String(record[key] || '')
                        .toLowerCase()
                        .includes(value.toLowerCase());
                }
                if (Array.isArray(value)) {
                    return value.includes(record[key]);
                }
                return record[key] === value;
            });
        });
    }

    /**
     * Búsqueda global en todos los campos
     */
    search(query) {
        if (!query || query.trim() === '') return [...this.data];
        const q = query.toLowerCase();
        return this.data.filter(record => {
            return Object.values(record).some(val => {
                if (val === null || val === undefined) return false;
                return String(val).toLowerCase().includes(q);
            });
        });
    }

    /**
     * Obtiene todos los registros
     */
    getAll() {
        return [...this.data];
    }

    /**
     * Cuenta registros
     */
    count(predicate = null) {
        if (!predicate) return this.data.length;
        return this.data.filter(predicate).length;
    }

    /**
     * Paginación
     */
    paginate(page = 1, pageSize = 20, predicate = null) {
        const filtered = predicate ? this.data.filter(predicate) : this.data;
        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);
        
        return {
            items,
            total,
            page,
            pageSize,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
    }

    /**
     * Ordena registros
     */
    sort(field, order = 'asc') {
        const sorted = [...this.data].sort((a, b) => {
            const valA = a[field] ?? '';
            const valB = b[field] ?? '';
            
            if (typeof valA === 'number' && typeof valB === 'number') {
                return order === 'asc' ? valA - valB : valB - valA;
            }
            
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return order === 'asc' 
                ? strA.localeCompare(strB)
                : strB.localeCompare(strA);
        });
        return sorted;
    }

    /**
     * Reemplaza todos los datos (para import/restore)
     */
    replaceAll(newData) {
        this.data = Array.isArray(newData) ? newData : [];
        return this.save();
    }

    /**
     * Crea un respaldo
     */
    backup() {
        const backup = {
            key: this.storageKey,
            data: [...this.data],
            timestamp: new Date().toISOString(),
            count: this.data.length
        };
        return backup;
    }

    /**
     * Restaura desde respaldo
     */
    restore(backupData) {
        if (backupData && Array.isArray(backupData.data)) {
            this.data = [...backupData.data];
            return this.save();
        }
        return false;
    }

    /**
     * Vacía la colección
     */
    truncate() {
        this.data = [];
        return this.save();
    }
}

// ============================================
// Instancias de base de datos para cada colección
// ============================================

export const dbPigs = new Database(CONFIG.STORAGE_KEYS.PIGS);
export const dbSows = new Database(CONFIG.STORAGE_KEYS.SOWS);
export const dbBoars = new Database(CONFIG.STORAGE_KEYS.BOARS);
export const dbBreedings = new Database(CONFIG.STORAGE_KEYS.BREEDINGS);
export const dbLitters = new Database(CONFIG.STORAGE_KEYS.LITTERS);
export const dbVaccinations = new Database(CONFIG.STORAGE_KEYS.VACCINATIONS);
export const dbWeights = new Database(CONFIG.STORAGE_KEYS.WEIGHTS);
export const dbFeedings = new Database(CONFIG.STORAGE_KEYS.FEEDINGS);
export const dbInventory = new Database(CONFIG.STORAGE_KEYS.INVENTORY);
export const dbSales = new Database(CONFIG.STORAGE_KEYS.SALES);
export const dbPurchases = new Database(CONFIG.STORAGE_KEYS.PURCHASES);
export const dbMedicines = new Database(CONFIG.STORAGE_KEYS.MEDICINES);
export const dbSettings = new Database(CONFIG.STORAGE_KEYS.SETTINGS);

/**
 * Crea respaldo completo de toda la base de datos
 */
export function fullBackup() {
    const collections = {
        pigs: dbPigs.backup(),
        sows: dbSows.backup(),
        boars: dbBoars.backup(),
        breedings: dbBreedings.backup(),
        litters: dbLitters.backup(),
        vaccinations: dbVaccinations.backup(),
        weights: dbWeights.backup(),
        feedings: dbFeedings.backup(),
        inventory: dbInventory.backup(),
        sales: dbSales.backup(),
        purchases: dbPurchases.backup(),
        medicines: dbMedicines.backup(),
        settings: dbSettings.backup()
    };
    
    const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        collections
    };
    
    // Guardar en localStorage
    const backups = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.BACKUPS) || '[]');
    backups.push({
        id: generateId(),
        timestamp: backup.timestamp,
        data: backup,
        label: `Respaldo ${new Date().toLocaleString('es-ES')}`
    });
    
    // Mantener solo últimos 10 backups
    if (backups.length > 10) backups.shift();
    
    localStorage.setItem(CONFIG.STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
    return backup;
}

/**
 * Restaura desde respaldo completo
 */
export function fullRestore(backupData) {
    if (!backupData || !backupData.collections) return false;
    
    const mapping = {
        pigs: dbPigs,
        sows: dbSows,
        boars: dbBoars,
        breedings: dbBreedings,
        litters: dbLitters,
        vaccinations: dbVaccinations,
        weights: dbWeights,
        feedings: dbFeedings,
        inventory: dbInventory,
        sales: dbSales,
        purchases: dbPurchases,
        medicines: dbMedicines,
        settings: dbSettings
    };
    
    for (const [key, db] of Object.entries(mapping)) {
        if (backupData.collections[key]) {
            db.restore(backupData.collections[key]);
        }
    }
    
    return true;
}

/**
 * Obtiene lista de backups guardados
 */
export function getBackupList() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.BACKUPS) || '[]');
}

export default Database;