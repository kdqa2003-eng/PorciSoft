// ============================================
// Modelo: Cerdo/Porcino general
// ============================================

import { generateId } from '../utils.js';

export class Pig {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.number = data.number || '';           // Número de identificación
        this.earTag = data.earTag || '';           // Arete
        this.rfidChip = data.rfidChip || '';       // Chip RFID
        this.name = data.name || '';               // Nombre
        this.sex = data.sex || 'macho';            // macho / hembra
        this.breed = data.breed || '';             // Raza
        this.color = data.color || '';             // Color
        this.birthDate = data.birthDate || null;   // Fecha nacimiento
        this.birthWeight = data.birthWeight || null; // Peso nacimiento
        this.currentWeight = data.currentWeight || null; // Peso actual
        this.status = data.status || 'activo';     // activo / vendido / muerto / descartado
        this.origin = data.origin || 'nacimiento'; // nacimiento / compra / transferencia
        this.batch = data.batch || '';             // Lote
        this.pen = data.pen || '';                 // Corral
        this.motherId = data.motherId || null;     // ID de la madre
        this.fatherId = data.fatherId || null;     // ID del padre
        this.photo = data.photo || null;           // Fotografía (base64 o URL)
        this.observations = data.observations || '';
        this.healthStatus = data.healthStatus || 'sano'; // sano / enfermo / tratamiento / recuperado
        
        // Metadatos
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }

    /**
     * Convierte a objeto plano
     */
    toJSON() {
        return { ...this };
    }

    /**
     * Crea desde objeto plano
     */
    static fromJSON(json) {
        return new Pig(json);
    }

    /**
     * Valida datos requeridos
     */
    validate() {
        const errors = [];
        if (!this.number) errors.push('El número de identificación es requerido');
        if (!this.sex) errors.push('El sexo es requerido');
        if (!this.breed) errors.push('La raza es requerida');
        return errors;
    }
}

export default Pig;