import {
  search,
  fetchRefineSongArtist,
  fetchRefineVtuber,
} from "./api.js";

import { state } from "./state.js";


const dom = {
  song: document.getElementById("song"),
  artist: document.getElementById("artist"),
  searchBtn: document.getElementById("searchBtn"),
  message: document.getElementById("message"),
  result: document.getElementById("result"),

  refineArea: document.getElementById("refineArea"),
  refineLabel: document.getElementById("refineLabel"),
  refineBackBtn: document.getElementById("refineBackBtn"),

  sortColumn: document.getElementById("sort_column"),
  sortOrder: document.getElementById("sort_order"),

  pageInput: document.getElementById("pageInput"),
  maxPage: document.getElementById("maxPage"),
  totalCount: document.getElementById("totalCount"),

  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  prevPageBottom: document.getElementById("prevPageBottom"),
  nextPageBottom: document.getElementById("nextPageBottom"),

  resultControls: document.getElementById("resultControls"),
  bottomPagination: document.getElementById("bottomPagination"),

  vtuberMode: document.getElementById("vtuber_mode"),
  externalMode: document.getElementById("external_mode"),

  dateFrom: document.getElementById("date_from"),
  dateTo: document.getElementById("date_to")
};


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


export function initDateDefault(){

  const d = new Date();

  dom.dateTo.value =
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function initUIEvents(){

  dom.searchBtn.onclick = handleSearch;

  dom.song.oninput = validateSearchInput;
  dom.artist.oninput = validateSearchInput;

  dom.song.onkeydown = handleEnterSearch;
  dom.artist.onkeydown = handleEnterSearch;

  dom.refineBackBtn.onclick = handleRefineBack;

  dom.prevPage.onclick = ()=>changePage(state.currentPage-1);
  dom.nextPage.onclick = ()=>changePage(state.currentPage+1);

  dom.prevPageBottom.onclick = ()=>changePage(state.currentPage-1);
  dom.nextPageBottom.onclick = ()=>changePage(state.currentPage+1);

  dom.pageInput.onchange = e=>{
    const p = Number(e.target.value);
    if(!isNaN(p)) changePage(p);
  };

  dom.sortColumn.onchange = sortRemote;
  dom.sortOrder.onchange = sortRemote;

  validateSearchInput();
}


function validateSearchInput(){

  const song = dom.song.value.trim();
  const artist = dom.artist.value.trim();

  if(song==="" && artist===""){
    dom.searchBtn.disabled=true;
    dom.message.innerText="曲名またはアーティスト名を入力してください";
  }else{
    dom.searchBtn.disabled=false;
    dom.message.innerText="";
  }
}

function handleEnterSearch(e){

  if(e.isComposing || e.keyCode===229) return;

  if(e.key==="Enter"){
    e.preventDefault();
    if(!dom.searchBtn.disabled) dom.searchBtn.click();
  }
}


function collectParams(){

  const vtubers =
    Array.from(document.querySelectorAll(".vtuber:checked"))
      .map(cb=>Number(cb.value));

  return {
    p_song: dom.song.value.trim() || null,
    p_artist: dom.artist.value.trim() || null,
    p_vtuber_ids: vtubers.length?vtubers:null,
    p_vtuber_mode: dom.vtuberMode.value,
    p_external_mode: dom.externalMode.value,
    p_date_from: dom.dateFrom.value||null,
    p_date_to: dom.dateTo.value||null,
    p_sort_column: dom.sortColumn.value,
    p_sort_order: dom.sortOrder.value
  };
}


async function runSearch(page=1){

  const params={
    ...state.lastParams,
    p_limit: state.pageSize,
    p_offset: (page-1)*state.pageSize
  };

  const data = await search(params);

  state.currentData=data;
  state.currentPage=page;
  state.totalCount=data.length?data[0].total_count:0;

  refreshUI();
}

async function handleSearch(){

  if(dom.song.value.trim()==="" && dom.artist.value.trim()===""){
    dom.message.innerText="曲名またはアーティスト名を入力してください";
    return;
  }

  dom.result.innerText="検索中...";

  const params=collectParams();

  state.baseParams={...params};
  state.lastParams={...params};

  state.refineLevel=0;
  state.autoSongRefine=false;
  state.vtuberRefineCache=null;
  state.songRefineCache=null;

  await runSearch(1);
  await buildRefineArea();
}


async function changePage(page){

  const max=Math.ceil(state.totalCount/state.pageSize)||1;

  page=Math.max(1,Math.min(page,max));

  await runSearch(page);

  window.scrollTo({top:0,behavior:"smooth"});
}

async function sortRemote(){

  if(!state.lastParams) return;

  state.lastParams.p_sort_column=dom.sortColumn.value;
  state.lastParams.p_sort_order=dom.sortOrder.value;

  await runSearch(1);
}


function refreshUI(){

  render(state.currentData);

  updatePagination();
  toggleResultControls();
  updateBackButton();
}

function updateBackButton(){

  dom.refineBackBtn.style.display=
    (state.refineLevel===0 ||
    (state.refineLevel===1 && state.autoSongRefine))
      ?"none":"inline-block";
}

function toggleResultControls(){

  if(state.totalCount>0){

    dom.resultControls.style.display="flex";
    dom.bottomPagination.style.display="flex";

    const max=Math.ceil(state.totalCount/state.pageSize)||1;

    const disablePrev=state.currentPage<=1;
    const disableNext=state.currentPage>=max;

    [dom.prevPage,dom.prevPageBottom].forEach(b=>b.disabled=disablePrev);
    [dom.nextPage,dom.nextPageBottom].forEach(b=>b.disabled=disableNext);

  }else{

    dom.resultControls.style.display="none";
    dom.bottomPagination.style.display="none";
  }
}

function updatePagination(){

  const max=Math.ceil(state.totalCount/state.pageSize)||1;

  dom.pageInput.value=state.currentPage;
  dom.maxPage.innerText=max;
  dom.totalCount.innerText=state.totalCount;
}


function render(data){

  if(!data.length){
    dom.result.innerHTML=`<div class="no-result">該当する曲は見つかりませんでした</div>`;
    return;
  }

  dom.result.innerHTML=data.map(createCard).join("");
}

function createCard(row){

  let url=row.url;

  if(row.song_time){
    url+=(url.includes("?")?"&":"?")+"t="+row.song_time+"s";
  }

  const vtuberHtml=(row.vtuber_names||[])
    .sort(sortVtuber)
    .map(v=>`<span class="vtuber-tag ${vtuberClassMap[v]||"other"}">${v}</span>`)
    .join("");

  return `
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
}

function sortVtuber(a,b){

  const ia=vtuberOrder.indexOf(a);
  const ib=vtuberOrder.indexOf(b);

  if(ia===-1 && ib===-1) return a.localeCompare(b);
  if(ia===-1) return 1;
  if(ib===-1) return -1;

  return ia-ib;
}


async function buildRefineArea(){

  dom.refineArea.innerHTML="";
  dom.refineLabel.innerText="";

  if(!state.songRefineCache){

    const {p_song,p_artist,p_vtuber_ids,p_vtuber_mode,p_external_mode,p_date_from,p_date_to}
      =state.lastParams;

    state.songRefineCache =
      await fetchRefineSongArtist({
        p_song,p_artist,p_vtuber_ids,p_vtuber_mode,p_external_mode,p_date_from,p_date_to
      });
  }

  const songs=state.songRefineCache;

  if(songs.length>1){

    dom.refineLabel.innerText="▼ 曲で絞り込み";

    songs.forEach(s=>{
      dom.refineArea.appendChild(createRefineBtn(
        `${s.song} (${s.artist}) : ${s.count}`,
        async()=>{
          state.lastParams.p_song=s.song;
          state.lastParams.p_artist=s.artist;

          state.refineLevel=1;
          state.autoSongRefine=false;
          state.vtuberRefineCache=null;

          await runSearch(1);
          await buildRefineVtuber();
        }
      ));
    });

    return;
  }

  if(songs.length===1){

    state.lastParams.p_song=songs[0].song;
    state.lastParams.p_artist=songs[0].artist;

    state.refineLevel=1;
    state.autoSongRefine=true;

    await runSearch(1);
    await buildRefineVtuber();
  }
}

async function buildRefineVtuber(){

  dom.refineArea.innerHTML="";
  dom.refineLabel.innerText="▼ メンバーで絞り込み";

  if(!state.vtuberRefineCache){

    state.vtuberRefineCache =
      await fetchRefineVtuber({
        p_song: state.lastParams.p_song,
        p_artist: state.lastParams.p_artist,
        p_vtuber_ids: null,
        p_vtuber_mode: state.lastParams.p_vtuber_mode,
        p_external_mode: state.lastParams.p_external_mode,
        p_date_from: state.lastParams.p_date_from,
        p_date_to: state.lastParams.p_date_to
      });
  }

  const vtubers=state.vtuberRefineCache;

  if(!vtubers.length) return;

  vtubers.forEach(v=>{

    const btn=createRefineBtn(
      `${v.vtuber_name} : ${v.count}`,
      async()=>{

        if(state.lastParams.p_vtuber_ids &&
          state.lastParams.p_vtuber_ids[0]===v.vtuber_id){

          state.lastParams.p_vtuber_ids=null;
          state.refineLevel=1;

        }else{

          state.lastParams.p_vtuber_ids=[v.vtuber_id];
          state.lastParams.p_vtuber_mode="OR";
          state.refineLevel=2;
        }

        await runSearch(1);
        buildRefineVtuber();
      }
    );

    btn.classList.add(vtuberClassMap[v.vtuber_name]||"other");

    if(state.lastParams.p_vtuber_ids &&
       state.lastParams.p_vtuber_ids[0]===v.vtuber_id){
      btn.classList.add("active-refine");
    }

    dom.refineArea.appendChild(btn);
  });
}

function createRefineBtn(label,fn){

  const btn=document.createElement("button");

  btn.className="refine-btn";
  btn.innerText=label;
  btn.onclick=fn;

  return btn;
}

async function handleRefineBack(){

  if(state.refineLevel===2){

    state.lastParams.p_vtuber_ids=null;
    state.refineLevel=1;

  }else if(state.refineLevel===1){

    state.lastParams={...state.baseParams};
    state.refineLevel=0;
  }

  await runSearch(1);
  await buildRefineArea();
}