// ============================================
// ADMIN COMMAND CENTER - Operational Engine
// Restored Kings Foundation - Phase 1 Overhaul
// ============================================

import { auth, db, supabase } from './supabase.js';
import { AdminAPI } from './admin-api.js';

// Show notification helper
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] Admin Alert: ${message}`);
    // Future: Replace with toast system
    alert(message);
}

document.addEventListener('DOMContentLoaded', async () => {
    // --- Authentication Check ---
    try {
        const { data: { user } } = await auth.getUser();
        if (!user) {
            window.location.href = '/auth.html';
            return;
        }
        // Authenticated access enabled for admin console.
        // If role data exists, still log it for audit visibility.
        const { data: profile } = await db.getProfile(user.id);
        if (profile?.role) {
            console.log(`Admin access granted for authenticated user role: ${profile.role}`);
        }

        initializeAdmin();
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/auth.html';
    }
});

function initializeAdmin() {
    console.log('Admin OS [Modular Engine] Online');

    // --- Suite Initializers ---
    const suites = {
        users: initUsersSuite,
        content: initContentSuite,
        donations: initDonationsSuite,
        volunteers: initVolunteersSuite,
        analytics: initAnalyticsSuite,
        settings: initSettingsSuite
    };

    // --- Navigation Logic ---
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const suite = this.dataset.suite;
            if (!suite) return;

            // Update UI
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.suite-section').forEach(section => {
                section.style.display = section.id === `${suite}Suite` ? 'block' : 'none';
            });

            // Trigger Suite Initialization
            if (suites[suite]) suites[suite]();
            console.log(`Command Suite Switched: ${suite.toUpperCase()}`);
        });
    });

    // Initialize Default Suite
    initUsersSuite();
    initOmniSearch();
}

// --- SUITE: Users ---
async function initUsersSuite() {
    const container = document.getElementById('userList');
    if (!container) return;

    try {
        const users = await AdminAPI.getUsers();
        if (users.length === 0) {
            container.innerHTML = `<p style="color: rgba(255,255,255,0.4);">No members found.</p>`;
            return;
        }

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td>${u.full_name || 'Unnamed King'}</td>
                            <td>${u.email}</td>
                            <td><span class="role-pill">${u.role || 'user'}</span></td>
                            <td><span class="status-pill status-${u.status === 'active' ? 'success' : 'info'}">${u.status || 'active'}</span></td>
                            <td>
                                <button class="btn btn-ghost btn-xs edit-user-btn" 
                                    data-id="${u.id}" 
                                    data-name="${u.full_name || u.email}"
                                    data-role="${u.role || 'user'}"
                                    data-status="${u.status || 'active'}">
                                    Edit
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Attach Event Listeners
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.onclick = () => {
                const { id, name, role, status } = btn.dataset;
                document.getElementById('editUserId').value = id;
                document.getElementById('editUserName').value = name;
                document.getElementById('editUserRole').value = role;
                document.getElementById('editUserStatus').value = status;
                document.getElementById('userEditModal').style.display = 'flex';
            };
        });
    } catch (e) {
        container.innerHTML = `<p style="color: #ef4444;">Error syncing members: ${e.message}</p>`;
    }
}

// Attach Modal Closers
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('userEditModal');
    if (!modal) return;

    modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';

    document.getElementById('saveUserBtn').onclick = async () => {
        const id = document.getElementById('editUserId').value;
        const role = document.getElementById('editUserRole').value;
        const status = document.getElementById('editUserStatus').value;
        const btn = document.getElementById('saveUserBtn');

        try {
            btn.disabled = true;
            btn.innerText = 'Syncing...';

            await AdminAPI.updateUserRole(id, role);
            await AdminAPI.updateUserStatus(id, status);

            // Log the action
            await AdminAPI.logAction('USER_UPDATE', 'profile', id, { role, status });

            showNotification('Member authority updated successfully.', 'success');
            modal.style.display = 'none';
            initUsersSuite(); // Refresh
        } catch (e) {
            showNotification(`Update failed: ${e.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Commit Changes';
        }
    };
});

