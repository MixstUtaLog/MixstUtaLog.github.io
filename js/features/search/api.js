import { client } from "../../shared/supabaseClient.js";

export async function search(params){

  const { data, error } =
    await client.rpc("search_song_streams", params);

  if(error) throw new Error(error.message);

  return data || [];
}


export async function fetchSuggestSong(keyword, artist){

  const { data, error } =
    await client.rpc("suggest_song", {
      p_keyword: keyword || null,
      p_artist: artist || null
    });

  if(error) throw new Error(error.message);

  return data || [];
}


export async function fetchSuggestArtist(keyword, song){

  const { data, error } =
    await client.rpc("suggest_artist", {
      p_keyword: keyword || null,
      p_song: song || null
    });

  if(error) throw new Error(error.message);

  return data || [];
}


export async function fetchRefineSongArtist(params){

  const { data, error } =
    await client.rpc("refine_song_artist", params);

  if(error) throw new Error(error.message);

  return data || [];
}


export async function fetchRefineVtuber(params){

  const { data, error } =
    await client.rpc("refine_vtuber", params);

  if(error) throw new Error(error.message);

  return data || [];
}