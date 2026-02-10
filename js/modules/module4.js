/**
 * 第四轮审查模块（module4）
 * 
 * 本模块负责第四轮审查的房间分配和结果计算，包括：
 * - 玩家分配到3个房间（无人数限制）
 * - 监管者选择
 * - 荔枝偷吃结果计算
 * - 能力使用流程
 * - 显示前三轮审查结果
 *
 * 函数分类：
 *
 * 【初始化与配置】
 * - initModule4(): 初始化第四轮审查模块，显示前三轮结果
 * - randomAssignModule4(): 随机分配第四轮房间，并更新未分配玩家列表
 *
 * 【结果计算与显示】
 * - confirmModule4(): 确认第四轮分配并计算结果（包含结果渲染逻辑）
 *
 * 【事件处理】
 * - setupModule4EventListeners(): 设置模块4事件监听器
 */


// 初始化第四轮审查（模块4）
function initModule4() {
  // 清除房间选中状态
  if (typeof clearRoomSelection === 'function') {
    clearRoomSelection();
  }

  // 若已有配置（跨模块返回），不重置，直接按现有状态渲染；否则初始化
  const hasExisting =
    gameData.module4 &&
    gameData.module4.room1 &&
    gameData.module4.room2 &&
    gameData.module4.room3 &&
    ((gameData.module4.room1.surfaceMembers && gameData.module4.room1.surfaceMembers.length > 0) ||
      (gameData.module4.room2.surfaceMembers && gameData.module4.room2.surfaceMembers.length > 0) ||
      (gameData.module4.room3.surfaceMembers && gameData.module4.room3.surfaceMembers.length > 0) ||
      gameData.module4.guard1 !== null ||
      gameData.module4.guard2 !== null ||
      gameData.module4.guard3 !== null);

  if (!hasExisting) {
    // 重置模块4数据
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
  }

  // 显示使者列表与房间：按当前状态渲染
  const playersContainer = document.getElementById("players-module-4");
  if (playersContainer) {
    playersContainer.innerHTML = "";

    const assignedIds = new Set([
      ...(gameData.module4.room1.surfaceMembers || []),
      ...(gameData.module4.room2.surfaceMembers || []),
      ...(gameData.module4.room3.surfaceMembers || []),
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

  // 清空并渲染房间成员
  const room1Container = document.querySelector("#room-1-4 .room-players");
  const room2Container = document.querySelector("#room-2-4 .room-players");
  const room3Container = document.querySelector("#room-3-4 .room-players");
  room1Container.innerHTML = "";
  room2Container.innerHTML = "";
  room3Container.innerHTML = "";
  renderRoomPlayers("module4", "room1", room1Container);
  renderRoomPlayers("module4", "room2", room2Container);
  renderRoomPlayers("module4", "room3", room3Container);

  // 监管选择区由 renderRoomPlayers 中自动控制

  // 隐藏结果，显示配置区域
  document.getElementById("result-4").classList.add("hidden");
  document.querySelector("#module-4 > div:first-child").classList.remove("hidden");

  // 根据完成状态更新确认按钮
  checkRoomComplete("module4");

  // 显示第一轮结果
  if (gameData.module1) {
    const smallResultEl = document.getElementById("prev-round1-small-result-mod4");
    const largeResultEl = document.getElementById("prev-round1-large-result-mod4");
    
    if (smallResultEl) {
      smallResultEl.textContent = gameData.module1.smallRoom.surfaceLycheeState
        ? "被偷吃"
        : "完好";
      smallResultEl.className = `text-xs font-bold ${
        gameData.module1.smallRoom.surfaceLycheeState
          ? "text-primary"
          : "text-dark"
      }`;
    }
    
    if (largeResultEl) {
      largeResultEl.textContent = gameData.module1.largeRoom.surfaceLycheeState
        ? "被偷吃"
        : "完好";
      largeResultEl.className = `text-xs font-bold ${
        gameData.module1.largeRoom.surfaceLycheeState
          ? "text-primary"
          : "text-dark"
      }`;
    }

    const prevRound1SmallMembersMod4 = document.getElementById("prev-round1-small-members-mod4");
    if (prevRound1SmallMembersMod4) {
      prevRound1SmallMembersMod4.innerHTML = "";
      gameData.module1.smallRoom.surfaceMembers.forEach((playerId) => {
        const player = gameData.players.find((p) => p.id === playerId);
        const tag = document.createElement("span");
        tag.className = `px-1 py-0.5 rounded text-xs ${
          playerId === gameData.module1.smallGuard
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-gray-100 text-gray-700"
        }`;
        tag.textContent = player ? player.name : String(playerId);
        prevRound1SmallMembersMod4.appendChild(tag);
      });
    }

    const prevRound1LargeMembersMod4 = document.getElementById("prev-round1-large-members-mod4");
    if (prevRound1LargeMembersMod4) {
      prevRound1LargeMembersMod4.innerHTML = "";
      gameData.module1.largeRoom.surfaceMembers.forEach((playerId) => {
        const player = gameData.players.find((p) => p.id === playerId);
        const tag = document.createElement("span");
        tag.className = `px-1 py-0.5 rounded text-xs ${
          playerId === gameData.module1.largeGuard
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-gray-100 text-gray-700"
        }`;
        tag.textContent = player ? player.name : String(playerId);
        prevRound1LargeMembersMod4.appendChild(tag);
      });
    }
  }

  // 显示第二轮结果
  const prev1SmallResultEl = document.getElementById("prev1-small-result");
  const prev1LargeResultEl = document.getElementById("prev1-large-result");
  
  if (prev1SmallResultEl) {
    prev1SmallResultEl.textContent = gameData.module2.smallRoom.surfaceLycheeState
      ? "被偷吃"
      : "完好";
    prev1SmallResultEl.className = `text-xs font-bold ${
      gameData.module2.smallRoom.surfaceLycheeState
        ? "text-primary"
        : "text-dark"
    }`;
  }
  
  if (prev1LargeResultEl) {
    prev1LargeResultEl.textContent = gameData.module2.largeRoom.surfaceLycheeState
      ? "被偷吃"
      : "完好";
    prev1LargeResultEl.className = `text-xs font-bold ${
      gameData.module2.largeRoom.surfaceLycheeState
        ? "text-primary"
        : "text-dark"
    }`;
  }

  // 显示第二轮成员列表（被监管者通过颜色区分）
  const prev1SmallMembers = document.getElementById("prev1-small-members");
  if (prev1SmallMembers) {
    prev1SmallMembers.innerHTML = "";
    gameData.module2.smallRoom.surfaceMembers.forEach((playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      const tag = document.createElement("span");
      tag.className = `px-1 py-0.5 rounded text-xs ${
        playerId === gameData.module2.smallGuard
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-gray-100 text-gray-700"
      }`;
      tag.textContent = player ? player.name : String(playerId);
      prev1SmallMembers.appendChild(tag);
    });
  }

  const prev1LargeMembers = document.getElementById("prev1-large-members");
  if (prev1LargeMembers) {
    prev1LargeMembers.innerHTML = "";
    gameData.module2.largeRoom.surfaceMembers.forEach((playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      const tag = document.createElement("span");
      tag.className = `px-1 py-0.5 rounded text-xs ${
        playerId === gameData.module2.largeGuard
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-gray-100 text-gray-700"
      }`;
      tag.textContent = player ? player.name : String(playerId);
      prev1LargeMembers.appendChild(tag);
    });
  }

  // 显示第三轮结果
  const prev2SmallResultEl = document.getElementById("prev2-small-result");
  const prev2LargeResultEl = document.getElementById("prev2-large-result");
  
  if (prev2SmallResultEl) {
    prev2SmallResultEl.textContent = gameData.module3.smallRoom.surfaceLycheeState
      ? "被偷吃"
      : "完好";
    prev2SmallResultEl.className = `text-xs font-bold ${
      gameData.module3.smallRoom.surfaceLycheeState
        ? "text-primary"
        : "text-dark"
    }`;
  }
  
  if (prev2LargeResultEl) {
    prev2LargeResultEl.textContent = gameData.module3.largeRoom.surfaceLycheeState
      ? "被偷吃"
      : "完好";
    prev2LargeResultEl.className = `text-xs font-bold ${
      gameData.module3.largeRoom.surfaceLycheeState
        ? "text-primary"
        : "text-dark"
    }`;
  }

  // 显示第三轮成员列表（被监管者通过颜色区分）
  const prev2SmallMembers = document.getElementById("prev2-small-members");
  if (prev2SmallMembers) {
    prev2SmallMembers.innerHTML = "";
    gameData.module3.smallRoom.surfaceMembers.forEach((playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      const tag = document.createElement("span");
      tag.className = `px-1 py-0.5 rounded text-xs ${
        playerId === gameData.module3.smallGuard
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-gray-100 text-gray-700"
      }`;
      tag.textContent = player ? player.name : String(playerId);
      prev2SmallMembers.appendChild(tag);
    });
  }

  const prev2LargeMembers = document.getElementById("prev2-large-members");
  if (prev2LargeMembers) {
    prev2LargeMembers.innerHTML = "";
    gameData.module3.largeRoom.surfaceMembers.forEach((playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      const tag = document.createElement("span");
      tag.className = `px-1 py-0.5 rounded text-xs ${
        playerId === gameData.module3.largeGuard
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-gray-100 text-gray-700"
      }`;
      tag.textContent = player ? player.name : String(playerId);
      prev2LargeMembers.appendChild(tag);
    });
  }

  // 设置房间拖放事件
  setupRoomDropZone("room-1-4", Infinity, "room-1-count-4", "module4", "room1");
  setupRoomDropZone("room-2-4", Infinity, "room-2-count-4", "module4", "room2");
  setupRoomDropZone("room-3-4", Infinity, "room-3-count-4", "module4", "room3");

  // 添加人数显示元素
  document.querySelectorAll("#module-4 .room h3").forEach((h3, index) => {
    // 避免重复添加
    if (!document.getElementById(`room-${index + 1}-count-4`)) {
      const countSpan = document.createElement("span");
      countSpan.id = `room-${index + 1}-count-4`;
      countSpan.className = "bg-light px-2 py-1 rounded-full text-sm ml-2";
      countSpan.textContent = "0人";
      h3.appendChild(countSpan);
    }
  });
  setupModule4EventListeners();
  renderRoundGuidance("module4");
  setupDiscussionTimer("module4");
}


// 模块4随机分配函数
function randomAssignModule4() {
  // 清空现有分配
  gameData.module4.room1.realMembers = [];
  gameData.module4.room1.surfaceMembers = [];
  gameData.module4.room2.realMembers = [];
  gameData.module4.room2.surfaceMembers = [];
  gameData.module4.room3.realMembers = [];
  gameData.module4.room3.surfaceMembers = [];
  gameData.module4.guard1 = null;
  gameData.module4.guard2 = null;
  gameData.module4.guard3 = null;

  // 清空房间显示
  const room1Container = document.querySelector("#room-1-4 .room-players");
  const room2Container = document.querySelector("#room-2-4 .room-players");
  const room3Container = document.querySelector("#room-3-4 .room-players");
  room1Container.innerHTML = "";
  room2Container.innerHTML = "";
  room3Container.innerHTML = "";

  // 随机分配每个使者到3个房间中的一个
  gameData.players.forEach((player) => {
    const randomRoom = Math.floor(Math.random() * 3) + 1; // 1-3
    gameData.module4[`room${randomRoom}`].realMembers.push(player.id);
    gameData.module4[`room${randomRoom}`].surfaceMembers.push(player.id);
  });

  // 为每个非空房间自动选择第一个使者作为监管者（确保监管者有效性）
  if (gameData.module4.room1.realMembers.length > 0) {
    gameData.module4.guard1 = gameData.module4.room1.realMembers[0];
    // 确保监管者在房间成员中
    if (!gameData.module4.room1.realMembers.includes(gameData.module4.guard1)) {
      gameData.module4.guard1 = gameData.module4.room1.realMembers[0];
    }
  }
  if (gameData.module4.room2.realMembers.length > 0) {
    gameData.module4.guard2 = gameData.module4.room2.realMembers[0];
    // 确保监管者在房间成员中
    if (!gameData.module4.room2.realMembers.includes(gameData.module4.guard2)) {
      gameData.module4.guard2 = gameData.module4.room2.realMembers[0];
    }
  }
  if (gameData.module4.room3.realMembers.length > 0) {
    gameData.module4.guard3 = gameData.module4.room3.realMembers[0];
    // 确保监管者在房间成员中
    if (!gameData.module4.room3.realMembers.includes(gameData.module4.guard3)) {
      gameData.module4.guard3 = gameData.module4.room3.realMembers[0];
    }
  }

  // 更新显示
  updateRoomCount("module4", "room1", "room-1-count-4");
  updateRoomCount("module4", "room2", "room-2-count-4");
  updateRoomCount("module4", "room3", "room-3-count-4");

  renderRoomPlayers("module4", "room1", room1Container);
  renderRoomPlayers("module4", "room2", room2Container);
  renderRoomPlayers("module4", "room3", room3Container);

  // 重新渲染未分配玩家列表
  const playersContainer = document.getElementById("players-module-4");
  if (playersContainer) {
    playersContainer.innerHTML = "";
    const assignedIds = new Set([
      ...gameData.module4.room1.surfaceMembers,
      ...gameData.module4.room2.surfaceMembers,
      ...gameData.module4.room3.surfaceMembers,
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
  checkRoomComplete("module4");
}


// 确认模块4分配并计算结果
function confirmModule4() {
  // 若未初始化真实监管者，默认使用表面监管者
  if (gameData.module4.guard1Real === undefined) gameData.module4.guard1Real = gameData.module4.guard1;
  if (gameData.module4.guard2Real === undefined) gameData.module4.guard2Real = gameData.module4.guard2;
  if (gameData.module4.guard3Real === undefined) gameData.module4.guard3Real = gameData.module4.guard3;

  const realGuard1 = gameData.module4.guard1Real ?? gameData.module4.guard1;
  const realGuard2 = gameData.module4.guard2Real ?? gameData.module4.guard2;
  const realGuard3 = gameData.module4.guard3Real ?? gameData.module4.guard3;

  // 检查骨哨虫王是否强制改变了某个房间状态（需要同时检查目标房间和能力是否真的被使用）
  const boneWhistleKing = gameData.players.find((p) => p.specialRole === "boneWhistleKing");
  const boneWhistleKingUsed = boneWhistleKing && boneWhistleKing.abilityUsage && boneWhistleKing.abilityUsage["module4"];
  const boneWhistleKingTarget = gameData.boneWhistleKingTarget && gameData.boneWhistleKingTarget["module4"];

  // 计算房间1结果
  const room1Addicts = gameData.module4.room1.realMembers.filter(
    (id) =>
      gameData.lycheeAddicts.includes(id) && id !== realGuard1
  );
  const room1NormalState = room1Addicts.length > 0;
  const room1Forced = boneWhistleKingUsed && boneWhistleKingTarget === "room1";
  gameData.module4.room1.realLycheeState = room1Forced ? true : room1NormalState;
  gameData.module4.room1.surfaceLycheeState = gameData.module4.room1.realLycheeState;

  // 计算房间2结果
  const room2Addicts = gameData.module4.room2.realMembers.filter(
    (id) =>
      gameData.lycheeAddicts.includes(id) && id !== realGuard2
  );
  const room2NormalState = room2Addicts.length > 0;
  const room2Forced = boneWhistleKingUsed && boneWhistleKingTarget === "room2";
  gameData.module4.room2.realLycheeState = room2Forced ? true : room2NormalState;
  gameData.module4.room2.surfaceLycheeState = gameData.module4.room2.realLycheeState;

  // 计算房间3结果
  const room3Addicts = gameData.module4.room3.realMembers.filter(
    (id) =>
      gameData.lycheeAddicts.includes(id) && id !== realGuard3
  );
  const room3NormalState = room3Addicts.length > 0;
  const room3Forced = boneWhistleKingUsed && boneWhistleKingTarget === "room3";
  gameData.module4.room3.realLycheeState = room3Forced ? true : room3NormalState;
  gameData.module4.room3.surfaceLycheeState = gameData.module4.room3.realLycheeState;

  // 记录本轮（第4轮）偷吃的荔枝瘾成员（仅非监管者），供偷吃历史统计使用
  const eatenRound = 4;
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
        recordSilentWhisperChargeGain(player.id, "module4", 1);
      }
    }
  };
  room1Addicts.forEach(markEaten);
  room2Addicts.forEach(markEaten);
  room3Addicts.forEach(markEaten);

  // 更新结果显示
  const result1El = document.getElementById("result-1-4");
  const result2El = document.getElementById("result-2-4");
  const result3El = document.getElementById("result-3-4");

  // 显示结果时使用真实荔枝状态（因为所有人都能看到荔枝是否还在）
  result1El.textContent = gameData.module4.room1.realLycheeState
    ? "荔枝被偷吃了"
    : "荔枝完好";
  result1El.className = `text-lg ${
    gameData.module4.room1.realLycheeState
      ? "text-primary font-bold"
      : "text-dark"
  }`;

  result2El.textContent = gameData.module4.room2.realLycheeState
    ? "荔枝被偷吃了"
    : "荔枝完好";
  result2El.className = `text-lg ${
    gameData.module4.room2.realLycheeState
      ? "text-primary font-bold"
      : "text-dark"
  }`;

  result3El.textContent = gameData.module4.room3.realLycheeState
    ? "荔枝被偷吃了"
    : "荔枝完好";
  result3El.className = `text-lg ${
    gameData.module4.room3.realLycheeState
      ? "text-primary font-bold"
      : "text-dark"
  }`;

  // 显示被监管者
  const guard1Player = gameData.players.find(
    (p) => p.id === gameData.module4.guard1
  ) || { name: "无" };
  const guard2Player = gameData.players.find(
    (p) => p.id === gameData.module4.guard2
  ) || { name: "无" };
  const guard3Player = gameData.players.find(
    (p) => p.id === gameData.module4.guard3
  ) || { name: "无" };

  document.getElementById("guard-1-4").textContent = guard1Player.name;
  document.getElementById("guard-2-4").textContent = guard2Player.name;
  document.getElementById("guard-3-4").textContent = guard3Player.name;

  // 显示房间1成员列表
  const room1Members = document.getElementById("room1-members-4");
  room1Members.innerHTML = "";
  gameData.module4.room1.surfaceMembers.forEach((playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    const memberTag = document.createElement("span");
    memberTag.className = `px-2 py-1 rounded ${
      playerId === gameData.module4.guard1
        ? "bg-primary/10 text-primary"
        : "bg-gray-100"
    }`;
    memberTag.textContent = player.name;
    room1Members.appendChild(memberTag);
  });

  // 显示房间2成员列表
  const room2Members = document.getElementById("room2-members-4");
  room2Members.innerHTML = "";
  gameData.module4.room2.surfaceMembers.forEach((playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    const memberTag = document.createElement("span");
    memberTag.className = `px-2 py-1 rounded ${
      playerId === gameData.module4.guard2
        ? "bg-primary/10 text-primary"
        : "bg-gray-100"
    }`;
    memberTag.textContent = player.name;
    room2Members.appendChild(memberTag);
  });

  // 显示房间3成员列表
  const room3Members = document.getElementById("room3-members-4");
  room3Members.innerHTML = "";
  gameData.module4.room3.surfaceMembers.forEach((playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    const memberTag = document.createElement("span");
    memberTag.className = `px-2 py-1 rounded ${
      playerId === gameData.module4.guard3
        ? "bg-primary/10 text-primary"
        : "bg-gray-100"
    }`;
    memberTag.textContent = player.name;
    room3Members.appendChild(memberTag);
  });

  renderSettlementInfo("module4");
  if (typeof renderGoldenMonkSanctuaryAnnouncement === "function") {
    renderGoldenMonkSanctuaryAnnouncement("module4");
  }

  if (typeof logModuleRealStatus === "function") {
    logModuleRealStatus("module4");
  }

  // 隐藏配置区域，显示结果
  document.querySelector("#module-4 > div:first-child").classList.add("hidden");
  document.getElementById("result-4").classList.remove("hidden");
}


// 设置模块4事件监听器
function setupModule4EventListeners() {
    // 返回按钮 - 返回模块3结果页
    document.getElementById('back-to-3').addEventListener('click', () => {
        resetModuleAbilities('module4');
        showModule(3);
        document.getElementById('result-3').classList.remove('hidden');
        document.querySelector('#module-3 > div:first-child').classList.add('hidden');
    });
    
    // 确认分配按钮
    document.getElementById('confirm-4').addEventListener('click', () => {
        if (checkRoomComplete('module4')) {
            showArrestModal('module4');
        }
    });
    
    // 随机分配按钮
    document.getElementById('random-module-4').addEventListener('click', randomAssignModule4);
    
    // 结果页返回修改按钮
    document.getElementById('back-to-4-config').addEventListener('click', () => {
        resetModuleAbilities('module4');
        // 恢复真实成员为表面成员
        restoreRealFromSurface('module4');
        // 修正监管者（若为已在本模块使用能力的易容术士或无效）
        if (typeof resetGuardsForModuleOnBack === 'function') {
            resetGuardsForModuleOnBack('module4');
        }
        document.querySelector('#module-4 > div:first-child').classList.remove('hidden');
        document.getElementById('result-4').classList.add('hidden');
    });
    
    // 进入最终投票按钮
    document.getElementById('to-module-5').addEventListener('click', () => {
        initModule5();
        showModule(5);
    });
}