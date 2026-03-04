import { client } from "../../shared/supabaseClient.js";

export async function fetchArtistData(params) {
  const { data, error } = await client.rpc(
    "get_artist_refine_data",
    params
  );

  if (error) throw new Error(error.message);
  return data;
}