/**
 * 第一轮审查模块（module1）
 * 
 * 本模块负责第一轮审查的房间分配和结果计算，包括：
 * - 玩家分配到小房间/大房间
 * - 监管者选择
 * - 荔枝偷吃结果计算（含缄默能力次数的去重累积）
 * - 能力使用流程
 *
 * 函数分类：
 *
 * 【初始化与配置】
 * - initModule1(): 初始化第一轮审查模块，并根据当前人数设置房间容量
 * - randomAssignModule1(): 按动态容量随机分配房间成员
 *
 * 【结果计算与显示】
 * - confirmModule1(): 确认第一轮分配并计算结果（包含能力流程）
 * - renderModule1Result(forceSettlement): 渲染第一轮审查结果
 *
 * 【事件处理】
 * - setupModule1EventListeners(): 设置第一轮审查模块事件
 */


// 初始化第一轮审查（模块1）
function initModule1() {
  // 清除房间选中状态
  if (typeof clearRoomSelection === 'function') {
    clearRoomSelection();
  }

  // 若已有配置（跨模块返回），不重置，直接按现有状态渲染；否则初始化
  const hasExisting =
    gameData.module1 &&
    gameData.module1.smallRoom &&
    gameData.module1.largeRoom &&
    ((gameData.module1.smallRoom.surfaceMembers &&
      gameData.module1.smallRoom.surfaceMembers.length > 0) ||
      (gameData.module1.largeRoom.surfaceMembers &&
        gameData.module1.largeRoom.surfaceMembers.length > 0) ||
      gameData.module1.smallGuard !== null ||
      gameData.module1.largeGuard !== null);

  if (!hasExisting) {
    // 重置模块1数据
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
  } else {
    if (gameData.module1.smallGuardReal === undefined) {
      gameData.module1.smallGuardReal = gameData.module1.smallGuard;
    }
    if (gameData.module1.largeGuardReal === undefined) {
      gameData.module1.largeGuardReal = gameData.module1.largeGuard;
    }
  }

  const totalPlayers = getTotalPlayers();
  const { small: smallLimit, large: largeLimit } = getRoomLimits(totalPlayers);

  const smallTitle = document.querySelector("#small-room-1 h3 span:first-child");
  const largeTitle = document.querySelector("#large-room-1 h3 span:first-child");
  if (smallTitle) smallTitle.textContent = `小房间 (限${smallLimit}人)`;
  if (largeTitle) largeTitle.textContent = `大房间 (限${largeLimit}人)`;

  // 显示使者列表与房间：按当前状态渲染
  const playersContainer = document.getElementById("players-module-1");
  if (playersContainer) {
    playersContainer.innerHTML = "";

    const assignedIds = new Set([
      ...(gameData.module1.smallRoom.surfaceMembers || []),
      ...(gameData.module1.largeRoom.surfaceMembers || []),
    ]);
    
    // 确保 gameData.players 存在且有效
    if (gameData.players && gameData.players.length > 0) {
      gameData.players.forEach((player) => {
        if (player && !assignedIds.has(player.id)) {
          const playerEl = createDraggablePlayer(player);
          playersContainer.appendChild(playerEl);
        }
      });
    }

    // 如果所有玩家都已分配，显示提示信息
    if (assignedIds.size === gameData.players.length) {
      const placeholder = document.createElement("div");
      placeholder.className = "text-gray-400 text-sm text-center py-4";
      placeholder.textContent = "所有使者已分配到房间，如需调整请从房间中移除使者";
      playersContainer.appendChild(placeholder);
    }
  }

  // 渲染房间成员
  const smallContainer = document.querySelector("#small-room-1 .room-players");
  const largeContainer = document.querySelector("#large-room-1 .room-players");
  smallContainer.innerHTML = "";
  largeContainer.innerHTML = "";
  renderRoomPlayers("module1", "smallRoom", smallContainer);
  renderRoomPlayers("module1", "largeRoom", largeContainer);

  // 更新计数
  updateRoomCount("module1", "smallRoom", "small-count-1");
  updateRoomCount("module1", "largeRoom", "large-count-1");

  // 监管选择区域显示由 renderRoomPlayers 内逻辑控制

  // 切换到配置区域
  const resultSection = document.getElementById("result-1");
  if (resultSection) resultSection.classList.add("hidden");
  const configSection = document.querySelector("#module-1 > div:first-child");
  if (configSection) configSection.classList.remove("hidden");

  // 根据完成状态启用/禁用确认
  checkRoomComplete("module1");

  // 设置房间拖放事件
  setupRoomDropZone("small-room-1", smallLimit, "small-count-1", "module1", "smallRoom");
  setupRoomDropZone("large-room-1", largeLimit, "large-count-1", "module1", "largeRoom");
  setupModule1EventListeners();
}


