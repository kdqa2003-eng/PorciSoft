// ============================================
// Modelo: Alimentación
// ============================================

import { generateId } from '../utils.js';

export class Feeding {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.feedType = data.feedType || '';           // Tipo de alimento
        this.supplier = data.supplier || '';           // Proveedor
        this.costPerUnit = data.costPerUnit || 0;      // Costo por unidad
        this.unit = data.unit || 'kg';                 // Unidad
        this.stock = data.stock || 0;                  // Stock actual
        this.minStock = data.minStock || 50;           // Stock mínimo (alerta)
        this.dailyConsumption = data.dailyConsumption || 0;
        this.pen = data.pen || '';                     // Corral asociado
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.quantity = data.quantity || 0;
        this.observations = data.observations || '';
        this.created_at = data.created_at || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }

    static fromJSON(json) {
        return new Feeding(json);
    }
}

export default Feeding;