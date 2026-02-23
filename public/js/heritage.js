/**
 * HERITAGE ENGINE - Phase 11
 * Managing Sovereign Assets and Vault Interactions.
 */

import { auth, supabase } from './supabase.js';

class HeritageEngine {
    constructor() {
        this.init();
    }

    async init() {
        const user = (await auth.getUser());
        if (!user) return;

        this.initVault();
        this.initAvatar();
        this.initNetworkingPulse();
    }

    initVault() {
        const vaultSection = document.getElementById('heritageVault');
        if (!vaultSection) return;

        const vaultBtn = vaultSection.querySelector('.btn');
        if (vaultBtn) {
            vaultBtn.addEventListener('click', () => {
                this.openVaultModal();
            });
        }
    }

    openVaultModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="glass-panel modal-content" style="max-width: 600px; padding: 2.5rem; border: 1px solid var(--gold-500); position: relative;">
                <button class="close-btn" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">&times;</button>
                <h2 style="color: var(--gold-400); margin-bottom: 1.5rem; font-family: 'Outfit', sans-serif;">Heritage Vault</h2>
                <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-bottom: 2rem;">Access your encrypted legacy documents and sovereign certificates.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="glass-panel" style="padding: 1rem; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📜</div>
                        <div style="font-size: 0.8rem; font-weight: 700;">Foundation Charter</div>
                        <button class="btn btn-ghost btn-sm" style="margin-top: 0.5rem; width: 100%;">View</button>
                    </div>
                    <div class="glass-panel" style="padding: 1rem; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">💎</div>
                        <div style="font-size: 0.8rem; font-weight: 700;">Legacy Certificate</div>
                        <button class="btn btn-ghost btn-sm" style="margin-top: 0.5rem; width: 100%;">Download</button>
                    </div>
                </div>
                
                <div style="margin-top: 2rem; padding: 1rem; background: rgba(212, 165, 116, 0.05); border-radius: 8px;">
                    <div style="font-size: 0.7rem; color: var(--gold-500); font-weight: 800; letter-spacing: 1px;">VAULT STATUS: ENCRYPTED</div>
                    <div style="font-size: 0.6rem; color: rgba(255,255,255,0.4); margin-top: 2px;">Last access: ${new Date().toLocaleString()}</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.close-btn').onclick = () => modal.remove();
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    initAvatar() {
        const avatar = document.querySelector('.avatar-container img');
        if (avatar) {
            avatar.classList.add('sovereign-avatar');
            avatar.addEventListener('click', () => {
                alert("King's Profile: Level 4 Patron\nYour contribution velocity is in the top 5%.");
            });
        }
    }

    async initNetworkingPulse() {
        const hubSection = document.getElementById('nobleNetworking');
        if (!hubSection) return;

        const hubBtn = hubSection.querySelector('.btn');
        if (hubBtn) {
            hubBtn.addEventListener('click', async () => {
                this.openNetworkingHub();
            });
        }
    }

    async openNetworkingHub() {
        const { data: kings, error } = await supabase
            .from('profiles')
            .select('full_name, role')
            .limit(5);

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="glass-panel modal-content" style="max-width: 500px; padding: 2.5rem; border: 1px solid var(--gold-500); position: relative;">
                <button class="close-btn" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">&times;</button>
                <h2 style="color: var(--gold-400); margin-bottom: 1.5rem; font-family: 'Outfit', sans-serif;">Noble Networking</h2>
                <div id="kingsList" style="display: flex; flex-direction: column; gap: 1rem;">
                    ${kings ? kings.map(k => `
                        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="width: 32px; height: 32px; background: var(--gold-500); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-900); font-weight: 800; font-size: 0.8rem;">
                                ${k.full_name?.charAt(0) || 'K'}
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; font-weight: 600;">${k.full_name || 'Anonymous King'}</div>
                                <div style="font-size: 0.7rem; color: var(--gold-400);">${k.role?.toUpperCase() || 'PATRON'}</div>
                            </div>
                        </div>
                    `).join('') : '<p>Recruiting noble allies...</p>'}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.close-btn').onclick = () => modal.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HeritageEngine();
});