// 模块1随机分配函数
function randomAssignModule1() {
  // 清空现有分配
  gameData.module1.smallRoom.realMembers = [];
  gameData.module1.smallRoom.surfaceMembers = [];
  gameData.module1.largeRoom.realMembers = [];
  gameData.module1.largeRoom.surfaceMembers = [];
  gameData.module1.smallGuard = null;
  gameData.module1.smallGuardReal = null;
  gameData.module1.largeGuard = null;
  gameData.module1.largeGuardReal = null;

  // 清空房间显示
  const smallContainer = document.querySelector("#small-room-1 .room-players");
  const largeContainer = document.querySelector("#large-room-1 .room-players");
  smallContainer.innerHTML = "";
  largeContainer.innerHTML = "";

  const totalPlayers = getTotalPlayers();
  const { small: smallLimit, large: largeLimit } = getRoomLimits(totalPlayers);

  // 随机分配玩家
  const shuffledPlayers = [...gameData.players].sort(() => 0.5 - Math.random());
  const smallPlayers = shuffledPlayers.slice(0, smallLimit);
  const largePlayers = shuffledPlayers.slice(smallLimit, smallLimit + largeLimit);

  smallPlayers.forEach((player) => {
    gameData.module1.smallRoom.realMembers.push(player.id);
    gameData.module1.smallRoom.surfaceMembers.push(player.id);
  });

  largePlayers.forEach((player) => {
    gameData.module1.largeRoom.realMembers.push(player.id);
    gameData.module1.largeRoom.surfaceMembers.push(player.id);
  });

  // 随机选择监管者
  if (gameData.module1.smallRoom.realMembers.length > 0) {
    gameData.module1.smallGuard = gameData.module1.smallRoom.realMembers[0];
    gameData.module1.smallGuardReal = gameData.module1.smallGuard;
  }
  if (gameData.module1.largeRoom.realMembers.length > 0) {
    gameData.module1.largeGuard = gameData.module1.largeRoom.realMembers[0];
    gameData.module1.largeGuardReal = gameData.module1.largeGuard;
  }

  // 更新UI
  updateRoomCount("module1", "smallRoom", "small-count-1");
  updateRoomCount("module1", "largeRoom", "large-count-1");

  renderRoomPlayers("module1", "smallRoom", smallContainer);
  renderRoomPlayers("module1", "largeRoom", largeContainer);

  // 重新渲染未分配玩家列表
  const playersContainer = document.getElementById("players-module-1");
  if (playersContainer) {
    playersContainer.innerHTML = "";
    const assignedIds = new Set([
      ...gameData.module1.smallRoom.surfaceMembers,
      ...gameData.module1.largeRoom.surfaceMembers,
    ]);
    gameData.players.forEach((player) => {
      if (!assignedIds.has(player.id)) {
        const playerEl = createDraggablePlayer(player);
        playersContainer.appendChild(playerEl);
      }
    });
    // 如果所有玩家都已分配，显示提示信息
    if (assignedIds.size === gameData.players.length) {
      const placeholder = document.createElement("div");
      placeholder.className = "text-gray-400 text-sm text-center py-4";
      placeholder.textContent = "所有使者已分配到房间，如需调整请从房间中移除使者";
      playersContainer.appendChild(placeholder);
    }
  }

  checkRoomComplete("module1");
}

