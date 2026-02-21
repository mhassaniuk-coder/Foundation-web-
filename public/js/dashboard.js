import { auth, db } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await auth.getUser();
    if (!user) {
        window.location.href = '/auth.html';
        return;
    }

    const userName = document.getElementById('userName');
    const greeting = document.getElementById('greeting');
    const logoutBtn = document.getElementById('logoutBtn');
    const totalDonated = document.getElementById('totalDonated');
    const donationList = document.getElementById('donationList');
    const projectList = document.getElementById('projectList');

    // UI Updates
    userName.innerText = `King ${user.email.split('@')[0]}`;
    greeting.innerText = `Greetings, King. Your legacy is growing.`;

    // Security Audit Trigger (Feature 3)
    const lastLoginTime = document.getElementById('lastLoginTime');
    if (lastLoginTime) {
        lastLoginTime.innerText = new Date().toLocaleTimeString();
    }

    // Notification Cloud (Feature 17)
    const bell = document.getElementById('notificationBell');
    const badge = document.getElementById('notifBadge');

    const sendNotification = (msg) => {
        badge.style.display = 'block';
        bell.addEventListener('click', () => {
            alert(`Kingly Notification: ${msg}`);
            badge.style.display = 'none';
        }, { once: true });
    };

    setTimeout(() => sendNotification("Welcome back, King! Your legacy is being calculated."), 3000);

    // Logout
    logoutBtn.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = '/';
    });

    // Donation Interaction
    const donateBtn = donationList.parentElement.querySelector('.btn-primary');
    if (donateBtn) {
        donateBtn.addEventListener('click', async () => {
            const amount = prompt("Enter donation amount ($):", "25");
            if (amount && !isNaN(amount)) {
                try {
                    const { error } = await supabase.from('donations').insert([
                        { user_id: user.id, amount: parseFloat(amount), type: 'One-time' }
                    ]);
                    if (error) throw error;
                    location.reload(); // Refresh to show new donation
                } catch (e) {
                    alert("Donation error: " + e.message);
                }
            }
        });
    }

    // Volunteer Interaction (Event Delegation)
    projectList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-primary')) {
            const projectCard = e.target.closest('.card');
            const projectTitle = projectCard.querySelector('h4').innerText;

            if (confirm(`Do you want to join the "${projectTitle}" team?`)) {
                try {
                    const { error } = await supabase.from('volunteer_tasks').insert([
                        { user_id: user.id, project_title: projectTitle, status: 'joined' }
                    ]);
                    if (error) throw error;
                    alert("Welcome to the team! Our coordinator will contact you shortly.");
                } catch (e) {
                    alert("Sign-up error: " + e.message);
                }
            }
        }
    });

    // Fetch Stats
    try {
        const { data: profile } = await db.getProfile(user.id);
        const { count: tasksCount } = await supabase.from('volunteer_tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

        if (profile) {
            totalDonated.innerText = `$${profile.total_donated || 0}`;
            document.getElementById('volunteerHours').innerText = `${profile.volunteer_hours || 0}h`;
            document.getElementById('livesImpacted').innerText = profile.lives_impacted || 0;

            // Sync Leaderboard (Feature 13)
            const userRankDonated = document.getElementById('userRankDonated');
            if (userRankDonated) userRankDonated.innerText = `$${profile.total_donated || 0}`;

            // Init Charts (Feature 12)
            initProjectionChart(profile.total_donated || 0);

            // Init Timeline (Feature 16)
            initLegacyTimeline(new Date(user.created_at).toLocaleDateString());

            // Badge Logic (Feature 43)
            const badgeContainer = document.getElementById('badgeContainer');
            if (profile.total_donated > 0) addBadge(badgeContainer, '❤️', 'Golden Heart', 'First Donation');
            if (profile.volunteer_hours >= 10) addBadge(badgeContainer, '⚔️', 'Iron Will', '10+ Hours');
            if (tasksCount >= 3) addBadge(badgeContainer, '🏛️', 'Community Pillar', '3+ Projects');

            // Role-Based UI (Feature 5)
            if (profile.role === 'admin') {
                document.querySelector('.container').insertAdjacentHTML('afterbegin', `
                    <div class="glass-panel" style="background: rgba(212, 165, 116, 0.1); border-color: var(--gold-500); padding: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--gold-400); font-weight: 700;">ADMIN PRIVILEGES DETECTED</span>
                        <a href="/admin.html" class="btn btn-primary btn-sm">Enter Admin Console</a>
                    </div>
                `);
            }
        }
    } catch (e) {
        console.error("Profile fetch error", e);
    }

    function addBadge(container, icon, title, desc) {
        const badge = document.createElement('div');
        badge.className = 'glass-panel';
        badge.style.padding = '10px';
        badge.style.textAlign = 'center';
        badge.style.minWidth = '80px';
        badge.innerHTML = `
            <div style="font-size: 1.5rem;">${icon}</div>
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--gold-400);">${title}</div>
            <div class="tooltip" style="font-size: 0.6rem;">${desc}</div>
        `;
        container.appendChild(badge);
    }

    // Receipt Generation (Feature 44)
    // Dynamic import for jsPDF to keep main bundle light
    async function generateReceipt(donation) {
        const { jsPDF } = await import('https://cdn.skypack.dev/jspdf');
        const doc = new jsPDF();

        doc.setFont('helvetica', 'bold');
        doc.text('OFFICIAL DONATION RECEIPT', 105, 40, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('Restored Kings Foundation', 105, 50, { align: 'center' });
        doc.text('501(c)(3) Nonprofit Organization', 105, 60, { align: 'center' });

        doc.line(20, 70, 190, 70);

        doc.text(`Donor Identity: ${user.email}`, 20, 90);
        doc.text(`Contribution Amount: $${donation.amount}`, 20, 100);
        doc.text(`Date of Giving: ${new Date(donation.created_at).toLocaleDateString()}`, 20, 110);
        doc.text(`Transaction Type: ${donation.type || 'Standard Contribution'}`, 20, 120);

        doc.text('Thank you for your royalty and support in rebuilding lives.', 105, 150, { align: 'center' });

        doc.save(`Receipt_RKF_${donation.id.substring(0, 8)}.pdf`);
    }

    // Attach receipt listener via delegation
    donationList.addEventListener('click', (e) => {
        if (e.target.innerText === 'Receipt') {
            const amount = e.target.parentElement.querySelector('p').innerText.match(/\d+/)[0];
            const date = e.target.parentElement.querySelector('span').innerText;
            generateReceipt({ amount, created_at: date, id: Math.random().toString(36) });
        }
    });

    // Fetch Donations
    try {
        const { data: donations } = await db.getDonations(user.id);
        if (donations && donations.length > 0) {
            donationList.innerHTML = donations.map(d => `
                <div class="activity-item" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 1rem 0;">
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <div>
                            <p style="margin: 0; font-weight: 600;">$${d.amount} Contribution</p>
                            <span style="font-size: 0.75rem; color: rgba(255,255,255,0.5);">${new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                        <button class="btn btn-ghost btn-sm" style="font-size: 0.7rem;">Receipt</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error("Donations fetch error", e);
    }

    // Fetch Projects & Smart Matching (Feature 15 & 11)
    try {
        const { data: profile } = await db.getProfile(user.id);
        const userSkills = profile?.skills ? profile.skills.toLowerCase().split(',').map(s => s.trim()) : [];

        const { data: projects } = await db.getVolunteerProjects();
        if (projects && projects.length > 0) {
            projectList.innerHTML = projects.map(p => {
                const isMatch = userSkills.some(skill => p.title.toLowerCase().includes(skill) || p.description.toLowerCase().includes(skill));
                return `
                    <div class="card" style="padding: 1.5rem; border: ${isMatch ? '1px solid var(--gold-500)' : '1px solid rgba(255,255,255,0.05)'}; position: relative;">
                        ${isMatch ? '<span style="position: absolute; top: 10px; right: 10px; font-size: 0.6rem; background: var(--gold-500); color: var(--primary-900); padding: 2px 6px; border-radius: 4px; font-weight: 700;">SMART MATCH</span>' : ''}
                        <h4 style="margin: 0; font-size: 1.1rem; color: white;">${p.title}</h4>
                        <div style="display: flex; gap: 0.5rem; margin: 0.75rem 0;">
                            <span style="font-size: 0.7rem; color: var(--gold-400); background: rgba(212, 165, 116, 0.1); padding: 2px 8px; border-radius: 10px;">Active</span>
                            <span style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">${p.location || 'Remote'}</span>
                        </div>
                        <p style="font-size: 0.85rem; margin: 0.5rem 0; color: rgba(255,255,255,0.7);">${p.description.substring(0, 80)}...</p>
                        <button class="btn ${isMatch ? 'btn-primary' : 'btn-secondary'} btn-sm" style="width: 100%; margin-top: 1rem;">Deploy to Project</button>
                    </div>
                `;
            }).join('');
        } else {
            projectList.innerHTML = `<p style="color: rgba(255,255,255,0.5);">Fetching active projects...</p>`;
        }
    } catch (e) {
        console.error("Projects fetch error", e);
    }

    // Donation Projection Chart (Feature 12)
    const initProjectionChart = (total) => {
        const ctx = document.getElementById('projectionChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Impact Value ($)',
                    data: [total * 0.2, total * 0.5, total * 0.8, total, total * 1.3, total * 1.7],
                    borderColor: '#d4a574',
                    backgroundColor: 'rgba(212, 165, 116, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                    x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                }
            }
            // Unlock Resource Vault (Feature 18)
    const unlockResources = () => {
                const vault = document.getElementById('resourceVault');
                if (!vault) return;
                vault.innerHTML = `
            <div style="text-align: center; padding: 1rem; background: rgba(212, 165, 116, 0.05); border-radius: 8px; border: 1px solid var(--gold-500); cursor: pointer;" onclick="alert('Downloading Impact Strategy 2026...')">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📄</div>
                <p style="font-size: 0.7rem; color: white; font-weight: 600;">Impact Strategy 2026</p>
                <span style="font-size: 0.6rem; color: var(--gold-400);">DOWNLOAD</span>
            </div>
            <div style="text-align: center; padding: 1rem; background: rgba(212, 165, 116, 0.05); border-radius: 8px; border: 1px solid var(--gold-500); cursor: pointer;" onclick="alert('Downloading Heritage Wallpapers...')">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🖼️</div>
                <p style="font-size: 0.7rem; color: white; font-weight: 600;">Heritage Wallpapers</p>
                <span style="font-size: 0.6rem; color: var(--gold-400);">DOWNLOAD</span>
            </div>
        `;
            };

            // Chat Mock (Feature 19)
            const chatBtn = document.querySelector('.btn-outline');
            if(chatBtn && chatBtn.innerText === 'Start Premium Consultation') {
            chatBtn.addEventListener('click', () => {
                alert("Initiating encrypted line to Foundation Coordinator... Please wait.");
                setTimeout(() => {
                    const chatContainer = chatBtn.parentElement;
                    chatContainer.innerHTML = `
                    <div style="width: 100%; text-align: left;">
                        <p style="font-size: 0.75rem; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;"><strong>Coordinator:</strong> Greetings King. How can I assist your mission today?</p>
                        <input type="text" class="form-input" style="width: 100%; font-size: 0.8rem;" placeholder="Type your message...">
                    </div>
                `;
                }, 1000);
            });
        }

        // Achievement Sharer (Feature 20)
        badgeContainer.addEventListener('click', (e) => {
            const badge = e.target.closest('.glass-panel');
            if (badge) {
                const title = badge.querySelector('div:nth-child(2)').innerText;
                alert(`Generating shareable Royal Achievement Card for "${title}"... (Success!)`);
            }
        });

        // Auto-unlock logic check
        if (totalDonated && parseInt(totalDonated.innerText.replace('$', '')) > 0) {
            unlockResources();
        }
    });
    };

// Legacy Milestone Timeline (Feature 16)
const initLegacyTimeline = (joinedDate) => {
    const dashboardGrid = document.querySelector('.dashboard-grid');
    const timelinePanel = document.createElement('div');
    timelinePanel.className = 'glass-panel';
    timelinePanel.style.padding = '2rem';
    timelinePanel.style.marginTop = '2rem';
    timelinePanel.style.gridColumn = 'span 3';
    timelinePanel.innerHTML = `
            <h3 style="margin-bottom: 2rem; color: white;">Your Legacy Timeline</h3>
            <div style="display: flex; justify-content: space-between; position: relative;">
                <div style="position: absolute; top: 15px; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.1); z-index: 0;"></div>
                <div style="text-align: center; z-index: 1;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--gold-500); margin: 0 auto 1rem; border: 4px solid var(--primary-900);"></div>
                    <p style="font-size: 0.8rem; font-weight: 600;">Joined</p>
                    <span style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">${joinedDate}</span>
                </div>
                <div style="text-align: center; z-index: 1; opacity: 0.5;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); margin: 0 auto 1rem; border: 4px solid var(--primary-900);"></div>
                    <p style="font-size: 0.8rem; font-weight: 600;">First Project</p>
                    <span style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">TBD</span>
                </div>
                <div style="text-align: center; z-index: 1; opacity: 0.5;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); margin: 0 auto 1rem; border: 4px solid var(--primary-900);"></div>
                    <p style="font-size: 0.8rem; font-weight: 600;">Impact Master</p>
                    <span style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">Future</span>
                </div>
            </div>
        `;
    dashboardGrid.after(timelinePanel);
};
});
