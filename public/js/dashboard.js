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
        if (profile) {
            totalDonated.innerText = `$${profile.total_donated || 0}`;
            document.getElementById('volunteerHours').innerText = `${profile.volunteer_hours || 0}h`;
            document.getElementById('livesImpacted').innerText = profile.lives_impacted || 0;
        }
    } catch (e) {
        console.error("Profile fetch error", e);
    }

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

    // Fetch Projects
    try {
        const { data: projects } = await db.getVolunteerProjects();
        if (projects && projects.length > 0) {
            projectList.innerHTML = projects.slice(0, 2).map(p => `
                <div class="card" style="padding: 1rem;">
                    <h4 style="margin: 0; font-size: 1rem;">${p.title}</h4>
                    <p style="font-size: 0.8rem; margin: 0.5rem 0;">${p.description.substring(0, 50)}...</p>
                    <button class="btn btn-primary btn-sm" style="width: 100%;">Join Team</button>
                </div>
            `).join('');
        } else {
            projectList.innerHTML = `<p style="color: rgba(255,255,255,0.5);">Fetching active projects...</p>`;
        }
    } catch (e) {
        console.error("Projects fetch error", e);
    }
});
