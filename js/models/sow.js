// ============================================
// Modelo: Cerda reproductora
// ============================================

import Pig from './pig.js';

export class Sow extends Pig {
    constructor(data = {}) {
        super({ ...data, sex: 'hembra' });
        
        // Información reproductiva
        this.firstHeatDate = data.firstHeatDate || null;    // Fecha primer celo
        this.parityNumber = data.parityNumber || 0;          // Número de partos
        this.reproductiveStatus = data.reproductiveStatus || 'vacia'; // vacia/servida/preñada/lactando/descanso/descartada
        this.lastServiceDate = data.lastServiceDate || null;
        this.lastFarrowingDate = data.lastFarrowingDate || null;
        this.expectedFarrowingDate = data.expectedFarrowingDate || null;
        this.lastWeaningDate = data.lastWeaningDate || null;
        
        // Historial acumulado
        this.totalBornAlive = data.totalBornAlive || 0;
        this.totalStillborn = data.totalStillborn || 0;
        this.totalMummified = data.totalMummified || 0;
        this.totalWeaned = data.totalWeaned || 0;
        this.totalAbortions = data.totalAbortions || 0;
        this.totalServices = data.totalServices || 0;
        
        // Promedios
        this.avgBornAlive = data.avgBornAlive || 0;
        this.avgWeaningWeight = data.avgWeaningWeight || 0;
        this.farrowingInterval = data.farrowingInterval || 0; // Intervalo entre partos en días
    }

    /**
     * Calcula fecha probable de parto
     */
    getExpectedFarrowingDate(serviceDate, gestationDays = 114) {
        if (!serviceDate) return null;
        const d = new Date(serviceDate);
        d.setDate(d.getDate() + gestationDays);
        return d.toISOString().split('T')[0];
    }

    /**
     * Calcula días de gestación actual
     */
    getGestationDays() {
        if (!this.lastServiceDate || this.reproductiveStatus !== 'preñada') return 0;
        const service = new Date(this.lastServiceDate);
        const now = new Date();
        return Math.floor((now - service) / (1000 * 60 * 60 * 24));
    }

    toJSON() {
        return { ...this };
    }

    static fromJSON(json) {
        return new Sow(json);
    }
}

export default Sow;