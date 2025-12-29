/**
 * 胡庭药巫能力模块
 * 
 * 角色信息：
 * - 阵营：普通阵营
 * - 能力：查验单个玩家是否为荔枝瘾成员；若被沐恩天使祝福，还会得知该目标的特殊身份（若存在）
 * - 使用上限：默认最多 4 次，不能查验自己，可在模块0中调整
 * 
 * 函数列表：
 * 
 * 【主要功能】
 * - showMedicineShamanAbility(module): 显示胡庭药巫能力界面（入口函数）
 * - useMedicineShamanAbility(): 执行身份查验能力并显示结果
 * 
 * 【UI渲染】
 * - renderMedicineShamanBaseLayout(container): 渲染统一的药巫界面基础结构
 * - renderPlayerSelectionGrid(medicineShaman): 渲染玩家选择网格
 * - renderAbilityExhaustedState(medicineShaman): 渲染能力次数已耗尽状态
 * 
 * 【事件处理】
 * - handlePlayerSelection(selectedPlayer, selectedButton): 处理玩家选择
 * - setupMedicineShamanEvents(): 设置胡庭药巫事件监听器
 * - resetMedicineShamanUI(): 重置胡庭药巫UI状态
 */


// 显示胡庭药巫能力界面
function showMedicineShamanAbility(module) {
    if (gameData) gameData.currentAbilityRoleKey = "medicineShaman";
    const medicineShaman = gameData.players.find(player => player.specialRole === 'medicineShaman');
    logAbilityAction("medicineShaman", "show", {
        module,
        assigned: !!medicineShaman,
        player: medicineShaman?.name || null,
    });

    // 未配置药巫时，直接跳过能力界面，进入结果流程
    if (!medicineShaman) {
        logAbilityAction("medicineShaman", "skip-no-role", { module });
        showModuleResult(module);
        return;
    }

    if (medicineShaman.abilitySealed) {
        logAbilityAction("medicineShaman", "sealed", { player: medicineShaman.name, module });
        // 无论是否被封印，都使用同一段“睁眼/闭眼”口播文案
        if (typeof rememberAbilityNarration === "function") {
            rememberAbilityNarration(
              "胡庭药巫，请睁眼。你要查验哪一位使者的身份？请以手势告知我。你查验的这位使者身份如下所示。行动结束请闭眼。",
              "汝可择一人，以药香辨其心性。"
            );
        }
        showAbilitySealedMessage("胡庭药巫", medicineShaman.name, module);
        return;
    }

    // 进入本能力前，先隐藏其他能力区块，确保界面互斥
    if (typeof hideAllAbilitySections === 'function') hideAllAbilitySections();

    if (typeof renderAbilityContextInfo === 'function') {
        renderAbilityContextInfo(module);
    }

    const { usedTimes, maxUses, isExhausted } = getAbilityUsageStats(medicineShaman, 'medicineShaman');
    const statusText = `使用次数：${usedTimes}/${maxUses}${isExhausted ? '（已耗尽）' : ''}`;
    const hintText = isExhausted ? '能力次数已耗尽，无法再次使用' : '可查验一名使者身份';
    updateAbilityUserInfo('胡庭药巫', medicineShaman.name, statusText, hintText);
    renderMuEnAngelBlessingHint(medicineShaman);

    const abilityContainer = createAbilityContainer('medicine-shaman-ability');
    if (!abilityContainer) return;
    renderMedicineShamanBaseLayout(abilityContainer);
    abilityContainer.classList.remove('hidden');
    document.getElementById('ability-result').classList.add('hidden');

    const canUse = medicineShaman ? canUseAbility(medicineShaman) : false;

    // 修改：即使能力次数耗尽，也显示面板（显示"能力次数已耗尽"）
    if (!canUse) {
        logAbilityAction("medicineShaman", "unavailable", { reason: "exhausted", module });
        renderAbilityExhaustedState(medicineShaman);
    } else {
        renderPlayerSelectionGrid(medicineShaman);
    }

    resetMedicineShamanUI();
    setupMedicineShamanEvents();

    gameData.currentAbilityModule = module;
    document.getElementById('ability-modal').classList.remove('hidden');
}


