/**
 * 易容术士能力模块
 *
 * 角色信息：
 * - 阵营：荔枝瘾阵营
 * - 能力：默认可指定一个房间迁移自身真实位置；若被沐恩天使祝福，可与另一房间的任意使者交换真实位置
 * - 限制：操作仅影响真实成员，不改变表面成员；即便处于被监管状态亦可移动，并会相应调整监管者
 * - 使用上限：默认 2 次（由模块0 / getAbilityMaxUses 控制，可被主持人调整）
 *
 * 函数列表：
 *
 * 【主要功能】
 * - showDisguiseMasterAbility(module): 显示易容术士能力界面（入口函数）
 * - executeDisguiseMove(module): 执行普通移动逻辑并展示结果
 * - executeBlessedDisguiseSwap(module, disguiseMaster): 在沐恩祝福下执行互换逻辑
 *
 * 【房间操作】
 * - getPlayerCurrentRoom(module, playerId): 获取玩家当前所在房间（基于真实成员）
 * - movePlayerRealMembers(module, fromRoomProp, toRoomProp, playerId): 执行真实成员移动并处理监管者
 */

// 显示易容术士能力界面
function showDisguiseMasterAbility(module) {
  if (gameData) gameData.currentAbilityRoleKey = "disguiseMaster";
  const disguiseMaster = gameData.players.find((p) => p.specialRole === "disguiseMaster");
  logAbilityAction("disguiseMaster", "show", {
    module,
    assigned: !!disguiseMaster,
    player: disguiseMaster?.name || null,
  });

  // 未配置：直接进入结果
  if (!disguiseMaster) {
    logAbilityAction("disguiseMaster", "skip-no-role", { module });
    showModuleResult(module);
    return;
  }

  const mainText =
    "易容术士，请睁眼。你要移动你的真实位置吗？如果要移动，请告知我你要去往第几个房间。若你未移动且未被监管，请偷吃你所在房间的荔枝。若你已经移动，可无视监管偷吃移动后房间的荔枝。行动结束请闭眼。";
  const subText = "汝可施幻术，暗渡陈仓。";

  if (disguiseMaster.abilitySealed) {
    logAbilityAction("disguiseMaster", "sealed", { player: disguiseMaster.name, module });
    // 被封印时也使用同一段“睁眼/闭眼”口播文案
    if (typeof rememberAbilityNarration === "function") {
      rememberAbilityNarration(mainText, subText);
    }
    showAbilitySealedMessage("易容术士", disguiseMaster.name, module);
    return;
  }

  // 进入本能力前，先隐藏其他能力区块，确保界面互斥
  if (typeof hideAllAbilitySections === 'function') hideAllAbilitySections();

  if (typeof renderAbilityContextInfo === 'function') {
    renderAbilityContextInfo(module);
  }

  // 准备模态框
  document.getElementById("ability-result").classList.add("hidden");

  // 创建能力容器
  const abilityContainer = createAbilityContainer("disguise-master-ability");
  abilityContainer.innerHTML = rememberAbilityNarration(mainText, subText);

  // 更新使用者信息
  const { usedTimes, maxUses, isExhausted } = getAbilityUsageStats(disguiseMaster, 'disguiseMaster');
  updateAbilityUserInfo(
    "易容术士",
    disguiseMaster.name,
    `使用次数：${usedTimes}/${maxUses}${isExhausted ? '（已耗尽）' : ''}`,
    isExhausted ? "能力次数已耗尽，无法再次使用" : "选择一个目标房间进行移动（只改变真实成员，不改变表面成员）"
  );
  renderMuEnAngelBlessingHint(disguiseMaster);

  // 检查能力是否可用
  const canUse = canUseAbility(disguiseMaster);

  const isBlessed = isMuEnAngelBlessed(disguiseMaster);

  if (!canUse) {
    logAbilityAction("disguiseMaster", "unavailable", { reason: "exhausted", module });
    // 能力次数已耗尽，显示统一耗尽状态
    const exhaustedEl = createAbilityExhaustedElement({
      roleName: "易容术士",
      usedTimes,
      maxUses,
      description: "易容术士的能力使用次数已用尽，无法再次使用",
    });
    exhaustedEl.classList.add("mt-4");
    abilityContainer.appendChild(exhaustedEl);

    // 只显示"不使用能力"按钮
    const actionsEl = document.createElement("div");
    actionsEl.className = "mt-4 flex justify-center space-x-4";
    actionsEl.innerHTML = `
      <button id="disguise-skip" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover">匿形潜伏</button>
    `;
    abilityContainer.appendChild(actionsEl);
    actionsEl.querySelector("#disguise-skip").addEventListener("click", skipAbilityUse);
  } else if (isBlessed) {
    const currentRoom = getPlayerCurrentRoom(module, disguiseMaster.id);
    const roomOptions = getRoomOptions(module);
    const candidatePlayers = [];
    roomOptions.forEach((opt) => {
      if (currentRoom && currentRoom.roomProp === opt.key) return;
      const members = gameData[module][opt.key]?.realMembers || [];
      members.forEach((playerId) => {
        if (playerId === disguiseMaster.id) return;
        const player = gameData.players.find((p) => p.id === playerId);
        if (player) {
          candidatePlayers.push({
            player,
            roomProp: opt.key,
            roomLabel: opt.label,
          });
        }
      });
    });

    const callout = document.createElement("div");
    callout.className =
      "mt-4 bg-primary/5 border border-primary/30 rounded-lg p-3 text-sm text-primary";
    callout.innerHTML =
      "<p class='font-semibold'>沐恩祝福：你可以与其他房间的一名使者互换真实位置。</p>";
    abilityContainer.appendChild(callout);

    if (candidatePlayers.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "mt-4 text-center text-gray-600";
      emptyMsg.textContent = "当前没有可供互换的目标。";
      abilityContainer.appendChild(emptyMsg);
    } else {
      const grid = document.createElement("div");
      grid.className = "mt-4 grid grid-cols-2 md:grid-cols-3 gap-3";
      candidatePlayers.forEach(({ player, roomLabel }) => {
        const btn = document.createElement("button");
        btn.className =
          "bg-white border-2 border-gray-300 rounded-lg p-3 text-center hover:border-primary";
        btn.innerHTML = `
          <div class="font-bold">${player.name}</div>
          <div class="text-xs text-gray-500 mt-1">${roomLabel}</div>
        `;
        btn.addEventListener("click", () => {
          grid.querySelectorAll("button").forEach((b) => {
            b.classList.remove("border-primary", "bg-primary/10");
            b.classList.add("border-gray-300");
          });
          btn.classList.remove("border-gray-300");
          btn.classList.add("border-primary", "bg-primary/10");
          gameData.currentAbilitySelection = player.id;
          logAbilityAction("disguiseMaster", "target-selected", {
            targetId: player.id,
            targetName: player.name,
            targetRoom: roomLabel,
          });
          localUseBtn.disabled = false;
        });
        grid.appendChild(btn);
      });
      abilityContainer.appendChild(grid);
    }

    const actionsEl = document.createElement("div");
    actionsEl.className = "mt-4 flex justify-center space-x-4";
    actionsEl.innerHTML = `
      <button id="disguise-use" class="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-md scale-hover" disabled>施展幻容术</button>
      <button id="disguise-skip" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover">匿形潜伏</button>
    `;
    abilityContainer.appendChild(actionsEl);

    const localUseBtn = actionsEl.querySelector("#disguise-use");
    const localSkipBtn = actionsEl.querySelector("#disguise-skip");
    localUseBtn.addEventListener("click", () => executeDisguiseMove(module));
    localSkipBtn.addEventListener("click", skipAbilityUse);
  } else {
    // 渲染目标房间选择
    const currentRoom = getPlayerCurrentRoom(module, disguiseMaster.id);
    const roomOptions = getRoomOptions(module);

    const optionsEl = document.createElement("div");
    optionsEl.className = "mt-4 grid grid-cols-2 md:grid-cols-3 gap-3";
    roomOptions.forEach((opt) => {
      const btn = document.createElement("button");
      const isCurrent = currentRoom?.roomProp === opt.key;
      btn.className = `px-3 py-2 rounded-lg border-2 ${isCurrent ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-gray-300 hover:border-primary"} bg-white text-center transition-all`;
      btn.dataset.roomProp = opt.key;
      btn.disabled = isCurrent;
      btn.innerHTML = `
        <div class="font-medium">${opt.label}</div>
        ${isCurrent ? '<div class="text-[10px] leading-none text-gray-400 mt-1">当前所在</div>' : ""}
      `;
      btn.addEventListener("click", () => {
        // 高亮选择
        optionsEl.querySelectorAll("button").forEach((b) => {
          b.classList.remove("border-primary", "bg-primary/10");
          if (!b.disabled) b.classList.add("border-gray-300");
        });
        if (!btn.disabled) {
          btn.classList.remove("border-gray-300");
          btn.classList.add("border-primary", "bg-primary/10");
        }
        // 保存当前目标房间选择
        gameData.currentAbilitySelection = opt.key;
        logAbilityAction("disguiseMaster", "target-selected", {
          fromRoom: currentRoom?.roomProp || null,
          fromLabel: currentRoom?.label || null,
          toRoom: opt.key,
          toLabel: opt.label,
        });
        // 立即刷新按钮可用状态
        if (typeof enableUse === 'function') enableUse();
      });
      optionsEl.appendChild(btn);
    });

    abilityContainer.appendChild(optionsEl);

    // 本能力专用按钮区域（避免复用药巫按钮被隐藏的父容器问题）
    const actionsEl = document.createElement("div");
    actionsEl.className = "mt-4 flex justify-center space-x-4";
    actionsEl.innerHTML = `
      <button id="disguise-use" class="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-md scale-hover" disabled>施展幻容术</button>
      <button id="disguise-skip" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover">匿形潜伏</button>
    `;
    abilityContainer.appendChild(actionsEl);

    // 选择目标后启用"使用能力"按钮
    const localUseBtn = actionsEl.querySelector("#disguise-use");
    const localSkipBtn = actionsEl.querySelector("#disguise-skip");
    const enableUse = () => {
      if (gameData.currentAbilitySelection && (!currentRoom || currentRoom.roomProp !== gameData.currentAbilitySelection)) {
        localUseBtn.disabled = false;
      } else {
        localUseBtn.disabled = true;
      }
    };
    // 使用冒泡阶段，确保在按钮 click 设置选择后再计算可用状态
    optionsEl.addEventListener("click", enableUse);

    // 绑定事件
    localUseBtn.addEventListener("click", () => executeDisguiseMove(module));
    localSkipBtn.addEventListener("click", skipAbilityUse);
  }

  // 重绑确认按钮
  rebindConfirmButton();

  document.getElementById("ability-modal").classList.remove("hidden");
  gameData.currentAbilityModule = module;
}

