/**
 * 身份确认模块（module0）
 *
 * 本模块负责游戏开始前的身份配置，包括：
 * - 玩家身份分配（普通/荔枝瘾/中立）
 * - 特殊角色分配
 * - 能力使用次数配置
 * - 身份展示控制
 *
 * 函数分类：
 *
 * 【初始化与渲染】
 * - initModule0(): 初始化身份确认模块
 * - renderModule0Players(): 渲染身份确认界面使者列表
 * - updateNarrativeTexts(): 按当前人数更新公告与规则说明
 * - getIdentityText(player): 获取玩家身份文本（用于显示）
 *
 * 【能力配置】
 * - ensureAbilityLimits(): 确保能力次数配置存在
 * - syncAbilityLimitInputs(): 同步特殊能力次数输入
 *
 * 【特殊角色操作】
 * - assignAllSpecialRoles(): 一键加入所有特殊身份
 *
 * 【身份展示控制】
 * - toggleRevealAllIdentities(): 一键展示/隐藏所有身份
 * - updateRevealAllButton(): 根据当前状态刷新一键身份按钮文案
 *
 * 【事件处理】
 * - setupModule0EventListeners(): 设置模块0事件监听器
 */

const abilityLimitFieldConfigs = [
  { id: "ability-limit-muEnAngel", key: "muEnAngel", label: "沐恩天使" },
  { id: "ability-limit-goldenMonk", key: "goldenMonk", label: "金刚僧" },
  { id: "ability-limit-medicineShaman", key: "medicineShaman", label: "胡庭药巫" },
  { id: "ability-limit-disguiseMaster", key: "disguiseMaster", label: "易容术士" },
  { id: "ability-limit-songMessenger", key: "songMessenger", label: "牧歌传讯者" },
  { id: "ability-limit-boneWhistleKing", key: "boneWhistleKing", label: "骨哨虫王" },
  { id: "ability-limit-silentWhisper", key: "silentWhisper", label: "缄默" },
];
const specialRoleTypes = ["muEnAngel", "goldenMonk", "medicineShaman", "disguiseMaster", "songMessenger", "boneWhistleKing", "silentWhisper", "hanBaLang"];
const defaultAbilityLimits = {
  muEnAngel: 1,
  goldenMonk: 1,
  medicineShaman: 4,
  disguiseMaster: 2,
  songMessenger: 4,
  boneWhistleKing: 1,
  silentWhisper: 0,
  hanBaLang: Infinity,
};

function ensureAbilityLimits() {
  if (!gameData.abilityLimits) {
    gameData.abilityLimits = { ...defaultAbilityLimits };
  } else {
    abilityLimitFieldConfigs.forEach(({ key }) => {
      if (typeof gameData.abilityLimits[key] !== "number") {
        gameData.abilityLimits[key] = defaultAbilityLimits[key];
      }
    });
    // 憨巴郎与沐恩天使的上限为常量（Infinity / 1），确保存在但不可通过输入框修改
    if (typeof gameData.abilityLimits.hanBaLang !== "number") {
      gameData.abilityLimits.hanBaLang = defaultAbilityLimits.hanBaLang;
    }
    if (typeof gameData.abilityLimits.muEnAngel !== "number") {
      gameData.abilityLimits.muEnAngel = defaultAbilityLimits.muEnAngel;
    }
  }
  return gameData.abilityLimits;
}

function syncAbilityLimitInputs() {
  const limits = ensureAbilityLimits();
  abilityLimitFieldConfigs.forEach(({ id, key }) => {
    const input = document.getElementById(id);
    if (input && typeof limits[key] !== "undefined") {
      input.value = limits[key];
    }
  });
}


