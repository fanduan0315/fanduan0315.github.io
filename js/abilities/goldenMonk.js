/**
 * 金刚僧能力模块
 *
 * 角色信息：
 * - 阵营：普通阵营
 * - 能力：在第一至第四轮任选一轮施展「不动明王咒」，令指定房间成为“圣域”，阻挡易容术士移动、骨哨虫王强制偷吃，以及对房内特殊身份的缄默封印（荔枝瘾能力次数会被浪费）
 * - 使用上限：整局 1 次（模块 0 可自定义），可选择保留到后续轮次；已施展后能力阶段会自动跳过
 * - 行动顺序：0.6（位于沐恩天使之后、缄默之前）
 *
 * 模块要点：
 * - showGoldenMonkAbility(): 负责展示不同状态的口播（正常 / 被封印 / 已耗尽）并驱动圣域选择 UI
 * - applyGoldenMonkSanctuary(): 记录圣域、广播结果、并在需要时统计被阻挡的能力类型
 * - removeGoldenMonkSanctuary(): 用于返回修改或缄默封印时移除或标记圣域（含“被缄默驱散”状态）
 * - renderGoldenMonkSanctuaryAnnouncement(): 在结果卡与复盘中展示圣域横幅与阻挡信息
 *
 * 沐恩祝福强化：
 * - 若金刚僧被沐恩天使祝福，圣域在结算公告时会额外列出被抵御的能力类型，并在复盘中显示详细列表。
 */

const GOLDEN_SANCTUARY_ALLOWED_MODULES = ["module1", "module2", "module3", "module4"];
const GOLDEN_MONK_SELECTED_CLASSES = [
  "border-primary",
  "bg-primary/10",
  "ring-2",
  "ring-primary/60",
  "shadow-lg",
  "scale-105",
];

function ensureGoldenMonkStore() {
  if (!gameData.goldenMonkSanctuary || typeof gameData.goldenMonkSanctuary !== "object") {
    gameData.goldenMonkSanctuary = {};
  }
  return gameData.goldenMonkSanctuary;
}

function getGoldenMonkSanctuary(module) {
  if (!module) return null;
  const store = ensureGoldenMonkStore();
  return store[module] || null;
}

function removeGoldenMonkSanctuary(module, options = {}) {
  const store = ensureGoldenMonkStore();
  if (!module) {
    Object.keys(store).forEach((key) => delete store[key]);
    return;
  }
  const record = store[module];
  if (!record) return;

  const abilityRecord = gameData?.abilityResults?.[module]?.goldenMonk;

  if (options.dispelledBy === "silentWhisper") {
    record.active = false;
    record.dispelledBy = "silentWhisper";
    if (abilityRecord) {
      abilityRecord.dispelledBy = "silentWhisper";
      abilityRecord.active = false;
    } else if (gameData?.abilityResults) {
      if (!gameData.abilityResults[module]) gameData.abilityResults[module] = {};
      gameData.abilityResults[module].goldenMonk = {
        roomProp: record.roomProp,
        roomLabel: record.roomLabel,
        muEnBlessed: record.muEnBlessed,
        blockedTypes: Array.isArray(record.blockedTypes) ? [...record.blockedTypes] : [],
        dispelledBy: "silentWhisper",
        active: false,
      };
    }
  } else {
    delete store[module];
    if (abilityRecord) {
      delete gameData.abilityResults[module].goldenMonk;
    }
  }

  const announcement = document.querySelector(`[data-sanctuary-announcement="${module}"]`);
  if (announcement && announcement.parentNode) {
    announcement.parentNode.removeChild(announcement);
  }
}

