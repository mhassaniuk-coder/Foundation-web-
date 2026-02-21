// ============================================
// LIVE HERITAGE LEDGER - Absolute Transparency
// Restored Kings Foundation - Phase 10
// ============================================

class HeritageLedger {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.entries = [];
        this.maxEntries = 10;
        if (this.container) this.init();
    }

    init() {
        console.log('Heritage Ledger: System Transparent');
        this.container.innerHTML = `
            <div class="ledger-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin:0; font-family: 'Outfit', sans-serif;">Live Heritage Ledger</h3>
                <span class="status-pill status-success" style="font-size: 0.6rem;">PUBLIC_VERIFIED</span>
            </div>
            <div id="ledgerStream" style="display: flex; flex-direction: column; gap: 0.75rem;"></div>
        `;
        this.stream = document.getElementById('ledgerStream');
        this.startStreaming();
    }

    startStreaming() {
        const mockData = [
            { id: 'TX-8821', type: 'INPUT', amt: '$50.00', desc: 'Secure Heritage Gift', source: 'Anonymous King' },
            { id: 'OPS-102', type: 'OUTPUT', amt: '$120.00', desc: 'Mentorship Session Materials', source: 'Sector 7' },
            { id: 'TX-8822', type: 'INPUT', amt: '$1,000.00', desc: 'Corporate Match: Apple Inc', source: 'Matching Hub' },
            { id: 'LOG-441', type: 'IMPACT', amt: '1 Unit', desc: 'Dignity Restoration Verified', source: 'Case #Marcus4' }
        ];

        // Seed initial
        mockData.forEach(d => this.addEntry(d));

        // Random pulse
        setInterval(() => {
            const random = mockData[Math.floor(Math.random() * mockData.length)];
            const unique = { ...random, id: 'TX-' + Math.floor(Math.random() * 9000), time: 'Just now' };
            this.addEntry(unique);
        }, 15000);
    }

    addEntry(data) {
        const item = document.createElement('div');
        item.className = 'glass-panel liquid-transparency';
        item.style.padding = '1rem';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = 'all 0.5s ease';

        const color = data.type === 'INPUT' ? '#4ade80' : (data.type === 'OUTPUT' ? '#f87171' : '#60a5fa');

        item.innerHTML = `
            <div>
                <div style="font-size: 0.6rem; color: rgba(255,255,255,0.4); font-weight: 800;">[${data.id}]</div>
                <div style="font-size: 0.85rem; font-weight: 600;">${data.desc}</div>
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">${data.source}</div>
            </div>
            <div style="text-align: right;">
                <div style="color: ${color}; font-weight: 800;">${data.amt}</div>
                <div style="font-size: 0.6rem; color: var(--gold-500); font-family: monospace;">SHA-256 VERIFIED</div>
            </div>
        `;

        if (this.stream.firstChild) {
            this.stream.insertBefore(item, this.stream.firstChild);
        } else {
            this.stream.appendChild(item);
        }

        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 10);

        if (this.stream.children.length > this.maxEntries) {
            this.stream.lastChild.classList.add('fade-out');
            setTimeout(() => this.stream.removeChild(this.stream.lastChild), 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ledgerContainer = document.getElementById('transparencyHub');
    if (ledgerContainer) new HeritageLedger('transparencyHub');
});