// 初始化模块0：同步人数配置并渲染身份确认界面
function initModule0() {
  if (!gameData.composition) {
    gameData.composition = { ordinary: 6, addict: 3, neutral: 1 };
  }
  const { ordinary, addict, neutral } = gameData.composition;
  const expectedTotal = ordinary + addict + neutral;

  if (getTotalPlayers() !== expectedTotal) {
    applyPlayerComposition(ordinary, addict, neutral, { silent: true });
  } else {
    gameData.players.forEach((player) => {
      if (typeof player.isNeutral === "undefined") {
        player.isNeutral = false;
      }
    });
  }

  renderModule0Players();

  const ordinaryInput = document.getElementById("count-ordinary");
  const addictInput = document.getElementById("count-addict");
  const neutralInput = document.getElementById("count-neutral");
  if (ordinaryInput) ordinaryInput.value = ordinary;
  if (addictInput) addictInput.value = addict;
  if (neutralInput) neutralInput.value = neutral;
  syncAbilityLimitInputs();

  updateSpecialRoleButtons();
  setupModule0EventListeners();
}


function getIdentityText(player) {
  let identityText = "";
  if (player.isLycheeAddict) {
    const addictNames = gameData.lycheeAddicts
      .map((id) => gameData.players.find((p) => p.id === id)?.name || `使者${id}`)
      .join("、");
    identityText = `荔枝瘾阵营：${addictNames}`;
  } else if (player.isNeutral) {
    identityText = "中立阵营";
  } else {
    identityText = "普通成员阵营";
  }

  if (player.specialRole) {
    const roleConfig = gameData.specialRoles.roleConfig[player.specialRole];
    if (roleConfig) {
      identityText += `，你的特殊身份为(${roleConfig.name})`;
    }
  }
  return identityText;
}

/**
 * 根据当前人数配置更新身份确认页面及规则说明中的动态文案。
 */
function updateNarrativeTexts() {
  const total = getTotalPlayers();
  const comp = gameData.composition || {};
  const configuredAddict = typeof comp.addict === "number" ? comp.addict : null;
  const configuredNeutral = typeof comp.neutral === "number" ? comp.neutral : null;
  const configuredOrdinary = typeof comp.ordinary === "number" ? comp.ordinary : null;

  const addict = configuredAddict ?? Math.max(gameData.lycheeAddicts ? gameData.lycheeAddicts.length : 0, 1);
  const neutral = configuredNeutral ?? (gameData.neutralPlayers ? gameData.neutralPlayers.length : 0);
  const ordinary = configuredOrdinary ?? Math.max(total - addict - neutral, 0);
  const { small, large } = getRoomLimits(total);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("communique-total-span", total);
  setText("communique-total-span-2", total);
  setText("communique-addict-span", addict);
  setText("communique-addict-span-2", addict);

  setText("help-story-total-span", total);
  setText("help-story-total-span-2", total);
  setText("help-story-addict-span", addict);

  setText("help-total-count", total);
  setText("help-addict-count", addict);
  setText("help-ordinary-count", ordinary);
  setText("help-neutral-count", neutral);

  setText("help-votes-per-person", addict);
  setText("help-votes-target-count", addict);
  setText("help-victory-threshold", addict);

  const neutralItem = document.getElementById("help-neutral-item");
  if (neutralItem) {
    neutralItem.style.display = neutral > 0 ? "list-item" : "none";
  }

  setText("help-large-limit", large);
  setText("help-small-limit", small);
  setText("help-large-limit-2", large);
  setText("help-small-limit-2", small);
  setText("help-large-limit-3", large);
  setText("help-small-limit-3", small);

  // 更新能力次数上限显示
  const limits = ensureAbilityLimits();
  setText("help-ability-limit-goldenMonk", limits.goldenMonk);
  setText("help-ability-limit-medicineShaman", limits.medicineShaman);
  setText("help-ability-limit-disguiseMaster", limits.disguiseMaster);
  setText("help-ability-limit-songMessenger", limits.songMessenger);
  setText("help-ability-limit-boneWhistleKing", limits.boneWhistleKing);
  setText("help-ability-limit-silentWhisper", "随偷吃次数增加");
  setText("identity-ability-limit-goldenMonk", limits.goldenMonk);
  setText("identity-ability-limit-medicineShaman", limits.medicineShaman);
  setText("identity-ability-limit-disguiseMaster", limits.disguiseMaster);
  setText("identity-ability-limit-songMessenger", limits.songMessenger);
  setText("identity-ability-limit-boneWhistleKing", limits.boneWhistleKing);
  setText("identity-ability-limit-silentWhisper", "随偷吃次数增加");
}


