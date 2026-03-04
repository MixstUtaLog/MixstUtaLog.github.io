import { client } from "../../shared/supabaseClient.js";

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
}

export async function search(params) {
  const { data, error } = await client.rpc(
    "search_song_streams",
    params
  );

  if (error) throw new Error(error.message);

  return data || [];
}