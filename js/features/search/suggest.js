import { fetchSuggestSong, fetchSuggestArtist } from "./api.js";

let debounceTimer = null;
let activeIndex = -1;
let suggestions = [];

let requestId = 0;
const suggestCache = new Map();

const DEBOUNCE_MS = 500;
const MIN_LENGTH = 2;

function createList(input){

  const box = input.nextElementSibling;
  const keyword = input.value.trim();
  const isSong = input.id === "song";
  const songValue = document.getElementById("song").value.trim();
  const artistValue = document.getElementById("artist").value.trim();

  const cacheKey = `${isSong}|${keyword}|${songValue}|${artistValue}`;
  const min = input.id==="song" && artistValue ? 0 : MIN_LENGTH;

  if(keyword.length < min){
    const allowEmptySong =
      input.id === "song" &&
      artistValue.length > 0;

    if(!allowEmptySong){
      box.style.display = "none";
      box.innerHTML = "";
      return;
    }
  }

  if(suggestCache.has(cacheKey)){
    render(box, suggestCache.get(cacheKey), isSong);
    return;
  }

  const id = ++requestId;

  (async ()=>{

    let results;

    if(isSong)
      results = await fetchSuggestSong(keyword, artistValue);
    else
      results = await fetchSuggestArtist(keyword, songValue);

    if(id !== requestId) return;

    suggestCache.set(cacheKey, results);

    render(box, results, isSong);

  })();
}

function render(box, results, isSong){

  suggestions = results;

  box.innerHTML = results.map((r,i)=>
    `<div class="suggest-item" data-i="${i}">
      ${isSong ? r.song : r.artist}
    </div>`
  ).join("");

  activeIndex = -1;
  box.style.display = results.length ? "block" : "none";
}

export function attachSuggest(id){

  const input = document.getElementById(id);

  const box = document.createElement("div");
  box.className = "suggest-box";

  input.parentNode.appendChild(box);

  input.addEventListener("input",()=>{

    clearTimeout(debounceTimer);

    debounceTimer =
      setTimeout(()=>createList(input), DEBOUNCE_MS);

  });

  input.addEventListener("keydown",(e)=>{

    const items = box.querySelectorAll(".suggest-item");
    if(!items.length) return;

    if(e.key==="ArrowDown"){
      e.preventDefault();
      activeIndex=(activeIndex+1)%items.length;
      update(items);
    }

    if(e.key==="ArrowUp"){
      e.preventDefault();
      activeIndex=(activeIndex-1+items.length)%items.length;
      update(items);
    }

    if(e.key==="Enter" && activeIndex>=0){
      e.preventDefault();
      select(input, suggestions[activeIndex]);
    }

    if(e.key==="Escape"){
      box.style.display="none";
    }

  });

  box.addEventListener("click",(e)=>{

    const item = e.target.closest(".suggest-item");
    if(!item) return;

    const i = Number(item.dataset.i);
    select(input, suggestions[i]);

  });

  document.addEventListener("click",(e)=>{

    if(!input.contains(e.target) && !box.contains(e.target))
      box.style.display="none";

  });

  input.addEventListener("focus",()=>{createList(input);});

}

function update(items){
  items.forEach(i=>i.classList.remove("active"));

  if(activeIndex>=0)
    items[activeIndex].classList.add("active");

}

function select(input,item){

  if(input.id==="song"){

    input.value = item.song;

    const artistInput =
      document.getElementById("artist");

    if(!artistInput.value){
      artistInput.value = item.artist;
    }

  }else{

    input.value = item.artist;
    const songInput = document.getElementById("song");
    createList(songInput);

  }

  input.nextElementSibling.style.display="none";
}