function confirmModule1() {
  if (!gameData.module1) return;

  const moduleData = gameData.module1;
  if (moduleData.smallGuardReal === undefined) {
    moduleData.smallGuardReal = moduleData.smallGuard;
  }
  if (moduleData.largeGuardReal === undefined) {
    moduleData.largeGuardReal = moduleData.largeGuard;
  }

  const realSmallGuard = moduleData.smallGuardReal ?? moduleData.smallGuard;
  const realLargeGuard = moduleData.largeGuardReal ?? moduleData.largeGuard;

  const smallRoomAddicts = moduleData.smallRoom.realMembers.filter(
    (id) => gameData.lycheeAddicts.includes(id) && id !== realSmallGuard
  );
  const largeRoomAddicts = moduleData.largeRoom.realMembers.filter(
    (id) => gameData.lycheeAddicts.includes(id) && id !== realLargeGuard
  );

  const boneWhistleKing = gameData.players.find((p) => p.specialRole === "boneWhistleKing");
  const boneWhistleKingUsed =
    boneWhistleKing && boneWhistleKing.abilityUsage && boneWhistleKing.abilityUsage["module1"];
  const boneWhistleKingTarget =
    gameData.boneWhistleKingTarget && gameData.boneWhistleKingTarget["module1"];

  const smallRoomForced = boneWhistleKingUsed && boneWhistleKingTarget === "smallRoom";
  const largeRoomForced = boneWhistleKingUsed && boneWhistleKingTarget === "largeRoom";

  moduleData.smallRoom.realLycheeState = smallRoomForced ? true : smallRoomAddicts.length > 0;
  moduleData.smallRoom.surfaceLycheeState = moduleData.smallRoom.realLycheeState;
  moduleData.largeRoom.realLycheeState = largeRoomForced ? true : largeRoomAddicts.length > 0;
  moduleData.largeRoom.surfaceLycheeState = moduleData.largeRoom.realLycheeState;

  const eatenRound = 1;
  const markEaten = (playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    if (!player) return;
    if (!player.activationHistory) player.activationHistory = [];
    const firstTimeThisRound = !player.activationHistory.includes(eatenRound);
    if (firstTimeThisRound) {
      player.activationHistory.push(eatenRound);
    }
    if (player.specialRole === "silentWhisper" && firstTimeThisRound) {
      player.silentCharges = (player.silentCharges || 0) + 1;
      player.abilityUsed = (player.abilityUses || 0) >= player.silentCharges;
      if (typeof recordSilentWhisperChargeGain === "function") {
        recordSilentWhisperChargeGain(player.id, "module1", 1);
      }
    }
  };
  smallRoomAddicts.forEach(markEaten);
  largeRoomAddicts.forEach(markEaten);

  renderModule1Result();
  // 隐藏配置区域，显示结果区域（都在 module-1 内）
  const configSection = document.querySelector("#module-1 > div:first-child");
  if (configSection) configSection.classList.add("hidden");
  const resultSection = document.getElementById("result-1");
  if (resultSection) {
    resultSection.classList.remove("hidden");
  }
  // 确保 module-1 是显示的
  showModule(1);
  gameData.currentPhase = 1;
  updateGameStatus();
}

