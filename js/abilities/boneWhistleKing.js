/**
 * 骨哨虫王能力模块
 *
 * 角色信息：
 * - 阵营：荔枝瘾阵营
 * - 能力：强制某个房间荔枝被偷吃（每局限1次）
 * - 限制：需在普通偷吃流程之后结算，影响真实、表面荔枝状态
 * - 使用上限：默认 1 次；若被沐恩天使祝福则额外 +1（通过 getAbilityMaxUses 统一计算）
 *
 * 函数列表：
 *
 * 【主要功能】
 * - showBoneWhistleKingAbility(module): 显示骨哨虫王能力界面（入口函数）
 * - executeBoneWhistleKingAbility(module): 执行强制偷吃能力并更新游戏状态
 *
 * 【事件处理】
 * - setupBoneWhistleKingEvents(): 绑定按钮事件（复用全局按钮）
 */

// 显示骨哨虫王能力界面
function markBoneWhistleUsage(boneWhistleKing, module) {
  if (typeof boneWhistleKing.abilityUses !== "number") boneWhistleKing.abilityUses = 0;
  boneWhistleKing.abilityUses += 1;
  if (!boneWhistleKing.abilityUsage) boneWhistleKing.abilityUsage = {};
  boneWhistleKing.abilityUsage[module] = true;
  const { maxUses } = getAbilityUsageStats(boneWhistleKing, "boneWhistleKing");
  boneWhistleKing.abilityUsed = boneWhistleKing.abilityUses >= maxUses;
  const statusText = `使用次数：${boneWhistleKing.abilityUses}/${maxUses}${boneWhistleKing.abilityUsed ? "（已耗尽）" : ""}`;
  const hintText = boneWhistleKing.abilityUsed
    ? "能力次数已耗尽，无法再次使用"
    : "选择一个目标房间强制荔枝被偷吃（在所有玩家偷吃之后生效）";
  updateAbilityUserInfo("骨哨虫王", boneWhistleKing.name, statusText, hintText);
  renderMuEnAngelBlessingHint(boneWhistleKing);
}

