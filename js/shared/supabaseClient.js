const supabaseUrl = "https://lmddclqnqzkdvxvfzhor.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZGRjbHFucXprZHZ4dmZ6aG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjkzMzYsImV4cCI6MjA4NjU0NTMzNn0.2xXa8YPwgkzRgiaFnAgOukiR7hsAKYb1avqRCyYe3FU";
export const client = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);