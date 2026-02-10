/**
 * 第二轮审查模块（module2）
 * 
 * 本模块负责第二轮审查的房间分配和结果计算，包括：
 * - 玩家分配到小房间/大房间
 * - 监管者选择
 * - 荔枝偷吃结果计算
 * - 能力使用流程
 * - 显示第一轮审查结果
 *
 * 函数分类：
 *
 * 【初始化与配置】
 * - initModule2(): 初始化第二轮审查模块，并根据当前人数设置房间容量，显示第一轮结果
 * - randomAssignModule2(): 按动态容量随机分配房间成员，并更新未分配玩家列表
 *
 * 【结果计算与显示】
 * - confirmModule2(): 确认第二轮分配并计算结果（包含结果渲染逻辑）
 *
 * 【事件处理】
 * - setupModule2EventListeners(): 设置第二轮审查模块事件（包括返回第一轮结果页面的逻辑）
 */


// 初始化第二轮审查（模块2）
function initModule2() {
  // 清除房间选中状态
  if (typeof clearRoomSelection === 'function') {
    clearRoomSelection();
  }

  // 若已有配置（跨模块返回），不重置，直接按现有状态渲染；否则初始化
  const hasExisting =
    gameData.module2 &&
    gameData.module2.smallRoom &&
    gameData.module2.largeRoom &&
    ((gameData.module2.smallRoom.surfaceMembers &&
      gameData.module2.smallRoom.surfaceMembers.length > 0) ||
      (gameData.module2.largeRoom.surfaceMembers &&
        gameData.module2.largeRoom.surfaceMembers.length > 0) ||
      gameData.module2.smallGuard !== null ||
      gameData.module2.largeGuard !== null);

  if (!hasExisting) {
    // 重置模块2数据（采用与模块3/4一致的新结构）
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
      smallGuardReal: null,
      largeGuard: null,
      largeGuardReal: null,
    };
  } else {
    if (gameData.module2.smallGuardReal === undefined) {
      gameData.module2.smallGuardReal = gameData.module2.smallGuard;
    }
    if (gameData.module2.largeGuardReal === undefined) {
      gameData.module2.largeGuardReal = gameData.module2.largeGuard;
    }
  }

  const totalPlayers = getTotalPlayers();
  const { small: smallLimit, large: largeLimit } = getRoomLimits(totalPlayers);

  const smallTitle = document.querySelector("#small-room-2 h3 span:first-child");
  const largeTitle = document.querySelector("#large-room-2 h3 span:first-child");
  if (smallTitle) smallTitle.textContent = `小房间 (限${smallLimit}人)`;
  if (largeTitle) largeTitle.textContent = `大房间 (限${largeLimit}人)`;

  // 显示使者列表与房间：按当前状态渲染
  const playersContainer = document.getElementById("players-module-2");
  if (playersContainer) {
    playersContainer.innerHTML = "";

    const assignedIds = new Set([
      ...(gameData.module2.smallRoom.surfaceMembers || []),
      ...(gameData.module2.largeRoom.surfaceMembers || []),
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
  const smallContainer = document.querySelector("#small-room-2 .room-players");
  const largeContainer = document.querySelector("#large-room-2 .room-players");
  smallContainer.innerHTML = "";
  largeContainer.innerHTML = "";
  renderRoomPlayers("module2", "smallRoom", smallContainer);
  renderRoomPlayers("module2", "largeRoom", largeContainer);

  // 更新计数
  updateRoomCount("module2", "smallRoom", "small-count-2");
  updateRoomCount("module2", "largeRoom", "large-count-2");

  // 监管选择区域显示由 renderRoomPlayers 内逻辑控制

  // 切换到配置区域
  document.getElementById("result-2").classList.add("hidden");
  document.querySelector("#module-2 > div:first-child").classList.remove("hidden");

  // 根据完成状态启用/禁用确认
  checkRoomComplete("module2");

  // 显示第一轮结果
  if (gameData.module1) {
    const smallResultEl = document.getElementById("prev-round1-small-result");
    const largeResultEl = document.getElementById("prev-round1-large-result");
    
    if (smallResultEl) {
      smallResultEl.textContent = gameData.module1.smallRoom.surfaceLycheeState
        ? "荔枝被偷吃了"
        : "荔枝完好";
      smallResultEl.className = `text-lg font-bold ${
        gameData.module1.smallRoom.surfaceLycheeState
          ? "text-primary"
          : "text-dark"
      }`;
    }
    
    if (largeResultEl) {
      largeResultEl.textContent = gameData.module1.largeRoom.surfaceLycheeState
        ? "荔枝被偷吃了"
        : "荔枝完好";
      largeResultEl.className = `text-lg font-bold ${
        gameData.module1.largeRoom.surfaceLycheeState
          ? "text-primary"
          : "text-dark"
      }`;
    }

    // 显示第一轮小房间成员（被监管者通过颜色区分，不再显示文字）
    const prevRound1SmallMembers = document.getElementById("prev-round1-small-members");
    if (prevRound1SmallMembers) {
      prevRound1SmallMembers.innerHTML = "";
      gameData.module1.smallRoom.surfaceMembers.forEach((playerId) => {
        const player = gameData.players.find((p) => p.id === playerId);
        const tag = document.createElement("span");
        tag.className = `px-2 py-1 rounded text-sm ${
          playerId === gameData.module1.smallGuard
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-gray-100 text-gray-700"
        }`;
        tag.textContent = player ? player.name : String(playerId);
        prevRound1SmallMembers.appendChild(tag);
      });
    }

    // 显示第一轮大房间成员（被监管者通过颜色区分，不再显示文字）
    const prevRound1LargeMembers = document.getElementById("prev-round1-large-members");
    if (prevRound1LargeMembers) {
      prevRound1LargeMembers.innerHTML = "";
      gameData.module1.largeRoom.surfaceMembers.forEach((playerId) => {
        const player = gameData.players.find((p) => p.id === playerId);
        const tag = document.createElement("span");
        tag.className = `px-2 py-1 rounded text-sm ${
          playerId === gameData.module1.largeGuard
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-gray-100 text-gray-700"
        }`;
        tag.textContent = player ? player.name : String(playerId);
        prevRound1LargeMembers.appendChild(tag);
      });
    }
  }

  // 设置房间拖放事件
  setupRoomDropZone("small-room-2", smallLimit, "small-count-2", "module2", "smallRoom");
  setupRoomDropZone("large-room-2", largeLimit, "large-count-2", "module2", "largeRoom");
  setupModule2EventListeners();
  renderRoundGuidance("module2");
  setupDiscussionTimer("module2");
}


// 模块2随机分配函数
function randomAssignModule2() {
  // 清空现有分配
  gameData.module2.smallRoom.realMembers = [];
  gameData.module2.smallRoom.surfaceMembers = [];
  gameData.module2.largeRoom.realMembers = [];
  gameData.module2.largeRoom.surfaceMembers = [];
  gameData.module2.smallGuard = null;
  gameData.module2.smallGuardReal = null;
  gameData.module2.largeGuard = null;
  gameData.module2.largeGuardReal = null;

  // 清空房间显示
  const smallContainer = document.querySelector("#small-room-2 .room-players");
  const largeContainer = document.querySelector("#large-room-2 .room-players");
  smallContainer.innerHTML = "";
  largeContainer.innerHTML = "";

  // 随机打乱使者顺序
  const shuffledPlayers = [...gameData.players].sort(() => 0.5 - Math.random());

  const totalPlayers = getTotalPlayers();
  const { small: smallLimit, large: largeLimit } = getRoomLimits(totalPlayers);

  const smallRoomPlayers = shuffledPlayers.slice(0, smallLimit);
  const largeRoomPlayers = shuffledPlayers.slice(smallLimit, smallLimit + largeLimit);

  // 添加到小房间
  smallRoomPlayers.forEach((player) => {
    gameData.module2.smallRoom.realMembers.push(player.id);
    gameData.module2.smallRoom.surfaceMembers.push(player.id);
  });

  // 添加到大房间
  largeRoomPlayers.forEach((player) => {
    gameData.module2.largeRoom.realMembers.push(player.id);
    gameData.module2.largeRoom.surfaceMembers.push(player.id);
  });

  // 自动选择第一个使者作为监管者（确保监管者在对应房间中）
  if (smallRoomPlayers.length > 0) {
    gameData.module2.smallGuard = smallRoomPlayers[0].id;
    gameData.module2.smallGuardReal = gameData.module2.smallGuard;
    // 确保监管者在房间成员中
    if (
      !gameData.module2.smallRoom.realMembers.includes(
        gameData.module2.smallGuard
      )
    ) {
      gameData.module2.smallGuard = gameData.module2.smallRoom.realMembers[0];
      gameData.module2.smallGuardReal = gameData.module2.smallGuard;
    }
  }
  if (largeRoomPlayers.length > 0) {
    gameData.module2.largeGuard = largeRoomPlayers[0].id;
    gameData.module2.largeGuardReal = gameData.module2.largeGuard;
    // 确保监管者在房间成员中
    if (
      !gameData.module2.largeRoom.realMembers.includes(
        gameData.module2.largeGuard
      )
    ) {
      gameData.module2.largeGuard = gameData.module2.largeRoom.realMembers[0];
      gameData.module2.largeGuardReal = gameData.module2.largeGuard;
    }
  }

  // 更新显示
  updateRoomCount("module2", "smallRoom", "small-count-2");
  updateRoomCount("module2", "largeRoom", "large-count-2");

  renderRoomPlayers("module2", "smallRoom", smallContainer);
  renderRoomPlayers("module2", "largeRoom", largeContainer);

  // 重新渲染未分配玩家列表
  const playersContainer = document.getElementById("players-module-2");
  if (playersContainer) {
    playersContainer.innerHTML = "";
    const assignedIds = new Set([
      ...gameData.module2.smallRoom.surfaceMembers,
      ...gameData.module2.largeRoom.surfaceMembers,
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

  // 检查是否完成
  checkRoomComplete("module2");
}


// 确认模块2分配并计算结果
function confirmModule2() {
  if (gameData.module2.smallGuardReal === undefined) {
    gameData.module2.smallGuardReal = gameData.module2.smallGuard;
  }
  if (gameData.module2.largeGuardReal === undefined) {
    gameData.module2.largeGuardReal = gameData.module2.largeGuard;
  }

  const realSmallGuard =
    gameData.module2.smallGuardReal ?? gameData.module2.smallGuard;
  const realLargeGuard =
    gameData.module2.largeGuardReal ?? gameData.module2.largeGuard;

  // 计算小房间结果
  const smallRoomAddicts = gameData.module2.smallRoom.realMembers.filter(
    (id) =>
      gameData.lycheeAddicts.includes(id) && id !== realSmallGuard
  );
  const smallRoomNormalState = smallRoomAddicts.length > 0;
  
  // 检查骨哨虫王是否强制改变了小房间状态（需要同时检查目标房间和能力是否真的被使用）
  const boneWhistleKing = gameData.players.find((p) => p.specialRole === "boneWhistleKing");
  const boneWhistleKingUsed = boneWhistleKing && boneWhistleKing.abilityUsage && boneWhistleKing.abilityUsage["module2"];
  const boneWhistleKingTarget = gameData.boneWhistleKingTarget && gameData.boneWhistleKingTarget["module2"];
  const smallRoomForced = boneWhistleKingUsed && boneWhistleKingTarget === "smallRoom";
  
  gameData.module2.smallRoom.realLycheeState = smallRoomForced ? true : smallRoomNormalState;
  gameData.module2.smallRoom.surfaceLycheeState = gameData.module2.smallRoom.realLycheeState;

  // 计算大房间结果
  const largeRoomAddicts = gameData.module2.largeRoom.realMembers.filter(
    (id) =>
      gameData.lycheeAddicts.includes(id) && id !== realLargeGuard
  );
  const largeRoomNormalState = largeRoomAddicts.length > 0;
  
  // 检查骨哨虫王是否强制改变了大房间状态
  const largeRoomForced = boneWhistleKingUsed && boneWhistleKingTarget === "largeRoom";
  
  gameData.module2.largeRoom.realLycheeState = largeRoomForced ? true : largeRoomNormalState;
  gameData.module2.largeRoom.surfaceLycheeState = gameData.module2.largeRoom.realLycheeState;

  // 记录本轮（第2轮）偷吃的荔枝瘾成员（仅非监管者），供偷吃历史统计使用
  const eatenRound = 2;
  const markEaten = (playerId) => {
    const player = gameData.players.find(p => p.id === playerId);
    if (!player) return;
    if (!player.activationHistory) player.activationHistory = [];
    if (!player.activationHistory.includes(eatenRound)) {
      player.activationHistory.push(eatenRound);
    }
    if (player.specialRole === "silentWhisper") {
      player.silentCharges = (player.silentCharges || 0) + 1;
      player.abilityUsed = (player.abilityUses || 0) >= player.silentCharges;
      if (typeof recordSilentWhisperChargeGain === "function") {
        recordSilentWhisperChargeGain(player.id, "module2", 1);
      }
    }
  };
  smallRoomAddicts.forEach(markEaten);
  largeRoomAddicts.forEach(markEaten);

  const smallTitleEl = document.getElementById("small-result-title-2");
  if (smallTitleEl) {
    smallTitleEl.textContent = `小房间`;
  }
  const largeTitleEl = document.getElementById("large-result-title-2");
  if (largeTitleEl) {
    largeTitleEl.textContent = `大房间`;
  }

  // 更新结果显示
  const smallResultEl = document.getElementById("small-result-2");
  const largeResultEl = document.getElementById("large-result-2");

  // 显示结果时使用真实荔枝状态（因为所有人都能看到荔枝是否还在）
  smallResultEl.textContent = gameData.module2.smallRoom.realLycheeState
    ? "荔枝被偷吃了"
    : "荔枝完好";
  smallResultEl.className = `text-lg ${
    gameData.module2.smallRoom.realLycheeState
      ? "text-primary font-bold"
      : "text-dark"
  }`;

  largeResultEl.textContent = gameData.module2.largeRoom.realLycheeState
    ? "荔枝被偷吃了"
    : "荔枝完好";
  largeResultEl.className = `text-lg ${
    gameData.module2.largeRoom.realLycheeState
      ? "text-primary font-bold"
      : "text-dark"
  }`;

  // 显示被监管者
  const smallGuardPlayer = gameData.players.find(
    (p) => p.id === gameData.module2.smallGuard
  );
  const largeGuardPlayer = gameData.players.find(
    (p) => p.id === gameData.module2.largeGuard
  );

  document.getElementById("small-guard-2").textContent = smallGuardPlayer.name;
  document.getElementById("large-guard-2").textContent = largeGuardPlayer.name;

  // 显示小房间成员列表
  const smallMembersContainer = document.getElementById("small-room-members-2");
  smallMembersContainer.innerHTML = "";
  gameData.module2.smallRoom.surfaceMembers.forEach((playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    const memberTag = document.createElement("span");
    // 给被监管者添加特殊样式
    memberTag.className = `px-2 py-1 rounded ${
      playerId === gameData.module2.smallGuard
        ? "bg-primary/10 text-primary"
        : "bg-gray-100"
    }`;
    memberTag.textContent = player.name;
    smallMembersContainer.appendChild(memberTag);
  });

  // 显示大房间成员列表
  const largeMembersContainer = document.getElementById("large-room-members-2");
  largeMembersContainer.innerHTML = "";
  gameData.module2.largeRoom.surfaceMembers.forEach((playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    const memberTag = document.createElement("span");
    // 给被监管者添加特殊样式
    memberTag.className = `px-2 py-1 rounded ${
      playerId === gameData.module2.largeGuard
        ? "bg-primary/10 text-primary"
        : "bg-gray-100"
    }`;
    memberTag.textContent = player.name;
    largeMembersContainer.appendChild(memberTag);
  });

  renderSettlementInfo("module2");
  if (typeof renderGoldenMonkSanctuaryAnnouncement === "function") {
    renderGoldenMonkSanctuaryAnnouncement("module2");
  }

  if (typeof logModuleRealStatus === "function") {
    logModuleRealStatus("module2");
  }

  // 隐藏配置区域，显示结果
  document.querySelector("#module-2 > div:first-child").classList.add("hidden");
  document.getElementById("result-2").classList.remove("hidden");
}


// 设置模块2事件监听器
function setupModule2EventListeners() {
    // 返回按钮
    document.getElementById('back-to-1').addEventListener('click', () => {
      // 返回第一轮结果页面
      hideAllModules();
      // 显示 module-1 并切换到结果区域
      const configSection = document.querySelector("#module-1 > div:first-child");
      if (configSection) configSection.classList.add("hidden");
      const resultSection = document.getElementById("result-1");
      if (resultSection) {
        resultSection.classList.remove("hidden");
      }
      // 重新渲染结果以确保数据正确
      if (typeof renderModule1Result === "function") {
        renderModule1Result();
      }
      showModule(1);
      gameData.currentPhase = 1;
      updateGameStatus();
    });
    
    // 确认分配按钮
    document.getElementById('confirm-2').addEventListener('click', () => {
        if (checkRoomComplete('module2')) {
            showArrestModal('module2');
        }
    });
    
    // 随机分配按钮
    document.getElementById('random-module-2').addEventListener('click', randomAssignModule2);
    
    // 结果页返回修改按钮
    document.getElementById('back-to-2-config').addEventListener('click', () => {
        resetModuleAbilities('module2', { clearMuEnAngelBlessing: true });
        // 恢复真实成员为表面成员
        restoreRealFromSurface('module2');
        if (typeof resetGuardsForModuleOnBack === 'function') {
            resetGuardsForModuleOnBack('module2');
        }
        document.querySelector('#module-2 > div:first-child').classList.remove('hidden');
        document.getElementById('result-2').classList.add('hidden');
    });
    
    // 进入下一模块按钮
    document.getElementById('to-module-3').addEventListener('click', () => {
        initModule3();
        showModule(3);
    });
}