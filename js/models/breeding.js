// ============================================
// Modelo: Servicio / Monta / Inseminación
// ============================================

import { generateId } from '../utils.js';

export class Breeding {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.sowId = data.sowId || null;
        this.boarId = data.boarId || null;
        this.type = data.type || 'monta_natural'; // monta_natural / inseminacion_artificial
        this.serviceDate = data.serviceDate || null;
        this.returnDate = data.returnDate || null;     // 21 días después (retorno al celo)
        this.diagnosisDate = data.diagnosisDate || null;
        this.expectedFarrowingDate = data.expectedFarrowingDate || null;
        this.responsible = data.responsible || '';
        this.result = data.result || 'pendiente';       // pendiente/preñada/vacia/aborto
        this.observations = data.observations || '';
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }

    /**
     * Calcula fechas automáticas
     */
    calculateDates(serviceDate, gestationDays = 114) {
        const service = new Date(serviceDate);
        
        // Retorno al celo: 21 días
        const returnDate = new Date(service);
        returnDate.setDate(returnDate.getDate() + 21);
        
        // Fecha probable de parto: 114 días
        const farrowingDate = new Date(service);
        farrowingDate.setDate(farrowingDate.getDate() + gestationDays);
        
        return {
            returnDate: returnDate.toISOString().split('T')[0],
            expectedFarrowingDate: farrowingDate.toISOString().split('T')[0]
        };
    }

    toJSON() {
        return { ...this };
    }

    static fromJSON(json) {
        return new Breeding(json);
    }
}

export default Breeding;