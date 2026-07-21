// ============================================
// Modelo: Camada / Parto
// ============================================

import { generateId } from '../utils.js';

export class Litter {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.sowId = data.sowId || null;               // ID de la madre
        this.fatherId = data.fatherId || null;          // ID del padre (verraco)
        this.farrowingDate = data.farrowingDate || null; // Fecha de parto
        this.farrowingTime = data.farrowingTime || '';  // Hora
        this.duration = data.duration || null;          // Duración en horas
        this.parityNumber = data.parityNumber || 0;     // Número de parto de la cerda
        
        // Resultados
        this.bornAlive = data.bornAlive || 0;
        this.stillborn = data.stillborn || 0;
        this.mummified = data.mummified || 0;
        this.totalBorn = data.totalBorn || 0;
        this.avgBirthWeight = data.avgBirthWeight || 0;
        this.litterWeight = data.litterWeight || 0;
        
        // Problemas
        this.problems = data.problems || '';
        this.medications = data.medications || '';
        this.assistance = data.assistance || false;     // Requirió asistencia
        
        // Estado de la camada
        this.status = data.status || 'activa';          // activa/destetada/finalizada
        this.weaningDate = data.weaningDate || null;
        this.weanedCount = data.weanedCount || 0;
        this.weaningWeight = data.weaningWeight || 0;
        this.mortalityPreWeaning = data.mortalityPreWeaning || 0;
        
        // IDs de los lechones creados
        this.pigletIds = data.pigletIds || [];
        
        this.observations = data.observations || '';
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }

    static fromJSON(json) {
        return new Litter(json);
    }
}

export default Litter;