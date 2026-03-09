import {
  search,
  fetchRefineSongArtist,
  fetchRefineVtuber,
} from "./api.js";

import { state } from "./state.js";


export function initDateDefault(){
  const today = new Date();
  const yyyy=today.getFullYear();
  const mm=String(today.getMonth()+1).padStart(2,"0");
  const dd=String(today.getDate()).padStart(2,"0");
  document.getElementById("date_to").value = `${yyyy}-${mm}-${dd}`;
}

state.refineLevel = 0;

const vtuberClassMap = {
  "空奏イト": "ito",
  "天吹サン": "san",
  "小鈴りあん": "lian",
  "雪白キャル": "qalu",
  "星乃りむ": "rimu",
  "成海ミャオ": "myao",
  "琴宮いおり": "iori",
  "渚沢シチ": "shichi"
};

const vtuberOrder = [
  "空奏イト","天吹サン","小鈴りあん","雪白キャル",
  "星乃りむ","成海ミャオ","琴宮いおり","渚沢シチ"
];

function validateSearchInput(){
  const song = document.getElementById("song").value.trim();
  const artist = document.getElementById("artist").value.trim();
  const btn = document.getElementById("searchBtn");
  const message = document.getElementById("message");

  if(song === "" && artist === ""){
    btn.disabled = true;
    message.innerText = "曲名またはアーティスト名を入力してください";
  }else{
    btn.disabled = false;
    message.innerText = "";
  }
}

function handleEnterSearch(e){
  if(e.isComposing || e.keyCode === 229) return;
  if(e.key === "Enter"){
    e.preventDefault();

    const btn = document.getElementById("searchBtn");

    if(!btn.disabled){
      btn.click();
    }
  }
}

export function initUIEvents(){
  document.getElementById("searchBtn").addEventListener("click",handleSearch);

  const songInput = document.getElementById("song");
  const artistInput = document.getElementById("artist");

  songInput.addEventListener("input", validateSearchInput);
  artistInput.addEventListener("input", validateSearchInput);

  songInput.addEventListener("keydown", handleEnterSearch);
  artistInput.addEventListener("keydown", handleEnterSearch);

  document.getElementById("refineBackBtn").addEventListener("click",handleRefineBack);
  document.getElementById("prevPage").addEventListener("click",()=>changePage(state.currentPage-1));
  document.getElementById("nextPage").addEventListener("click",()=>changePage(state.currentPage+1));

  document.getElementById("pageInput").addEventListener("change", (e)=>{
    const page = Number(e.target.value);
    if(!isNaN(page)) changePage(page);
  });

  document.getElementById("sort_column").addEventListener("change",sortRemote);
  document.getElementById("sort_order").addEventListener("change",sortRemote);

  document.getElementById("prevPageBottom").addEventListener("click",()=>changePage(state.currentPage-1));
  document.getElementById("nextPageBottom").addEventListener("click",()=>changePage(state.currentPage+1));

  validateSearchInput();
}


async function handleSearch(){
  const song = document.getElementById("song").value.trim();
  const artist = document.getElementById("artist").value.trim();

  if(song === "" && artist === ""){
    document.getElementById("message").innerText =
      "曲名またはアーティスト名を入力してください";
    return;
  }
  document.getElementById("result").innerText="検索中...";
  const params = collectParams();

  state.baseParams = {...params};
  state.lastParams = {...params};
  state.refineLevel = 0;
  state.autoSongRefine = false;
  state.vtuberRefineCache = null;
  state.songRefineCache = null;

  await fetchPage(1);
  await buildRefineArea();
  refreshUI();
}


function collectParams(){
  const vtubers = Array.from(document.querySelectorAll(".vtuber:checked"))
    .map(cb=>Number(cb.value));

  return {
    p_song: document.getElementById("song").value.trim() || null,
    p_artist: document.getElementById("artist").value.trim() || null,
    p_vtuber_ids: vtubers.length ? vtubers : null,
    p_vtuber_mode: document.getElementById("vtuber_mode").value,
    p_external_mode: document.getElementById("external_mode").value,
    p_date_from: document.getElementById("date_from").value || null,
    p_date_to: document.getElementById("date_to").value || null,
    p_sort_column: document.getElementById("sort_column").value,
    p_sort_order: document.getElementById("sort_order").value
  };
}


async function fetchPage(page){
  const params = {...state.lastParams, p_limit: state.pageSize, p_offset: (page-1)*state.pageSize};
  const data = await search(params);
  state.currentData = data;
  state.currentPage = page;
  state.totalCount = data.length ? data[0].total_count : 0;
}


async function changePage(page){
  const max = Math.ceil(state.totalCount/state.pageSize)||1;
  page = Math.max(1, Math.min(page, max));
  await fetchPage(page);
  refreshUI();
  window.scrollTo({top:0,behavior:"smooth"});
}


async function sortRemote(){
  if(!state.lastParams) return;
  state.lastParams.p_sort_column = document.getElementById("sort_column").value;
  state.lastParams.p_sort_order = document.getElementById("sort_order").value;
  await fetchPage(1);
  refreshUI();
}


function updateBackButton(){
  const btn = document.getElementById("refineBackBtn");
  btn.style.display = (state.refineLevel === 0 || (state.refineLevel === 1 && state.autoSongRefine)) ? "none" : "inline-block";
}


async function handleRefineBack(){
  if(state.refineLevel === 2){
    state.lastParams.p_vtuber_ids = null;
    state.refineLevel = 1;
  } else if(state.refineLevel === 1){
    state.lastParams = {...state.baseParams};
    state.refineLevel = 0;
  }
  await fetchPage(1);
  await buildRefineArea();
  refreshUI();
}