function applyGoldenMonkSanctuary(module, roomProp, roomLabel, muEnBlessed) {
  const store = ensureGoldenMonkStore();
  store[module] = {
    module,
    roomProp,
    roomLabel,
    muEnBlessed: !!muEnBlessed,
    active: true,
    blockedTypes: [],
  };

  if (!gameData.abilityResults) gameData.abilityResults = {};
  if (!gameData.abilityResults[module]) gameData.abilityResults[module] = {};
  gameData.abilityResults[module].goldenMonk = {
    roomProp,
    roomLabel,
    muEnBlessed: !!muEnBlessed,
    blockedTypes: [],
  };
}

function recordGoldenMonkBlock(module, abilityTypeLabel) {
  if (!module || !abilityTypeLabel) return;
  const store = ensureGoldenMonkStore();
  const record = store[module];
  if (!record) return;
  if (!Array.isArray(record.blockedTypes)) {
    record.blockedTypes = [];
  }
  if (!record.blockedTypes.includes(abilityTypeLabel)) {
    record.blockedTypes.push(abilityTypeLabel);
  }

  const abilityResult = gameData?.abilityResults?.[module]?.goldenMonk;
  if (abilityResult) {
    if (!Array.isArray(abilityResult.blockedTypes)) {
      abilityResult.blockedTypes = [];
    }
    if (!abilityResult.blockedTypes.includes(abilityTypeLabel)) {
      abilityResult.blockedTypes.push(abilityTypeLabel);
    }
  }
}

function getRealMembersForRoom(module, roomProp) {
  if (!module || !roomProp || !gameData) return [];
  if (module === "module4") {
    return [...(gameData.module4?.[roomProp]?.realMembers || [])];
  }
  if (!gameData[module]) return [];
  return [...(gameData[module][roomProp]?.realMembers || [])];
}

function isRoomSanctuaryProtected(module, roomProp) {
  const record = getGoldenMonkSanctuary(module);
  return !!(record && record.active && record.roomProp === roomProp);
}

function isPlayerProtectedBySanctuary(module, playerId) {
  if (!playerId) return false;
  const record = getGoldenMonkSanctuary(module);
  if (!record || !record.active) return false;
  const members = getRealMembersForRoom(module, record.roomProp);
  return members.includes(playerId);
}

