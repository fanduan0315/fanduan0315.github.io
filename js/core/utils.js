/**
 * 通用工具函数库
 *
 * 本文件包含游戏系统各模块共用的通用工具函数，按功能分类如下：
 *
 * 【UI控制】
 * - showNotification(message): 显示顶部临时通知
 * - hideAllModules(): 隐藏所有游戏模块
 * - showModule(moduleNumber): 显示指定游戏模块
 * - updateGameStatus(): 更新顶部游戏状态显示
 * - hideAllAbilitySections(): 隐藏能力模态内的所有能力区块
 *
 * 【游戏初始化与重置】
 * - startGame(): 开始游戏，分配特殊角色
 * - assignLycheeAddicts(): 随机分配荔枝瘾成员身份（已废弃，使用 applyPlayerComposition）
 * - applyPlayerComposition(ordinaryCount, addictCount, neutralCount, options): 应用人数构成，重置玩家列表并随机标注阵营
 * - resetModulesForNewComposition(): 重置各模块的房间配置与投票数据，适配最新人数设置
 * - resetGameCompletely(): 完全重置游戏状态
 *
 * 【玩家与身份管理】
 * - refreshPlayerIdentities(): 刷新所有玩家的身份显示
 * - getTotalPlayers(): 获取总人数
 * - getRoomLimits(totalPlayers): 根据当前总人数获取模块2/3的小房间与大房间人数限制
 *
 * 【模块流程控制】
 * - showArrestModal(module): 显示关押使者过渡界面
 * - confirmArrest(): 确认关押完毕，进入能力阶段
 * - restoreRealFromSurface(module): 恢复真实成员为表面成员（返回修改时使用）
 * - resetGuardsForModuleOnBack(module): "返回修改"时重置监管者状态
 *
 * 【轮次元数据管理】
 * - ensureRoundMeta(moduleKey): 确保轮次元数据存在
 * - getRandomPlayerId(): 获取随机玩家ID
 * - assignRoundCaptain(moduleKey, force): 分配轮次队长
 * - assignSelectionOrder(moduleKey, force): 分配选择顺序
 * - assignSettlementOrder(moduleKey, force): 分配结算顺序
 *
 * 【UI渲染辅助】
 * - renderRoundGuidance(moduleKey): 渲染轮次指引信息
 * - renderSettlementInfo(moduleKey, force): 渲染结算信息
 *
 * 【定时器管理】
 * - setupDiscussionTimer(moduleKey): 设置讨论阶段定时器
 * - setupSettlementTimer(moduleKey): 设置结算阶段定时器
 *
 * 【调试工具】
 * - debugGameState(): 在控制台输出游戏状态用于调试
 */

