// ============================================
// ADMIN COMMAND CENTER - Operational Engine
// Restored Kings Foundation - Phase 8 & 11
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

    // --- Bulk Outreach (Feature 9) ---
    const broadcastBtn = document.querySelector('#commandSuite .btn-primary');
    if (broadcastBtn) {
        broadcastBtn.onclick = () => {
            const msgInput = document.querySelector('#commandSuite textarea');
            const msg = msgInput ? msgInput.value : '';
            if (!msg) return alert('Cannot broadcast zero payload.');

            broadcastBtn.disabled = true;
            broadcastBtn.innerText = 'Transmitting...';
            setTimeout(() => {
                const segment = document.querySelector('#commandSuite select')?.value || 'All';
                alert(`Royal Decree Transmitted Successfully.\nSegment: ${segment}`);
                broadcastBtn.disabled = false;
                broadcastBtn.innerText = 'Execute Global Broadcast';
                if (msgInput) msgInput.value = '';
            }, 1500);
        };
    }

    // --- Operational Control (Feature 16: Export) ---
    const auditLink = document.querySelector('.nav-link[data-suite="audit"]');
    if (auditLink) {
        auditLink.addEventListener('click', () => {
            if (confirm('Initiate audit-ready data export? (Feature 16)')) {
                alert('Generating encrypted operational report... Download will begin shortly.');
            }
        });
    }
});

// --- Intelligence Foundations ---

function initIntelligenceCharts() {
    const ctx = document.getElementById('impactVelocityChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
                label: 'Intervention Velocity',
                data: [45, 52, 48, 70, 85],
                backgroundColor: '#d4a574'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function initAuditVault() {
    const vault = document.getElementById('auditVaultEntries');
    if (!vault) return;
    const logs = [
        { time: '14:22:01', action: 'CURRENCY_NEXUS_SYNC', user: 'System' },
        { time: '14:15:33', action: 'ROLE_AUTHORITY_MOD', user: 'SuperAdmin' },
        { time: '13:58:12', action: 'BULK_OUTREACH_EXEC', user: 'Ops_Lead' }
    ];
    vault.innerHTML = logs.map(log => `
        <div style="font-size: 0.75rem; padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between;">
            <span style="color: var(--gold-500);">${log.time}</span>
            <span style="font-weight: 700;">${log.action}</span>
            <span style="color: rgba(255,255,255,0.4);">${log.user}</span>
        </div>
    `).join('');
}

function initRadarAnimation() {
    // Simulated radar pings in CSS/SVG
    console.log('Impact Radar: Tracking Global Restoration...');
}

function initOmniSearch() {
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const query = prompt('OMNI-SEARCH COMMAND:\nEnter name, ID, or project tag');
            if (query) alert(`Command Pulse: Searching for "${query}"...`);
        }
    });
}

function initPredictiveChart() {
    const ctx = document.getElementById('predictiveImpactChart');
    if (!ctx) return;

    if (window.myPredictiveChart) window.myPredictiveChart.destroy();

    window.myPredictiveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2024', '2025', '2026', '2027', '2028'],
            datasets: [{
                label: 'Heritage Projection',
                data: [100, 140, 210, 350, 520],
                borderColor: '#d4a574',
                backgroundColor: 'rgba(212, 165, 116, 0.1)',
                fill: true,
                tension: 0.4,
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                y: { display: false }
            }
        }
    });
}