// --- SUITE: Content ---
async function initContentSuite() {
    console.log('Content Suite: Initializing Forge...');
    const blogContainer = document.getElementById('blogList');
    const programContainer = document.getElementById('programList');

    if (!blogContainer || !programContainer) return;

    // Fetch Blogs
    try {
        const blogs = await AdminAPI.getBlogPosts();
        blogContainer.innerHTML = blogs.length === 0 ?
            `<p style="color: rgba(255,255,255,0.4);">No entries found.</p>` :
            `<div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${blogs.map(b => `
                    <div class="glass-panel" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 700;">${b.title}</div>
                            <div style="font-size: 0.6rem; color: ${b.is_published ? '#4ade80' : 'var(--gold-500)'};">
                                ${b.is_published ? 'PUBLISHED' : 'DRAFT'}
                            </div>
                        </div>
                        <button class="btn btn-ghost btn-xs edit-blog-btn" data-id="${b.id}">Edit</button>
                    </div>
                `).join('')}
            </div>`;

        // Wire up New/Edit
        document.querySelectorAll('.edit-blog-btn').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const post = blogs.find(b => b.id === id);
                if (post) openBlogModal(post);
            };
        });

        const createBlogBtn = document.querySelector('#contentSuite .btn-primary');
        if (createBlogBtn) createBlogBtn.onclick = () => openBlogModal();

    } catch (e) {
        blogContainer.innerHTML = `<p style="color: #ef4444;">Sync Error.</p>`;
    }

    // Fetch Programs
    try {
        const programs = await AdminAPI.getPrograms();
        programContainer.innerHTML = programs.length === 0 ?
            `<p style="color: rgba(255,255,255,0.4);">No programs found.</p>` :
            `<div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${programs.map(p => `
                    <div class="glass-panel" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 1.2rem;">${p.icon || '🛠️'}</span>
                            <div>
                                <div style="font-weight: 700;">${p.name}</div>
                                <div style="font-size: 0.6rem; color: rgba(255,255,255,0.5);">ORDER: ${p.sort_order}</div>
                            </div>
                        </div>
                        <button class="btn btn-ghost btn-xs edit-program-btn" data-id="${p.id}">Edit</button>
                    </div>
                `).join('')}
            </div>`;

        document.querySelectorAll('.edit-program-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const program = programs.find(p => p.id === id);
                if (program) openProgramModal(program);
            };
        });

        const createProgramBtn = document.querySelector('#contentSuite .btn-ghost.btn-block');
        if (createProgramBtn) createProgramBtn.onclick = () => openProgramModal();

    } catch (e) {
        programContainer.innerHTML = `<p style="color: #ef4444;">Sync Error.</p>`;
    }
}

function openBlogModal(post = null) {
    const modal = document.getElementById('blogModal');
    document.getElementById('blogId').value = post?.id || '';
    document.getElementById('blogTitle').value = post?.title || '';
    document.getElementById('blogSlug').value = post?.slug || '';
    document.getElementById('blogContent').value = post?.content || '';
    document.getElementById('blogImage').value = post?.featured_image || '';
    document.getElementById('blogPublished').checked = post?.is_published || false;
    modal.style.display = 'flex';
}

function openProgramModal(program = null) {
    const modal = document.getElementById('programModal');
    document.getElementById('programId').value = program?.id || '';
    document.getElementById('programName').value = program?.name || '';
    document.getElementById('programDesc').value = program?.description || '';
    document.getElementById('programIcon').value = program?.icon || '👑';
    document.getElementById('programSort').value = program?.sort_order || 0;
    modal.style.display = 'flex';
}

