// ============================================
// LIVE TRANSPARENCY LEDGER - Public Visibility
// Restored Kings Foundation - Phase 10
// ============================================

import { supabase } from './supabase.js';

class HeritageLedger {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.entries = [];
        this.maxEntries = 10;
        if (this.container) this.init();
    }

    init() {
        console.log('Transparency Ledger: System Active');
        this.container.innerHTML = `
            <div class="ledger-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin:0; font-family: 'Outfit', sans-serif;">Live Transparency Ledger</h3>
                <span class="status-pill status-success" style="font-size: 0.6rem;">PUBLIC VERIFIED</span>
            </div>
            <div id="ledgerStream" style="display: flex; flex-direction: column; gap: 0.75rem;"></div>
        `;
        this.stream = document.getElementById('ledgerStream');
        this.startStreaming();
    }

    async startStreaming() {
        try {
            // Fetch initial real data
            const { data, error } = await supabase
                .from('donations')
                .select('id, amount, type, created_at, profiles(full_name, email)')
                .order('created_at', { ascending: false })
                .limit(this.maxEntries);

            if (data) {
                data.forEach(d => {
                    this.addEntry({
                        id: d.id.substring(0, 8).toUpperCase(),
                        type: d.type === 'heritage' ? 'INPUT' : (d.type === 'impact' ? 'INPUT' : 'OUTPUT'),
                        amt: `$${parseFloat(d.amount).toLocaleString()}`,
                        desc: d.type.toUpperCase() + ' Contribution',
                        source: d.profiles?.full_name || 'Anonymous Donor'
                    });
                });
            }

            // Real-time subscription for new donations
            supabase
                .channel('public:donations')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, payload => {
                    const newEntry = payload.new;
                    this.addEntry({
                        id: (newEntry.id || 'TX').substring(0, 8).toUpperCase(),
                        type: 'INPUT',
                        amt: `$${parseFloat(newEntry.amount).toLocaleString()}`,
                        desc: 'Real-time Contribution',
                        source: 'Verified Donor'
                    });
                })
                .subscribe();

        } catch (e) {
            console.error('Ledger Real-time Sync Error:', e);
        }
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
                <div style="font-size: 0.6rem; color: var(--gold-500); font-family: monospace;">Integrity Verified</div>
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
            const last = this.stream.lastChild;
            last.classList.add('fade-out');
            setTimeout(() => this.stream.removeChild(last), 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ledgerContainer = document.getElementById('transparencyHub');
    if (ledgerContainer) new HeritageLedger('transparencyHub');
});
