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
    if (ctx) {
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

    initSentimentAI();
    initResourceAllocation();
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

// Feature 19: Automated Governance PDF Generator
async function generateGovernanceReport() {
    alert('Synthesizing operational data for Governance Report...');
    const { jsPDF } = window.jspdf ? window.jspdf : (await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'));
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text('RKF GOVERNANCE REPORT', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Report ID: GOV-${Date.now()}`, 105, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Operational Vital Signs:', 20, 50);
    doc.setFontSize(11);
    doc.text('- Global Impact Velocity: +14.2%', 20, 60);
    doc.text('- Financial Transparency Score: 100/100', 20, 70);
    doc.text('- Active Restoration Chapters: 3', 20, 80);
    doc.text('- Satellite Heritage Verified: True', 20, 90);

    doc.setFontSize(8);
    doc.text('Restored Kings Foundation - Sovereign Intelligence Division', 105, 280, { align: 'center' });

    doc.save(`RKF_Governance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

function initSentimentAI() {
    const container = document.getElementById('adminSentimentHub');
    if (!container) return;
    console.log('Sentiment AI: Processing stakeholder pulse data...');
}

function initResourceAllocation() {
    const ctx = document.getElementById('resourceAllocChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Restoration', 'Nutrition', 'Global Expansion'],
            datasets: [{
                data: [50, 30, 20],
                backgroundColor: ['#d4a574', '#1e293b', '#0f172a'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
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
