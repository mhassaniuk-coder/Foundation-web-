// Configuration for Supabase
// In production, these values should be injected via environment variables
// For Vercel, use: https://vercel.com/docs/environment-variables
const SUPABASE_URL = window.SUPABASE_URL || "https://sdcyqjnkathygshzilqa.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkY3lxam5rYXRoeWdzaHppbHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTgyNjQsImV4cCI6MjA4NzI3NDI2NH0.TN7aVuVOkN18DRYWPA4-k3nE6g5HeyOypNP4h_vua6s";

// Stripe public key - configurable via environment variables
const STRIPE_PUBLIC_KEY = window.STRIPE_PUBLIC_KEY || '';

// Export configuration
export { SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_PUBLIC_KEY };
