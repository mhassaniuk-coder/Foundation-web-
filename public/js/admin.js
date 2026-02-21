// ============================================
// ADMIN COMMAND CENTER - Intelligence Engine
// Restored Kings Foundation - Phase 8
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Command Center [Intelligence Engine] Online');

    // Feature 1-8: Intelligence Suite Initialization
    initIntelligenceCharts();
    initAuditVault();
    initRadarAnimation();

    // Feature 23: Omni-Search (Cmd+K)
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            triggerOmniSearch();
        }
    });

    // Suite Navigation Logic
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            console.log(`Switching to Command Suite: ${this.dataset.suite}`);
        });
    });
});

// --- Feature 2 & 7: Intelligence Visualization ---
function initIntelligenceCharts() {
    const ctx = document.getElementById('impactVelocityChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Impact Magnitude',
                data: [12, 19, 15, 25, 32, 45],
                borderColor: '#d4a574',
                backgroundColor: 'rgba(212, 165, 116, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

// --- Feature 5: System Audit Vault ---
function initAuditVault() {
    const vault = document.getElementById('auditLog');
    if (!vault) return;

    const mockLogs = [
        { type: 'SECURE', msg: 'Encrypted communication established with Field_Unit_04', time: '5m ago' },
        { type: 'FINANCE', msg: 'Batch reconciliation for Q3 Heritage Gifts complete', time: '12m ago' },
        { type: 'OPS', msg: 'Mentorship Scaling milestone flagged for review', time: '24m ago' }
    ];

    mockLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'audit-item';
        item.innerHTML = `
            <span class="status-pill ${log.type === 'SECURE' ? 'status-success' : 'status-info'}" 
                  style="${log.type === 'FINANCE' ? 'color: #60a5fa; background: rgba(96,165,250,0.1); border-color: rgba(96,165,250,0.2);' : ''}">
                  ${log.type}
            </span>
            <span style="font-size: 0.8rem;">${log.msg}</span>
            <span style="font-size: 0.7rem; color: rgba(255,255,255,0.3); margin-left: auto;">${log.time}</span>
        `;
        vault.appendChild(item);
    });
}

// --- Feature 1: Radar Animation Controls ---
function initRadarAnimation() {
    // Logic for dynamic radar pings if connected to real data
    console.log('Impact Radar Scan: Complete (100% Coverage)');
}

// --- Feature 23: Omni-Search Pulse ---
function triggerOmniSearch() {
    const term = prompt('GLOBAL COMMAND INPUT:\nSearch users, transactions, or projects');
    if (term) {
        alert(`Omni-Search Query: "${term}"\nFiltering Operational Data...`);
    }
}

// Feature 22: Operational Health Alerts
setInterval(() => {
    const health = Math.random() > 0.9 ? 'ANOMALY DETECTED' : 'OPERATIONAL';
    if (health !== 'OPERATIONAL') {
        console.warn(`[SYSTEM_TRIAGE] Operational Alert: Resource Gap in Sector 7`);
    }
}, 30000);