/**
 * 渲染身份确认界面中的玩家卡片，并绑定姓名/身份切换行为。
 */
function renderModule0Players() {
  const playersContainer = document.getElementById("player-card-grid");
  if (!playersContainer) return;
  playersContainer.innerHTML = "";

  gameData.players.forEach((player, index) => {
    const numeral = chineseNumbers[index] || player.id;
    const playerBox = document.createElement("div");
    playerBox.className =
      "bg-white border-2 border-gray-300 rounded-lg p-3 text-center scale-hover";
    playerBox.dataset.playerId = player.id;

    const revealed = Boolean(player.revealed);
    const identityText = revealed ? getIdentityText(player) : "";
  const identityClass = player.isLycheeAddict
    ? "text-primary"
    : player.isNeutral
    ? "text-amber-500 font-semibold"
    : "text-dark";

    playerBox.innerHTML = `
      <div class="font-bold mb-2">${player.name || `使者${numeral}`}</div>
      <input
        type="text"
        placeholder="输入姓名"
        class="player-name-input w-full text-center border rounded py-1 mb-2"
        data-player-id="${player.id}"
        value="${player.name || ""}"
        maxlength="10"
      >
      <button class="toggle-identity text-sm text-gray-600 hover:text-primary">
        ${revealed ? "隐藏身份" : "查看身份"}
      </button>
      <div class="identity ${revealed ? "" : "hidden"} mt-2 text-sm font-medium ${identityClass}">
        ${identityText}
      </div>
    `;

    playersContainer.appendChild(playerBox);
  });

  playersContainer.querySelectorAll(".toggle-identity").forEach((button) => {
    button.addEventListener("click", (e) => {
      const box = e.target.closest("[data-player-id]");
      if (!box) return;
      const playerId = parseInt(box.dataset.playerId, 10);
      const player = gameData.players.find((p) => p.id === playerId);
      const identityDiv = box.querySelector(".identity");
      if (!player || !identityDiv) return;

      player.revealed = !player.revealed;
      if (player.revealed) {
        identityDiv.textContent = getIdentityText(player);
        const identityClass = player.isLycheeAddict
          ? "text-primary"
          : player.isNeutral
          ? "text-accent"
          : "text-dark";
        identityDiv.className = `identity mt-2 text-sm font-medium ${identityClass}`;
        identityDiv.classList.remove("hidden");
        button.textContent = "隐藏身份";
      } else {
        identityDiv.textContent = "";
        identityDiv.className = "identity hidden mt-2 text-sm font-medium";
        button.textContent = "查看身份";
      }
    });
  });

  playersContainer.querySelectorAll(".player-name-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      // 实时限制输入长度
      if (e.target.value.length > 10) {
        e.target.value = e.target.value.slice(0, 10);
      }
    });
    input.addEventListener("change", (e) => {
      const playerId = parseInt(e.target.dataset.playerId, 10);
      const player = gameData.players.find((p) => p.id === playerId);
      if (!player) return;
      let newName = e.target.value.trim();
      // 确保不超过10个字符
      if (newName.length > 10) {
        newName = newName.slice(0, 10);
        e.target.value = newName;
      }
      const displayName = newName || `使者${chineseNumbers[playerId - 1] || playerId}`;
      player.name = displayName;
      e.target.value = displayName;
      const nameLabel = e.target.closest(".bg-white")?.querySelector(".font-bold");
      if (nameLabel) {
        nameLabel.textContent = displayName;
      }
    });
  });

  updateNarrativeTexts();
  updateRevealAllButton();
}

function assignAllSpecialRoles() {
  if (!specialRoleTypes || !gameData?.specialRoles) return;
  const assignedValues = Object.values(gameData.specialRoles.assignedRoles || {});
  specialRoleTypes.forEach((roleType) => {
    if (!assignedValues.includes(roleType)) {
      assignSpecialRole(roleType);
    }
  });
}

