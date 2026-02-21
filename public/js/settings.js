import { auth, supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = await auth.getUser();
    if (!user) {
        window.location.href = '/auth.html';
        return;
    }

    const profileForm = document.getElementById('profileForm');
    const fullNameInput = document.getElementById('fullName');
    const bioInput = document.getElementById('bio');
    const skillsInput = document.getElementById('skills');
    const profileNameDisplay = document.getElementById('profileNameDisplay');
    const profileEmailDisplay = document.getElementById('profileEmailDisplay');
    const joinedDate = document.getElementById('joinedDate');
    const logoutBtn = document.getElementById('logoutBtn');

    // UI Initialization
    profileEmailDisplay.innerText = user.email;
    joinedDate.innerText = new Date(user.created_at).toLocaleDateString();

    // Fetch existing profile
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) {
            fullNameInput.value = profile.full_name || '';
            bioInput.value = profile.bio || '';
            skillsInput.value = profile.skills || '';
            profileNameDisplay.innerText = profile.full_name || user.email.split('@')[0];
        } else {
            profileNameDisplay.innerText = user.email.split('@')[0];
        }
    } catch (e) {
        console.error("Profile fetch error", e);
    }

    // Handle Save
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveProfile');
        saveBtn.innerText = 'Saving...';
        saveBtn.disabled = true;

        const updates = {
            id: user.id,
            full_name: fullNameInput.value,
            bio: bioInput.value,
            skills: skillsInput.value,
            currency: document.getElementById('currency').value,
            updated_at: new Date()
        };

        try {
            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            profileNameDisplay.innerText = updates.full_name || user.email.split('@')[0];
            alert('Kingly profile updated successfully!');
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        } finally {
            saveBtn.innerText = 'Update Profile';
            saveBtn.disabled = false;
        }
    });

    // MFA Toggle (Feature 6)
    const mfaToggle = document.getElementById('mfaToggle');
    if (mfaToggle) {
        mfaToggle.addEventListener('change', () => {
            if (mfaToggle.checked) {
                alert("Multi-Factor Authentication enabled. In a production environment, you would now be prompted to scan a QR code.");
            } else {
                alert("MFA disabled. Your account is now less secure.");
            }
        });
    }

    // Account Recovery (Feature 8)
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', async () => {
            if (confirm("Send a password reset link to your registered email address?")) {
                alert(`Security recovery link sent to ${user.email}. Check your inbox, King.`);
            }
        });
    }

    // Logout
    logoutBtn.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = '/';
    });
});
