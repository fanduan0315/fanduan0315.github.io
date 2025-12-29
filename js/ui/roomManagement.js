/**
 * 房间管理模块
 * 
 * 本模块负责房间相关的UI渲染和状态管理，包括：
 * - 房间人数显示与更新
 * - 房间内玩家列表渲染
 * - 监管者选择界面
 * - 房间配置完成状态检查
 *
 * 函数分类：
 *
 * 【房间状态更新】
 * - updateRoomCount(module, roomProp, countElementId): 根据当前人数限制更新房间人数显示（支持module1-4，包含空值检查）
 * - checkRoomComplete(module): 检查房间配置是否完成，支持module1-4，自动启用/禁用确认按钮
 *
 * 【UI渲染】
 * - renderRoomPlayers(module, roomProp, container): 渲染房间内的玩家列表，支持module1-4，包含移除按钮事件处理
 * - renderGuardOptions(roomData, container, module, roomProp): 渲染监管者选择选项，支持module1-4
 */


// 更新房间计数
function updateRoomCount(module, roomProp, countElementId) {
  // 使用 surfaceMembers 而不是 realMembers，因为易容术士移动时只改变真实成员，不影响表面成员
  // 在配置阶段，表面成员和真实成员应该是一致的（除了易容术士移动后）
  const count = gameData[module][roomProp].surfaceMembers.length;
  const countEl = document.getElementById(countElementId);
  
  if (!countEl) {
    console.error(`未找到计数元素: ${countElementId}`);
    return;
  }
  
  const totalPlayers = getTotalPlayers();
  const limits = getRoomLimits(totalPlayers);

  if (countElementId.includes("small-count")) {
    countEl.textContent = `${count}/${limits.small}`;
  } else if (countElementId.includes("large-count")) {
    countEl.textContent = `${count}/${limits.large}`;
  } else {
    countEl.textContent = `${count}人`;
  }
}


// 渲染房间内的使者
function renderRoomPlayers(module, roomProp, container) {
  container.innerHTML = "";
  const playerIds = gameData[module][roomProp].surfaceMembers;

  // 生成房间内使者列表
  playerIds.forEach((playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    const playerEl = document.createElement("div");
    playerEl.className =
      "player-item bg-white border border-gray-300 rounded-full px-3 py-1 text-sm flex items-center justify-center mb-1 scale-hover";
    playerEl.dataset.playerId = playerId;
    playerEl.innerHTML = `
            <span>${player.name}</span>
            <button class="remove-player ml-1 text-gray-400 hover:text-primary">
                <i class="fa fa-times-circle"></i>
            </button>
        `;

    // 移除使者按钮事件
    playerEl.querySelector(".remove-player").addEventListener("click", () => {
      removePlayerFromRoom(module, roomProp, playerId);
      // 修复 playerListId 的生成逻辑
      const moduleNum = module.replace("module", "");
      const playerListId = `players-module-${moduleNum}`;
      const playerList = document.getElementById(playerListId);
      if (playerList) {
        // 移除提示信息（如果存在）
        const placeholder = playerList.querySelector(".text-gray-400");
        if (placeholder) {
          placeholder.remove();
        }
        // 检查是否已存在该玩家元素，避免重复添加
        const existingPlayer = playerList.querySelector(`[data-player-id="${playerId}"]`);
        if (!existingPlayer) {
          const draggablePlayer = createDraggablePlayer(player);
          playerList.appendChild(draggablePlayer);
        }
      }
      checkRoomComplete(module);
    });

    container.appendChild(playerEl);
  });

  // 控制监管者区域显示
  let guardAreaId = "";
  if (module === "module1") {
    guardAreaId =
      roomProp === "smallRoom" ? "small-guard-area-1" : "large-guard-area-1";
  } else if (module === "module2") {
    guardAreaId =
      roomProp === "smallRoom" ? "small-guard-area" : "large-guard-area";
  } else if (module === "module3") {
    guardAreaId =
      roomProp === "smallRoom" ? "small-guard-area-3" : "large-guard-area-3";
  } else if (module === "module4") {
    guardAreaId =
      roomProp === "room1"
        ? "room1-guard-area-4"
        : roomProp === "room2"
        ? "room2-guard-area-4"
        : "room3-guard-area-4";
  }

  const guardSelection = document.getElementById(guardAreaId);
  const guardContainer = guardSelection
    ? guardSelection.querySelector(".room-guards")
    : null;

  if (playerIds.length > 0 && guardSelection && guardContainer) {
    guardSelection.classList.remove("hidden");
    renderGuardOptions(
      gameData[module][roomProp],
      guardContainer,
      module,
      roomProp
    );
  } else if (guardSelection) {
    guardSelection.classList.add("hidden");
    // 当房间为空时，强制清除监管者选择
    if (module === "module1") {
      if (roomProp === "smallRoom") {
        gameData.module1.smallGuard = null;
        gameData.module1.smallGuardReal = null;
      } else {
        gameData.module1.largeGuard = null;
        gameData.module1.largeGuardReal = null;
      }
    } else if (module === "module2") {
      if (roomProp === "smallRoom") {
        gameData.module2.smallGuard = null;
        gameData.module2.smallGuardReal = null;
      } else {
        gameData.module2.largeGuard = null;
        gameData.module2.largeGuardReal = null;
      }
    } else if (module === "module3") {
      if (roomProp === "smallRoom") {
        gameData.module3.smallGuard = null;
        gameData.module3.smallGuardReal = null;
      } else {
        gameData.module3.largeGuard = null;
        gameData.module3.largeGuardReal = null;
      }
    } else if (module === "module4") {
      if (roomProp === "room1") {
        gameData.module4.guard1 = null;
        gameData.module4.guard1Real = null;
      } else if (roomProp === "room2") {
        gameData.module4.guard2 = null;
        gameData.module4.guard2Real = null;
      } else {
        gameData.module4.guard3 = null;
        gameData.module4.guard3Real = null;
      }
    }
  }

  checkRoomComplete(module);
}