// 渲染能力次数已耗尽状态
function renderAbilityExhaustedState(medicineShaman) {
    const contentBody = document.getElementById('medicine-shaman-body');
    if (!contentBody) return;

    contentBody.innerHTML = '';

    const { usedTimes, maxUses } = getAbilityUsageStats(medicineShaman, 'medicineShaman');
    const exhaustedEl = createAbilityExhaustedElement({
        roleName: '胡庭药巫',
        usedTimes,
        maxUses,
        description: '胡庭药巫的能力使用次数已用尽，无法再次使用'
    });
    contentBody.appendChild(exhaustedEl);

    const selectedInfo = document.getElementById('selected-player-info');
    if (selectedInfo) selectedInfo.classList.add('hidden');

    const useAbilityBtn = document.getElementById('use-ability');
    if (useAbilityBtn) {
        useAbilityBtn.classList.add('hidden');
        useAbilityBtn.disabled = true;
    }

    const skipAbilityBtn = document.getElementById('skip-ability');
    if (skipAbilityBtn) skipAbilityBtn.classList.remove('hidden');
}


// 渲染玩家选择网格
function renderPlayerSelectionGrid(medicineShaman) {
    const contentBody = document.getElementById('medicine-shaman-body');
    if (!contentBody) return;

    contentBody.innerHTML = '';

    const playerGrid = document.createElement('div');
    playerGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-2';
    
    gameData.players.forEach(player => {
        if (player.id === medicineShaman.id) return; // 不能查验自己
        
        const playerBtn = document.createElement('button');
        playerBtn.className = 'bg-white border-2 border-gray-300 hover:border-primary rounded-lg p-3 text-center scale-hover transition-all';
        playerBtn.dataset.playerId = player.id;
        playerBtn.innerHTML = `
            <div class="font-bold mb-1">${player.name}</div>
            <div class="text-[10px] leading-none text-gray-400">使者${chineseNumbers[player.id-1]}</div>
        `;
        
        playerBtn.addEventListener('click', () => {
            handlePlayerSelection(player, playerBtn);
        });
        
        playerGrid.appendChild(playerBtn);
    });
    
    contentBody.appendChild(playerGrid);

    const useAbilityBtn = document.getElementById('use-ability');
    if (useAbilityBtn) {
        useAbilityBtn.classList.remove('hidden');
        useAbilityBtn.disabled = true;
    }

    const skipAbilityBtn = document.getElementById('skip-ability');
    if (skipAbilityBtn) skipAbilityBtn.classList.remove('hidden');
}


// 处理玩家选择
function handlePlayerSelection(selectedPlayer, selectedButton) {
    logAbilityAction("medicineShaman", "target-selected", {
        targetId: selectedPlayer.id,
        targetName: selectedPlayer.name,
    });
    
    // 移除其他按钮的选中状态
    document.querySelectorAll('#medicine-shaman-ability .grid button').forEach(btn => {
        btn.classList.remove('border-primary', 'bg-primary/10');
        btn.classList.add('border-gray-300');
    });
    
    // 设置当前选中状态
    selectedButton.classList.remove('border-gray-300');
    selectedButton.classList.add('border-primary', 'bg-primary/10');
    
    // 更新选择显示
    document.getElementById('selected-player-info').classList.remove('hidden');
    document.getElementById('selected-player-name').textContent = selectedPlayer.name;
    
    // 启用使用能力按钮
    document.getElementById('use-ability').disabled = false;
    
    // 保存当前选择
    gameData.currentAbilitySelection = selectedPlayer.id;
}


// 重置胡庭药巫UI状态
function resetMedicineShamanUI() {
    document.getElementById('selected-player-info').classList.add('hidden');
    const useBtn = document.getElementById('use-ability');
    if (useBtn) {
        useBtn.disabled = true;
    }
    gameData.currentAbilitySelection = null;
}