function toggleRevealAllIdentities() {
  if (!gameData || !Array.isArray(gameData.players)) return;
  const shouldRevealAll = !gameData.allIdentitiesRevealed;
  gameData.allIdentitiesRevealed = shouldRevealAll;
  gameData.players.forEach((player) => {
    player.revealed = shouldRevealAll;
  });
  renderModule0Players();
  updateRevealAllButton();
}

function updateRevealAllButton() {
  const toggleBtn = document.getElementById("toggle-all-identities");
  if (!toggleBtn) return;
  const shouldRevealAll = Boolean(gameData?.allIdentitiesRevealed);
  toggleBtn.textContent = shouldRevealAll ? "一键隐藏所有身份（仅供调试使用）" : "一键展示所有身份（仅供调试使用）";
}


/**
 * 设置模块0事件监听器（人数配置、特殊身份分配、开始游戏）。
 */
function setupModule0EventListeners() {
  const startBtn = document.getElementById("start-game");
  if (startBtn) {
    // 移除旧的事件监听器（如果存在）
    const newStartBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newStartBtn, startBtn);
    // 重新绑定事件
    document.getElementById("start-game").addEventListener("click", () => {
      console.log("开始审查按钮被点击");
      if (typeof startGame === "function") {
        startGame();
      } else {
        console.error("startGame 函数未定义");
      }
    });
  } else {
    console.error("未找到 start-game 按钮");
  }

  document.querySelectorAll(".special-role-btn").forEach((button) => {
    if (!button.dataset.bound) {
      button.addEventListener("click", (e) => {
        const roleType = e.currentTarget.dataset.role;
        assignSpecialRole(roleType);
      });
      button.dataset.bound = "true";
    }
  });

  const applyBtn = document.getElementById("apply-composition");
  if (applyBtn && !applyBtn.dataset.bound) {
    applyBtn.addEventListener("click", () => {
      const ordinaryInput = document.getElementById("count-ordinary");
      const addictInput = document.getElementById("count-addict");
      const neutralInput = document.getElementById("count-neutral");

      const ordinary = parseInt(ordinaryInput?.value, 10) || 0;
      const addict = parseInt(addictInput?.value, 10) || 0;
      const neutral = parseInt(neutralInput?.value, 10) || 0;

      const abilityLimitsPayload = {};
      let abilityLimitError = null;
      abilityLimitFieldConfigs.forEach(({ id, key, label }) => {
        const inputEl = document.getElementById(id);
        const rawValue = parseInt(inputEl?.value ?? "", 10);
        if (Number.isNaN(rawValue) || rawValue < 0 || rawValue > 9) {
          abilityLimitError = `${label} 的使用次数需为 0-9 之间的整数`;
          return;
        }
        abilityLimitsPayload[key] = rawValue;
      });

      if (abilityLimitError) {
        showNotification(abilityLimitError);
        return;
      }

      const limits = ensureAbilityLimits();
      Object.assign(limits, abilityLimitsPayload);
      syncAbilityLimitInputs();

      if (applyPlayerComposition(ordinary, addict, neutral)) {
        resetModulesForNewComposition();
        renderModule0Players();
        updateSpecialRoleButtons();
        const totals = gameData.composition;
        if (ordinaryInput) ordinaryInput.value = totals.ordinary;
        if (addictInput) addictInput.value = totals.addict;
        if (neutralInput) neutralInput.value = totals.neutral;
        syncAbilityLimitInputs();
        updateNarrativeTexts();
      }
    });
    applyBtn.dataset.bound = "true";
  }

  const assignAllBtn = document.getElementById("assign-all-special-roles");
  if (assignAllBtn && !assignAllBtn.dataset.bound) {
    assignAllBtn.addEventListener("click", assignAllSpecialRoles);
    assignAllBtn.dataset.bound = "true";
  }

  const toggleIdentitiesBtn = document.getElementById("toggle-all-identities");
  if (toggleIdentitiesBtn && !toggleIdentitiesBtn.dataset.bound) {
    toggleIdentitiesBtn.addEventListener("click", toggleRevealAllIdentities);
    toggleIdentitiesBtn.dataset.bound = "true";
  }
}