// 渲染监管者选择选项
function renderGuardOptions(roomData, container, module, roomProp) {
  container.innerHTML = "";
  const playerIds = roomData.surfaceMembers;
  let selectedGuard = null;

  // 获取当前已选择的监管者
  if (module === "module1") {
    selectedGuard =
      roomProp === "smallRoom"
        ? gameData.module1.smallGuard
        : gameData.module1.largeGuard;
  } else if (module === "module2") {
    selectedGuard =
      roomProp === "smallRoom"
        ? gameData.module2.smallGuard
        : gameData.module2.largeGuard;
  } else if (module === "module3") {
    selectedGuard =
      roomProp === "smallRoom"
        ? gameData.module3.smallGuard
        : gameData.module3.largeGuard;
  } else if (module === "module4") {
    if (roomProp === "room1") selectedGuard = gameData.module4.guard1;
    else if (roomProp === "room2") selectedGuard = gameData.module4.guard2;
    else selectedGuard = gameData.module4.guard3;
  }

  playerIds.forEach((playerId) => {
    const player = gameData.players.find((p) => p.id === playerId);
    const guardOption = document.createElement("button");
    guardOption.className = `px-3 py-1 rounded-full text-sm ${
      selectedGuard === playerId
        ? "bg-primary text-white"
        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }`;
    guardOption.dataset.playerId = playerId;
    guardOption.textContent = player.name;

    guardOption.addEventListener("click", () => {
      // 更新选中的监管者
      if (module === "module1") {
        if (roomProp === "smallRoom") {
          gameData.module1.smallGuard = playerId;
          gameData.module1.smallGuardReal = playerId;
        } else {
          gameData.module1.largeGuard = playerId;
          gameData.module1.largeGuardReal = playerId;
        }
      } else if (module === "module2") {
        if (roomProp === "smallRoom") {
          gameData.module2.smallGuard = playerId;
          gameData.module2.smallGuardReal = playerId;
        } else {
          gameData.module2.largeGuard = playerId;
          gameData.module2.largeGuardReal = playerId;
        }
      } else if (module === "module3") {
        if (roomProp === "smallRoom") {
          gameData.module3.smallGuard = playerId;
          gameData.module3.smallGuardReal = playerId;
        } else {
          gameData.module3.largeGuard = playerId;
          gameData.module3.largeGuardReal = playerId;
        }
      } else if (module === "module4") {
        if (roomProp === "room1") {
          gameData.module4.guard1 = playerId;
          gameData.module4.guard1Real = playerId;
        } else if (roomProp === "room2") {
          gameData.module4.guard2 = playerId;
          gameData.module4.guard2Real = playerId;
        } else {
          gameData.module4.guard3 = playerId;
          gameData.module4.guard3Real = playerId;
        }
      }

      // 重新渲染选项以更新选中状态
      renderGuardOptions(roomData, container, module, roomProp);
      checkRoomComplete(module);
    });

    container.appendChild(guardOption);
  });
}