// 使用能力
function useMedicineShamanAbility() {
  if (typeof lockAbilityAction === "function" && !lockAbilityAction()) return;
  const medicineShaman = gameData.players.find(
    (player) =>
      player.specialRole === "medicineShaman" &&
      (player.abilityUses ?? 0) <
        (typeof getAbilityMaxUses === "function"
          ? getAbilityMaxUses("medicineShaman")
          : 4)
  );
  const targetPlayer = gameData.players.find(
    (player) => player.id === gameData.currentAbilitySelection
  );

  if (!medicineShaman || !targetPlayer) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }

  logAbilityAction("medicineShaman", "execute", {
    targetId: targetPlayer.id,
    targetName: targetPlayer.name,
    isLycheeAddict: !!targetPlayer.isLycheeAddict,
  });

  // 增加使用次数并更新是否耗尽标记
  if (typeof medicineShaman.abilityUses !== "number") {
    medicineShaman.abilityUses = 0;
  }
  const { maxUses } = getAbilityUsageStats(medicineShaman, "medicineShaman");
  medicineShaman.abilityUses += 1;
  medicineShaman.abilityUsed = medicineShaman.abilityUses >= maxUses;
  // 记录本次能力在当前模块使用过
  if (!medicineShaman.abilityUsage) medicineShaman.abilityUsage = {};
  if (gameData.currentAbilityModule) {
    medicineShaman.abilityUsage[gameData.currentAbilityModule] = true;
  }

  // 刷新使用者信息显示，更新使用次数
  const { usedTimes, isExhausted } = getAbilityUsageStats(medicineShaman, "medicineShaman");
  const updatedStatusText = `使用次数：${usedTimes}/${maxUses}${
    isExhausted ? "（已耗尽）" : ""
  }`;
  const updatedHintText = isExhausted
    ? "能力次数已耗尽，无法再次使用"
    : "可查验一名使者身份";
  updateAbilityUserInfo(
    "胡庭药巫",
    medicineShaman.name,
    updatedStatusText,
    updatedHintText
  );
  renderMuEnAngelBlessingHint(medicineShaman);

  const isAddict = targetPlayer.isLycheeAddict;
  const resultText = isAddict
    ? `${targetPlayer.name} 是荔枝瘾成员！`
    : `${targetPlayer.name} 不是荔枝瘾成员`;

  // 存储查验结果用于复盘
  if (!gameData.abilityResults) gameData.abilityResults = {};
  if (!gameData.abilityResults[gameData.currentAbilityModule]) {
    gameData.abilityResults[gameData.currentAbilityModule] = {};
  }
  const blessed = isMuEnAngelBlessed(medicineShaman);
  const revealedRoleKey = blessed ? targetPlayer.specialRole || null : null;
  const revealedRoleName = revealedRoleKey
    ? gameData.specialRoles.roleConfig[revealedRoleKey]?.name || revealedRoleKey
    : (blessed ? "无特殊身份" : null);

  gameData.abilityResults[gameData.currentAbilityModule].medicineShaman = {
    targetId: targetPlayer.id,
    targetName: targetPlayer.name,
    isAddict: isAddict,
    revealedRoleKey,
    revealedRoleName,
    muEnBlessed: blessed,
  };

  const resultEl = document.getElementById("ability-result-text");
  const baseClass = `text-lg font-bold ${isAddict ? "text-primary" : "text-dark"}`;
  if (blessed) {
    const rolePhrase =
      revealedRoleKey && revealedRoleKey !== null && revealedRoleName !== "无特殊身份"
        ? `对方的特殊身份为「${revealedRoleName}」。`
        : "对方没有特殊身份。";
    resultEl.innerHTML = `
      <div>${resultText}</div>
      <div class="mt-2 text-base text-primary font-medium">
        沐恩祝福提示：${rolePhrase}
      </div>
    `;
    resultEl.className = baseClass;
  } else {
  resultEl.textContent = resultText;
    resultEl.className = baseClass;
  }

  document.getElementById("medicine-shaman-ability").classList.add("hidden");
  document.getElementById("ability-result").classList.remove("hidden");
  updateAbilityResultNarration();
  if (typeof unlockAbilityAction === "function") unlockAbilityAction();
}


// 设置胡庭药巫事件监听器
function setupMedicineShamanEvents() {
    const useAbilityBtn = document.getElementById('use-ability');
    const skipAbilityBtn = document.getElementById('skip-ability');
    const confirmResultBtn = document.getElementById('confirm-result');
    
    useAbilityBtn.replaceWith(useAbilityBtn.cloneNode(true));
    skipAbilityBtn.replaceWith(skipAbilityBtn.cloneNode(true));
    confirmResultBtn.replaceWith(confirmResultBtn.cloneNode(true));
    
    document.getElementById('use-ability').addEventListener('click', useMedicineShamanAbility);
    document.getElementById('skip-ability').addEventListener('click', skipAbilityUse);
    document.getElementById('confirm-result').addEventListener('click', confirmAbilityResult);
}

function renderMedicineShamanBaseLayout(container) {
    container.innerHTML = `
        ${rememberAbilityNarration(
          "胡庭药巫，请睁眼。你要查验哪一位使者的身份？请以手势告知我。你查验的这位使者身份如下所示。行动结束请闭眼。",
          "汝可择一人，以药香辨其心性。"
        )}
        <div class="mb-4">
            <div id="medicine-shaman-body" class="space-y-4"></div>
            <div
                id="selected-player-info"
                class="bg-white p-3 rounded-lg border border-primary/30 hidden"
            >
                <p class="font-medium">
                    当前选择:
                    <span id="selected-player-name" class="text-primary"></span>
                </p>
            </div>
        </div>
        <div class="flex justify-center space-x-4">
            <button
                id="use-ability"
                class="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-md scale-hover"
                disabled
            >
                燃香辨心
            </button>
            <button
                id="skip-ability"
                class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover"
            >
                暂收药香
            </button>
        </div>
    `;
}