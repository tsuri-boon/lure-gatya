let makersData = {};
let filteredMakers = [];

fetch('data/lure_data_7.json')
  .then(response => response.json())
  .then(data => {
    makersData = data;
    filteredMakers = data.filter(maker => maker.lures && maker.lures.length > 0);
    createSlotItems();
  });

const genreSelect = document.getElementById("genre");
genreSelect.addEventListener("change", function() {
  const selectedGenre = this.value;
  if (selectedGenre === "") {
    filteredMakers = makersData.filter(maker => maker.lures && maker.lures.length > 0);
  } else {
    filteredMakers = makersData.filter(maker =>
      maker.lures && maker.lures.some(lure => Array.isArray(lure.genre) && lure.genre.includes(selectedGenre))
    );
  }
  createSlotItems();
});

const slot = document.getElementById("slot");
const spinBtn = document.getElementById("spin");
const result = document.getElementById("result");

const slotHeight = 100;
const containerHeight = 100;
const duration = 4000;
let spinning = false;

const saved = sessionStorage.getItem("selectedLure");
if (saved) {
  const { selected, lure } = JSON.parse(saved);
  result.innerHTML = `
    <div> メーカー：${selected.maker} </div>
    <div><a href="${selected.url}" target="_blank">${selected.url}</a></div>
    <div style="margin-top: 20px;"></div>
    <div> おすすめルアー：${lure.name}</div>
    <div style="margin-top: 10px;">
    <img src="${lure.image}" alt="${lure.name}" style="width:400px;">
    </div>
    <div style="margin-top: 10px;">${lure.link}</div>
  `;
}

let fullList = [];
function shuffle(array) {
  const newArr = [...array];
  for(let i=newArr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function createSlotItems() {
  slot.innerHTML = "";
  fullList = [];
  for(let i=0; i<10; i++) {
    const shuffled = shuffle(filteredMakers);
    fullList.push(...shuffled);
  }
  fullList.forEach(name => {
    const div = document.createElement("div");
    div.className = "slot-item";
    div.textContent = name.maker;
    slot.appendChild(div);
  });
}

// 抽選中メッセージの配列
const spinMessages = [
  "何が出るかな..？",
  "レアルアーが来るかも！？",
  "好きなメーカーがでそう！",
  "抽選中..."
];

// ランダム取得関数
function getRandomMessage() {
  const index = Math.floor(Math.random() * spinMessages.length);
  return spinMessages[index];
}

spinBtn.addEventListener("click", () => {
  if(spinning) return;
  if(filteredMakers.length === 0) {
    result.textContent = "調整中";
    return;
  }
  spinning = true;
  // ランダムメッセージを表示
  result.textContent = getRandomMessage();
  spinBtn.disabled = true;

  slot.style.transition = "none";
  slot.style.transform = "translateY(0)";

  setTimeout(() => {
    createSlotItems();

    const baseRound = filteredMakers.length * 5;
    const randomIndex = Math.floor(Math.random() * filteredMakers.length);
    const visibleIndex = baseRound + randomIndex;
    const offset = visibleIndex * slotHeight - (containerHeight / 2) + (slotHeight / 2);

    slot.style.transition = `transform ${duration}ms cubic-bezier(0.22,1,0.36,1)`;
    slot.style.transform = `translateY(-${offset}px)`;

    setTimeout(() => {
      spinning = false;
      spinBtn.disabled = false;
      const selected = fullList[visibleIndex];
      const selectedGenre = genreSelect.value;
      const lures = (selected.lures || []).filter(lure =>
        Array.isArray(lure.genre) && lure.genre.includes(selectedGenre)
      );
      const randomLure = lures.length > 0 ? lures[Math.floor(Math.random() * lures.length)] : null;

      confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0.25, y: 0.6 } });
      confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 0.75, y: 0.6 } });

      if (randomLure) {
        const makerName = selected.maker;
        const makerNameJap = selected.maker_jap ? `（${selected.maker_jap}）` : "";
        result.innerHTML = `<h2>${makerName}${makerNameJap}</h2>`;
        result.innerHTML += `
         <div><a href="${selected.url}" target="_blank">${selected.url}</a></div>
          <div class="lure-image" style="margin-top:10px; max-width:400px; height:auto;　display: block; margin: 0 auto;">
          ${randomLure.image}  
          </div>
          <div>
          <p>ルアー名: ${randomLure.name}</p>
          <p>種類： ${randomLure.type}</p>
          </div>
          <div style="margin-top: 10px;">${selected.link}</div>
        `;
      } else {
        result.innerHTML = `
          <div>メーカー：${selected.maker}</div>
          <div><a href="${selected.url}" target="_blank">${selected.url}</a></div>
          <div style="margin-top: 20px;">おすすめルアー情報はありません</div>
          <div style="margin-top: 10px;">${selected.link}</div>
        `;
      }

    }, duration + 100);
  }, 50);
});
