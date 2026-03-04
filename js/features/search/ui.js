import { search } from "./api.js";
import { state } from "./state.js";

export function initDateDefault() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
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
    switch (name.trim()) {
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

function getVtuberArray(row) {
    return row.vtubers
        ? row.vtubers.split(",").map(n => n.trim())
        : [];
}

function refreshUI() {
    updatePagination();
    renderPage();
    buildRefineArea();
    renderBackButton();
}

function applyDefaultSort() {
    const sortColumn = document.getElementById("sort_column");
    const sortOrder = document.getElementById("sort_order");

    if (sortColumn) sortColumn.value = "date";
    if (sortOrder) sortOrder.value = "desc";

    state.currentData.sort((a, b) =>
        new Date(b.streamdate) - new Date(a.streamdate)
    );
}

function render(data) {
    const resultDiv = document.getElementById("result");
    let html = "";

    data.forEach(item => {
        let timestampUrl = item.url;
        if (item.song_time) {
            timestampUrl += (item.url.includes("?") ? "&" : "?") +
                "t=" + item.song_time + "s";
        }

        let vtuberHtml = "";
        if (item.vtubers) {
            item.vtubers.split(",").forEach(name => {
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
            <div class="member-list">${vtuberHtml}</div>
            ${item.memo && item.memo.trim() !== ""
                ? `<div class="memo">※ ${item.memo}</div>`
                : ""}
        </div>`;
    });

    resultDiv.innerHTML = html;

    const bottomPaginationHtml = `
        <div id="bottomPagination">
            <button id="prevPageBottom">◀</button>
            <button id="nextPageBottom">▶</button>
        </div>
    `;

    document.getElementById("bottomPagination")?.remove();
    resultDiv.insertAdjacentHTML("afterend", bottomPaginationHtml);

    const prevBtn = document.getElementById("prevPageBottom");
    const nextBtn = document.getElementById("nextPageBottom");

    const maxPage = Math.ceil(state.currentData.length / state.pageSize);

    if (prevBtn && nextBtn) {
        prevBtn.onclick = () => changePage(state.currentPage - 1);
        nextBtn.onclick = () => changePage(state.currentPage + 1);

        prevBtn.disabled = state.currentPage === 1;
        nextBtn.disabled = state.currentPage === maxPage;
    }
}

function renderPage() {
    const start = (state.currentPage - 1) * state.pageSize;
    const pageData =
        state.currentData.slice(start, start + state.pageSize);

    render(pageData);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function updatePagination() {
    const maxPage =
        Math.ceil(state.currentData.length / state.pageSize) || 1;

    document.getElementById("resultControls").style.display = "flex";
    document.getElementById("pageInput").value = state.currentPage;
    document.getElementById("pageInput").max = maxPage;
    document.getElementById("maxPage").textContent = maxPage;
    document.getElementById("totalCount").textContent =
        state.currentData.length;

    document.getElementById("prevPage").disabled =
        state.currentPage === 1;

    document.getElementById("nextPage").disabled =
        state.currentPage === maxPage;
}

function changePage(newPage) {
    const maxPage =
        Math.ceil(state.currentData.length / state.pageSize) || 1;

    state.currentPage =
        Math.min(Math.max(newPage, 1), maxPage);

    refreshUI();
}

function sortLocal() {
    if (!state.currentData.length) return;

    const column =
        document.getElementById("sort_column").value;

    const order =
        document.getElementById("sort_order").value;

    state.currentData.sort((a, b) => {
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

    state.currentPage = 1;
    refreshUI();
}

export function initUIEvents() {
    document.getElementById("song")
        ?.addEventListener("input", validate);

    document.getElementById("artist")
        ?.addEventListener("input", validate);

    document.getElementById("searchBtn")
        ?.addEventListener("click", handleSearch);

    document.getElementById("prevPage")
        ?.addEventListener("click",
            () => changePage(state.currentPage - 1));

    document.getElementById("nextPage")
        ?.addEventListener("click",
            () => changePage(state.currentPage + 1));

    document.getElementById("sort_column")
        ?.addEventListener("change", sortLocal);

    document.getElementById("sort_order")
        ?.addEventListener("change", sortLocal);

    validate();
}

function collectSearchParams() {

    const checkedVtubers = Array.from(
        document.querySelectorAll(".vtuber:checked")
    ).map(cb => Number(cb.value));

    return {
        p_song: document.getElementById("song").value.trim() || null,
        p_artist: document.getElementById("artist").value.trim() || null,

        p_vtuber_ids:
            checkedVtubers.length ? checkedVtubers : null,

        p_vtuber_mode:
            document.getElementById("vtuber_mode").value,

        p_external_mode:
            document.getElementById("external_mode").value,

        p_date_from:
            document.getElementById("date_from").value || null,

        p_date_to:
            document.getElementById("date_to").value || null,

        p_sort_column: "date",
        p_sort_order: "desc",
        p_limit: 500,
        p_offset: 0
    };
}

async function handleSearch() {
    resetRefineUI();

    const resultDiv = document.getElementById("result");
    resultDiv.innerText = "検索中...";

    let data;
    try {
        data = await search(collectSearchParams());
    } catch (err) {
        resultDiv.innerText = err.message;
        return;
    }

    state.originalData = [...data];
    state.currentData = [...data];

    state.selectedSong = null;
    state.selectedArtist = null;
    state.selectedVtuber = null;
    state.hasUserRefined = false;
    state.currentPage = 1;

    applyDefaultSort();

    if (state.currentData.length >= 500) {
        document.getElementById("message").innerText =
            "※検索結果が500件に達しました。条件を絞ってください。";
    } else {
        document.getElementById("message").innerText = "";
    }

    refreshUI();
}

function refineBySongArtist(song, artist) {
    state.hasUserRefined = true;
    state.selectedSong = song;
    state.selectedArtist = artist;
    state.selectedVtuber = null;

    state.currentData = state.originalData.filter(row =>
        row.song === song &&
        row.artist === artist
    );

    state.currentPage = 1;
    applyDefaultSort();
    refreshUI();
}

function refineByVtuber(name) {
    state.hasUserRefined = true;
    state.selectedVtuber = name;

    const baseData = state.selectedSong
        ? state.originalData.filter(row =>
            row.song === state.selectedSong &&
            row.artist === state.selectedArtist
        )
        : state.currentData;

    state.currentData = baseData.filter(row =>
        getVtuberArray(row).includes(name)
    );

    state.currentPage = 1;
    applyDefaultSort();
    refreshUI();
}

function goBackRefine() {

    if (state.selectedVtuber) {
        state.selectedVtuber = null;
        refineBySongArtist(
            state.selectedSong,
            state.selectedArtist
        );
        return;
    }

    state.selectedSong = null;
    state.selectedArtist = null;
    state.selectedVtuber = null;
    state.hasUserRefined = false;

    state.currentData = [...state.originalData];
    state.currentPage = 1;

    refreshUI();
}

function resetRefineUI() {
    const container = document.getElementById("refineArea");
    const label = document.getElementById("refineLabel");

    container.innerHTML = "";
    label.innerText = "";

    state.selectedSong = null;
    state.selectedArtist = null;
    state.selectedVtuber = null;
    state.hasUserRefined = false;

    renderBackButton();
}

function renderBackButton() {
    const wrapper = document.getElementById("refineWrapper");
    let backBtn = document.getElementById("refineBackBtn");

    if (!backBtn) {
        backBtn = document.createElement("button");
        backBtn.id = "refineBackBtn";
        backBtn.className = "refine-btn back-btn";
        backBtn.innerText = "← 1つ前に戻る";
        backBtn.onclick = goBackRefine;
        wrapper.prepend(backBtn);
    }

    backBtn.style.display =
        state.hasUserRefined ? "inline-block" : "none";
}

function buildRefineArea() {

    const container = document.getElementById("refineArea");
    const label = document.getElementById("refineLabel");

    container.innerHTML = "";
    label.innerText = "";

    if (
        !state.currentData.length ||
        state.currentData.length >= 500
    ) {
        return;
    }

    const uniqueSongs = new Set(
        state.originalData.map(row =>
            `${row.song}|||${row.artist}`
        )
    );

    if (!state.selectedSong && uniqueSongs.size > 1) {
        buildSongArtistSummary();
        return;
    }

    if (!state.selectedSong && uniqueSongs.size === 1) {
        const [song, artist] =
            [...uniqueSongs][0].split("|||");

        state.selectedSong = song;
        state.selectedArtist = artist;
    }

    renderVtuberSummary();
}

function buildSongArtistSummary() {

    const map = new Map();

    state.currentData.forEach(row => {
        const key = `${row.song}|||${row.artist}`;
        map.set(key, (map.get(key) || 0) + 1);
    });

    const summary = Array.from(map.entries())
        .map(([key, count]) => {
            const [song, artist] = key.split("|||");
            return { song, artist, count };
        })
        .sort((a, b) => b.count - a.count);

    renderSummary(summary, "songArtist");
}

function renderVtuberSummary() {

    const songBase = state.originalData.filter(row =>
        row.song === state.selectedSong &&
        row.artist === state.selectedArtist
    );

    const map = new Map();

    songBase.forEach(row => {
        getVtuberArray(row).forEach(name => {
            map.set(name, (map.get(name) || 0) + 1);
        });
    });

    const summary = Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    renderSummary(summary, "vtuber");
}

function renderSummary(summary, type) {

    const area = document.getElementById("refineArea");
    const label = document.getElementById("refineLabel");

    label.innerText =
        type === "songArtist"
            ? "▼ 曲でさらに絞り込む:"
            : "▼ メンバーでさらに絞り込む:";

    summary.forEach(item => {

        const btn = document.createElement("button");
        btn.className = "refine-btn";

        if (type === "songArtist") {
            btn.innerText =
                `${item.song} (${item.artist}) : ${item.count}件`;

            btn.onclick = () =>
                refineBySongArtist(
                    item.song,
                    item.artist
                );

        } else {
            btn.innerText =
                `${item.name} : ${item.count}件`;

            btn.onclick = () =>
                refineByVtuber(item.name);

            btn.classList.add(
                getVtuberClass(item.name)
            );

            if (item.name === state.selectedVtuber) {
                btn.classList.add("active-refine");
            }
        }

        area.appendChild(btn);
    });
}