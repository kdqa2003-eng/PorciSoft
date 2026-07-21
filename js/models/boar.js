// ============================================
// Modelo: Verraco
// ============================================

import Pig from './pig.js';

export class Boar extends Pig {
    constructor(data = {}) {
        super({ ...data, sex: 'macho' });
        
        this.geneticLine = data.geneticLine || '';       // Línea genética
        this.availability = data.availability || 'disponible'; // disponible/ocupado/descanso/descartado
        this.totalServices = data.totalServices || 0;
        this.lastServiceDate = data.lastServiceDate || null;
        this.semenQuality = data.semenQuality || null;    // Calidad genética (1-10)
        this.fertilityRate = data.fertilityRate || 0;     // Tasa de fertilidad (%)
    }

    toJSON() {
        return { ...this };
    }

    static fromJSON(json) {
        return new Boar(json);
    }
}

export default Boar;