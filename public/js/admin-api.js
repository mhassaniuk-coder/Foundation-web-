/**
 * RKF Admin Intelligence API
 * Centralized handlers for modular admin operations.
 */
import { supabase, db } from './supabase.js';

export const AdminAPI = {
    // User Management
    async getUsers() {
        console.log('AdminAPI: Fetching foundation members...');
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async updateUserRole(userId, role) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);
        if (error) throw error;
        return data;
    },

    async updateUserStatus(userId, status) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ status })
            .eq('id', userId);
        if (error) throw error;
        return data;
    },

    // Content Management
    async getBlogPosts() {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return [];
        return data;
    },

    async createBlogPost(post) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('blog_posts')
            .insert([{ ...post, author_id: user.id }]);
        if (error) throw error;
        return data;
    },

    async updateBlogPost(id, post) {
        const { data, error } = await supabase
            .from('blog_posts')
            .update(post)
            .eq('id', id);
        if (error) throw error;
        return data;
    },

    async deleteBlogPost(id) {
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async getPrograms() {
        const { data, error } = await supabase
            .from('programs')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error) return [];
        return data;
    },

    async createProgram(program) {
        const { data, error } = await supabase
            .from('programs')
            .insert([program]);
        if (error) throw error;
        return data;
    },

    async updateProgram(id, program) {
        const { data, error } = await supabase
            .from('programs')
            .update(program)
            .eq('id', id);
        if (error) throw error;
        return data;
    },

    async deleteProgram(id) {
        const { error } = await supabase
            .from('programs')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Donations
    async getDonationLedger() {
        const { data, error } = await supabase
            .from('donations')
            .select('*, profiles(full_name, email)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createDonation(donation) {
        const { data, error } = await supabase
            .from('donations')
            .insert([donation]);
        if (error) throw error;
        return data;
    },

    async getDonationStats() {
        const { data: totals, error: tError } = await supabase
            .from('donations')
            .select('amount');
        if (tError) throw tError;

        const totalHeritage = totals.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

        // Simplified velocity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recent, error: rError } = await supabase
            .from('donations')
            .select('amount')
            .gte('created_at', thirtyDaysAgo.toISOString());

        const monthlyVelocity = rError ? 0 : recent.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

        return { totalHeritage, monthlyVelocity };
    },

    async getGrowthAnalytics() {
        const { data, error } = await supabase
            .from('profiles')
            .select('created_at')
            .order('created_at', { ascending: true });
        if (error) return [];
        return data;
    },

    async getDonationTrends() {
        const { data, error } = await supabase
            .from('donations')
            .select('created_at, amount')
            .order('created_at', { ascending: true });
        if (error) return [];
        return data;
    },

    // Volunteers
    async getPendingApplications() {
        const { data, error } = await supabase
            .from('volunteer_applications')
            .select('*, profiles(full_name, email)')
            .eq('status', 'pending');
        if (error) return []; // Fallback
        return data;
    },

    // Audit Logging
    async logAction(action, entityType, entityId, newValues) {
        const user = (await supabase.auth.getUser()).data.user;
        const { error } = await supabase
            .from('admin_audit_log')
            .insert([{
                user_id: user.id,
                action,
                entity_type: entityType,
                entity_id: entityId,
                new_values: newValues
            }]);
        if (error) console.error('Audit Log Error:', error);
    },

    // Sovereign Settings
    async getSystemSettings() {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .single();
        if (error && error.code !== 'PGRST116') throw error; // Handle missing settings row
        return data || {};
    },

    async updateSystemSettings(config) {
        // Attempt to update the single settings row
        const { data, error } = await supabase
            .from('system_settings')
            .upsert({ id: 1, ...config }); // Assuming a single row with ID 1
        if (error) throw error;
        return data;
    }
};
