import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper functions for Auth
export const auth = {
    async signUp(email, password) {
        return await supabase.auth.signUp({ email, password })
    },
    async signIn(email, password) {
        return await supabase.auth.signInWithPassword({ email, password })
    },
    async signOut() {
        return await supabase.auth.signOut()
    },
    async getUser() {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    }
}

// Helper functions for Database
export const db = {
    async getProfile(userId) {
        return await supabase.from('profiles').select('*').eq('id', userId).single()
    },
    async getDonations(userId) {
        return await supabase.from('donations').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    },
    async getVolunteerProjects() {
        return await supabase.from('projects').select('*').eq('status', 'active')
    },
    async insertDonation(userId, amount) {
        return await supabase.from('donations').insert([{ user_id: userId, amount: amount }])
    },
    async joinProject(userId, projectTitle) {
        return await supabase.from('volunteer_tasks').insert([{ user_id: userId, project_title: projectTitle, status: 'joined' }])
    }
}