// 检查房间配置是否完成
function checkRoomComplete(module) {
  let isComplete = false;

  if (module === "module1") {
    const totalPlayers = getTotalPlayers();
    const limits = getRoomLimits(totalPlayers);
    const smallRequired = limits.small;
    const largeRequired = limits.large;

    // 额外验证：监管者必须仍在对应房间中（使用 surfaceMembers，因为监管者是从表面成员中选择的）
    const smallGuardValid =
      gameData.module1.smallGuard === null ||
      gameData.module1.smallRoom.surfaceMembers.includes(
        gameData.module1.smallGuard
      );
    const largeGuardValid =
      gameData.module1.largeGuard === null ||
      gameData.module1.largeRoom.surfaceMembers.includes(
        gameData.module1.largeGuard
      );

    // 严格判断条件：人数达标且都选择了有效的监管者（使用 surfaceMembers，因为易容术士移动不影响表面成员）
    isComplete =
      gameData.module1.smallRoom.surfaceMembers.length === smallRequired &&
      gameData.module1.largeRoom.surfaceMembers.length === largeRequired &&
      gameData.module1.smallGuard !== null && // 小房间必须选监管者
      gameData.module1.largeGuard !== null && // 大房间必须选监管者
      smallGuardValid && // 小房间监管者必须有效
      largeGuardValid; // 大房间监管者必须有效

    const confirmBtn = document.getElementById("confirm-1");
    if (confirmBtn) {
      confirmBtn.disabled = !isComplete;
    }

    // 显示具体提示信息
    if (!isComplete) {
      if (gameData.module1.smallRoom.surfaceMembers.length !== smallRequired) {
        showNotification(`小房间需要${smallRequired}名使者`);
      } else if (gameData.module1.largeRoom.surfaceMembers.length !== largeRequired) {
        showNotification(`大房间需要${largeRequired}名使者`);
      } else if (gameData.module1.smallGuard === null || !smallGuardValid) {
        showNotification("请为小房间选择有效的监管者");
      } else if (gameData.module1.largeGuard === null || !largeGuardValid) {
        showNotification("请为大房间选择有效的监管者");
      }
    }
  } else if (module === "module2") {
    const totalPlayers = getTotalPlayers();
    const limits = getRoomLimits(totalPlayers);
    const smallRequired = limits.small;
    const largeRequired = limits.large;

    // 额外验证：监管者必须仍在对应房间中（使用 surfaceMembers，因为监管者是从表面成员中选择的）
    const smallGuardValid =
      gameData.module2.smallGuard === null ||
      gameData.module2.smallRoom.surfaceMembers.includes(
        gameData.module2.smallGuard
      );
    const largeGuardValid =
      gameData.module2.largeGuard === null ||
      gameData.module2.largeRoom.surfaceMembers.includes(
        gameData.module2.largeGuard
      );

    // 严格判断条件：人数达标且都选择了有效的监管者（使用 surfaceMembers，因为易容术士移动不影响表面成员）
    isComplete =
      gameData.module2.smallRoom.surfaceMembers.length === smallRequired &&
      gameData.module2.largeRoom.surfaceMembers.length === largeRequired &&
      gameData.module2.smallGuard !== null && // 小房间必须选监管者
      gameData.module2.largeGuard !== null && // 大房间必须选监管者
      smallGuardValid && // 小房间监管者必须有效
      largeGuardValid; // 大房间监管者必须有效

    const confirmBtn = document.getElementById("confirm-2");
    confirmBtn.disabled = !isComplete;

    // 显示具体提示信息
    if (!isComplete) {
      if (gameData.module2.smallRoom.surfaceMembers.length !== smallRequired) {
        showNotification(`小房间需要${smallRequired}名使者`);
      } else if (gameData.module2.largeRoom.surfaceMembers.length !== largeRequired) {
        showNotification(`大房间需要${largeRequired}名使者`);
      } else if (gameData.module2.smallGuard === null || !smallGuardValid) {
        showNotification("请为小房间选择有效的监管者");
      } else if (gameData.module2.largeGuard === null || !largeGuardValid) {
        showNotification("请为大房间选择有效的监管者");
      }
    }
  } else if (module === "module3") {
    const totalPlayers = getTotalPlayers();
    const limits = getRoomLimits(totalPlayers);
    const smallRequired = limits.small;
    const largeRequired = limits.large;

    // 模块3判断逻辑 - 添加监管者有效性验证（使用 surfaceMembers，因为监管者是从表面成员中选择的）
    const smallGuardValid =
      gameData.module3.smallGuard === null ||
      gameData.module3.smallRoom.surfaceMembers.includes(
        gameData.module3.smallGuard
      );
    const largeGuardValid =
      gameData.module3.largeGuard === null ||
      gameData.module3.largeRoom.surfaceMembers.includes(
        gameData.module3.largeGuard
      );

    // 使用 surfaceMembers，因为易容术士移动不影响表面成员
    isComplete =
      gameData.module3.smallRoom.surfaceMembers.length === smallRequired &&
      gameData.module3.largeRoom.surfaceMembers.length === largeRequired &&
      gameData.module3.smallGuard !== null &&
      gameData.module3.largeGuard !== null &&
      smallGuardValid &&
      largeGuardValid;

    const confirmBtn = document.getElementById("confirm-3");
    confirmBtn.disabled = !isComplete;

    if (!isComplete) {
      if (gameData.module3.smallRoom.surfaceMembers.length !== smallRequired) {
        showNotification(`小房间需要${smallRequired}名使者`);
      } else if (gameData.module3.largeRoom.surfaceMembers.length !== largeRequired) {
        showNotification(`大房间需要${largeRequired}名使者`);
      } else if (gameData.module3.smallGuard === null || !smallGuardValid) {
        showNotification("请为小房间选择有效的监管者");
      } else if (gameData.module3.largeGuard === null || !largeGuardValid) {
        showNotification("请为大房间选择有效的监管者");
      }
    }
  } else if (module === "module4") {
    // 模块4判断逻辑（3个房间无人数限制）
    const assignedCount =
      gameData.module4.room1.realMembers.length +
      gameData.module4.room2.realMembers.length +
      gameData.module4.room3.realMembers.length;
    const expectedTotal = getTotalPlayers();

    // 检查监管者有效性
    const guard1Valid =
      gameData.module4.guard1 === null ||
      (gameData.module4.room1.realMembers.length > 0 &&
        gameData.module4.room1.realMembers.includes(gameData.module4.guard1));
    const guard2Valid =
      gameData.module4.guard2 === null ||
      (gameData.module4.room2.realMembers.length > 0 &&
        gameData.module4.room2.realMembers.includes(gameData.module4.guard2));
    const guard3Valid =
      gameData.module4.guard3 === null ||
      (gameData.module4.room3.realMembers.length > 0 &&
        gameData.module4.room3.realMembers.includes(gameData.module4.guard3));

    // 检查有人的房间是否都选了有效的监管者
    let guardsComplete = true;
    if (gameData.module4.room1.realMembers.length > 0) {
      if (gameData.module4.guard1 === null || !guard1Valid) {
        guardsComplete = false;
        showNotification("请为房间1选择有效的监管者");
      }
    }
    if (gameData.module4.room2.realMembers.length > 0) {
      if (gameData.module4.guard2 === null || !guard2Valid) {
        guardsComplete = false;
        showNotification("请为房间2选择有效的监管者");
      }
    }
    if (gameData.module4.room3.realMembers.length > 0) {
      if (gameData.module4.guard3 === null || !guard3Valid) {
        guardsComplete = false;
        showNotification("请为房间3选择有效的监管者");
      }
    }

    // 总人数必须等于配置的人数（所有使者都要分配房间）
    if (assignedCount !== expectedTotal) {
      isComplete = false;
      showNotification(`请分配所有${expectedTotal}名使者（当前${assignedCount}人）`);
    } else {
      isComplete = guardsComplete;
    }

    const confirmBtn = document.getElementById("confirm-4");
    confirmBtn.disabled = !isComplete;
  }

  return isComplete; // 返回是否完成状态
}