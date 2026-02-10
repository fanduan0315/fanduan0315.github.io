/**
 * 房间分配系统模块（点击选择方式）
 * 
 * 本模块负责玩家房间分配功能的实现，包括：
 * - 创建可点击的玩家元素
 * - 设置房间点击选中功能
 * - 处理玩家在房间间的移动
 *
 * 函数分类：
 *
 * 【元素创建】
 * - createDraggablePlayer(player): 创建可点击的玩家元素（用于未分配玩家列表）
 *
 * 【房间选择设置】
 * - setupRoomDropZone(roomId, maxPlayers, countElementId, module, roomProp): 设置房间点击选中功能，支持module1-4，点击玩家后自动加入选中房间
 *
 * 【玩家移动】
 * - removePlayerFromRoom(module, roomProp, playerId): 从房间移除玩家，并重新添加到玩家列表
 */

// 全局变量：当前选中的房间信息
let selectedRoom = {
  roomId: null,
  module: null,
  roomProp: null,
  maxPlayers: null,
  countElementId: null
};

// 清除房间选中状态
function clearRoomSelection() {
  // 移除所有房间的选中样式
  document.querySelectorAll('.room-selected').forEach(room => {
    room.classList.remove('room-selected');
  });
  selectedRoom = {
    roomId: null,
    module: null,
    roomProp: null,
    maxPlayers: null,
    countElementId: null
  };
}

// 创建可点击的使者元素（用于未分配玩家列表）
function createDraggablePlayer(player) {
  const playerEl = document.createElement("div");
  playerEl.className =
    "player-item bg-white border border-gray-300 rounded-full px-3 py-1 text-sm flex items-center justify-center cursor-pointer scale-hover";
  playerEl.dataset.playerId = player.id;
  playerEl.innerHTML = `
                <span>${player.name}</span>
            `;

  // 添加点击事件：将玩家添加到选中的房间
  playerEl.addEventListener("click", () => {
    if (!selectedRoom.roomId) {
      showNotification("请先选择一个房间");
      return;
    }
    
    // 调用添加玩家到房间的函数
    addPlayerToSelectedRoom(player.id);
  });

  return playerEl;
}


// 添加玩家到选中的房间
function addPlayerToSelectedRoom(playerId) {
  const { roomId, module, roomProp, maxPlayers, countElementId } = selectedRoom;
  
  if (!roomId) {
    showNotification("请先选择一个房间");
    return;
  }

  const roomEl = document.getElementById(roomId);
  const playersContainer = roomEl.querySelector(".room-players");

  // 检查模块数据结构，确保使用正确的访问方式
  let currentRealMembers, currentSurfaceMembers;

  // 根据模块类型获取正确的数据结构
  if (module === "module1" || module === "module2" || module === "module3" || module === "module4") {
    currentRealMembers = gameData[module][roomProp].realMembers;
    currentSurfaceMembers = gameData[module][roomProp].surfaceMembers;
  } else {
    // 回退到旧数据结构（理论上不会发生）
    currentRealMembers = gameData[module][roomProp];
    currentSurfaceMembers = gameData[module][roomProp];
  }

  // 检查是否已达到最大人数
  if (currentRealMembers.length >= maxPlayers) {
    showNotification("已达到房间最大人数限制");
    return;
  }

  // 检查使者是否已在其他房间
  let playerInOtherRoom = false;
  let otherRoomProp = "";

  if (module === "module1" || module === "module2" || module === "module3") {
    otherRoomProp = roomProp === "smallRoom" ? "largeRoom" : "smallRoom";
    if (gameData[module][otherRoomProp].realMembers.includes(playerId)) {
      playerInOtherRoom = true;
    }
  } else if (module === "module4") {
    // 检查其他两个房间
    const otherRooms = ["room1", "room2", "room3"].filter(
      (r) => r !== roomProp
    );
    otherRooms.forEach((r) => {
      if (gameData[module][r].realMembers.includes(playerId)) {
        playerInOtherRoom = true;
        otherRoomProp = r;
      }
    });
  }

  // 如果使者在其他房间，先移除
  if (playerInOtherRoom) {
    removePlayerFromRoom(module, otherRoomProp, playerId);

    // 特别处理：如果被移动的使者是监管者，需要重置监管者选择
    if (module === "module1") {
      if (
        otherRoomProp === "smallRoom" &&
        gameData.module1.smallGuard === playerId
      ) {
        gameData.module1.smallGuard = null;
        gameData.module1.smallGuardReal = null;
      } else if (
        otherRoomProp === "largeRoom" &&
        gameData.module1.largeGuard === playerId
      ) {
        gameData.module1.largeGuard = null;
        gameData.module1.largeGuardReal = null;
      }
    } else if (module === "module2") {
      if (
        otherRoomProp === "smallRoom" &&
        gameData.module2.smallGuard === playerId
      ) {
        gameData.module2.smallGuard = null;
      } else if (
        otherRoomProp === "largeRoom" &&
        gameData.module2.largeGuard === playerId
      ) {
        gameData.module2.largeGuard = null;
      }
    } else if (module === "module3") {
      if (
        otherRoomProp === "smallRoom" &&
        gameData.module3.smallGuard === playerId
      ) {
        gameData.module3.smallGuard = null;
      } else if (
        otherRoomProp === "largeRoom" &&
        gameData.module3.largeGuard === playerId
      ) {
        gameData.module3.largeGuard = null;
      }
    } else if (module === "module4") {
      if (otherRoomProp === "room1" && gameData.module4.guard1 === playerId) {
        gameData.module4.guard1 = null;
      } else if (
        otherRoomProp === "room2" &&
        gameData.module4.guard2 === playerId
      ) {
        gameData.module4.guard2 = null;
      } else if (
        otherRoomProp === "room3" &&
        gameData.module4.guard3 === playerId
      ) {
        gameData.module4.guard3 = null;
      }
    }
  }

  // 添加使者到当前房间（同时更新真实和表面成员）
  if (!currentRealMembers.includes(playerId)) {
    gameData[module][roomProp].realMembers.push(playerId);
    gameData[module][roomProp].surfaceMembers.push(playerId);
    updateRoomCount(module, roomProp, countElementId);
    renderRoomPlayers(module, roomProp, playersContainer);
    
    // 从玩家列表中移除该使者
    const moduleNum = module.replace("module", "");
    const playerListId = `players-module-${moduleNum}`;
    const playerList = document.getElementById(playerListId);
    if (playerList) {
      const playerElement = playerList.querySelector(`[data-player-id="${playerId}"]`);
      if (playerElement) {
        playerElement.remove();
      }
      // 如果所有玩家都已分配，显示提示信息
      if (playerList.children.length === 0 || (playerList.children.length === 1 && playerList.children[0].classList.contains("text-gray-400"))) {
        const placeholder = document.createElement("div");
        placeholder.className = "text-gray-400 text-sm text-center py-4";
        placeholder.textContent = "所有使者已分配到房间，如需调整请从房间中移除使者";
        playerList.appendChild(placeholder);
      }
    }
    
    checkRoomComplete(module);
  }
}

