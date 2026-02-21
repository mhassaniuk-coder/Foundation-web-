// ============================================
// ADMIN COMMAND CENTER - Operational Engine
// Restored Kings Foundation - Phase 8
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin OS [Operational Engine] Online');

    // --- Initializers ---
    initIntelligenceCharts();
    initAuditVault();
    initRadarAnimation();
    initOmniSearch();

    // --- Navigation Logic ---
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const suite = this.dataset.suite;
            if (!suite) return;

            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.suite-section').forEach(section => {
                section.style.display = section.id === `${suite}Suite` ? 'block' : 'none';
            });

            if (suite === 'sovereign') initPredictiveChart();
            console.log(`Command Suite Switched: ${suite.toUpperCase()}`);
        });
    });

    const msg = document.querySelector('#commandSuite textarea').value;
    if (!msg) return alert('Cannot broadcast zero payload.');
    broadcastBtn.disabled = true;
    broadcastBtn.innerText = 'Transmitting...';
    setTimeout(() => {
        alert(`Royal Decree Transmitted Successfully.\nSegment: ${document.querySelector('#commandSuite select').value}`);
        broadcastBtn.disabled = false;
        broadcastBtn.innerText = 'Execute Global Broadcast';
        document.querySelector('#commandSuite textarea').value = '';
    }, 1500);
};
    }

// --- Operational Control (Feature 16: Export) ---
document.querySelector('.nav-link[data-suite="audit"]')?.addEventListener('click', () => {
    if (confirm('Initiate audit-ready data export? (Feature 16)')) {
        alert('Generating encrypted operational report... Download will begin shortly.');
    }
});

// --- Intelligence Periodic Updates (Feature 4 & 22) ---
setInterval(() => {
    initAuditVault(); // Refresh audit items
    console.log('[HEARTBEAT] Operational health check passed.');
}, 60000);
});

// --- Intelligence Visualization (Feature 2) ---
function initIntelligenceCharts() {
    const ctx = document.getElementById('impactVelocityChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Velocity',
                data: [12, 19, 15, 25, 32, 45],
                borderColor: '#d4a574',
                backgroundColor: 'rgba(212, 165, 116, 0.1)',
                fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}

// --- Audit Vault Log (Feature 5) ---
function initAuditVault() {
    const vault = document.getElementById('auditLog');
    if (!vault) return;
    vault.innerHTML = '';
    const mockLogs = [
        { type: 'SECURE', msg: 'Field Unit 4 communications encrypted', time: '2m ago' },
        { type: 'FINANCE', msg: 'Batch reconciliation complete', time: '8m ago' },
        { type: 'IDENTITY', msg: 'Overseer session validated (Feature 5)', time: '14m ago' }
    ];
    mockLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'audit-item';
        item.innerHTML = `
            <span class="status-pill status-${log.type === 'SECURE' ? 'success' : 'info'}">${log.type}</span>
            <span style="font-size: 0.8rem;">${log.msg}</span>
            <span style="font-size: 0.7rem; color: rgba(255,255,255,0.3); margin-left: auto;">${log.time}</span>
        `;
        vault.appendChild(item);
    });
}

// --- Omni-Search (Feature 23) ---
function initOmniSearch() {
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const query = prompt('OMNI-SEARCH COMMAND:\nEnter name, ID, or project tag');
            if (query) alert(`Command Pulse: Searching for "${query}"...`);
        }
    });
}

function initRadarAnimation() {
    console.log('Operational Radar: Scanning Sector 7...');
}