// 显示通知
function showNotification(message) {
  // 检查是否已有通知
  let notification = document.querySelector(".game-notification");
  if (notification) {
    notification.remove();
  }

  // 创建新通知
  notification = document.createElement("div");
  notification.className =
    "game-notification fixed bottom-4 right-4 bg-accent text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-y-10 opacity-0";
  notification.textContent = message;
  document.body.appendChild(notification);

  // 显示通知
  setTimeout(() => {
    notification.classList.remove("translate-y-10", "opacity-0");
  }, 10);

  // 3秒后隐藏
  setTimeout(() => {
    notification.classList.add("translate-y-10", "opacity-0");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}


// 隐藏所有模块
function hideAllModules() {
  document.querySelectorAll('section[id^="module-"]').forEach((section) => {
    section.classList.add("hidden");
  });
}


// 完整的显示模块函数
function showModule(moduleNumber) {
  console.log(`showModule 被调用，moduleNumber: ${moduleNumber}`);
  
  // 隐藏所有模块
  document.querySelectorAll('section[id^="module-"]').forEach((section) => {
    section.classList.add("hidden");
  });

  // 显示指定模块
  const targetModule = document.getElementById(`module-${moduleNumber}`);
  if (targetModule) {
  targetModule.classList.remove("hidden");
    console.log(`成功显示 module-${moduleNumber}`);
  } else {
    console.error(`未找到 module-${moduleNumber} 元素`);
  }

  // 更新游戏状态
  gameData.currentPhase = moduleNumber;
  updateGameStatus();
}


// 更新游戏状态显示
function updateGameStatus() {
  const phaseNames = [
    "基础设定",           // phase 0
    "第一轮审查",         // phase 1
    "第二轮审查",         // phase 2
    "第三轮审查",         // phase 3
    "第四轮审查",         // phase 4
    "最终投票",           // phase 5
    "游戏结果",           // phase 6
  ];

  const phaseName = phaseNames[gameData.currentPhase] || "未知阶段";
  const phaseEl = document.getElementById("current-phase");
  if (phaseEl) {
    phaseEl.textContent = phaseName;
  }
}

// 隐藏能力模态内的所有能力区块
function hideAllAbilitySections() {
  const ids = [
    'mu-en-angel-ability',
    'medicine-shaman-ability',
    'disguise-master-ability',
    'song-messenger-ability',
    'silent-whisper-ability',
    'lychee-addict-action',
    'bone-whistle-king-ability',
    'ability-result',
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}


// 调试函数：检查游戏状态
function debugGameState() {
  console.log("=== 游戏状态调试 ===");
  console.log(
    "所有玩家:",
    gameData.players.map((p) => ({
      id: p.id,
      name: p.name,
      isLycheeAddict: p.isLycheeAddict,
      specialRole: p.specialRole,
      abilityActivated: p.abilityActivated,
      abilityUsed: p.abilityUsed,
    }))
  );
  console.log("荔枝瘾成员:", gameData.lycheeAddicts);
  console.log("已分配特殊角色:", gameData.specialRoles.assignedRoles);

  const medicineShaman = gameData.players.find(
    (p) => p.specialRole === "medicineShaman"
  );
  console.log("胡庭药巫详情:", medicineShaman);
}


// 刷新所有使者的身份显示
function refreshPlayerIdentities() {
  document.querySelectorAll("[data-player-id]").forEach((box) => {
    const playerId = parseInt(box.dataset.playerId);
    const player = gameData.players.find((p) => p.id === playerId);
    const identityDiv = box.querySelector(".identity");

    // 检查 player 是否存在，避免访问 undefined 的属性
    if (!player) {
      console.warn(`未找到玩家 ID ${playerId} 的数据`);
      return;
    }

    if (player.revealed && identityDiv) {
      let identityText = "";
      if (player.isLycheeAddict) {
        // 如果是荔枝瘾成员，显示所有荔枝瘾同伴
        const addictNames = gameData.lycheeAddicts
          .map((id) => {
            const p = gameData.players.find((p) => p.id === id);
            return p ? p.name : `使者${id}`;
          })
          .join("、");
        identityText = `荔枝瘾阵营：${addictNames}`;
        // 如果有特殊角色，添加显示
        if (player.specialRole) {
          const roleConfig =
            gameData.specialRoles.roleConfig[player.specialRole];
          identityText += ` ，你的特殊身份为(${roleConfig.name})`;
        }
      } else {
        identityText = "普通成员阵营";
        // 如果有特殊角色，添加显示
        if (player.specialRole) {
          const roleConfig =
            gameData.specialRoles.roleConfig[player.specialRole];
          identityText += ` ，你的特殊身份为(${roleConfig.name})`;
        }
      }
      identityDiv.textContent = identityText;
      identityDiv.className = `identity mt-2 text-sm font-medium ${
        player.isLycheeAddict ? "text-primary" : "text-dark"
      }`;
    }
  });

  console.log("身份显示刷新完成");
}


// 分配荔枝瘾成员
function assignLycheeAddicts() {
  // 此函数已废弃，应使用 applyPlayerComposition 来分配身份
  // 保留此函数以避免调用错误，但实际不做任何操作
  // 因为身份分配现在由 applyPlayerComposition 处理
  if (!gameData.composition) {
    gameData.composition = { ordinary: 6, addict: 3, neutral: 1 };
  }
  const { ordinary, addict, neutral } = gameData.composition;
  applyPlayerComposition(ordinary, addict, neutral, { silent: true });
}


// 开始游戏
function startGame() {
  console.log("=== startGame 函数开始执行 ===");
  console.log("开始游戏，分配特殊角色...");

  // 分配特殊角色
  if (typeof assignSpecialRoles === "function") {
  assignSpecialRoles();
  } else {
    console.error("assignSpecialRoles 函数未定义");
    return;
  }

  // 调试：检查是否分配了胡庭药巫
  const medicineShaman = gameData.players.find(
    (player) => player.specialRole === "medicineShaman"
  );
  console.log("胡庭药巫分配情况:", medicineShaman);
  console.log(
    "所有玩家特殊角色:",
    gameData.players.map((p) => ({ name: p.name, role: p.specialRole }))
  );

  // 初始化第一轮审查（现在有配置页面）
  if (typeof initModule1 === "function") {
    console.log("调用 initModule1()");
    initModule1();
  } else {
    console.error("initModule1 函数未定义");
    return;
  }
  
  if (typeof showModule === "function") {
    console.log("调用 showModule(1)");
    showModule(1);
  } else {
    console.error("showModule 函数未定义");
  }
  
  console.log("=== startGame 函数执行完成 ===");
}

// 获取总人数
function getTotalPlayers() {
  return Array.isArray(gameData.players) ? gameData.players.length : 0;
}

/**
 * 根据当前总人数获取模块2/3的小房间与大房间人数限制。
 * @param {number} totalPlayers
 * @returns {{large: number, small: number}}
 */
function getRoomLimits(totalPlayers) {
  // 规则：10→7/3；9→6/3；8→5/3；7→4/3；6→3/3；5→3/2
  switch (totalPlayers) {
    case 10: return { large: 7, small: 3 };
    case 9: return { large: 6, small: 3 };
    case 8: return { large: 5, small: 3 };
    case 7: return { large: 4, small: 3 };
    case 6: return { large: 3, small: 3 };
    case 5: return { large: 3, small: 2 };
    default:
      // 回退：最小5人
      const large = Math.max(3, Math.min(7, totalPlayers - 3));
      const small = totalPlayers - large;
      return { large, small };
  }
}

/**
 * 应用人数构成，重置玩家列表并随机标注荔枝瘾与中立阵营。
 * @param {number} ordinaryCount
 * @param {number} addictCount
 * @param {number} neutralCount
 * @param {{silent?: boolean}} [options]
 * @returns {boolean}
 */
function applyPlayerComposition(ordinaryCount, addictCount, neutralCount, options = {}) {
  const total = ordinaryCount + addictCount + neutralCount;
  const silent = options.silent === true;

  // 校验
  if (ordinaryCount < addictCount) {
    showNotification("普通阵营人数不能小于荔枝瘾人数");
    return false;
  }
  if (addictCount <= 0) {
    showNotification("荔枝瘾阵营人数必须大于0");
    return false;
  }
  if (total < 5 || total > 10) {
    showNotification("总人数需在 5 到 10 之间");
    return false;
  }

  // 重置基础数据
  // 当 total 比当前玩家数小时，先截断数组以避免访问undefined
  if (Array.isArray(gameData.players) && gameData.players.length > total) {
    gameData.players = gameData.players.slice(0, total);
  } else {
    gameData.players = [];
  }

  gameData.specialRoles.assignedRoles = {};
  gameData.lycheeAddicts = [];
  gameData.neutralPlayers = [];
  gameData.composition = { ordinary: ordinaryCount, addict: addictCount, neutral: neutralCount };
  gameData.totalPlayers = total;

  for (let i = 0; i < total; i++) {
    const playerId = i + 1;
    const numeral = chineseNumbers[i] || playerId;
    const defaultName = `使者${numeral}`;
    if (!gameData.players[i]) {
      gameData.players[i] = {};
    }
    gameData.players[i] = {
      id: playerId,
      name: defaultName,
      isLycheeAddict: false,
      isNeutral: false,
      revealed: false,
      specialRole: null,
      abilityActivated: false,
      abilityUsed: false,
      activationHistory: [],
      abilityUses: 0,
      abilityUsage: {},
      abilitySealed: false,
      silentCharges: 0,
    };
  }

  // 随机选择荔枝瘾成员 addictCount 个
  const indices = [...Array(total).keys()];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const addictIndices = indices.slice(0, addictCount);
  addictIndices.forEach((idx) => {
    gameData.players[idx].isLycheeAddict = true;
    gameData.lycheeAddicts.push(idx + 1);
  });

  // 标记中立 neutralCount 个（从剩余普通中取）
  const remaining = indices.slice(addictCount);
  const neutralIndices = remaining.slice(0, neutralCount);
  neutralIndices.forEach((idx) => {
    gameData.players[idx].isNeutral = true;
    gameData.neutralPlayers.push(idx + 1);
  });

  if (!silent) {
    showNotification(`已应用人数配置：总${total}人（普通${ordinaryCount}、荔枝瘾${addictCount}、中立${neutralCount}）`);
  }
  return true;
}

/**
 * 重置各模块的房间配置与投票数据，适配最新人数设置。
 */
function resetModulesForNewComposition() {
  gameData.module1 = {
    smallRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    largeRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    smallGuard: null,
    smallGuardReal: null,
    largeGuard: null,
    largeGuardReal: null,
  };

  gameData.module2 = {
    smallRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    largeRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    smallGuard: null,
    largeGuard: null,
  };

  gameData.module3 = {
    smallRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    largeRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    smallGuard: null,
    largeGuard: null,
  };

  gameData.module4 = {
    room1: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    room2: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    room3: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    guard1: null,
    guard2: null,
    guard3: null,
  };

  gameData.voteCounts = {};
  const defaultDiscussionTimer = () => ({
    duration: 300,
    remaining: 300,
    running: false,
    intervalId: null,
  });
  const defaultSettlementTimer = () => ({
    duration: 60,
    remaining: 60,
    running: false,
    intervalId: null,
  });
  const ensureRoundMetaDefaults = (key) => {
    if (!gameData.roundMeta[key]) {
      gameData.roundMeta[key] = {};
    }
    const meta = gameData.roundMeta[key];
    if (key !== "module1") {
      meta.captainId = null;
      meta.selectionStartId = null;
      meta.selectionOrder = [];
      meta.timer = defaultDiscussionTimer();
    }
    meta.settlementStartId = null;
    meta.settlementOrder = [];
    meta.settlementTimer = defaultSettlementTimer();
  };
  if (!gameData.roundMeta) {
    gameData.roundMeta = {};
  }
  ["module1", "module2", "module3", "module4"].forEach(ensureRoundMetaDefaults);
}

/**
 * 完全重置游戏：重置所有模块和数据
 * 用于"重新开始游戏"按钮
 */
function resetGameCompletely() {
  console.log('=== 完全重置游戏 ===');
  
  // 1. 重置所有玩家的能力使用状态和特殊身份
  gameData.players.forEach((player) => {
    player.abilityUses = 0;
    player.abilityUsed = false;
    player.abilityActivated = true;
    player.abilityUsage = {};
    player.activationHistory = [];
    player.abilitySealed = false;
    player.silentCharges = 0;
    player.revealed = false;
    player.specialRole = null; // 重置特殊身份分配
    // 注意：不重置 isLycheeAddict 和 isNeutral，保留阵营分配（因为玩家身份是固定的）
    // 注意：不重置 name，保留玩家姓名
  });

  // 1.1 重置特殊角色分配
  gameData.specialRoles.assignedRoles = {};

  // 2. 重置所有模块数据
  resetModulesForNewComposition();

  // 3. 重置投票数据
  gameData.voteCounts = {};
  gameData.currentVoter = 0;

  // 4. 重置游戏阶段和状态
  gameData.currentPhase = 0;
  gameData.currentAbilitySelection = null;
  gameData.currentAbilityModule = null;
  gameData.currentArrestModule = null;
  gameData.pendingAbilities = [];

  // 5. 重置骨哨虫王目标房间信息
  if (gameData.boneWhistleKingTarget) {
    gameData.boneWhistleKingTarget = {};
  }

  // 6. 重置能力使用结果
  if (gameData.abilityResults) {
    gameData.abilityResults = {};
  }

  // 7. 隐藏所有模态框
  const abilityModal = document.getElementById('ability-modal');
  if (abilityModal) abilityModal.classList.add('hidden');
  const arrestModal = document.getElementById('arrest-modal');
  if (arrestModal) arrestModal.classList.add('hidden');

  // 8. 隐藏所有模块的结果区域
  const resultSections = [
    'result-1', 'result-2', 'result-3', 'result-4'
  ];
  resultSections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // 9. 显示模块0的配置区域（隐藏结果区域）
  const module1Config = document.querySelector('#module-1 > div:first-child');
  if (module1Config) module1Config.classList.remove('hidden');
  const module2Config = document.querySelector('#module-2 > div:first-child');
  if (module2Config) module2Config.classList.remove('hidden');
  const module3Config = document.querySelector('#module-3 > div:first-child');
  if (module3Config) module3Config.classList.remove('hidden');
  const module4Config = document.querySelector('#module-4 > div:first-child');
  if (module4Config) module4Config.classList.remove('hidden');

  // 10. 更新游戏状态显示
  updateGameStatus();

  // 11. 更新特殊角色按钮状态
  if (typeof updateSpecialRoleButtons === 'function') {
    updateSpecialRoleButtons();
  }

  console.log('=== 游戏重置完成 ===');
}

function ensureRoundMeta(moduleKey) {
  if (!gameData.roundMeta) {
    gameData.roundMeta = {};
  }
  if (!gameData.roundMeta[moduleKey]) {
    gameData.roundMeta[moduleKey] = {};
  }
  const meta = gameData.roundMeta[moduleKey];
  if (moduleKey !== "module1") {
    if (typeof meta.captainId === "undefined") meta.captainId = null;
    if (typeof meta.selectionStartId === "undefined") meta.selectionStartId = null;
    if (!Array.isArray(meta.selectionOrder)) meta.selectionOrder = [];
    if (!meta.timer) {
      meta.timer = {
        duration: 300,
        remaining: 300,
        running: false,
        intervalId: null,
      };
    }
  }
  if (typeof meta.settlementStartId === "undefined") meta.settlementStartId = null;
  if (!Array.isArray(meta.settlementOrder)) meta.settlementOrder = [];
  if (!meta.settlementTimer) {
    meta.settlementTimer = {
      duration: 60,
      remaining: 60,
      running: false,
      intervalId: null,
    };
  }
  return meta;
}

function getRandomPlayerId() {
  if (!gameData.players || gameData.players.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * gameData.players.length);
  return gameData.players[randomIndex].id;
}

function assignRoundCaptain(moduleKey, force = false) {
  if (moduleKey === "module1") return null;
  const meta = ensureRoundMeta(moduleKey);
  if (!meta.captainId || force) {
    meta.captainId = getRandomPlayerId();
  }
  return meta.captainId;
}

function assignSelectionOrder(moduleKey, force = false) {
  if (moduleKey === "module1") return [];
  const meta = ensureRoundMeta(moduleKey);
  const players = gameData.players || [];
  const needsRegenerate =
    force ||
    !Array.isArray(meta.selectionOrder) ||
    meta.selectionOrder.length !== players.length ||
    meta.selectionOrder.some(
      (id) => !players.find((player) => player.id === id)
    );

  if (needsRegenerate) {
    if (players.length === 0) {
      meta.selectionOrder = [];
      meta.selectionStartId = null;
      return meta.selectionOrder;
    }
    const startId = getRandomPlayerId();
    meta.selectionStartId = startId;
    const startIndex = players.findIndex((p) => p.id === startId);
    const order = [];
    for (let i = 0; i < players.length; i++) {
      const idx = (startIndex + i) % players.length;
      order.push(players[idx].id);
    }
    meta.selectionOrder = order;
  }
  return meta.selectionOrder;
}

function renderRoundGuidance(moduleKey) {
  if (!gameData.players || gameData.players.length === 0) return;
  const suffix = moduleKey.replace("module", "");
  const captainId = assignRoundCaptain(moduleKey);
  const selectionOrder = assignSelectionOrder(moduleKey);
  const captainSpan = document.getElementById(`captain-name-${suffix}`);
  const captainInlineSpan = document.getElementById(
    `captain-name-inline-${suffix}`
  );
  let captainName = "待定";
  if (captainId) {
    const resolvedName =
      typeof getPlayerNameById === "function"
        ? getPlayerNameById(captainId)
        : gameData.players.find((p) => p.id === captainId)?.name;
    if (resolvedName) {
      captainName = resolvedName;
    }
  }
  if (captainSpan) {
    captainSpan.textContent = captainName;
  }
  if (captainInlineSpan) {
    captainInlineSpan.textContent = captainName;
  }

  const refreshBtn = document.getElementById(`refresh-captain-${suffix}`);
  if (refreshBtn && !refreshBtn.dataset.bound) {
    refreshBtn.addEventListener("click", () => {
      assignRoundCaptain(moduleKey, true);
      renderRoundGuidance(moduleKey);
    });
    refreshBtn.dataset.bound = "true";
  }

  const startSpan = document.getElementById(`selection-start-${suffix}`);
  if (startSpan) {
    if (selectionOrder.length > 0) {
      const startId = selectionOrder[0];
      const startName =
        typeof getPlayerNameById === "function"
          ? getPlayerNameById(startId)
          : gameData.players.find((p) => p.id === startId)?.name || "未知使者";
      startSpan.textContent = startName;
    } else {
      startSpan.textContent = "待定";
    }
  }

  const orderContainer = document.getElementById(`selection-order-${suffix}`);
  if (orderContainer) {
    orderContainer.innerHTML = "";
    if (selectionOrder.length === 0) {
      const emptyTag = document.createElement("span");
      emptyTag.className =
        "px-2 py-1 rounded text-xs bg-gray-100 text-gray-400 border border-dashed border-gray-300";
      emptyTag.textContent = "暂无使者信息";
      orderContainer.appendChild(emptyTag);
    } else {
      selectionOrder.forEach((playerId, index) => {
        const chip = document.createElement("span");
        chip.className =
          "px-2 py-1 rounded-full text-xs bg-white border border-gray-200";
        const name =
          typeof getPlayerNameById === "function"
            ? getPlayerNameById(playerId)
            : gameData.players.find((p) => p.id === playerId)?.name || "未知使者";
        chip.textContent = `${index + 1}. ${name}`;
        orderContainer.appendChild(chip);
      });
    }
  }
}

function assignSettlementOrder(moduleKey, force = false) {
  const meta = ensureRoundMeta(moduleKey);
  const players = gameData.players || [];
  const needsRegenerate =
    force ||
    !Array.isArray(meta.settlementOrder) ||
    meta.settlementOrder.length !== players.length ||
    meta.settlementOrder.some(
      (id) => !players.find((player) => player.id === id)
    );

  if (needsRegenerate) {
    if (meta.settlementTimer && meta.settlementTimer.intervalId) {
      clearInterval(meta.settlementTimer.intervalId);
    }
    const duration =
      (meta.settlementTimer && meta.settlementTimer.duration) || 60;
    meta.settlementTimer = {
      duration,
      remaining: duration,
      running: false,
      intervalId: null,
    };

    if (players.length === 0) {
      meta.settlementOrder = [];
      meta.settlementStartId = null;
      return meta.settlementOrder;
    }
    const startId = getRandomPlayerId();
    meta.settlementStartId = startId;
    const startIndex = players.findIndex((p) => p.id === startId);
    const order = [];
    for (let i = 0; i < players.length; i++) {
      const idx = (startIndex + i) % players.length;
      order.push(players[idx].id);
    }
    meta.settlementOrder = order;
  }
  return meta.settlementOrder || [];
}

function renderSettlementInfo(moduleKey, force = false) {
  if (!gameData || !Array.isArray(gameData.players)) return;
  const suffix = moduleKey.replace("module", "");
  const order = assignSettlementOrder(moduleKey, force);
  const resolveName = (playerId) =>
    typeof getPlayerNameById === "function"
      ? getPlayerNameById(playerId)
      : gameData.players.find((p) => p.id === playerId)?.name || "未知使者";

  const startSpan = document.getElementById(`settlement-start-${suffix}`);
  if (startSpan) {
    startSpan.textContent =
      order.length > 0 ? resolveName(order[0]) : "待定";
  }
  const endSpan = document.getElementById(`settlement-end-${suffix}`);
  if (endSpan) {
    endSpan.textContent =
      order.length > 0 ? resolveName(order[order.length - 1]) : "待定";
  }

  const orderContainer = document.getElementById(
    `settlement-order-${suffix}`
  );
  if (orderContainer) {
    orderContainer.innerHTML = "";
    if (order.length === 0) {
      const emptyTag = document.createElement("span");
      emptyTag.className =
        "px-2 py-1 rounded text-xs bg-gray-100 text-gray-400 border border-dashed border-gray-300";
      emptyTag.textContent = "暂无使者信息";
      orderContainer.appendChild(emptyTag);
    } else {
      order.forEach((playerId, index) => {
        const chip = document.createElement("span");
        chip.className =
          "px-2 py-1 rounded-full text-xs bg-white border border-gray-200";
        chip.textContent = `${index + 1}. ${resolveName(playerId)}`;
        orderContainer.appendChild(chip);
      });
    }
  }

  setupSettlementTimer(moduleKey);
}

function setupDiscussionTimer(moduleKey) {
  const suffix = moduleKey.replace("module", "");
  const timerDisplay = document.getElementById(`discussion-timer-${suffix}`);
  const startBtn = document.getElementById(`start-timer-${suffix}`);
  const resetBtn = document.getElementById(`reset-timer-${suffix}`);
  if (!timerDisplay || !startBtn || !resetBtn) return;

  const meta = ensureRoundMeta(moduleKey);
  if (
    !meta.timer ||
    typeof meta.timer !== "object" ||
    typeof meta.timer.duration !== "number"
  ) {
    meta.timer = {
      duration: 300,
      remaining: 300,
      running: false,
      intervalId: null,
    };
  }
  if (typeof meta.timer.remaining !== "number") {
    meta.timer.remaining = meta.timer.duration;
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const updateDisplay = () => {
    timerDisplay.textContent = formatTime(meta.timer.remaining);
    if (meta.timer.remaining === 0) {
      timerDisplay.classList.add("text-red-600", "font-semibold");
    } else {
      timerDisplay.classList.remove("text-red-600", "font-semibold");
    }
  };

  const stopInterval = () => {
    if (meta.timer.intervalId) {
      clearInterval(meta.timer.intervalId);
      meta.timer.intervalId = null;
    }
    meta.timer.running = false;
  };

  const setStartLabel = (targetBtn) => {
    targetBtn.textContent = meta.timer.running
      ? "暂停"
      : meta.timer.remaining === 0
      ? "重新开始"
      : "开始";
  };

  // 防止重复绑定事件
  const newStartBtn = startBtn.cloneNode(true);
  startBtn.parentNode.replaceChild(newStartBtn, startBtn);
  const newResetBtn = resetBtn.cloneNode(true);
  resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);

  newStartBtn.addEventListener("click", () => {
    if (meta.timer.running) {
      stopInterval();
      setStartLabel(newStartBtn);
      return;
    }
    if (meta.timer.remaining === 0) {
      meta.timer.remaining = meta.timer.duration;
      updateDisplay();
    }
    meta.timer.running = true;
    setStartLabel(newStartBtn);
    meta.timer.intervalId = setInterval(() => {
      if (meta.timer.remaining > 0) {
        meta.timer.remaining -= 1;
        updateDisplay();
      } else {
        stopInterval();
        setStartLabel(newStartBtn);
        updateDisplay();
      }
    }, 1000);
  });

  newResetBtn.addEventListener("click", () => {
    stopInterval();
    meta.timer.remaining = meta.timer.duration;
    updateDisplay();
    setStartLabel(newStartBtn);
  });

  updateDisplay();
  setStartLabel(newStartBtn);
}

function setupSettlementTimer(moduleKey) {
  const suffix = moduleKey.replace("module", "");
  const timerDisplay = document.getElementById(`settlement-timer-${suffix}`);
  const startBtn = document.getElementById(
    `start-settlement-timer-${suffix}`
  );
  const resetBtn = document.getElementById(
    `reset-settlement-timer-${suffix}`
  );
  if (!timerDisplay || !startBtn || !resetBtn) return;

  const meta = ensureRoundMeta(moduleKey);
  const timer = meta.settlementTimer || {
    duration: 60,
    remaining: 60,
    running: false,
    intervalId: null,
  };
  meta.settlementTimer = timer;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const updateDisplay = () => {
    timerDisplay.textContent = formatTime(timer.remaining);
    if (timer.remaining === 0) {
      timerDisplay.classList.add("text-red-600", "font-semibold");
    } else {
      timerDisplay.classList.remove("text-red-600", "font-semibold");
    }
  };

  const stopInterval = () => {
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
    }
    timer.running = false;
  };

  const replaceButton = (btn) => {
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
    return clone;
  };

  const newStartBtn = replaceButton(startBtn);
  const newResetBtn = replaceButton(resetBtn);

  const setStartLabel = () => {
    newStartBtn.textContent = timer.running
      ? "暂停"
      : timer.remaining === 0
      ? "重新开始"
      : "开始";
  };

  newStartBtn.addEventListener("click", () => {
    if (timer.running) {
      stopInterval();
      setStartLabel();
      return;
    }
    if (timer.remaining === 0) {
      timer.remaining = timer.duration || 60;
      updateDisplay();
    }
    timer.running = true;
    setStartLabel();
    timer.intervalId = setInterval(() => {
      if (timer.remaining > 0) {
        timer.remaining -= 1;
        updateDisplay();
      } else {
        stopInterval();
        setStartLabel();
        updateDisplay();
      }
    }, 1000);
  });

  newResetBtn.addEventListener("click", () => {
    stopInterval();
    timer.remaining = timer.duration || 60;
    updateDisplay();
    setStartLabel();
  });

  updateDisplay();
  setStartLabel();
}


// 显示关押过渡界面
function showArrestModal(module) {
  console.log("显示关押界面，模块:", module);

  // 保存当前模块
  gameData.currentArrestModule = module;

  // 显示关押界面
  document.getElementById("arrest-modal").classList.remove("hidden");
}


// 关押完毕，进入能力使用阶段
function confirmArrest() {
    console.log('即将开始关押，进入能力使用阶段');
    
    // 隐藏关押界面
    document.getElementById('arrest-modal').classList.add('hidden');

    const module = gameData.currentArrestModule;
    
    // 设置当前能力模块
    gameData.currentAbilityModule = module;

    // 构建本轮能力队列（按顺序依次执行）
    // 规则：只要本局有这个身份，就加入队列（即使能力次数已耗尽）
    const queue = [];

    // 荔枝瘾进房前的秘密讨论（顺序0，在所有能力之前）
    if (typeof showLycheeAddictAction === 'function') {
        queue.push('lycheeAction');
    }

    // 沐恩天使（普通阵营）—— 在第二轮审查中于缄默之前行动
    const muEnAngel = gameData.players.find(p => p.specialRole === 'muEnAngel');
    if (muEnAngel && typeof showMuEnAngelAbility === 'function') {
        queue.push('muEnAngel');
    }

    // 金刚僧（普通阵营）—— 行动顺序 0.6，位于沐恩天使之后、缄默之前，可在第一至第四轮施放圣域
    const goldenMonk = gameData.players.find((p) => p.specialRole === "goldenMonk");
    const allowSanctuary =
      module === "module1" ||
      module === "module2" ||
      module === "module3" ||
      module === "module4";
    if (goldenMonk && allowSanctuary && typeof showGoldenMonkAbility === "function") {
        queue.push('goldenMonk');
    }

    // 缄默（荔枝瘾阵营）
    const silentWhisper = gameData.players.find(p => p.specialRole === 'silentWhisper');
    if (silentWhisper && typeof showSilentWhisperAbility === 'function') {
        queue.push('silentWhisper');
    }

    // 胡庭药巫（普通阵营）
    const medicineShaman = gameData.players.find(p => p.specialRole === 'medicineShaman');
    if (medicineShaman && typeof showMedicineShamanAbility === 'function') {
        queue.push('medicineShaman');
    }

    // 易容术士（荔枝瘾阵营）
    const disguiseMaster = gameData.players.find(p => p.specialRole === 'disguiseMaster');
    if (disguiseMaster && typeof showDisguiseMasterAbility === 'function') {
        queue.push('disguiseMaster');
    }

    // 牧歌传讯者（普通阵营）
    const songMessenger = gameData.players.find(p => p.specialRole === 'songMessenger');
    if (songMessenger && typeof showSongMessengerAbility === 'function') {
        queue.push('songMessenger');
    }

    // 骨哨虫王（荔枝瘾阵营）
    const boneWhistleKing = gameData.players.find(p => p.specialRole === 'boneWhistleKing');
    if (boneWhistleKing && typeof showBoneWhistleKingAbility === 'function') {
        queue.push('boneWhistleKing');
    }

    // 保存到全局，供基类流转
    gameData.pendingAbilities = queue;

    // 起始：若队列为空直接显示结果，否则按队列启动
    if (!gameData.pendingAbilities || gameData.pendingAbilities.length === 0) {
        if (typeof proceedNextAbilityOrResult === 'function') {
            proceedNextAbilityOrResult(module); // 会直接进入结果
        } else {
            showModuleResult(module);
        }
    } else {
        if (typeof proceedNextAbilityOrResult === 'function') {
            proceedNextAbilityOrResult(module);
        } else {
            // 兜底：只显示首个已知能力
            const next = gameData.pendingAbilities[0];
            if (next === 'medicineShaman') showMedicineShamanAbility(module);
            else if (next === 'disguiseMaster') showDisguiseMasterAbility(module);
            else if (next === 'songMessenger') showSongMessengerAbility(module);
            else if (next === 'boneWhistleKing') showBoneWhistleKingAbility(module);
        }
    }
}

// 将指定模块的 realMembers 恢复为 surfaceMembers（用于“返回修改”）
function restoreRealFromSurface(module) {
  if (!module) return;
  if (module === "module1" || module === "module2" || module === "module3") {
    ["smallRoom", "largeRoom"].forEach((key) => {
      const surf = gameData[module][key].surfaceMembers || [];
      gameData[module][key].realMembers = [...surf];
    });
  } else if (module === "module4") {
    ["room1", "room2", "room3"].forEach((key) => {
      const surf = gameData.module4[key].surfaceMembers || [];
      gameData.module4[key].realMembers = [...surf];
    });
  }
}

// 返回修改时：
function resetGuardsForModuleOnBack(module) {
  // 目标：状态恢复到能力使用前；若被监管者是已在本模块使用过能力的易容术士，则真实被监管者重置为易容术士（表面被监管者不变）
  const disguise = gameData.players.find(p => p.specialRole === 'disguiseMaster');
  if (!disguise) return;

  if (module === 'module1') {
    if (gameData.module1.smallGuardReal === undefined) {
      gameData.module1.smallGuardReal = gameData.module1.smallGuard;
    }
    if (gameData.module1.largeGuardReal === undefined) {
      gameData.module1.largeGuardReal = gameData.module1.largeGuard;
    }

    const dmUsed = typeof wasAbilityUsedInModule === 'function' && wasAbilityUsedInModule('module1', disguise);
    if (dmUsed) {
      const inSmall = gameData.module1.smallRoom.realMembers.includes(disguise.id);
      const inLarge = gameData.module1.largeRoom.realMembers.includes(disguise.id);
      if (inSmall) gameData.module1.smallGuardReal = disguise.id;
      if (inLarge) gameData.module1.largeGuardReal = disguise.id;
    } else {
      gameData.module1.smallGuardReal = gameData.module1.smallGuard;
      gameData.module1.largeGuardReal = gameData.module1.largeGuard;
    }
  } else if (module === 'module2') {
    if (gameData.module2.smallGuardReal === undefined) {
      gameData.module2.smallGuardReal = gameData.module2.smallGuard;
    }
    if (gameData.module2.largeGuardReal === undefined) {
      gameData.module2.largeGuardReal = gameData.module2.largeGuard;
    }

    const dmUsed = typeof wasAbilityUsedInModule === 'function' && wasAbilityUsedInModule('module2', disguise);
    if (dmUsed) {
      const inSmall = gameData.module2.smallRoom.realMembers.includes(disguise.id);
      const inLarge = gameData.module2.largeRoom.realMembers.includes(disguise.id);
      if (inSmall) gameData.module2.smallGuardReal = disguise.id;
      if (inLarge) gameData.module2.largeGuardReal = disguise.id;
    } else {
      gameData.module2.smallGuardReal = gameData.module2.smallGuard;
      gameData.module2.largeGuardReal = gameData.module2.largeGuard;
    }
  } else if (module === 'module3') {
    // 初始化真实监管者字段
    if (gameData.module3.smallGuardReal === undefined) gameData.module3.smallGuardReal = gameData.module3.smallGuard;
    if (gameData.module3.largeGuardReal === undefined) gameData.module3.largeGuardReal = gameData.module3.largeGuard;

    const dmUsed = typeof wasAbilityUsedInModule === 'function' && wasAbilityUsedInModule('module3', disguise);
    if (dmUsed) {
      // 恢复到能力使用前：真实成员已在 restoreRealFromSurface 中恢复，这里设置真实监管者为易容术士所在房间的他本人
      const inSmall = gameData.module3.smallRoom.realMembers.includes(disguise.id);
      const inLarge = gameData.module3.largeRoom.realMembers.includes(disguise.id);
      if (inSmall) gameData.module3.smallGuardReal = disguise.id;
      if (inLarge) gameData.module3.largeGuardReal = disguise.id;
    } else {
      // 未使用则让真实与表面保持一致
      gameData.module3.smallGuardReal = gameData.module3.smallGuard;
      gameData.module3.largeGuardReal = gameData.module3.largeGuard;
    }
  } else if (module === 'module4') {
    if (gameData.module4.guard1Real === undefined) gameData.module4.guard1Real = gameData.module4.guard1;
    if (gameData.module4.guard2Real === undefined) gameData.module4.guard2Real = gameData.module4.guard2;
    if (gameData.module4.guard3Real === undefined) gameData.module4.guard3Real = gameData.module4.guard3;

    const dmUsed = typeof wasAbilityUsedInModule === 'function' && wasAbilityUsedInModule('module4', disguise);
    if (dmUsed) {
      const inR1 = gameData.module4.room1.realMembers.includes(disguise.id);
      const inR2 = gameData.module4.room2.realMembers.includes(disguise.id);
      const inR3 = gameData.module4.room3.realMembers.includes(disguise.id);
      if (inR1) gameData.module4.guard1Real = disguise.id;
      if (inR2) gameData.module4.guard2Real = disguise.id;
      if (inR3) gameData.module4.guard3Real = disguise.id;
    } else {
      gameData.module4.guard1Real = gameData.module4.guard1;
      gameData.module4.guard2Real = gameData.module4.guard2;
      gameData.module4.guard3Real = gameData.module4.guard3;
    }
  }
}

function logModuleRealStatus(module) {
  if (!window || !console || !gameData || !module) return;
  const moduleData = gameData[module];
  if (!moduleData) return;

  const moduleLabelMap = {
    module1: "第一轮审查",
    module2: "第二轮审查",
    module3: "第三轮审查",
    module4: "第四轮审查",
  };

  const formatPlayer = (playerId) => {
    if (playerId === undefined || playerId === null) return "未指定";
    const player = gameData.players?.find?.((p) => p.id === playerId);
    return player ? `${player.name}（ID:${player.id}）` : `使者${playerId}`;
  };

  const rooms = [];

  if (module === "module4") {
    ["room1", "room2", "room3"].forEach((roomKey, index) => {
      const guardKey = `guard${index + 1}`;
      const guardRealKey = `${guardKey}Real`;
      const roomData = moduleData[roomKey];
      if (!roomData) return;
      rooms.push({
        name: `房间${index + 1}`,
        members: [...(roomData.realMembers || [])].map(formatPlayer),
        guard: formatPlayer(moduleData[guardRealKey] ?? moduleData[guardKey]),
      });
    });
  } else if (["module1", "module2", "module3"].includes(module)) {
    [
      { roomKey: "smallRoom", guardKey: "smallGuard", label: "小房间" },
      { roomKey: "largeRoom", guardKey: "largeGuard", label: "大房间" },
    ].forEach(({ roomKey, guardKey, label }) => {
      const guardRealKey = `${guardKey}Real`;
      const roomData = moduleData[roomKey];
      if (!roomData) return;
      rooms.push({
        name: label,
        members: [...(roomData.realMembers || [])].map(formatPlayer),
        guard: formatPlayer(moduleData[guardRealKey] ?? moduleData[guardKey]),
      });
    });
  } else {
    return;
  }

  const groupTitle = `[审查结果] ${moduleLabelMap[module] || module} 的真实房间信息`;
  if (console.groupCollapsed) {
    console.groupCollapsed(groupTitle);
  } else {
    console.log(groupTitle);
  }

  rooms.forEach((room) => {
    const membersOutput = room.members.length ? room.members : ["（无人）"];
    console.log(`${room.name}真实成员`, membersOutput);
    console.log(`${room.name}真实被监管者`, room.guard);
  });

  if (console.groupCollapsed) {
    console.groupEnd();
  }
}