// 设置房间点击选中功能
function setupRoomDropZone(
  roomId,
  maxPlayers,
  countElementId,
  module,
  roomProp
) {
  const roomEl = document.getElementById(roomId);
  if (!roomEl) {
    console.error(`未找到房间元素: ${roomId}`);
    return;
  }

  // 添加点击事件：选中/取消选中房间
  roomEl.addEventListener("click", (e) => {
    // 如果点击的是房间内的玩家或按钮，不触发房间选中
    if (e.target.closest('.player-item') || e.target.closest('.remove-player') || e.target.closest('.room-guards')) {
      return;
    }

    // 如果点击的是同一个房间，取消选中
    if (selectedRoom.roomId === roomId) {
      clearRoomSelection();
      showNotification("已取消房间选择");
    } else {
      // 清除之前的选中状态
      clearRoomSelection();
      
      // 设置新的选中状态
      selectedRoom = {
        roomId: roomId,
        module: module,
        roomProp: roomProp,
        maxPlayers: maxPlayers,
        countElementId: countElementId
      };
      
      // 添加选中样式
      roomEl.classList.add("room-selected");
      showNotification("房间已选中，请点击玩家姓名将其加入该房间");
    }
  });
}


// 从房间移除使者
function removePlayerFromRoom(module, roomProp, playerId) {
  // 新数据结构：同时移除真实和表面成员
  gameData[module][roomProp].realMembers = gameData[module][
    roomProp
  ].realMembers.filter((id) => id !== playerId);
  gameData[module][roomProp].surfaceMembers = gameData[module][
    roomProp
  ].surfaceMembers.filter((id) => id !== playerId);

  // 如果被移除的使者是当前监管者，则重置监管者
  if (module === "module1") {
    if (roomProp === "smallRoom" && gameData.module1.smallGuard === playerId) {
      gameData.module1.smallGuard = null;
      gameData.module1.smallGuardReal = null;
    } else if (
      roomProp === "largeRoom" &&
      gameData.module1.largeGuard === playerId
    ) {
      gameData.module1.largeGuard = null;
      gameData.module1.largeGuardReal = null;
    }
  } else if (module === "module2") {
    if (roomProp === "smallRoom" && gameData.module2.smallGuard === playerId) {
      gameData.module2.smallGuard = null;
    } else if (
      roomProp === "largeRoom" &&
      gameData.module2.largeGuard === playerId
    ) {
      gameData.module2.largeGuard = null;
    }
  } else if (module === "module3") {
    if (roomProp === "smallRoom" && gameData.module3.smallGuard === playerId) {
      gameData.module3.smallGuard = null;
    } else if (
      roomProp === "largeRoom" &&
      gameData.module3.largeGuard === playerId
    ) {
      gameData.module3.largeGuard = null;
    }
  } else if (module === "module4") {
    if (roomProp === "room1" && gameData.module4.guard1 === playerId) {
      gameData.module4.guard1 = null;
    } else if (roomProp === "room2" && gameData.module4.guard2 === playerId) {
      gameData.module4.guard2 = null;
    } else if (roomProp === "room3" && gameData.module4.guard3 === playerId) {
      gameData.module4.guard3 = null;
    }
  }

  // 更新对应房间的计数和显示
  let countElementId = "";
  let roomId = "";

  if (module === "module1") {
    countElementId =
      roomProp === "smallRoom" ? "small-count-1" : "large-count-1";
    roomId =
      roomProp === "smallRoom" ? "small-room-1" : "large-room-1";
  } else if (module === "module2" || module === "module3") {
    countElementId =
      roomProp === "smallRoom" ? "small-count-2" : "large-count-2";
    if (module === "module3") {
      countElementId =
        roomProp === "smallRoom" ? "small-count-3" : "large-count-3";
    }
    roomId =
      module === "module2"
        ? roomProp === "smallRoom"
          ? "small-room-2"
          : "large-room-2"
        : roomProp === "smallRoom"
        ? "small-room-3"
        : "large-room-3";
  } else if (module === "module4") {
    const roomNum = roomProp.replace("room", "");
    countElementId = `room-${roomNum}-count-4`;
    roomId = `room-${roomNum}-4`;
  }

  updateRoomCount(module, roomProp, countElementId);
  const playersContainer = document.querySelector(`#${roomId} .room-players`);
  renderRoomPlayers(module, roomProp, playersContainer);

  // 重新检查完成状态
  checkRoomComplete(module);
}