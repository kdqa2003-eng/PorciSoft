// ============================================
// Modelo: Vacunación
// ============================================

import { generateId } from '../utils.js';

export class Vaccination {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.animalId = data.animalId || null;         // ID del animal
        this.animalType = data.animalType || 'pig';    // pig/sow/boar/piglet
        this.vaccine = data.vaccine || '';
        this.batch = data.batch || '';                 // Lote de vacuna
        this.date = data.date || null;
        this.nextDoseDate = data.nextDoseDate || null;
        this.veterinarian = data.veterinarian || '';
        this.dosage = data.dosage || '';
        this.route = data.route || '';                 // intramuscular/subcutánea/oral
        this.observations = data.observations || '';
        this.created_at = data.created_at || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }

    static fromJSON(json) {
        return new Vaccination(json);
    }
}

export default Vaccination;