// Attach More Modal Closers
document.addEventListener('DOMContentLoaded', () => {
    // Select all modalo-overlays
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        const closeBtn = overlay.querySelector('.close-modal');
        if (closeBtn) closeBtn.onclick = () => overlay.style.display = 'none';
    });

    // Save Blog
    const saveBlogBtn = document.getElementById('saveBlogBtn');
    if (saveBlogBtn) {
        saveBlogBtn.onclick = async () => {
            const id = document.getElementById('blogId').value;
            const post = {
                title: document.getElementById('blogTitle').value,
                slug: document.getElementById('blogSlug').value,
                content: document.getElementById('blogContent').value,
                featured_image: document.getElementById('blogImage').value,
                is_published: document.getElementById('blogPublished').checked,
                published_at: document.getElementById('blogPublished').checked ? new Date().toISOString() : null
            };

            try {
                saveBlogBtn.disabled = true;
                saveBlogBtn.innerText = 'Forging...';

                if (id) {
                    await AdminAPI.updateBlogPost(id, post);
                    await AdminAPI.logAction('BLOG_UPDATE', 'blog_posts', id, post);
                } else {
                    await AdminAPI.createBlogPost(post);
                    await AdminAPI.logAction('BLOG_CREATE', 'blog_posts', null, post);
                }

                showNotification('Narrative forged successfully.', 'success');
                document.getElementById('blogModal').style.display = 'none';
                initContentSuite();
            } catch (e) {
                showNotification(`Forge error: ${e.message}`, 'error');
            } finally {
                saveBlogBtn.disabled = false;
                saveBlogBtn.innerText = 'Forge Post';
            }
        };
    }

    // Save Program
    const saveProgramBtn = document.getElementById('saveProgramBtn');
    if (saveProgramBtn) {
        saveProgramBtn.onclick = async () => {
            const id = document.getElementById('programId').value;
            const program = {
                name: document.getElementById('programName').value,
                description: document.getElementById('programDesc').value,
                icon: document.getElementById('programIcon').value,
                sort_order: parseInt(document.getElementById('programSort').value)
            };

            try {
                saveProgramBtn.disabled = true;
                saveProgramBtn.innerText = 'Syncing...';

                if (id) {
                    await AdminAPI.updateProgram(id, program);
                    await AdminAPI.logAction('PROGRAM_UPDATE', 'programs', id, program);
                } else {
                    await AdminAPI.createProgram(program);
                    await AdminAPI.logAction('PROGRAM_CREATE', 'programs', null, program);
                }

                showNotification('Program asset synced successfully.', 'success');
                document.getElementById('programModal').style.display = 'none';
                initContentSuite();
            } catch (e) {
                showNotification(`Sync error: ${e.message}`, 'error');
            } finally {
                saveProgramBtn.disabled = false;
                saveProgramBtn.innerText = 'Sync Program';
            }
        };
    }
});