function handleDisguiseSanctuaryBlock(module, disguiseMaster, message, meta = {}) {
  if (!disguiseMaster) return;
  if (typeof disguiseMaster.abilityUses !== "number") disguiseMaster.abilityUses = 0;
  disguiseMaster.abilityUses += 1;
  const { maxUses } = getAbilityUsageStats(disguiseMaster, "disguiseMaster");
  disguiseMaster.abilityUsed = disguiseMaster.abilityUses >= maxUses;
  if (!disguiseMaster.abilityUsage) disguiseMaster.abilityUsage = {};
  disguiseMaster.abilityUsage[module] = true;

  updateAbilityUserInfo(
    "易容术士",
    disguiseMaster.name,
    `使用次数：${disguiseMaster.abilityUses}/${maxUses}${disguiseMaster.abilityUsed ? "（已耗尽）" : ""}`,
    disguiseMaster.abilityUsed
      ? "能力次数已耗尽，无法再次使用"
      : "选择一个目标房间进行移动（只改变真实成员，不改变表面成员）"
  );
  renderMuEnAngelBlessingHint(disguiseMaster);

  if (!gameData.abilityResults) gameData.abilityResults = {};
  if (!gameData.abilityResults[module]) gameData.abilityResults[module] = {};
  const normalizedMeta = { ...meta };
  if (!normalizedMeta.message && message) {
    normalizedMeta.message = message;
  }
  if (normalizedMeta.fromRoom && !normalizedMeta.fromLabel) {
    normalizedMeta.fromLabel = getRoomLabel(module, normalizedMeta.fromRoom);
  }
  if (normalizedMeta.toRoom && !normalizedMeta.toLabel) {
    normalizedMeta.toLabel = getRoomLabel(module, normalizedMeta.toRoom);
  }
  if (normalizedMeta.masterFrom && !normalizedMeta.masterFromLabel) {
    normalizedMeta.masterFromLabel = getRoomLabel(module, normalizedMeta.masterFrom);
  }
  if (normalizedMeta.targetFrom && !normalizedMeta.targetFromLabel) {
    normalizedMeta.targetFromLabel = getRoomLabel(module, normalizedMeta.targetFrom);
  }
  gameData.abilityResults[module].disguiseMaster = {
    blockedBySanctuary: true,
    ...normalizedMeta,
  };

  const abilityContainer = document.getElementById("disguise-master-ability");
  if (abilityContainer) abilityContainer.classList.add("hidden");
  const resultEl = document.getElementById("ability-result-text");
  if (resultEl) {
    resultEl.innerHTML = `
      <div class="text-lg font-bold text-primary mb-2">${message}</div>
      <p class="text-sm text-gray-700">能力已计入使用次数。</p>
    `;
  }
  const resultBox = document.getElementById("ability-result");
  if (resultBox) {
    resultBox.classList.remove("hidden");
    updateAbilityResultNarration();
    rebindConfirmButton();
  }
  if (typeof unlockAbilityAction === "function") unlockAbilityAction();
}