function toggleResultControls(){
  const controls = document.getElementById("resultControls");
  const bottom = document.getElementById("bottomPagination");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const prevBottom = document.getElementById("prevPageBottom");
  const nextBottom = document.getElementById("nextPageBottom");

  if(state.totalCount > 0){
    controls.style.display = "flex";
    bottom.style.display = "flex";
    const max = Math.ceil(state.totalCount/state.pageSize)||1;
    const disablePrev = state.currentPage <= 1;
    const disableNext = state.currentPage >= max;
    prevBtn.disabled = disablePrev;
    nextBtn.disabled = disableNext;
    prevBottom.disabled = disablePrev;
    nextBottom.disabled = disableNext;
  }else{
    controls.style.display = "none";
    bottom.style.display = "none";
  }
}


function refreshUI(){
  render(state.currentData);
  updatePagination();
  toggleResultControls();
  updateBackButton();
}


function render(data){
  const result = document.getElementById("result");
  if(!data.length){
    result.innerHTML = `<div class="no-result">該当する曲は見つかりませんでした</div>`;
    return;
  }

  let html = "";
  data.forEach(row=>{
    let url = row.url;
    if(row.song_time){
      url += (url.includes("?") ? "&" : "?") + "t=" + row.song_time + "s";
    }

    const vtuberHtml = (row.vtuber_names||[]).sort((a,b)=>{
      const ia=vtuberOrder.indexOf(a), ib=vtuberOrder.indexOf(b);
      if(ia===-1 && ib===-1) return a.localeCompare(b);
      if(ia===-1) return 1;
      if(ib===-1) return -1;
      return ia-ib;
    }).map(v=>`<span class="vtuber-tag ${vtuberClassMap[v]||'other'}">${v}</span>`).join("");

    html += `
    <div class="card">
      <div class="card-title">
        ♪ <a href="${url}" target="_blank">${row.song}</a>
        <span class="artist-name">${row.artist}</span>
      </div>
      <div class="card-sub">
        <div>${row.streamdate}</div>
        <div>${row.stream_name||""}</div>
      </div>
      <div>${vtuberHtml}</div>
      ${row.memo?`<div class="memo">※ ${row.memo}</div>`:""}
    </div>`;
  });

  result.innerHTML = html;
}


function updatePagination(){
  const max = Math.ceil(state.totalCount/state.pageSize)||1;
  document.getElementById("pageInput").value = state.currentPage;
  document.getElementById("maxPage").innerText = max;
  document.getElementById("totalCount").innerText = state.totalCount;
}


async function buildRefineArea(){
  const area = document.getElementById("refineArea");
  const label = document.getElementById("refineLabel");
  area.innerHTML = "";
  label.innerText = "";

  if(!state.songRefineCache){
    const {p_song,p_artist,p_vtuber_ids,p_vtuber_mode,p_external_mode,p_date_from,p_date_to} = state.lastParams;
    state.songRefineCache = await fetchRefineSongArtist({p_song,p_artist,p_vtuber_ids,p_vtuber_mode,p_external_mode,p_date_from,p_date_to});
  }

  const songs = state.songRefineCache;
  if(songs.length>1){
    label.innerText="▼ 曲で絞り込み";
    songs.forEach(s=>{
      const btn=document.createElement("button");
      btn.className="refine-btn";
      btn.innerText=`${s.song} (${s.artist}) : ${s.count}`;
      btn.onclick=async ()=>{
        state.lastParams.p_song=s.song;
        state.lastParams.p_artist=s.artist;
        state.refineLevel=1;
        state.autoSongRefine=false;
        state.vtuberRefineCache=null;
        await fetchPage(1);
        await buildRefineVtuber();
        refreshUI();
      };
      area.appendChild(btn);
    });
    return;
  }

  if(songs.length===1){
    state.lastParams.p_song = songs[0].song;
    state.lastParams.p_artist = songs[0].artist;
    state.refineLevel = 1;
    state.autoSongRefine = true;
    await fetchPage(1);
    await buildRefineVtuber();
  }
}


async function buildRefineVtuber(){
  const area = document.getElementById("refineArea");
  const label = document.getElementById("refineLabel");
  area.innerHTML="";
  label.innerText="▼ メンバーで絞り込み";

  if(!state.vtuberRefineCache){
    state.vtuberRefineCache = await fetchRefineVtuber({
      p_song: state.lastParams.p_song,
      p_artist: state.lastParams.p_artist,
      p_vtuber_ids: null,
      p_vtuber_mode: state.lastParams.p_vtuber_mode,
      p_external_mode: state.lastParams.p_external_mode,
      p_date_from: state.lastParams.p_date_from,
      p_date_to: state.lastParams.p_date_to
    });
  }

  const vtubers = state.vtuberRefineCache;
  if(!vtubers.length) return;

  vtubers.forEach(v=>{
    const btn=document.createElement("button");
    btn.className=`refine-btn ${vtuberClassMap[v.vtuber_name]||'other'}`;
    btn.dataset.vtuberId=v.vtuber_id;
    btn.innerText=`${v.vtuber_name} : ${v.count}`;
    if(state.lastParams.p_vtuber_ids && state.lastParams.p_vtuber_ids[0]===v.vtuber_id){
      btn.classList.add("active-refine");
    }
    btn.onclick=async ()=>{
      if(state.lastParams.p_vtuber_ids && state.lastParams.p_vtuber_ids[0]===v.vtuber_id){
        state.lastParams.p_vtuber_ids=null;
        state.refineLevel=1;
      }else{
        state.lastParams.p_vtuber_ids=[v.vtuber_id];
        state.lastParams.p_vtuber_mode="OR";
        state.refineLevel=2;
      }
      await fetchPage(1);
      buildRefineVtuber();
      refreshUI();
    };
    area.appendChild(btn);
  });
}