function showGoldenMonkAbility(module) {
  if (gameData) gameData.currentAbilityRoleKey = "goldenMonk";
  const monk = gameData.players.find((p) => p.specialRole === "goldenMonk");
  logAbilityAction("goldenMonk", "show", { module, assigned: !!monk });

  if (!monk) {
    logAbilityAction("goldenMonk", "skip-no-role", { module });
    proceedNextAbilityOrResult(module);
    return;
  }

  if (!GOLDEN_SANCTUARY_ALLOWED_MODULES.includes(module)) {
    logAbilityAction("goldenMonk", "skip-no-role", { module, reason: "module-not-allowed" });
    proceedNextAbilityOrResult(module);
    return;
  }

  if (typeof hideAllAbilitySections === "function") hideAllAbilitySections();
  if (typeof renderAbilityContextInfo === "function") {
    renderAbilityContextInfo(module);
  }

  const abilityContainer = createAbilityContainer("golden-monk-ability");
  const { usedTimes, maxUses, isExhausted } = getAbilityUsageStats(monk, "goldenMonk");

  updateAbilityUserInfo(
    "金刚僧",
    monk.name,
    `使用次数：${usedTimes}/${maxUses}${isExhausted ? "（已耗尽）" : ""}`,
    isExhausted
      ? "不动明王咒本局已施展，圣域只可建立一次"
      : "你可以在本轮秘密选定一个房间，令其成为“圣域”"
  );
  renderMuEnAngelBlessingHint(monk);

  if (isExhausted) {
    logAbilityAction("goldenMonk", "skip-exhausted", { module });
    if (typeof showNotification === "function") {
      showNotification("金刚僧本局的圣域已施展，自动跳过此能力阶段。");
    }
    proceedNextAbilityOrResult(module);
    return;
  }

  const narration = rememberAbilityNarration(
    "金刚僧，请睁眼。请问你要在本轮加持一处房间，使其成为圣域吗？如果要施展能力，请选择一个房间。行动结束请闭眼。",
    "汝可持杵布坛，使一室成圣域而百邪莫侵。"
  );

  if (monk.abilitySealed) {
    abilityContainer.innerHTML = `
      ${narration}
      <div class="mt-4 bg-white/90 border border-primary/20 rounded-xl p-4 text-center space-y-4">
        <p class="text-gray-700 text-base leading-relaxed">
          ${monk.name} 的能力已被缄默封印，本轮无法建立圣域。
        </p>
        <button
          id="golden-monk-sealed-skip"
          class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover"
        >
          明白
        </button>
      </div>
    `;
    const sealedBtn = abilityContainer.querySelector("#golden-monk-sealed-skip");
    if (sealedBtn) {
      sealedBtn.replaceWith(sealedBtn.cloneNode(true));
      abilityContainer
        .querySelector("#golden-monk-sealed-skip")
        .addEventListener("click", () => {
          abilityContainer.classList.add("hidden");
          skipAbilityUse("sealed");
        });
    }
    const abilityResult = document.getElementById("ability-result");
    if (abilityResult) abilityResult.classList.add("hidden");
    const modalEl = document.getElementById("ability-modal");
    if (modalEl) modalEl.classList.remove("hidden");
    gameData.currentAbilityModule = module;
    return;
  }

  const roomOptions = getRoomOptions(module);
  abilityContainer.innerHTML = `
    ${narration}
    <div class="mt-4 space-y-4">
      <p class="text-sm text-gray-600">请选择要加持的房间。</p>
      <div id="golden-room-grid" class="grid grid-cols-2 md:grid-cols-${module === "module4" ? "3" : "2"} gap-3"></div>
      <div class="flex flex-wrap justify-center gap-3">
        <button id="golden-monk-use" class="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-md scale-hover" disabled>施展不动明王咒</button>
        <button id="golden-monk-delay" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover">暂不施展</button>
      </div>
    </div>
  `;

  const grid = abilityContainer.querySelector("#golden-room-grid");
  const useBtn = abilityContainer.querySelector("#golden-monk-use");
  const delayBtn = abilityContainer.querySelector("#golden-monk-delay");

  roomOptions.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className =
      "px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-primary bg-white text-center transition-all";
    btn.dataset.roomProp = opt.key;
    btn.innerHTML = `
      <div class="font-semibold text-primary">${opt.label}</div>
      <p class="text-xs text-gray-500 mt-1">一旦选择即刻加持</p>
    `;
    btn.addEventListener("click", () => {
      grid.querySelectorAll("button").forEach((b) => {
        b.classList.remove(
          "border-primary",
          "bg-primary/10",
          "ring-2",
          "ring-primary/60",
          "shadow-lg",
          "scale-105"
        );
        b.classList.add("border-gray-200");
      });
      btn.classList.remove("border-gray-200");
      GOLDEN_MONK_SELECTED_CLASSES.forEach((cls) => btn.classList.add(cls));
      gameData.currentAbilitySelection = opt.key;
      useBtn.disabled = false;
      logAbilityAction("goldenMonk", "target-selected", {
        module,
        roomProp: opt.key,
        roomLabel: opt.label,
      });
    });
    grid.appendChild(btn);
  });

  useBtn.addEventListener("click", () => executeGoldenMonkAbility(module));
  delayBtn.addEventListener("click", () => {
    const abilityPane = document.getElementById("golden-monk-ability");
    if (abilityPane) abilityPane.classList.add("hidden");
    skipAbilityUse("delayed");
  });

  document.getElementById("ability-modal").classList.remove("hidden");
  gameData.currentAbilityModule = module;
}

