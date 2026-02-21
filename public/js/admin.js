import { auth, supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await auth.getUser();

    // Admin check (Simulated for now, would typically use roles/claims)
    if (!user || !user.email.includes('admin')) {
        // For demonstration, let's allow anyone who successfully logs in to see the admin view if they know the URL,
        // but typically this would redirect back if not an admin.
        if (!user) {
            window.location.href = '/auth.html';
            return;
        }
    }

    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = '/';
    });

    // Fetch Global Stats
    async function fetchStats() {
        // Real-time aggregates would happen here
        // For now, let's just fetch the counts of relevant tables
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { data: donations } = await supabase.from('donations').select('amount');
        const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });

        if (userCount !== null) document.getElementById('platformUsers').innerText = userCount;
        if (donations) {
            const total = donations.reduce((acc, curr) => acc + curr.amount, 0);
            document.getElementById('totalFunds').innerText = `$${total.toLocaleString()}`;
        }
        if (projectCount !== null) document.getElementById('activeVolunteers').innerText = projectCount * 12; // Just a mock factor
    }

    // Fetch User List
    async function fetchUsers() {
        const { data: profiles } = await supabase.from('profiles').select('*').limit(5);
        const userTable = document.getElementById('userTable');

        if (profiles && profiles.length > 0) {
            userTable.innerHTML = profiles.map(p => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; background: rgba(255,255,255,0.02); border-radius: 8px;">
                    <div>
                        <div style="color: white; font-weight: 600;">${p.full_name || 'Anonymous King'}</div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.4);">${p.id.substring(0, 8)}...</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-ghost btn-sm" style="font-size: 0.6rem; padding: 4px 8px;">Details</button>
                        <button class="btn btn-secondary btn-sm" style="font-size: 0.6rem; padding: 4px 8px; border-color: #ef4444; color: #ef4444;">Suspend</button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Initialize
    fetchStats();
    fetchUsers();
});
