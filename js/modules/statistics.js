// ============================================
// Módulo: Estadísticas (Gráficos avanzados)
// ============================================

import { dbLitters, dbSales, dbPigs, dbFeedings } from '../database.js';
import { formatCurrency } from '../utils.js';

export default class StatisticsModule {
    constructor(container) {
        this.container = container;
    }

    async render() {
        this.container.innerHTML = `
            <h2 class="section-title">📈 Estadísticas</h2>
            <div class="charts-row">
                <div class="chart-card">
                    <h3>💰 Ingresos mensuales (ventas)</h3>
                    <canvas id="chartSales"></canvas>
                </div>
                <div class="chart-card">
                    <h3>📊 Peso promedio al destete</h3>
                    <canvas id="chartWeaningWeight"></canvas>
                </div>
            </div>
            <div class="charts-row mt-3">
                <div class="chart-card">
                    <h3>💀 Mortalidad mensual</h3>
                    <canvas id="chartMortality"></canvas>
                </div>
                <div class="chart-card">
                    <h3>🌾 Consumo de alimento (kg)</h3>
                    <canvas id="chartFeed"></canvas>
                </div>
            </div>
        `;
        this.renderCharts();
    }

    renderCharts() {
        this.renderSalesChart();
        this.renderWeaningWeightChart();
        this.renderMortalityChart();
        this.renderFeedChart();
    }

    renderSalesChart() {
        const ctx = document.getElementById('chartSales')?.getContext('2d');
        if (!ctx) return;
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const now = new Date();
        const sales = dbSales.getAll();
        const monthlyTotals = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const total = sales.filter(s => {
                if (!s.date) return false;
                const sd = new Date(s.date);
                return sd.getMonth() === m && sd.getFullYear() === y;
            }).reduce((sum, s) => sum + (s.totalPrice || 0), 0);
            monthlyTotals.push(total);
        }
        new Chart(ctx, {
            type: 'bar',
            data: { labels: months, datasets: [{ label: 'Ventas', data: monthlyTotals, backgroundColor: '#16a34a' }] }
        });
    }

    renderWeaningWeightChart() {
        const ctx = document.getElementById('chartWeaningWeight')?.getContext('2d');
        if (!ctx) return;
        const litters = dbLitters.find(l => l.weaningWeight > 0);
        const data = litters.map(l => l.weaningWeight);
        new Chart(ctx, {
            type: 'line',
            data: { labels: data.map((_,i) => i+1), datasets: [{ label: 'Peso (kg)', data, borderColor: '#2563eb' }] }
        });
    }

    renderMortalityChart() {
        const ctx = document.getElementById('chartMortality')?.getContext('2d');
        if (!ctx) return;
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const now = new Date();
        const deaths = dbPigs.find(p => p.status === 'muerto');
        const data = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const count = deaths.filter(p => p.updated_at && new Date(p.updated_at).getMonth() === d.getMonth()).length;
            data.push(count);
        }
        new Chart(ctx, {
            type: 'bar', data: { labels: months, datasets: [{ label: 'Muertes', data, backgroundColor: '#dc2626' }] }
        });
    }

    renderFeedChart() {
        const ctx = document.getElementById('chartFeed')?.getContext('2d');
        if (!ctx) return;
        const feeds = dbFeedings.getAll();
        const labels = feeds.map(f => f.feedType);
        const data = feeds.map(f => f.stock || 0);
        new Chart(ctx, {
            type: 'pie', data: { labels, datasets: [{ data, backgroundColor: ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ec4899'] }] }
        });
    }
}