/**
 * 第三轮审查模块（module3）
 * 
 * 本模块负责第三轮审查的房间分配和结果计算，包括：
 * - 玩家分配到小房间/大房间
 * - 监管者选择
 * - 荔枝偷吃结果计算
 * - 能力使用流程
 * - 显示前两轮审查结果
 *
 * 函数分类：
 *
 * 【初始化与配置】
 * - initModule3(): 初始化第三轮审查模块，并沿用当前人数上限，显示前两轮结果
 * - randomAssignModule3(): 在动态容量限制下随机分配房间，并更新未分配玩家列表
 *
 * 【结果计算与显示】
 * - confirmModule3(): 确认第三轮分配并计算结果（包含结果渲染逻辑）
 *
 * 【事件处理】
 * - setupModule3EventListeners(): 设置第三轮审查模块事件
 */


// 初始化模块3
function initModule3() {
  // 清除房间选中状态
  if (typeof clearRoomSelection === 'function') {
    clearRoomSelection();
  }

  // 如果已存在配置（跨模块返回时），不重置数据，直接按现有状态渲染
  const hasExisting =
    gameData.module3 &&
    gameData.module3.smallRoom &&
    gameData.module3.largeRoom &&
    ((gameData.module3.smallRoom.surfaceMembers &&
      gameData.module3.smallRoom.surfaceMembers.length > 0) ||
      (gameData.module3.largeRoom.surfaceMembers &&
        gameData.module3.largeRoom.surfaceMembers.length > 0) ||
      gameData.module3.smallGuard !== null ||
      gameData.module3.largeGuard !== null);

  if (!hasExisting) {
    // 首次进入：重置模块3数据
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
  }

  const totalPlayers = getTotalPlayers();
  const { small: smallLimit, large: largeLimit } = getRoomLimits(totalPlayers);

  const smallTitle = document.querySelector("#small-room-3 h3 span:first-child");
  const largeTitle = document.querySelector("#large-room-3 h3 span:first-child");
  if (smallTitle) smallTitle.textContent = `小房间 (限${smallLimit}人)`;
  if (largeTitle) largeTitle.textContent = `大房间 (限${largeLimit}人)`;

  // 显示使者列表与房间：按当前状态渲染
  const playersContainer = document.getElementById("players-module-3");
  if (playersContainer) {
    playersContainer.innerHTML = "";

    const assignedIds = new Set([
      ...(gameData.module3.smallRoom.surfaceMembers || []),
      ...(gameData.module3.largeRoom.surfaceMembers || []),
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
  const smallContainer = document.querySelector("#small-room-3 .room-players");
  const largeContainer = document.querySelector("#large-room-3 .room-players");
  smallContainer.innerHTML = "";
  largeContainer.innerHTML = "";
  renderRoomPlayers("module3", "smallRoom", smallContainer);
  renderRoomPlayers("module3", "largeRoom", largeContainer);

  // 更新计数
  updateRoomCount("module3", "smallRoom", "small-count-3");
  updateRoomCount("module3", "largeRoom", "large-count-3");

  // 确保监管选择区域根据渲染状态自动处理（在 renderRoomPlayers 中完成）

  // 切换到配置区域
  document.getElementById("result-3").classList.add("hidden");
  document.querySelector("#module-3 > div:first-child").classList.remove("hidden");

  // 根据完成状态启用/禁用确认
  checkRoomComplete("module3");

  // 显示第一轮结果
  if (gameData.module1) {
    const smallResultEl = document.getElementById("prev-round1-small-result-mod3");
    const largeResultEl = document.getElementById("prev-round1-large-result-mod3");
    
    if (smallResultEl) {
      smallResultEl.textContent = gameData.module1.smallRoom.surfaceLycheeState
        ? "被偷吃"
        : "完好";
      smallResultEl.className = `text-sm font-bold ${
        gameData.module1.smallRoom.surfaceLycheeState
          ? "text-primary"
          : "text-dark"
      }`;
    }
    
    if (largeResultEl) {
      largeResultEl.textContent = gameData.module1.largeRoom.surfaceLycheeState
        ? "被偷吃"
        : "完好";
      largeResultEl.className = `text-sm font-bold ${
        gameData.module1.largeRoom.surfaceLycheeState
          ? "text-primary"
          : "text-dark"
      }`;
    }

    const prevRound1SmallMembersMod3 = document.getElementById("prev-round1-small-members-mod3");
    if (prevRound1SmallMembersMod3) {
      prevRound1SmallMembersMod3.innerHTML = "";
      gameData.module1.smallRoom.surfaceMembers.forEach((playerId) => {
        const player = gameData.players.find((p) => p.id === playerId);
        const tag = document.createElement("span");
        tag.className = `px-1.5 py-0.5 rounded text-xs ${
          playerId === gameData.module1.smallGuard
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-gray-100 text-gray-700"
        }`;
        tag.textContent = player ? player.name : String(playerId);
        prevRound1SmallMembersMod3.appendChild(tag);
      });
    }

    const prevRound1LargeMembersMod3 = document.getElementById("prev-round1-large-members-mod3");
    if (prevRound1LargeMembersMod3) {
      prevRound1LargeMembersMod3.innerHTML = "";
      gameData.module1.largeRoom.surfaceMembers.forEach((playerId) => {
        const player = gameData.players.find((p) => p.id === playerId);
        const tag = document.createElement("span");
        tag.className = `px-1.5 py-0.5 rounded text-xs ${
          playerId === gameData.module1.largeGuard
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-gray-100 text-gray-700"
        }`;
        tag.textContent = player ? player.name : String(playerId);
        prevRound1LargeMembersMod3.appendChild(tag);
      });
    }
  }

  // 显示第二轮结果
  const prevSmallResultEl = document.getElementById("prev-small-result");
  const prevLargeResultEl = document.getElementById("prev-large-result");
  
  if (prevSmallResultEl) {
    prevSmallResultEl.textContent = gameData.module2.smallRoom.surfaceLycheeState
      ? "被偷吃"
      : "完好";
    prevSmallResultEl.className = `text-sm font-bold ${
      gameData.module2.smallRoom.surfaceLycheeState
        ? "text-primary"
        : "text-dark"
    }`;
  }
  
  if (prevLargeResultEl) {
    prevLargeResultEl.textContent = gameData.module2.largeRoom.surfaceLycheeState
      ? "被偷吃"
      : "完好";
    prevLargeResultEl.className = `text-sm font-bold ${
      gameData.module2.largeRoom.surfaceLycheeState
        ? "text-primary"
        : "text-dark"
    }`;
  }

  // 显示第二轮小房间成员（被监管者通过颜色区分）
  const prevSmallMembers = document.getElementById("prev-small-members");
  if (prevSmallMembers) {
    prevSmallMembers.innerHTML = "";
    gameData.module2.smallRoom.surfaceMembers.forEach((playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      const tag = document.createElement("span");
      tag.className = `px-1.5 py-0.5 rounded text-xs ${
        playerId === gameData.module2.smallGuard
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-gray-100 text-gray-700"
      }`;
      tag.textContent = player ? player.name : String(playerId);
      prevSmallMembers.appendChild(tag);
    });
  }

  // 显示第二轮大房间成员（被监管者通过颜色区分）
  const prevLargeMembers = document.getElementById("prev-large-members");
  if (prevLargeMembers) {
    prevLargeMembers.innerHTML = "";
    gameData.module2.largeRoom.surfaceMembers.forEach((playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      const tag = document.createElement("span");
      tag.className = `px-1.5 py-0.5 rounded text-xs ${
        playerId === gameData.module2.largeGuard
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-gray-100 text-gray-700"
      }`;
      tag.textContent = player ? player.name : String(playerId);
      prevLargeMembers.appendChild(tag);
    });
  }

  // 设置房间拖放事件
  setupRoomDropZone("small-room-3", smallLimit, "small-count-3", "module3", "smallRoom");
  setupRoomDropZone("large-room-3", largeLimit, "large-count-3", "module3", "largeRoom");
  setupModule3EventListeners();
  renderRoundGuidance("module3");
  setupDiscussionTimer("module3");
}


// 模块3随机分配函数
function randomAssignModule3() {
  // 清空现有分配
  gameData.module3.smallRoom.realMembers = [];
  gameData.module3.smallRoom.surfaceMembers = [];
  gameData.module3.largeRoom.realMembers = [];
  gameData.module3.largeRoom.surfaceMembers = [];
  gameData.module3.smallGuard = null;
  gameData.module3.largeGuard = null;

  // 清空房间显示
  const smallContainer = document.querySelector("#small-room-3 .room-players");
  const largeContainer = document.querySelector("#large-room-3 .room-players");
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
    gameData.module3.smallRoom.realMembers.push(player.id);
    gameData.module3.smallRoom.surfaceMembers.push(player.id);
  });

  // 添加到大房间
  largeRoomPlayers.forEach((player) => {
    gameData.module3.largeRoom.realMembers.push(player.id);
    gameData.module3.largeRoom.surfaceMembers.push(player.id);
  });

  // 自动选择第一个使者作为监管者（确保监管者在对应房间中）
  if (smallRoomPlayers.length > 0) {
    gameData.module3.smallGuard = smallRoomPlayers[0].id;
    // 确保监管者在房间成员中
    if (
      !gameData.module3.smallRoom.realMembers.includes(
        gameData.module3.smallGuard
      )
    ) {
      gameData.module3.smallGuard = gameData.module3.smallRoom.realMembers[0];
    }
  }
  if (largeRoomPlayers.length > 0) {
    gameData.module3.largeGuard = largeRoomPlayers[0].id;
    // 确保监管者在房间成员中
    if (
      !gameData.module3.largeRoom.realMembers.includes(
        gameData.module3.largeGuard
      )
    ) {
      gameData.module3.largeGuard = gameData.module3.largeRoom.realMembers[0];
    }
  }

  // 更新显示
  updateRoomCount("module3", "smallRoom", "small-count-3");
  updateRoomCount("module3", "largeRoom", "large-count-3");

  renderRoomPlayers("module3", "smallRoom", smallContainer);
  renderRoomPlayers("module3", "largeRoom", largeContainer);

  // 重新渲染未分配玩家列表
  const playersContainer = document.getElementById("players-module-3");
  if (playersContainer) {
    playersContainer.innerHTML = "";
    const assignedIds = new Set([
      ...gameData.module3.smallRoom.surfaceMembers,
      ...gameData.module3.largeRoom.surfaceMembers,
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
  checkRoomComplete("module3");
}


// 确认模块3分配并计算结果
function confirmModule3() {
  // 若未初始化真实监管者，默认使用表面监管者
  if (gameData.module3.smallGuardReal === undefined) {
    gameData.module3.smallGuardReal = gameData.module3.smallGuard;
  }
  if (gameData.module3.largeGuardReal === undefined) {
    gameData.module3.largeGuardReal = gameData.module3.largeGuard;
  }

  const realSmallGuard = gameData.module3.smallGuardReal ?? gameData.module3.smallGuard;
  const realLargeGuard = gameData.module3.largeGuardReal ?? gameData.module3.largeGuard;

  // 计算小房间结果
  const smallRoomAddicts = gameData.module3.smallRoom.realMembers.filter(
    (id) =>
      gameData.lycheeAddicts.includes(id) && id !== realSmallGuard
  );
  const smallRoomNormalState = smallRoomAddicts.length > 0;
  
  // 检查骨哨虫王是否强制改变了小房间状态（需要同时检查目标房间和能力是否真的被使用）
  const boneWhistleKing = gameData.players.find((p) => p.specialRole === "boneWhistleKing");
  const boneWhistleKingUsed = boneWhistleKing && boneWhistleKing.abilityUsage && boneWhistleKing.abilityUsage["module3"];
  const boneWhistleKingTarget = gameData.boneWhistleKingTarget && gameData.boneWhistleKingTarget["module3"];
  const smallRoomForced = boneWhistleKingUsed && boneWhistleKingTarget === "smallRoom";
  
  gameData.module3.smallRoom.realLycheeState = smallRoomForced ? true : smallRoomNormalState;
  gameData.module3.smallRoom.surfaceLycheeState = gameData.module3.smallRoom.realLycheeState;

  // 计算大房间结果
  const largeRoomAddicts = gameData.module3.largeRoom.realMembers.filter(
    (id) =>
      gameData.lycheeAddicts.includes(id) && id !== realLargeGuard
  );
  const largeRoomNormalState = largeRoomAddicts.length > 0;
  
  // 检查骨哨虫王是否强制改变了大房间状态
  const largeRoomForced = boneWhistleKingUsed && boneWhistleKingTarget === "largeRoom";
  
  gameData.module3.largeRoom.realLycheeState = largeRoomForced ? true : largeRoomNormalState;
  gameData.module3.largeRoom.surfaceLycheeState = gameData.module3.largeRoom.realLycheeState;

  // 记录本轮（第3轮）偷吃的荔枝瘾成员（仅非监管者），供偷吃历史统计使用
  const eatenRound = 3;
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
        recordSilentWhisperChargeGain(player.id, "module3", 1);
      }
    }
  };
  smallRoomAddicts.forEach(markEaten);
  largeRoomAddicts.forEach(markEaten);

  const smallTitleEl = document.getElementById("small-result-title-3");
  if (smallTitleEl) {
    smallTitleEl.textContent = `小房间`;
  }
  const largeTitleEl = document.getElementById("large-result-title-3");
  if (largeTitleEl) {
    largeTitleEl.textContent = `大房间`;
  }

  // 更新结果显示
  const smallResultEl = document.getElementById("small-result-3");
  const largeResultEl = document.getElementById("large-result-3");

  // 显示结果时使用真实荔枝状态（因为所有人都能看到荔枝是否还在）
  smallResultEl.textContent = gameData.module3.smallRoom.realLycheeState
    ? "荔枝被偷吃了"
    : "荔枝完好";
  smallResultEl.className = `text-lg ${
    gameData.module3.smallRoom.realLycheeState
      ? "text-primary font-bold"
      : "text-dark"
  }`;

  largeResultEl.textContent = gameData.module3.largeRoom.realLycheeState
    ? "荔枝被偷吃了"
    : "荔枝完好";
  largeResultEl.className = `text-lg ${
    gameData.module3.largeRoom.realLycheeState
      ? "text-primary font-bold"
      : "text-dark"
  }`;

  // 显示被监管者
  const smallGuardPlayer = gameData.players.find(
    (p) => p.id === gameData.module3.smallGuard
  );
  const largeGuardPlayer = gameData.players.find(
    (p) => p.id === gameData.module3.largeGuard
  );

  document.getElementById("small-guard-3").textContent = smallGuardPlayer ? smallGuardPlayer.name : "未选择";
  document.getElementById("large-guard-3").textContent = largeGuardPlayer ? largeGuardPlayer.name : "未选择";

  // 显示第三轮小房间成员列表
  const smallMembersContainer = document.getElementById("small-room-members-3");
  smallMembersContainer.innerHTML = "";
  gameData.module3.smallRoom.surfaceMembers.forEach((playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    const memberTag = document.createElement("span");
    memberTag.className = `px-2 py-1 rounded ${
      playerId === gameData.module3.smallGuard
        ? "bg-primary/10 text-primary"
        : "bg-gray-100"
    }`;
    memberTag.textContent = player ? player.name : String(playerId);
    smallMembersContainer.appendChild(memberTag);
  });

  // 显示第三轮大房间成员列表
  const largeMembersContainer = document.getElementById("large-room-members-3");
  largeMembersContainer.innerHTML = "";
  gameData.module3.largeRoom.surfaceMembers.forEach((playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    const memberTag = document.createElement("span");
    memberTag.className = `px-2 py-1 rounded ${
      playerId === gameData.module3.largeGuard
        ? "bg-primary/10 text-primary"
        : "bg-gray-100"
    }`;
    memberTag.textContent = player ? player.name : String(playerId);
    largeMembersContainer.appendChild(memberTag);
  });

  renderSettlementInfo("module3");
  if (typeof renderGoldenMonkSanctuaryAnnouncement === "function") {
    renderGoldenMonkSanctuaryAnnouncement("module3");
  }

  if (typeof logModuleRealStatus === "function") {
    logModuleRealStatus("module3");
  }

  // 隐藏配置区域，显示结果
  document.querySelector("#module-3 > div:first-child").classList.add("hidden");
  document.getElementById("result-3").classList.remove("hidden");
}


// 设置模块3事件监听器
function setupModule3EventListeners() {
    // 返回按钮 - 返回模块2结果页
    document.getElementById('back-to-2').addEventListener('click', () => {
        resetModuleAbilities('module3');
        showModule(2);
        document.getElementById('result-2').classList.remove('hidden');
        document.querySelector('#module-2 > div:first-child').classList.add('hidden');
    });
    
    // 确认分配按钮
    document.getElementById('confirm-3').addEventListener('click', () => {
        if (checkRoomComplete('module3')) {
            showArrestModal('module3');
        }
    });
    
    // 随机分配按钮
    document.getElementById('random-module-3').addEventListener('click', randomAssignModule3);
    
    // 结果页返回修改按钮
    document.getElementById('back-to-3-config').addEventListener('click', () => {
        resetModuleAbilities('module3');
        // 恢复真实成员为表面成员
        restoreRealFromSurface('module3');
        // 修正监管者（若为已在本模块使用能力的易容术士或无效）
        if (typeof resetGuardsForModuleOnBack === 'function') {
            resetGuardsForModuleOnBack('module3');
        }
        document.querySelector('#module-3 > div:first-child').classList.remove('hidden');
        document.getElementById('result-3').classList.add('hidden');
    });
    
    // 进入下一模块按钮
    document.getElementById('to-module-4').addEventListener('click', () => {
        initModule4();
        showModule(4);
    });
}