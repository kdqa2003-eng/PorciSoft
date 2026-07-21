import { dbPigs, dbSows, dbBoars, dbBreedings, dbLitters, dbFeedings, dbMedicines, dbSales } from '../database.js';
import { formatCurrency, formatNumber } from '../utils.js';
import CONFIG from '../config.js';

export default class DashboardModule {
    constructor(container) {
        this.container = container;
    }

    async render() {
        const stats = this.calculateStats();
        
        this.container.innerHTML = `
            <div class="dashboard">
                <h2 class="section-title">📊 Dashboard</h2>
                <p class="section-subtitle">Resumen general de la granja</p>
                
                <div class="dashboard-cards">
                    ${this.createCard('🐷', 'Total Animales', stats.totalAnimals, 'blue')}
                    ${this.createCard('🐖', 'Madres', stats.totalSows, 'pink')}
                    ${this.createCard('🐗', 'Verracos', stats.totalBoars, 'purple')}
                    ${this.createCard('🤰', 'Preñadas', stats.pregnantSows, 'orange')}
                    ${this.createCard('🍼', 'Lactando', stats.lactatingSows, 'cyan')}
                    ${this.createCard('⭕', 'Vacías', stats.emptySows, 'secondary')}
                    ${this.createCard('📅', 'Próx. Partos', stats.upcomingFarrowings, 'green')}
                    ${this.createCard('🐽', 'Nacidos (año)', stats.bornThisYear, 'blue')}
                    ${this.createCard('✅', 'Destetados', stats.weanedTotal, 'green')}
                    ${this.createCard('💰', 'Vendidos', stats.soldAnimals, 'orange')}
                    ${this.createCard('💀', 'Muertos', stats.deadAnimals, 'red')}
                    ${this.createCard('🌾', 'Alimento (kg)', formatNumber(stats.feedStock), 'cyan')}
                    ${this.createCard('💊', 'Medicamentos', stats.medicineStock, 'pink')}
                    ${this.createCard('💵', 'Ganancia Est.', formatCurrency(stats.estimatedProfit), 'green')}
                </div>
                
                <div class="charts-row">
                    <div class="chart-card">
                        <h3>📈 Nacimientos mensuales</h3>
                        <div class="chart-container"><canvas id="chartBirths"></canvas></div>
                    </div>
                    <div class="chart-card">
                        <h3>📊 Distribución de estados</h3>
                        <div class="chart-container"><canvas id="chartStatus"></canvas></div>
                    </div>
                </div>
            </div>
        `;
        
        this.renderCharts(stats);
    }

    calculateStats() {
        const pigs = dbPigs.getAll();
        const sows = dbSows.getAll();
        const boars = dbBoars.getAll();
        const breedings = dbBreedings.getAll();
        const litters = dbLitters.getAll();
        const feedings = dbFeedings.getAll();
        const medicines = dbMedicines.getAll();
        const sales = dbSales.getAll();
        
        const now = new Date();
        const thisYear = now.getFullYear();
        
        // Totales
        const totalAnimals = pigs.filter(p => p.status === 'activo').length;
        const totalSows = sows.filter(s => s.status === 'activo').length;
        const totalBoars = boars.filter(b => b.status === 'activo').length;
        
        // Reproductivo
        const pregnantSows = sows.filter(s => s.reproductiveStatus === 'preñada').length;
        const lactatingSows = sows.filter(s => s.reproductiveStatus === 'lactando').length;
        const emptySows = sows.filter(s => s.reproductiveStatus === 'vacia').length;
        
        // Próximos partos (próximos 10 días)
        const upcoming = sows.filter(s => {
            if (!s.expectedFarrowingDate || s.reproductiveStatus !== 'preñada') return false;
            const days = Math.ceil((new Date(s.expectedFarrowingDate) - now) / (1000*60*60*24));
            return days >= 0 && days <= 10;
        }).length;
        
        // Nacimientos del año
        const bornThisYear = litters.filter(l => l.farrowingDate && new Date(l.farrowingDate).getFullYear() === thisYear)
            .reduce((sum, l) => sum + (l.bornAlive || 0), 0);
        
        // Destetados
        const weanedTotal = litters.reduce((sum, l) => sum + (l.weanedCount || 0), 0);
        
        // Vendidos
        const soldAnimals = pigs.filter(p => p.status === 'vendido').length;
        const deadAnimals = pigs.filter(p => p.status === 'muerto').length;
        
        // Inventario
        const feedStock = feedings.reduce((sum, f) => sum + (f.stock || 0), 0);
        const medicineStock = medicines.filter(m => m.type === 'medicamento').length; // Simplificado
        
        // Ganancia estimada (ventas - compras) - simplificado
        const salesTotal = sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
        const estimatedProfit = salesTotal; // Falta restar costos, pero por simplicidad
        
        return {
            totalAnimals, totalSows, totalBoars, pregnantSows, lactatingSows,
            emptySows, upcomingFarrowings: upcoming, bornThisYear, weanedTotal,
            soldAnimals, deadAnimals, feedStock, medicineStock, estimatedProfit
        };
    }

    createCard(icon, label, value, colorClass) {
        return `
            <div class="stat-card">
                <div class="stat-icon ${colorClass}">${icon}</div>
                <div class="stat-info">
                    <h4>${value}</h4>
                    <p>${label}</p>
                </div>
            </div>
        `;
    }

    renderCharts(stats) {
        // Gráfico de nacimientos mensuales (últimos 12 meses)
        this.renderMonthlyBirthsChart();
        // Gráfico de distribución de estados
        this.renderStatusChart(stats);
    }

    renderMonthlyBirthsChart() {
        const ctx = document.getElementById('chartBirths')?.getContext('2d');
        if (!ctx) return;
        
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const now = new Date();
        const data = [];
        
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = d.getMonth();
            const year = d.getFullYear();
            const count = dbLitters.find(l => {
                if (!l.farrowingDate) return false;
                const fd = new Date(l.farrowingDate);
                return fd.getMonth() === month && fd.getFullYear() === year;
            }).reduce((sum, l) => sum + (l.bornAlive || 0), 0);
            data.push(count);
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Nacimientos',
                    data: data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37,99,235,0.1)',
                    fill: true
                }]
            }
        });
    }

    renderStatusChart(stats) {
        const ctx = document.getElementById('chartStatus')?.getContext('2d');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Activos', 'Vendidos', 'Muertos', 'Descartados'],
                datasets: [{
                    data: [
                        dbPigs.count(p => p.status === 'activo'),
                        dbPigs.count(p => p.status === 'vendido'),
                        dbPigs.count(p => p.status === 'muerto'),
                        dbPigs.count(p => p.status === 'descartado')
                    ],
                    backgroundColor: ['#16a34a','#f59e0b','#dc2626','#64748b']
                }]
            }
        });
    }
}