const supabaseUrl = "https://lmddclqnqzkdvxvfzhor.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZGRjbHFucXprZHZ4dmZ6aG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjkzMzYsImV4cCI6MjA4NjU0NTMzNn0.2xXa8YPwgkzRgiaFnAgOukiR7hsAKYb1avqRCyYe3FU";
const client = window.supabase.createClient(supabaseUrl, supabaseKey);

export let songCache = [];

export async function loadSongCache() {
    let allData = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await client
            .from("songs")
            .select("id, song, artist, song_normalized, artist_normalized")
            .range(from, from + pageSize - 1);

        if (error) {
            console.error(error);
            break;
        }

        allData = allData.concat(data);

        if (data.length < pageSize) break;

        from += pageSize;
    }

    songCache = allData;
    console.log("Song cache loaded:", songCache.length);
}

export async function search(params) {
    const { data, error } = await client.rpc("search_song_streams", params);

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}