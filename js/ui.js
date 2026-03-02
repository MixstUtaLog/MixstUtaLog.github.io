let currentData = [];
let currentPage = 1;
let totalCount = 0;
const pageSize = 100;

import { search } from "./api.js";

export function initDateDefault() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById("date_to").value = `${yyyy}-${mm}-${dd}`;
}

function validate() {
    const song = document.getElementById("song").value.trim();
    const artist = document.getElementById("artist").value.trim();
    const btn = document.getElementById("searchBtn");
    const message = document.getElementById("message");

    if (!song && !artist) {
        btn.disabled = true;
        message.innerText = "曲名 / アーティスト名どちらかを入力してください";
    } else {
        btn.disabled = false;
        message.innerText = "";
    }
}

function getVtuberClass(name) {
    switch(name.trim()) {
        case "空奏イト": return "ito";
        case "天吹サン": return "san";
        case "小鈴りあん": return "lian";
        case "雪白キャル": return "qalu";
        case "星乃りむ": return "rimu";
        case "成海ミャオ": return "myao";
        case "琴宮いおり": return "iori";
        case "渚沢シチ": return "shichi";
        default: return "other";
    }
}

function render(data) {
    const resultDiv = document.getElementById("result");
    let html = "";

    data.forEach(item => {
        let timestampUrl = item.url;
        if (item.song_time) {
            timestampUrl += (item.url.includes("?") ? "&" : "?") + "t=" + item.song_time + "s";
        }

        let vtuberHtml = "";
        if (item.vtubers) {
            const members = item.vtubers.split(",");
            members.forEach(name => {
                const cls = getVtuberClass(name);
                vtuberHtml += `<span class="vtuber-tag ${cls}">${name.trim()}</span>`;
            });
        }

     html += `
        <div class="card">
            <div class="card-title">
                ♪ <a href="${timestampUrl}" target="_blank">${item.song}</a>
                <span class="artist-name">${item.artist}</span>
            </div>

            <div class="card-sub">
                <div class="stream-date">${item.streamdate}</div>
                <div class="stream-name">${item.stream_name || ""}</div>
            </div>

            <div class="member-list">
                ${vtuberHtml}
            </div>

            ${item.memo && item.memo.trim() !== "" 
                ? `<div class="memo">※ ${item.memo}</div>` 
                : ""}
        </div>
        `;

    });

    resultDiv.innerHTML = html;

    const bottomPaginationHtml = `
        <div id="bottomPagination">
            <button id="prevPageBottom">◀</button>
            <button id="nextPageBottom">▶</button>
        </div>
    `;

    const existing = document.getElementById("bottomPagination");
    if (existing) existing.remove();

    resultDiv.insertAdjacentHTML('afterend', bottomPaginationHtml);

    const prevBtn = document.getElementById("prevPageBottom");
    const nextBtn = document.getElementById("nextPageBottom");

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", () => changePage(currentPage - 1));
        nextBtn.addEventListener("click", () => changePage(currentPage + 1));

        const maxPage = Math.ceil(totalCount / pageSize);
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === maxPage;
    }
}

function renderPage() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = currentData.slice(start, end);
    render(pageData);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function updatePagination() {
    const maxPage = Math.ceil(totalCount / pageSize);
    document.getElementById("resultControls").style.display = "flex";
    document.getElementById("pageInput").value = currentPage;
    document.getElementById("pageInput").max = maxPage;
    document.getElementById("maxPage").textContent = maxPage;
    document.getElementById("totalCount").textContent = totalCount;

    const prevTop = document.getElementById("prevPage");
    const nextTop = document.getElementById("nextPage");
    if (prevTop) prevTop.disabled = currentPage === 1;
    if (nextTop) nextTop.disabled = currentPage === maxPage;

}

function changePage(newPage) {
    const maxPage = Math.ceil(totalCount / pageSize);
    if (newPage < 1) newPage = 1;
    if (newPage > maxPage) newPage = maxPage;
    currentPage = newPage;
    updatePagination();
    renderPage();
}

function sortLocal() {
    if (!currentData.length) return;
    const column = document.getElementById("sort_column").value;
    const order = document.getElementById("sort_order").value;

    currentData.sort((a, b) => {
        let valA, valB;
        if (column === "date") {
            valA = new Date(a.streamdate);
            valB = new Date(b.streamdate);
        } else {
            valA = (a[column] || "").toLowerCase();
            valB = (b[column] || "").toLowerCase();
        }           
        if (valA < valB) return order === "asc" ? -1 : 1;
        if (valA > valB) return order === "asc" ? 1 : -1;
        return 0;
    });

    currentPage = 1;
    updatePagination();
    renderPage();
}

export function initUIEvents() {

    document.getElementById("song")
        ?.addEventListener("input", validate);

    document.getElementById("artist")
        ?.addEventListener("input", validate);
    
    document.getElementById("searchBtn")
        ?.addEventListener("click", handleSearch);

    validate(); 

    document.getElementById("prevPage")
        ?.addEventListener("click", () => changePage(currentPage - 1));

    document.getElementById("nextPage")
        ?.addEventListener("click", () => changePage(currentPage + 1));

    document.getElementById("sort_column")
        ?.addEventListener("change", sortLocal);

    document.getElementById("sort_order")
        ?.addEventListener("change", sortLocal);
}

function collectSearchParams() {
    const song = document.getElementById("song").value.trim() || null;
    const artist = document.getElementById("artist").value.trim() || null;
    
    const checked = Array.from(document.querySelectorAll(".vtuber:checked"));
    const vtuberIds = checked.map(cb => Number(cb.value));
    
    const vtuberMode = document.getElementById("vtuber_mode").value;
    const externalMode = document.getElementById("external_mode").value;
    
    const dateFrom = document.getElementById("date_from").value || null;
    const dateTo = document.getElementById("date_to").value || null;

    return {
        p_song: song,
        p_artist: artist,
        p_vtuber_ids: vtuberIds.length ? vtuberIds : null,
        p_vtuber_mode: vtuberMode,
        p_external_mode: externalMode,
        p_date_from: dateFrom,
        p_date_to: dateTo,
        p_sort_column: "date",
        p_sort_order: "desc",
        p_limit: 500,
        p_offset: 0
    };
}

async function handleSearch() {
    const params = collectSearchParams();

    const resultDiv = document.getElementById("result");
    resultDiv.innerText = "検索中...";

    let data;
    try {
        data = await search(params);
    } catch (err) {
        resultDiv.innerText = err.message;
        return;
    }

    currentData = data;
    totalCount = data.length;

    const sortColumn = document.getElementById("sort_column");
    const sortOrder = document.getElementById("sort_order");
    if (sortColumn) sortColumn.value = "date";
    if (sortOrder) sortOrder.value = "desc";

    if (totalCount >= 500) {
        document.getElementById("message").innerText =
            "※検索結果が500件に達しました。条件を絞ってください。";
    } else {
        document.getElementById("message").innerText = "";
    }

    currentPage = 1;
    updatePagination();
    renderPage();
}