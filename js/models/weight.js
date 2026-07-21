// ============================================
// Modelo: Pesaje
// ============================================

import { generateId } from '../utils.js';

export class Weight {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.animalId = data.animalId || null;
        this.weight = data.weight || 0;
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.type = data.type || 'regular'; // nacimiento/destete/regular/venta
        this.observations = data.observations || '';
        this.created_at = data.created_at || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }

    static fromJSON(json) {
        return new Weight(json);
    }
}

export default Weight;