function showBoneWhistleKingAbility(module) {
  if (gameData) gameData.currentAbilityRoleKey = "boneWhistleKing";
  const boneWhistleKing = gameData.players.find((p) => p.specialRole === "boneWhistleKing");
  logAbilityAction("boneWhistleKing", "show", {
    module,
    assigned: !!boneWhistleKing,
    player: boneWhistleKing?.name || null,
  });

  // 未配置：直接进入结果
  if (!boneWhistleKing) {
    logAbilityAction("boneWhistleKing", "skip-no-role", { module });
    showModuleResult(module);
    return;
  }

  const mainText =
    "骨哨虫王，请睁眼。你要强制让一个房间的荔枝被偷吃吗？如果要使用，请告知我目标房间。若你未被监管，请偷吃你所在房间的荔枝。行动结束请闭眼。";
  const subText = "汝可驱虫蚀果，强令一房荔枝尽毁。";

  if (boneWhistleKing.abilitySealed) {
    logAbilityAction("boneWhistleKing", "sealed", { player: boneWhistleKing.name, module });
    // 被封印时也使用同一段“睁眼/闭眼”口播文案
    if (typeof rememberAbilityNarration === "function") {
      rememberAbilityNarration(mainText, subText);
    }
    showAbilitySealedMessage("骨哨虫王", boneWhistleKing.name, module);
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
  const abilityContainer = createAbilityContainer("bone-whistle-king-ability");
  abilityContainer.innerHTML = rememberAbilityNarration(mainText, subText);

  // 更新使用者信息
  const { usedTimes, maxUses, isExhausted } = getAbilityUsageStats(boneWhistleKing, 'boneWhistleKing');
  updateAbilityUserInfo(
    "骨哨虫王",
    boneWhistleKing.name,
    `使用次数：${usedTimes}/${maxUses}${isExhausted ? '（已耗尽）' : ''}`,
    isExhausted ? "能力次数已耗尽，无法再次使用" : "选择一个目标房间强制荔枝被偷吃（在所有玩家偷吃之后生效）"
  );
  renderMuEnAngelBlessingHint(boneWhistleKing);

  // 检查能力是否可用
  const canUse = canUseAbility(boneWhistleKing);

  if (!canUse) {
    logAbilityAction("boneWhistleKing", "unavailable", { reason: "exhausted", module });
    const exhaustedEl = createAbilityExhaustedElement({
      roleName: "骨哨虫王",
      usedTimes,
      maxUses,
      description: "骨哨虫王的能力使用次数已用尽，无法再次使用",
    });
    exhaustedEl.classList.add("mt-4");
    abilityContainer.appendChild(exhaustedEl);

    // 只显示"不使用能力"按钮
    const actionsEl = document.createElement("div");
    actionsEl.className = "mt-4 flex justify-center space-x-4";
    actionsEl.innerHTML = `
      <button id="bone-skip" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover">暂束骨哨</button>
    `;
    abilityContainer.appendChild(actionsEl);
    actionsEl.querySelector("#bone-skip").addEventListener("click", () => {
      // 不使用能力时，清除之前保存的目标房间信息（如果存在）
      if (gameData.boneWhistleKingTarget && gameData.boneWhistleKingTarget[module]) {
        delete gameData.boneWhistleKingTarget[module];
      }
      skipAbilityUse();
    });
  } else {
    // 渲染目标房间选择
    const roomOptions = getRoomOptions(module);

    const optionsEl = document.createElement("div");
    optionsEl.className = "mt-4 grid grid-cols-2 md:grid-cols-3 gap-3";
    roomOptions.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = `px-3 py-2 rounded-lg border-2 border-gray-300 hover:border-primary bg-white text-center transition-all`;
      btn.dataset.roomProp = opt.key;
      btn.innerHTML = `
        <div class="font-medium">${opt.label}</div>
      `;
      btn.addEventListener("click", () => {
        // 高亮选择
        optionsEl.querySelectorAll("button").forEach((b) => {
          b.classList.remove("border-primary", "bg-primary/10");
          b.classList.add("border-gray-300");
        });
        btn.classList.remove("border-gray-300");
        btn.classList.add("border-primary", "bg-primary/10");
        // 保存当前目标房间选择
        gameData.currentAbilitySelection = opt.key;
        logAbilityAction("boneWhistleKing", "target-selected", {
          roomProp: opt.key,
          roomLabel: opt.label,
        });
        // 启用使用能力按钮
        const useBtn = document.getElementById("use-ability");
        if (useBtn) useBtn.disabled = false;
      });
      optionsEl.appendChild(btn);
    });

    abilityContainer.appendChild(optionsEl);

    // 本能力专用按钮区域
    const actionsEl = document.createElement("div");
    actionsEl.className = "mt-4 flex justify-center space-x-4";
    actionsEl.innerHTML = `
      <button id="bone-use" class="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-md scale-hover" disabled>鸣骨驱虫</button>
      <button id="bone-skip" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover">暂束骨哨</button>
    `;
    abilityContainer.appendChild(actionsEl);

    // 选择目标后启用"使用能力"按钮
    const localUseBtn = actionsEl.querySelector("#bone-use");
    const localSkipBtn = actionsEl.querySelector("#bone-skip");
    const enableUse = () => {
      if (gameData.currentAbilitySelection) {
        localUseBtn.disabled = false;
      } else {
        localUseBtn.disabled = true;
      }
    };
    optionsEl.addEventListener("click", enableUse, false);

    // 绑定事件
    localUseBtn.addEventListener("click", () => executeBoneWhistleKingAbility(module));
    localSkipBtn.addEventListener("click", () => {
      // 不使用能力时，清除之前保存的目标房间信息（如果存在）
      if (gameData.boneWhistleKingTarget && gameData.boneWhistleKingTarget[module]) {
        delete gameData.boneWhistleKingTarget[module];
      }
      skipAbilityUse();
    });
  }

  // 重绑确认按钮
  rebindConfirmButton();

  document.getElementById("ability-modal").classList.remove("hidden");
  gameData.currentAbilityModule = module;
}