function renderModule1Result(forceSettlement = false) {
  const moduleData = gameData.module1;
  if (!moduleData) return;

  const smallTitle = document.getElementById("small-result-title-1");
  if (smallTitle) {
    smallTitle.textContent = `小房间`;
  }
  const largeTitle = document.getElementById("large-result-title-1");
  if (largeTitle) {
    largeTitle.textContent = `大房间`;
  }

  const smallResultEl = document.getElementById("small-result-1");
  const largeResultEl = document.getElementById("large-result-1");
  if (smallResultEl) {
    smallResultEl.textContent = moduleData.smallRoom.realLycheeState ? "荔枝被偷吃了" : "荔枝完好";
    smallResultEl.className = `text-lg ${
      moduleData.smallRoom.realLycheeState ? "text-primary font-bold" : "text-dark"
    }`;
  }
  if (largeResultEl) {
    largeResultEl.textContent = moduleData.largeRoom.realLycheeState ? "荔枝被偷吃了" : "荔枝完好";
    largeResultEl.className = `text-lg ${
      moduleData.largeRoom.realLycheeState ? "text-primary font-bold" : "text-dark"
    }`;
  }

  const smallGuardPlayer = gameData.players.find((p) => p.id === moduleData.smallGuard) || {
    name: "未选择",
  };
  const largeGuardPlayer = gameData.players.find((p) => p.id === moduleData.largeGuard) || {
    name: "未选择",
  };
  const smallGuardEl = document.getElementById("small-guard-1");
  if (smallGuardEl) smallGuardEl.textContent = smallGuardPlayer.name;
  const largeGuardEl = document.getElementById("large-guard-1");
  if (largeGuardEl) largeGuardEl.textContent = largeGuardPlayer.name;

  const smallMembersContainer = document.getElementById("small-room-members-1");
  if (smallMembersContainer) {
    smallMembersContainer.innerHTML = "";
    moduleData.smallRoom.surfaceMembers.forEach((playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      const tag = document.createElement("span");
      tag.className = `px-2 py-0.5 rounded text-xs ${
        playerId === moduleData.smallGuard ? "bg-primary/10 text-primary" : "bg-gray-100"
      }`;
      tag.textContent = player ? player.name : `使者${playerId}`;
      smallMembersContainer.appendChild(tag);
    });
  }

  const largeMembersContainer = document.getElementById("large-room-members-1");
  if (largeMembersContainer) {
    largeMembersContainer.innerHTML = "";
    moduleData.largeRoom.surfaceMembers.forEach((playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      const tag = document.createElement("span");
      tag.className = `px-2 py-0.5 rounded text-xs ${
        playerId === moduleData.largeGuard ? "bg-primary/10 text-primary" : "bg-gray-100"
      }`;
      tag.textContent = player ? player.name : `使者${playerId}`;
      largeMembersContainer.appendChild(tag);
    });
  }

  renderSettlementInfo("module1", forceSettlement);
  if (typeof renderGoldenMonkSanctuaryAnnouncement === "function") {
    renderGoldenMonkSanctuaryAnnouncement("module1");
  }

  if (typeof logModuleRealStatus === "function") {
    logModuleRealStatus("module1");
  }
}

// 设置模块1事件监听器
function setupModule1EventListeners() {
    // 返回按钮
    const backTo0Btn = document.getElementById('back-to-0');
    if (backTo0Btn && !backTo0Btn.dataset.bound) {
        backTo0Btn.addEventListener('click', () => {
            showModule(0);
        });
        backTo0Btn.dataset.bound = "true";
    }
    
    // 确认分配按钮
    const confirm1Btn = document.getElementById('confirm-1');
    if (confirm1Btn && !confirm1Btn.dataset.bound) {
        confirm1Btn.addEventListener('click', () => {
            if (checkRoomComplete('module1')) {
                showArrestModal('module1');
            }
        });
        confirm1Btn.dataset.bound = "true";
    }
    
    // 随机分配按钮
    const randomModule1Btn = document.getElementById('random-module-1');
    if (randomModule1Btn && !randomModule1Btn.dataset.bound) {
        randomModule1Btn.addEventListener('click', randomAssignModule1);
        randomModule1Btn.dataset.bound = "true";
    }
    
    // 结果页返回修改按钮
    const backTo1ConfigBtn = document.getElementById('back-to-1-config');
    if (backTo1ConfigBtn && !backTo1ConfigBtn.dataset.bound) {
        backTo1ConfigBtn.addEventListener('click', () => {
            resetModuleAbilities('module1');
            // 恢复真实成员为表面成员
            restoreRealFromSurface('module1');
            if (typeof resetGuardsForModuleOnBack === 'function') {
                resetGuardsForModuleOnBack('module1');
            }
            document.querySelector('#module-1 > div:first-child').classList.remove('hidden');
            document.getElementById('result-1').classList.add('hidden');
        });
        backTo1ConfigBtn.dataset.bound = "true";
    }
    
    // 结果页进入下一轮按钮
    const toModule2Btn = document.getElementById('module1-to-module2');
    if (toModule2Btn && !toModule2Btn.dataset.bound) {
        toModule2Btn.addEventListener('click', () => {
            initModule2();
            showModule(2);
        });
        toModule2Btn.dataset.bound = "true";
    }
}