// 执行易容移动
function executeDisguiseMove(module) {
  if (typeof lockAbilityAction === "function" && !lockAbilityAction()) return;
  const disguiseMaster = gameData.players.find(
    (p) =>
      p.specialRole === "disguiseMaster" &&
      (p.abilityUses ?? 0) <
        (typeof getAbilityMaxUses === "function"
          ? getAbilityMaxUses("disguiseMaster")
          : 4)
  );
  if (!disguiseMaster) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }
  if (isMuEnAngelBlessed(disguiseMaster)) {
    executeBlessedDisguiseSwap(module, disguiseMaster);
    return;
  }
  const targetRoomProp = gameData.currentAbilitySelection;
  if (!targetRoomProp) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }

  const from = getPlayerCurrentRoom(module, disguiseMaster.id);
  if (!from || from.roomProp === targetRoomProp) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }

  if (typeof isRoomSanctuaryProtected === "function") {
    if (isRoomSanctuaryProtected(module, from.roomProp) || isRoomSanctuaryProtected(module, targetRoomProp)) {
      const toLabel = getRoomLabel(module, targetRoomProp);
      showNotification("圣域庇护阻止了易容术士的行动。");
      if (typeof recordGoldenMonkBlock === "function") {
        recordGoldenMonkBlock(module, "位置互换");
      }
      handleDisguiseSanctuaryBlock(
        module,
        disguiseMaster,
        `${disguiseMaster.name} 试图从 ${from.label || from.roomProp} 前往 ${toLabel}，但圣域庇护使其无法行动。`,
        {
          fromRoom: from.roomProp,
          toRoom: targetRoomProp,
        }
      );
      gameData.currentAbilitySelection = null;
      return;
    }
  }

  const toLabel = getRoomLabel(module, targetRoomProp);
  logAbilityAction("disguiseMaster", "execute", {
    fromRoom: from.roomProp,
    fromLabel: from.label,
    toRoom: targetRoomProp,
    toLabel,
    module,
  });

  movePlayerRealMembers(module, from.roomProp, targetRoomProp, disguiseMaster.id);

  // 增加使用次数与记录模块使用
  if (typeof disguiseMaster.abilityUses !== "number")
    disguiseMaster.abilityUses = 0;
  disguiseMaster.abilityUses += 1;
  const { maxUses } = getAbilityUsageStats(disguiseMaster, "disguiseMaster");
  disguiseMaster.abilityUsed = disguiseMaster.abilityUses >= maxUses;
  if (!disguiseMaster.abilityUsage) disguiseMaster.abilityUsage = {};
  disguiseMaster.abilityUsage[module] = true;

  // 刷新使用者信息显示，更新使用次数
  updateAbilityUserInfo(
    "易容术士",
    disguiseMaster.name,
    `使用次数：${disguiseMaster.abilityUses}/${maxUses}${disguiseMaster.abilityUsed ? '（已耗尽）' : ''}`,
    disguiseMaster.abilityUsed ? "能力次数已耗尽，无法再次使用" : "选择一个目标房间进行移动（只改变真实成员，不改变表面成员）"
  );

  // 显示结果
  const text = `${disguiseMaster.name} 从 ${from.label} 移动到 ${toLabel}（仅影响真实成员）`;
  
  // 存储移动结果用于复盘
  if (!gameData.abilityResults) gameData.abilityResults = {};
  if (!gameData.abilityResults[module]) {
    gameData.abilityResults[module] = {};
  }
  gameData.abilityResults[module].disguiseMaster = {
    fromRoom: from.roomProp,
    fromLabel: from.label,
    toRoom: targetRoomProp,
    toLabel: toLabel,
  };

  const resultEl = document.getElementById("ability-result-text");
  resultEl.textContent = text;
  resultEl.className = "text-lg font-bold text-dark";

  const abilityContainer = document.getElementById("disguise-master-ability");
  if (abilityContainer) abilityContainer.classList.add("hidden");
  document.getElementById("ability-result").classList.remove("hidden");
  updateAbilityResultNarration();
  if (typeof unlockAbilityAction === "function") unlockAbilityAction();
}