// 执行骨哨虫王强制偷吃
function executeBoneWhistleKingAbility(module) {
  if (typeof lockAbilityAction === "function" && !lockAbilityAction()) return;
  const boneWhistleKing = gameData.players.find(
    (p) =>
      p.specialRole === "boneWhistleKing" &&
      (p.abilityUses ?? 0) <
        (typeof getAbilityMaxUses === "function"
          ? getAbilityMaxUses("boneWhistleKing")
          : 1)
  );
  if (!boneWhistleKing) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }
  const targetRoomProp = gameData.currentAbilitySelection;
  if (!targetRoomProp) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }
  const roomLabel = getRoomLabel(module, targetRoomProp);

  if (typeof isRoomSanctuaryProtected === "function" && isRoomSanctuaryProtected(module, targetRoomProp)) {
    logAbilityAction("boneWhistleKing", "queue-skip", {
      module,
      reason: "sanctuary-protected",
      roomProp: targetRoomProp,
    });
    showNotification("圣域金光护持，该房间无法被强制偷吃。");
    if (typeof recordGoldenMonkBlock === "function") {
      recordGoldenMonkBlock(module, "结果篡改");
    }
    markBoneWhistleUsage(boneWhistleKing, module);
    if (!gameData.abilityResults) gameData.abilityResults = {};
    if (!gameData.abilityResults[module]) gameData.abilityResults[module] = {};
    gameData.abilityResults[module].boneWhistleKing = {
      roomProp: targetRoomProp,
      roomLabel,
      blockedBySanctuary: true,
    };
    const resultEl = document.getElementById("ability-result-text");
    if (resultEl) {
      resultEl.innerHTML = `
        <div class="text-lg font-bold text-primary mb-2">${boneWhistleKing.name} 试图以虫群侵袭 ${roomLabel}，但圣域庇护使其无功。</div>
        <p class="text-sm text-gray-700">能力仍计入使用次数。</p>
      `;
    }
    const abilityResultBox = document.getElementById("ability-result");
    if (abilityResultBox) {
      abilityResultBox.classList.remove("hidden");
      updateAbilityResultNarration();
      rebindConfirmButton();
    }
    const abilityContainer = document.getElementById("bone-whistle-king-ability");
    if (abilityContainer) abilityContainer.classList.add("hidden");
    gameData.currentAbilitySelection = null;
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }

  logAbilityAction("boneWhistleKing", "execute", {
    module,
    roomProp: targetRoomProp,
    roomLabel,
  });

  markBoneWhistleUsage(boneWhistleKing, module);

  // 保存目标房间信息，供 confirmModuleX 使用
  if (!gameData.boneWhistleKingTarget) gameData.boneWhistleKingTarget = {};
  gameData.boneWhistleKingTarget[module] = targetRoomProp;

  // 记录复盘数据
  if (!gameData.abilityResults) gameData.abilityResults = {};
  if (!gameData.abilityResults[module]) gameData.abilityResults[module] = {};
  gameData.abilityResults[module].boneWhistleKing = {
    roomProp: targetRoomProp,
    roomLabel,
    blockedBySanctuary: false,
  };

  // 强制改变目标房间的真实荔枝状态为"被偷吃"
  // 注意：这是在所有玩家偷吃计算之后生效，所以不影响队友的偷吃判定
  if (module === "module1" || module === "module2" || module === "module3") {
    if (targetRoomProp === "smallRoom") {
      gameData[module].smallRoom.realLycheeState = true;
      gameData[module].smallRoom.surfaceLycheeState = true;
    } else if (targetRoomProp === "largeRoom") {
      gameData[module].largeRoom.realLycheeState = true;
      gameData[module].largeRoom.surfaceLycheeState = true;
    }
  } else if (module === "module4") {
    if (targetRoomProp === "room1") {
      gameData.module4.room1.realLycheeState = true;
      gameData.module4.room1.surfaceLycheeState = true;
    } else if (targetRoomProp === "room2") {
      gameData.module4.room2.realLycheeState = true;
      gameData.module4.room2.surfaceLycheeState = true;
    } else if (targetRoomProp === "room3") {
      gameData.module4.room3.realLycheeState = true;
      gameData.module4.room3.surfaceLycheeState = true;
    }
  }

  // 显示结果
  const text = `${boneWhistleKing.name} 强制 ${roomLabel} 的荔枝被偷吃`;
  const resultEl = document.getElementById("ability-result-text");
  resultEl.textContent = text;
  resultEl.className = "text-lg font-bold text-primary";

  // 隐藏能力容器，显示结果
  const abilityContainer = document.getElementById("bone-whistle-king-ability");
  if (abilityContainer) abilityContainer.classList.add("hidden");
  
  // 隐藏其它能力区块，避免重叠
  if (typeof hideAllAbilitySections === "function") hideAllAbilitySections();
  
  document.getElementById("ability-result").classList.remove("hidden");
  updateAbilityResultNarration();

  // 重绑确认按钮
  rebindConfirmButton();
  if (typeof unlockAbilityAction === "function") unlockAbilityAction();
}

// 绑定按钮事件（复用全局按钮）
function setupBoneWhistleKingEvents() {
  const useAbilityBtn = document.getElementById("use-ability");
  const skipAbilityBtn = document.getElementById("skip-ability");
  const confirmResultBtn = document.getElementById("confirm-result");

  if (useAbilityBtn) {
    useAbilityBtn.replaceWith(useAbilityBtn.cloneNode(true));
    document.getElementById("use-ability").addEventListener("click", () => {
      if (gameData.currentAbilityModule) {
        executeBoneWhistleKingAbility(gameData.currentAbilityModule);
      }
    });
  }
  if (skipAbilityBtn) {
    skipAbilityBtn.replaceWith(skipAbilityBtn.cloneNode(true));
    document.getElementById("skip-ability").addEventListener("click", skipAbilityUse);
  }
  if (confirmResultBtn) {
    confirmResultBtn.replaceWith(confirmResultBtn.cloneNode(true));
    document.getElementById("confirm-result").addEventListener("click", confirmAbilityResult);
  }
}
