import { fetchArtistData } from "./api.js";
import { state } from "./state.js";
import {
  renderArtistSummaries,
  renderArtistDetail,
  renderActiveFilters,
  clearArtistDetail,
  renderArtistPagination
} from "./ui.js";

const PAGE_SIZE = 50;

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("artistSelect");

  state.artist = select.value;
  loadData();

  select.addEventListener("change", () => {
    resetState(select.value);
    loadData();
  });
});

function resetState(artist) {
    state.artist = artist;
    state.selectedSong = null;
    state.selectedSongName = null;
    state.selectedVtuberId = null;
    state.selectedVtuberName = null;
    state.page = 1;
}

async function loadData() {
  if (!state.artist) return;

  const data = await fetchArtistData({
    p_artist: state.artist,
    p_song_id: state.selectedSong,
    p_vtuber_id: state.selectedVtuberId,
    p_limit: PAGE_SIZE,
    p_offset: (state.page - 1) * PAGE_SIZE
  });

  renderArtistSummaries(
    data.song_summary,
    data.vtuber_summary,
    state,
    refineBySong,
    refineByVtuber
  );

  renderActiveFilters(state, removeSongFilter, removeVtuberFilter);

  if (state.selectedSong || state.selectedVtuberId) {
    renderArtistDetail(data.detail);
  } else {
    clearArtistDetail();
  }

  if (state.selectedSong || state.selectedVtuberId) {
    renderArtistPagination(
      data.total_count,
      state.page,
      PAGE_SIZE,
      (newPage) => {
        state.page = newPage;
        loadData();
      }
    );
  } else {
    document.getElementById("artistPagination").innerHTML = "";
  }
}

function refineBySong(songId, songName) {
  state.selectedSong = songId;
  state.selectedSongName = songName;
  state.page = 1;
  loadData();
}

function refineByVtuber(vtuberId, vtuberName) {
  state.selectedVtuberId = vtuberId;
  state.selectedVtuberName = vtuberName;
  state.page = 1;
  loadData();
}

function removeSongFilter() {
  state.selectedSong = null;
  state.selectedSongName = null;
  state.page = 1;
  loadData();
}

function removeVtuberFilter() {
  state.selectedVtuberId = null;
  state.selectedVtuberName = null;
  state.page = 1;
  loadData();
}