function executeBlessedDisguiseSwap(module, disguiseMaster) {
  const targetId = gameData.currentAbilitySelection;
  const targetPlayer = gameData.players.find((p) => p.id === targetId);
  if (!targetPlayer) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }
  const masterRoom = getPlayerCurrentRoom(module, disguiseMaster.id);
  const targetRoom = getPlayerCurrentRoom(module, targetPlayer.id);
  if (!masterRoom || !targetRoom || masterRoom.roomProp === targetRoom.roomProp) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }

  if (typeof isRoomSanctuaryProtected === "function") {
    if (isRoomSanctuaryProtected(module, masterRoom.roomProp) || isRoomSanctuaryProtected(module, targetRoom.roomProp)) {
      showNotification("圣域庇护阻止了房间互换。");
      if (typeof recordGoldenMonkBlock === "function") {
        recordGoldenMonkBlock(module, "位置互换");
      }
      handleDisguiseSanctuaryBlock(
        module,
        disguiseMaster,
        `${disguiseMaster.name} 与 ${targetPlayer.name} 试图互换房间，但圣域庇护使互换失败。`,
        {
          blockedSwap: true,
          masterFrom: masterRoom.roomProp,
          targetFrom: targetRoom.roomProp,
          targetId: targetPlayer.id,
        }
      );
      gameData.currentAbilitySelection = null;
      return;
    }
  }
  logAbilityAction("disguiseMaster", "execute", {
    swap: true,
    masterFrom: masterRoom.roomProp,
    targetFrom: targetRoom.roomProp,
    targetId: targetPlayer.id,
    targetName: targetPlayer.name,
    module,
  });

  movePlayerRealMembers(module, masterRoom.roomProp, targetRoom.roomProp, disguiseMaster.id);
  movePlayerRealMembers(module, targetRoom.roomProp, masterRoom.roomProp, targetPlayer.id);

  if (typeof disguiseMaster.abilityUses !== "number")
    disguiseMaster.abilityUses = 0;
  disguiseMaster.abilityUses += 1;
  const { maxUses } = getAbilityUsageStats(disguiseMaster, "disguiseMaster");
  disguiseMaster.abilityUsed = disguiseMaster.abilityUses >= maxUses;
  if (!disguiseMaster.abilityUsage) disguiseMaster.abilityUsage = {};
  disguiseMaster.abilityUsage[module] = true;

  updateAbilityUserInfo(
    "易容术士",
    disguiseMaster.name,
    `使用次数：${disguiseMaster.abilityUses}/${maxUses}${disguiseMaster.abilityUsed ? '（已耗尽）' : ''}`,
    disguiseMaster.abilityUsed ? "能力次数已耗尽，无法再次使用" : "你已完成互换，后续不可再用"
  );
  renderMuEnAngelBlessingHint(disguiseMaster);

  if (!gameData.abilityResults) gameData.abilityResults = {};
  if (!gameData.abilityResults[module]) {
    gameData.abilityResults[module] = {};
  }
  gameData.abilityResults[module].disguiseMaster = {
    swapped: true,
    targetId: targetPlayer.id,
    targetName: targetPlayer.name,
    masterFrom: masterRoom.roomProp,
    masterTo: targetRoom.roomProp,
    targetFrom: targetRoom.roomProp,
    targetTo: masterRoom.roomProp,
    muEnBlessed: true,
  };

  const resultEl = document.getElementById("ability-result-text");
  resultEl.innerHTML = `
    <div class="text-lg font-bold text-dark">${disguiseMaster.name} 与 ${targetPlayer.name} 互换了真实房间！</div>
    <p class="mt-1 text-sm text-gray-700">${disguiseMaster.name} → ${targetRoom.label || targetRoom.roomProp}，${targetPlayer.name} → ${masterRoom.label || masterRoom.roomProp}</p>
  `;
  resultEl.className = "text-left";

  const abilityContainer = document.getElementById("disguise-master-ability");
  if (abilityContainer) abilityContainer.classList.add("hidden");
  document.getElementById("ability-result").classList.remove("hidden");
  updateAbilityResultNarration();
  gameData.currentAbilitySelection = null;
  if (typeof unlockAbilityAction === "function") unlockAbilityAction();
}