function executeGoldenMonkAbility(module) {
  if (!lockAbilityAction()) return;
  const monk = gameData.players.find((p) => p.specialRole === "goldenMonk");
  const roomProp = gameData.currentAbilitySelection;
  if (!monk || !roomProp) {
    unlockAbilityAction();
    return;
  }
  const roomLabel = getRoomLabel(module, roomProp);
  const muEnBlessed = isMuEnAngelBlessed(monk);

  if (typeof monk.abilityUses !== "number") monk.abilityUses = 0;
  monk.abilityUses += 1;
  const { maxUses } = getAbilityUsageStats(monk, "goldenMonk");
  monk.abilityUsed = monk.abilityUses >= maxUses;
  if (!monk.abilityUsage) monk.abilityUsage = {};
  monk.abilityUsage[module] = true;

  applyGoldenMonkSanctuary(module, roomProp, roomLabel, muEnBlessed);

  logAbilityAction("goldenMonk", "execute", {
    module,
    roomProp,
    roomLabel,
    muEnBlessed,
  });

  updateAbilityUserInfo(
    "金刚僧",
    monk.name,
    `使用次数：${monk.abilityUses}/${maxUses}（已耗尽）`,
    "本局圣域已施展完毕"
  );
  renderMuEnAngelBlessingHint(monk);

  const resultEl = document.getElementById("ability-result-text");
  if (resultEl) {
    resultEl.innerHTML = `
      <div class="text-lg font-bold text-primary mb-2">${monk.name} 默念不动明王咒，${roomLabel} 被金光庇护。</div>
      <p class="text-sm text-gray-700">该房间本轮免疫易容术士移动、骨哨虫王强制偷吃、缄默封印。</p>
    `;
  }
  document.getElementById("ability-result").classList.remove("hidden");
  updateAbilityResultNarration();
  rebindConfirmButton();

  const abilityContainer = document.getElementById("golden-monk-ability");
  if (abilityContainer) abilityContainer.classList.add("hidden");

  gameData.currentAbilitySelection = null;
  unlockAbilityAction();
}

function renderGoldenMonkSanctuaryAnnouncement(module) {
  const record = getGoldenMonkSanctuary(module);
  const resultContainerId =
    module === "module1"
      ? "result-1"
      : module === "module2"
      ? "result-2"
      : module === "module3"
      ? "result-3"
      : module === "module4"
      ? "result-4"
      : null;
  if (!resultContainerId) return;
  const resultContainer = document.getElementById(resultContainerId);
  if (!resultContainer) return;

  let banner = resultContainer.querySelector(`[data-sanctuary-announcement="${module}"]`);
  if (!record || !record.active) {
    if (banner) banner.remove();
    return;
  }

  if (!banner) {
    banner = document.createElement("div");
    banner.dataset.sanctuaryAnnouncement = module;
    banner.className =
      "mt-4 mb-4 border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-white to-amber-50 rounded-xl p-4 shadow-inner";
    const referenceNode = resultContainer.querySelector(".grid") || resultContainer.firstChild;
    if (referenceNode && referenceNode.parentNode) {
      referenceNode.parentNode.insertBefore(banner, referenceNode);
    } else {
      resultContainer.appendChild(banner);
    }
  }

  let message = `「${record.roomLabel}」受佛法加持，万法不侵。`;
  if (record.muEnBlessed) {
    if (Array.isArray(record.blockedTypes) && record.blockedTypes.length > 0) {
      const list = record.blockedTypes.map((t) => `【${t}】`).join("、");
      message = `圣域威严肃穆，曾抵御邪祟侵扰，其力源于：${list}。`;
    } else {
      message = "圣域威严肃穆，然未见邪祟侵犯。";
    }
  }

  banner.innerHTML = `
    <div class="flex items-start gap-3 text-sm text-amber-900">
      <i class="fa fa-chess-rook text-amber-600 text-xl"></i>
      <div>
        <p class="font-semibold text-base text-amber-800 mb-1">金刚圣域揭示</p>
        <p>${message}</p>
      </div>
    </div>
  `;
}