// --- SUITE: Donations ---
async function initDonationsSuite() {
    const container = document.getElementById('donationLedger');
    const totalDisp = document.getElementById('totalHeritageDisplay');
    const velocityDisp = document.getElementById('monthlyVelocityDisplay');
    if (!container) return;

    // Fetch Stats
    try {
        const stats = await AdminAPI.getDonationStats();
        if (totalDisp) totalDisp.innerText = `$${stats.totalHeritage.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        if (velocityDisp) velocityDisp.innerText = `+$${stats.monthlyVelocity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    } catch (e) {
        console.error('Stats Sync Error:', e);
    }

    // Fetch Ledger
    try {
        const donations = await AdminAPI.getDonationLedger();
        if (!donations || donations.length === 0) {
            container.innerHTML = `<p style="color: rgba(255,255,255,0.4);">No donations recorded.</p>`;
            return;
        }
        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Donor</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${donations.map(d => `
                        <tr>
                            <td title="${d.profiles?.email || 'System'}">
                                ${d.profiles?.full_name || d.profiles?.email || 'Anonymous'}
                            </td>
                            <td style="font-weight: 700; color: var(--gold-400);">$${parseFloat(d.amount).toFixed(2)}</td>
                            <td><span class="role-pill" style="font-size: 0.6rem;">${d.type}</span></td>
                            <td>${new Date(d.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<p style="color: #ef4444;">Error syncing donations.</p>`;
    }

    // Wire up Add Donation Trigger
    const addBtn = document.getElementById('addDonationTrigger');
    if (addBtn) {
        addBtn.onclick = () => {
            document.getElementById('donationModal').style.display = 'flex';
            initDonorSearch();
        };
    }
}

function initDonorSearch() {
    const searchInput = document.getElementById('donorSearch');
    const resultsContainer = document.getElementById('donorSearchResults');
    let users = [];

    searchInput.oninput = async () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        // Search among existing profiles (minimal lookup)
        try {
            if (users.length === 0) users = await AdminAPI.getUsers();

            const matches = users.filter(u =>
                (u.full_name?.toLowerCase().includes(query)) ||
                (u.email?.toLowerCase().includes(query))
            ).slice(0, 5);

            if (matches.length > 0) {
                resultsContainer.innerHTML = matches.map(u => `
                    <div class="search-result-item" 
                         style="padding: 0.75rem; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05);"
                         data-id="${u.id}" data-name="${u.full_name || u.email}">
                        <div style="font-size: 0.8rem; font-weight: 700;">${u.full_name || 'Unnamed'}</div>
                        <div style="font-size: 0.6rem; color: rgba(255,255,255,0.5);">${u.email}</div>
                    </div>
                `).join('');
                resultsContainer.style.display = 'block';

                document.querySelectorAll('.search-result-item').forEach(item => {
                    item.onclick = () => {
                        document.getElementById('selectedDonorId').value = item.dataset.id;
                        document.getElementById('donorSearch').value = item.dataset.name;
                        resultsContainer.style.display = 'none';
                    };
                });
            } else {
                resultsContainer.style.display = 'none';
            }
        } catch (e) {
            console.error('Donor Search Error:', e);
        }
    };
}

// Global initialization for Donation Saving
document.addEventListener('DOMContentLoaded', () => {
    const saveDonationBtn = document.getElementById('saveDonationBtn');
    if (saveDonationBtn) {
        saveDonationBtn.onclick = async () => {
            const donorId = document.getElementById('selectedDonorId').value;
            const amount = document.getElementById('donationAmount').value;
            const type = document.getElementById('donationType').value;
            const ref = document.getElementById('donationRef').value;

            if (!donorId || !amount) return showNotification('Incomplete foundation payload.', 'error');

            try {
                saveDonationBtn.disabled = true;
                saveDonationBtn.innerText = 'Syncing...';

                const donation = {
                    user_id: donorId,
                    amount: parseFloat(amount),
                    type: type,
                    external_id: ref
                };

                await AdminAPI.createDonation(donation);
                await AdminAPI.logAction('DONATION_CREATE', 'donations', null, donation);

                showNotification('Heritage contribution committed to ledger.', 'success');
                document.getElementById('donationModal').style.display = 'none';
                initDonationsSuite();
            } catch (e) {
                showNotification(`Ledger Error: ${e.message}`, 'error');
            } finally {
                saveDonationBtn.disabled = false;
                saveDonationBtn.innerText = 'Commit to Ledger';
            }
        };
    }
});

// --- SUITE: Volunteers ---
async function initVolunteersSuite() {
    const pendingContainer = document.getElementById('pendingVolunteers');
    const activeContainer = document.getElementById('activeDeployments');
    if (!pendingContainer || !activeContainer) return;

    // Fetch Pending
    try {
        const pending = await AdminAPI.getPendingApplications();
        pendingContainer.innerHTML = pending.length === 0 ?
            `<p style="color: rgba(255,255,255,0.4);">No pending assets.</p>` :
            `<table class="admin-table">
                <thead>
                    <tr>
                        <th>Applicant</th>
                        <th>Applied</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${pending.map(a => `
                        <tr>
                            <td>
                                <div>${a.profiles?.full_name || 'Candidate'}</div>
                                <div style="font-size: 0.6rem; color: rgba(255,255,255,0.4);">${a.profiles?.email}</div>
                            </td>
                            <td>${new Date(a.created_at).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-ghost btn-xs review-app-btn" data-id="${a.id}">Review</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;

        document.querySelectorAll('.review-app-btn').forEach(btn => {
            btn.onclick = () => {
                const app = pending.find(a => a.id === btn.dataset.id);
                if (app) openVolunteerModal(app);
            };
        });
    } catch (e) {
        pendingContainer.innerHTML = `<p style="color: #ef4444;">Sync Error.</p>`;
    }

    // Fetch Active
    try {
        const active = await AdminAPI.getActiveDeployments();
        activeContainer.innerHTML = active.length === 0 ?
            `<p style="color: rgba(255,255,255,0.4);">No active deployments.</p>` :
            `<table class="admin-table">
                <thead>
                    <tr>
                        <th>Volunteer</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${active.map(a => `
                        <tr>
                            <td>
                                <div>${a.profiles?.full_name || 'Volunteer'}</div>
                                <div style="font-size: 0.6rem; color: rgba(255,255,255,0.4);">${a.profiles?.email}</div>
                            </td>
                            <td><span class="status-pill status-success">DEPLOYED</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    } catch (e) {
        activeContainer.innerHTML = `<p style="color: #ef4444;">Sync Error.</p>`;
    }
}

function openVolunteerModal(app) {
    const modal = document.getElementById('volunteerModal');
    document.getElementById('reviewAppId').value = app.id;
    document.getElementById('reviewAppName').innerText = app.profiles?.full_name || 'Candidate';
    document.getElementById('reviewAppEmail').innerText = app.profiles?.email;
    document.getElementById('reviewAppSkills').innerText = app.skills || 'No skills reported.';
    document.getElementById('reviewAppMotivation').innerText = app.motivation || 'No motivation provided.';
    modal.style.display = 'flex';
}

// Global initialization for Volunteer Decisions
document.addEventListener('DOMContentLoaded', () => {
    const approveBtn = document.getElementById('approveAppBtn');
    const rejectBtn = document.getElementById('rejectAppBtn');
    const modal = document.getElementById('volunteerModal');

    if (approveBtn) {
        approveBtn.onclick = async () => handleVolunteerDecision('approved');
    }
    if (rejectBtn) {
        rejectBtn.onclick = async () => handleVolunteerDecision('rejected');
    }

    async function handleVolunteerDecision(status) {
        const id = document.getElementById('reviewAppId').value;
        const btn = status === 'approved' ? approveBtn : rejectBtn;
        const originalText = btn.innerText;

        try {
            btn.disabled = true;
            btn.innerText = 'Syncing...';

            await AdminAPI.updateVolunteerApplication(id, status);
            await AdminAPI.logAction(`VOLUNTEER_${status.toUpperCase()}`, 'volunteer_applications', id, { status });

            showNotification(`Application ${status} successfully.`, 'success');
            modal.style.display = 'none';
            initVolunteersSuite();
        } catch (e) {
            showNotification(`Nexus Error: ${e.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
});

// --- SUITE: Analytics ---
async function initAnalyticsSuite() {
    console.log('Analytics Suite: Scanning Impact Horizon...');
    const canvas = document.getElementById('impactVelocityChart');
    if (!canvas) return;

    try {
        const trends = await AdminAPI.getDonationTrends();

        // Aggregate data by date
        const dailyData = {};
        trends.forEach(d => {
            const date = new Date(d.created_at).toLocaleDateString();
            dailyData[date] = (dailyData[date] || 0) + parseFloat(d.amount);
        });

        const labels = Object.keys(dailyData).slice(-7); // Last 7 days
        const values = labels.map(l => dailyData[l]);

        // Destroy existing chart if it exists
        const chartStatus = Chart.getChart("impactVelocityChart");
        if (chartStatus !== undefined) chartStatus.destroy();

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Heritage Flow ($)',
                    data: values,
                    borderColor: '#d4a574', // var(--gold-500)
                    backgroundColor: 'rgba(212, 165, 116, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#d4a574'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.4)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255,255,255,0.4)' }
                    }
                }
            }
        });

        // Update Placeholder Matrix
        document.querySelector('.grid-3 .card:nth-child(2) div[style*="font-weight: 800"]')
            .innerText = `${Math.floor(Math.random() * 10) + 90}% POSITIVE`;

        // Calculate ROI (mock logic: $ total / total users)
        const stats = await AdminAPI.getDonationStats();
        const users = await AdminAPI.getUsers();
        const roi = users.length > 0 ? (stats.totalHeritage / users.length).toFixed(2) : 0;
        document.querySelector('.grid-3 .card:nth-child(3) div[style*="font-size: 2rem"]')
            .innerText = `$${roi} / King`;

    } catch (e) {
        console.error('Analytics Radar Failure:', e);
    }
}

// --- SUITE: Settings ---
async function initSettingsSuite() {
    console.log('Settings Suite: Accessing Sovereign Control...');
    const form = document.getElementById('systemSettingsForm');
    if (!form) return;

    try {
        const settings = await AdminAPI.getSystemSettings();

        // Populate inputs
        document.getElementById('maintenanceMode').checked = settings.maintenance_mode || false;
        document.getElementById('publicRegistration').checked = settings.public_registration ?? true;
        document.getElementById('heritageVisibility').checked = settings.heritage_visibility ?? true;

        form.onsubmit = async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerText;

            try {
                btn.disabled = true;
                btn.innerText = 'Syncing Sovereign State...';

                const config = {
                    maintenance_mode: document.getElementById('maintenanceMode').checked,
                    public_registration: document.getElementById('publicRegistration').checked,
                    heritage_visibility: document.getElementById('heritageVisibility').checked,
                    updated_at: new Date().toISOString()
                };

                await AdminAPI.updateSystemSettings(config);
                await AdminAPI.logAction('SYSTEM_CONFIG_UPDATE', 'system_settings', '1', config);

                showNotification('Sovereign configuration updated successfully.', 'success');
            } catch (err) {
                showNotification(`Configuration Error: ${err.message}`, 'error');
            } finally {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        };

    } catch (e) {
        console.error('Sovereign Link Failure:', e);
        showNotification('Failed to retrieve sovereign settings.', 'error');
    }
}

// --- Utility Functions ---

function initOmniSearch() {
    const searchPanel = document.createElement('div');
    searchPanel.id = 'omniSearchPanel';
    searchPanel.className = 'glass-panel';
    searchPanel.style.cssText = `
        position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
        width: 500px; max-height: 400px; z-index: 2000; padding: 2rem;
        display: none; flex-direction: column; gap: 1rem; border: 1px solid var(--gold-500);
        box-shadow: 0 20px 80px rgba(0,0,0,0.8);
    `;

    searchPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin:0; color: var(--gold-400);">Omni-Intelligence Search</h4>
            <span style="font-size: 0.6rem; color: rgba(255,255,255,0.4);">ESC TO CLOSE</span>
        </div>
        <input type="text" id="omniSearchInput" class="form-input" placeholder="Search Users, Blogs, Programs..." style="width: 100%;">
        <div id="omniSearchResults" style="overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem;"></div>
    `;

    document.body.appendChild(searchPanel);

    const input = document.getElementById('omniSearchInput');
    const resultsArea = document.getElementById('omniSearchResults');

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchPanel.style.display = 'flex';
            input.focus();
        }
        if (e.key === 'Escape') {
            searchPanel.style.display = 'none';
        }
    });

    input.addEventListener('input', async (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) {
            resultsArea.innerHTML = '';
            return;
        }

        resultsArea.innerHTML = '<div style="font-size: 0.7rem; color: var(--gold-400);">Searching intelligence network...</div>';

        try {
            const [{ data: users }, { data: blogs }, { data: programs }] = await Promise.all([
                supabase.from('profiles').select('id, full_name, email').ilike('full_name', `%${query}%`),
                supabase.from('blog_posts').select('id, title').ilike('title', `%${query}%`),
                supabase.from('programs').select('id, title').ilike('title', `%${query}%`)
            ]);

            resultsArea.innerHTML = '';

            const allResults = [
                ...(users?.map(u => ({ ...u, type: 'USER', label: u.full_name || u.email })) || []),
                ...(blogs?.map(b => ({ ...b, type: 'BLOG', label: b.title })) || []),
                ...(programs?.map(p => ({ ...p, type: 'PROGRAM', label: p.title })) || [])
            ];

            if (allResults.length === 0) {
                resultsArea.innerHTML = '<div style="font-size: 0.7rem; color: rgba(255,255,255,0.3);">No intelligence matches found.</div>';
                return;
            }

            allResults.forEach(res => {
                const item = document.createElement('div');
                item.className = 'glass-panel';
                item.style.padding = '0.75rem';
                item.style.cursor = 'pointer';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.innerHTML = `
                    <div style="font-size: 0.85rem;">${res.label}</div>
                    <div style="font-size: 0.6rem; color: var(--gold-500); font-weight: 800;">${res.type}</div>
                `;
                item.onclick = () => {
                    searchPanel.style.display = 'none';
                    showNotification(`Intelligence Located: ${res.label}`, 'success');
                    // Additional logic to switch suite/open modal could go here
                };
                resultsArea.appendChild(item);
            });
        } catch (err) {
            console.error('OmniSearch Error:', err);
        }
    });
}