// 获取玩家当前所在房间（真实成员）
function getPlayerCurrentRoom(module, playerId) {
  if (module === "module1" || module === "module2" || module === "module3") {
    const small = gameData[module].smallRoom.realMembers.includes(playerId);
    const large = gameData[module].largeRoom.realMembers.includes(playerId);
    if (small) return { roomProp: "smallRoom", label: "小房间" };
    if (large) return { roomProp: "largeRoom", label: "大房间" };
  } else if (module === "module4") {
    for (const key of ["room1", "room2", "room3"]) {
      if (gameData.module4[key].realMembers.includes(playerId)) {
        return { roomProp: key, label: getRoomLabel(module, key) };
      }
    }
  }
  return null;
}

// 执行真实成员移动并处理监管者
function movePlayerRealMembers(module, fromRoomProp, toRoomProp, playerId) {
  // 从来源移除
  gameData[module][fromRoomProp].realMembers = gameData[module][fromRoomProp].realMembers.filter((id) => id !== playerId);
  // 加入目标（不改变 surfaceMembers）
  if (!gameData[module][toRoomProp].realMembers.includes(playerId)) {
    gameData[module][toRoomProp].realMembers.push(playerId);
  }

  // 若来源房间监管者为该玩家，清空真实监管者（不影响表面监管者）
  if (module === "module1" || module === "module2") {
    // 初始化真实监管者字段（如果未初始化）
    if (gameData[module].smallGuardReal === undefined) {
      gameData[module].smallGuardReal = gameData[module].smallGuard;
    }
    if (gameData[module].largeGuardReal === undefined) {
      gameData[module].largeGuardReal = gameData[module].largeGuard;
    }
    // 只清空真实监管者，不影响表面监管者
    if (fromRoomProp === "smallRoom" && gameData[module].smallGuardReal === playerId) {
      gameData[module].smallGuardReal = null;
    } else if (fromRoomProp === "largeRoom" && gameData[module].largeGuardReal === playerId) {
      gameData[module].largeGuardReal = null;
    }
  } else if (module === "module3") {
    // 清空真实监管者，不影响表面监管者
    if (gameData.module3.smallGuardReal === undefined) gameData.module3.smallGuardReal = gameData.module3.smallGuard;
    if (gameData.module3.largeGuardReal === undefined) gameData.module3.largeGuardReal = gameData.module3.largeGuard;
    if (fromRoomProp === "smallRoom" && gameData.module3.smallGuardReal === playerId) {
      gameData.module3.smallGuardReal = null;
    } else if (fromRoomProp === "largeRoom" && gameData.module3.largeGuardReal === playerId) {
      gameData.module3.largeGuardReal = null;
    }
  } else if (module === "module4") {
    // 清空真实监管者，不影响表面监管者
    if (gameData.module4.guard1Real === undefined) gameData.module4.guard1Real = gameData.module4.guard1;
    if (gameData.module4.guard2Real === undefined) gameData.module4.guard2Real = gameData.module4.guard2;
    if (gameData.module4.guard3Real === undefined) gameData.module4.guard3Real = gameData.module4.guard3;
    if (fromRoomProp === "room1" && gameData.module4.guard1Real === playerId) {
      gameData.module4.guard1Real = null;
    } else if (fromRoomProp === "room2" && gameData.module4.guard2Real === playerId) {
      gameData.module4.guard2Real = null;
    } else if (fromRoomProp === "room3" && gameData.module4.guard3Real === playerId) {
      gameData.module4.guard3Real = null;
    }
  }
}