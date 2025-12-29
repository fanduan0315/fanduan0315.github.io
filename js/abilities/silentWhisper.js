/**
 * 缄默能力模块（Silent Whisper）
 *
 * 角色信息：
 * - 阵营：荔枝瘾阵营
 * - 能力：选择一名普通/中立特殊身份的使者并猜测其身份，命中则永久封印；若自身被沐恩天使祝福，主持人会为其排除一个错误选项
 * - 限制：每偷吃一颗荔枝获得一次使用次数（初始为 0 次），可在模块0中配置基础上限
 * - 行动顺序：在胡庭药巫之前、沐恩天使之后
 *
 * 模块要点：
 * - showSilentWhisperAbility(module): 构建完整的目标/身份选择 UI，维持统一的“睁眼/闭眼”口播，并在祝福状态下显示天使提示
 * - resolveResultState(): 处理封印结果，区分命中/祝福抵消/圣域阻挡，并可在命中金刚僧时立刻驱散当轮圣域
 * - handleConfirm(): 记录使用次数、实时刷新 UI、写入复盘日志，允许多次使用并显示每次结果详情
 */

function showSilentWhisperAbility(module) {
  if (gameData) gameData.currentAbilityRoleKey = "silentWhisper";
  const silent = gameData.players.find((p) => p.specialRole === "silentWhisper");
  logAbilityAction("silentWhisper", "show", {
    module,
    assigned: !!silent,
    player: silent?.name || null,
  });
  if (!silent) {
    logAbilityAction("silentWhisper", "skip-no-role", { module });
    if (typeof proceedNextAbilityOrResult === "function") {
      proceedNextAbilityOrResult(module);
    }
    return;
  }

  const mainText =
    "缄默，请睁眼。你要使用封印能力吗？如果要使用，你要猜测哪一位使者的身份？你猜测他的身份是第几个？你的封印结果如下所示。若你未被监管，请偷吃你所在房间的荔枝。行动结束请闭眼。";
  const subText = "汝可潜听十方，识其真身则封其灵术。";

  if (silent.abilitySealed) {
    logAbilityAction("silentWhisper", "sealed", { player: silent.name, module });
    // 被封印时也使用同一段“睁眼/闭眼”口播文案
    if (typeof rememberAbilityNarration === "function") {
      rememberAbilityNarration(mainText, subText);
    }
    showAbilitySealedMessage("缄默", silent.name, module);
    return;
  }

  if (typeof silent.abilityUses !== "number") silent.abilityUses = 0;
  if (typeof silent.silentCharges !== "number") silent.silentCharges = 0;

  if (!gameData.silentWhisperChargeRecords) {
    gameData.silentWhisperChargeRecords = {};
  }

  const { usedTimes, maxUses, isExhausted } = getAbilityUsageStats(silent, "silentWhisper");
  const remaining = Math.max(0, maxUses - usedTimes);

  if (typeof hideAllAbilitySections === "function") hideAllAbilitySections();
  if (typeof renderAbilityContextInfo === "function") {
    renderAbilityContextInfo(module);
  }

  const hintText =
    remaining > 0
      ? "选择目标使者与其可能的身份，尝试封印对方的能力"
      : "每当你偷吃一颗荔枝，就能获得一次使用机会";

  updateAbilityUserInfo(
    "缄默",
    silent.name,
    `使用次数：${usedTimes}/${maxUses}${isExhausted ? "（已耗尽）" : ""}`,
    hintText
  );
  renderMuEnAngelBlessingHint(silent);
  const silentBlessed = isMuEnAngelBlessed(silent);

  const container = createAbilityContainer("silent-whisper-ability");

  // 缄默可以选择任何普通/中立玩家（不管是否在module0中揭示了身份）
  const eligiblePlayers = gameData.players.filter(
    (p) =>
      p &&
      !p.isLycheeAddict &&
      p.id !== silent.id
  );

  // 从所有特殊身份配置中筛选出普通/中立阵营且已被分配的身份（作为可猜测的身份）
  const candidateRoles = Object.keys(gameData.specialRoles.roleConfig).filter(
    (roleKey) => {
      const roleConfig = gameData.specialRoles.roleConfig[roleKey];
      if (!roleConfig || roleConfig.faction === "lycheeAddict") return false;
      return gameData.players.some((player) => player.specialRole === roleKey);
    }
  );

  if (remaining <= 0 || candidateRoles.length === 0 || eligiblePlayers.length === 0) {
    logAbilityAction("silentWhisper", "unavailable", {
      reason: "no-charges-or-target",
      module,
      remaining,
      candidateRoles: candidateRoles.length,
      eligiblePlayers: eligiblePlayers.length,
    });
    container.innerHTML = `
      ${rememberAbilityNarration(
        mainText,
        subText
      )}
      <div class="bg-white/90 border border-primary/20 rounded-xl p-4 text-center space-y-4">
        <p class="text-gray-600">
          当前无法使用该能力。请确保你已经偷吃过荔枝，并且场上存在可供封印的普通/中立特殊身份目标。
        </p>
        <button
          id="silent-whisper-skip"
          class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover"
        >
          收声静候
        </button>
      </div>
    `;
    const skipBtn = container.querySelector("#silent-whisper-skip");
    if (skipBtn) {
      skipBtn.replaceWith(skipBtn.cloneNode(true));
      container
        .querySelector("#silent-whisper-skip")
        .addEventListener("click", skipAbilityUse);
    }
    document.getElementById("ability-result").classList.add("hidden");
    document.getElementById("ability-modal").classList.remove("hidden");
    gameData.currentAbilityModule = module;
    return;
  }

  container.innerHTML = `
    ${rememberAbilityNarration(
      mainText,
      subText
    )}
    <div class="space-y-6">
      ${
        silentBlessed
          ? `
        <div class="bg-primary/5 border border-primary/30 rounded-lg p-3 text-sm text-primary flex gap-2 items-start">
          <i class="fa fa-angellist mt-0.5"></i>
          <div>
            <p class="font-semibold">你正受沐恩天使庇护。</p>
            <p id="silent-angel-hint" class="mt-1">请选择目标后，天使会为你排除一个错误身份。</p>
          </div>
        </div>
      `
          : ""
      }
      <div>
        <h3 class="text-lg font-semibold text-primary font-tang mb-3">步骤一：选择目标使者</h3>
        <div id="silent-player-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"></div>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-primary font-tang mb-3">步骤二：选择要封印的身份</h3>
        <div id="silent-role-grid" class="flex flex-wrap gap-2"></div>
      </div>
      <div id="silent-selection-summary" class="bg-white/80 border border-dashed border-primary/30 rounded-lg p-3 text-sm text-gray-700 hidden">
        <p>目标：<span id="silent-selected-player" class="font-semibold text-primary"></span></p>
        <p>猜测身份：<span id="silent-selected-role" class="font-semibold text-primary"></span></p>
      </div>
      <div class="flex justify-center gap-4">
        <button
          id="silent-confirm"
          class="bg-primary text-white font-semibold px-6 py-2 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
        >
          落印缄声
        </button>
        <button
          id="silent-skip"
          class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded-full shadow-md"
        >
          匿声潜藏
        </button>
      </div>
    </div>
  `;

  const state = {
    playerId: null,
    roleKey: null,
    eliminatedRoleKey: null,
  };

  const playerGrid = container.querySelector("#silent-player-grid");
  const roleGrid = container.querySelector("#silent-role-grid");
  const summaryBox = container.querySelector("#silent-selection-summary");
  const summaryPlayer = container.querySelector("#silent-selected-player");
  const summaryRole = container.querySelector("#silent-selected-role");
  const confirmBtn = container.querySelector("#silent-confirm");
  const skipBtn = container.querySelector("#silent-skip");

  const roleButtons = {};
  const angelHint = container.querySelector("#silent-angel-hint");

  const refreshSummary = () => {
    const hasValidSelection =
      state.playerId && state.roleKey && state.roleKey !== state.eliminatedRoleKey;
    if (hasValidSelection) {
      summaryBox.classList.remove("hidden");
      const player = gameData.players.find((p) => p.id === state.playerId);
      const roleName = gameData.specialRoles.roleConfig[state.roleKey]?.name || "未知身份";
      summaryPlayer.textContent = player ? player.name : "未知";
      summaryRole.textContent = roleName;
      confirmBtn.disabled = false;
    } else {
      summaryBox.classList.add("hidden");
      confirmBtn.disabled = true;
    }
  };

  const clearAngelEliminationMarks = () => {
    Object.values(roleButtons).forEach((btn) => {
      if (!btn) return;
      btn.disabled = false;
      btn.classList.remove("opacity-60", "cursor-not-allowed");
      btn.querySelectorAll(".mu-en-angel-eliminated").forEach((tag) => tag.remove());
    });
  };

  const applyAngelRoleElimination = () => {
    if (!silentBlessed) return;
    clearAngelEliminationMarks();
    state.eliminatedRoleKey = null;
    if (!state.playerId) {
      if (angelHint) {
        angelHint.textContent = "请选择目标后，天使会为你排除一个错误身份。";
      }
      refreshSummary();
      return;
    }
    const target = gameData.players.find((p) => p.id === state.playerId);
    const actualRoleKey = target?.specialRole || null;
    const invalidRoles = candidateRoles.filter((roleKey) => roleKey !== actualRoleKey);
    if (invalidRoles.length === 0) {
      if (angelHint) {
        angelHint.textContent = `${target?.name || "该使者"} 没有可排除的身份信息。`;
      }
      refreshSummary();
      return;
    }
    const eliminatedKey = invalidRoles[Math.floor(Math.random() * invalidRoles.length)];
    state.eliminatedRoleKey = eliminatedKey;
    const eliminatedBtn = roleButtons[eliminatedKey];
    if (eliminatedBtn) {
      eliminatedBtn.disabled = true;
      eliminatedBtn.classList.add("opacity-60", "cursor-not-allowed");
      eliminatedBtn.insertAdjacentHTML(
        "beforeend",
        `<span class="block text-[10px] text-primary mu-en-angel-eliminated mt-1">已被天使排除</span>`
      );
      if (state.roleKey === eliminatedKey) {
        state.roleKey = null;
      }
    }
    if (angelHint) {
      const eliminatedName =
        gameData.specialRoles.roleConfig[eliminatedKey]?.name || "未知身份";
      angelHint.textContent = `天使提示：目标绝不可能是「${eliminatedName}」。`;
    }
    refreshSummary();
  };

  eligiblePlayers.forEach((player) => {
    const btn = document.createElement("button");
    btn.className =
      "border-2 border-gray-300 rounded-lg px-3 py-2 text-left bg-white hover:border-primary transition-all";
    btn.dataset.playerId = player.id;
    btn.innerHTML = `
      <div class="font-semibold text-gray-800">${player.name}</div>
      <div class="text-xs text-gray-500">使者${player.id}</div>
    `;
    btn.addEventListener("click", () => {
      playerGrid.querySelectorAll("button").forEach((b) =>
        b.classList.remove("border-primary", "bg-primary/10")
      );
      btn.classList.add("border-primary", "bg-primary/10");
      state.playerId = player.id;
      logAbilityAction("silentWhisper", "target-selected", {
        targetId: player.id,
        targetName: player.name,
      });
      applyAngelRoleElimination();
      refreshSummary();
    });
    playerGrid.appendChild(btn);
  });

  candidateRoles.forEach((roleKey) => {
    const roleConfig = gameData.specialRoles.roleConfig[roleKey];
    const roleBtn = document.createElement("button");
    roleBtn.className =
      "px-3 py-2 rounded-full border border-gray-300 text-sm bg-white hover:border-primary";
    roleBtn.dataset.roleKey = roleKey;
    roleBtn.textContent = roleConfig ? roleConfig.name : roleKey;
    roleBtn.addEventListener("click", () => {
      roleGrid.querySelectorAll("button").forEach((b) =>
        b.classList.remove("bg-primary", "bg-primary/10", "text-white", "text-primary", "border-primary", "font-semibold")
      );
      // 选中态：保证文字与背景有明显对比，不会“变成一片白色看不清”
      roleBtn.classList.add("bg-primary/10", "text-primary", "border-primary", "font-semibold");
      state.roleKey = roleKey;
      logAbilityAction("silentWhisper", "role-selected", {
        roleKey,
        roleName: roleConfig?.name || roleKey,
      });
      refreshSummary();
    });
    roleGrid.appendChild(roleBtn);
    roleButtons[roleKey] = roleBtn;
  });

  applyAngelRoleElimination();

  const resolveResultState = () => {
    const target = gameData.players.find((p) => p.id === state.playerId);
    const guessedRole = state.roleKey;
    const roleName = gameData.specialRoles.roleConfig[guessedRole]?.name || "未知身份";
    let message = "";
    let success = false;
    let blockedByBlessing = false;
    let blockedBySanctuary = false;

    if (!target) {
      message = "未能锁定目标，使得封印失败。";
    } else if (
      typeof isPlayerProtectedBySanctuary === "function" &&
      isPlayerProtectedBySanctuary(module, target.id)
    ) {
      blockedBySanctuary = true;
      const sanctuaryRecord =
        typeof getGoldenMonkSanctuary === "function"
          ? getGoldenMonkSanctuary(module)
          : null;
      const roomLabel = sanctuaryRecord?.roomLabel
        ? `（${sanctuaryRecord.roomLabel}）`
        : "";
      message = `${target.name} 所在的圣域庇护生效${roomLabel}，缄默无法对其施加封印。`;
      if (typeof recordGoldenMonkBlock === "function") {
        recordGoldenMonkBlock(module, "能力封印");
      }
    } else if (target.muEnAngelBlessed) {
      blockedByBlessing = true;
      message = `${target.name} 受到了沐恩天使的祝福，缄默无法封印 Ta。`;
    } else if (target.specialRole === guessedRole && !target.isLycheeAddict) {
      const previouslySealed = !!target.abilitySealed;
      if (!gameData.silentWhisperSeals) gameData.silentWhisperSeals = {};
      if (!gameData.silentWhisperSeals[module]) gameData.silentWhisperSeals[module] = [];
      gameData.silentWhisperSeals[module].push({
        targetId: target.id,
        previouslySealed,
      });
      if (!previouslySealed) {
        target.abilitySealed = true;
      }
      if (target.specialRole === "muEnAngel") {
        deactivateMuEnAngelBlessing(module, "sealed");
        message = `${target.name} 的「${roleName}」能力被永久封印，沐恩祝福被驱散！`;
      } else if (target.specialRole === "goldenMonk") {
        const sanctuaryRecord =
          typeof getGoldenMonkSanctuary === "function" ? getGoldenMonkSanctuary(module) : null;
        if (sanctuaryRecord && sanctuaryRecord.active) {
          logAbilityAction("silentWhisper", "cancel-sanctuary", {
            module,
            targetId: target.id,
            sanctRoom: sanctuaryRecord.roomProp,
          });
          if (typeof removeGoldenMonkSanctuary === "function") {
            removeGoldenMonkSanctuary(module, { dispelledBy: "silentWhisper" });
          }
          message = `${target.name} 的「${roleName}」能力被永久封印，先前建立的圣域随即消散！`;
        } else {
          message = `${target.name} 的「${roleName}」能力被永久封印！`;
        }
      } else {
        message = `${target.name} 的「${roleName}」能力被永久封印！`;
      }
      success = true;
    } else {
      message = `${target.name} 并非「${roleName}」，封印失败。`;
    }
    return { message, success, blockedByBlessing, blockedBySanctuary, target, roleName };
  };

  const handleConfirm = () => {
    const target = gameData.players.find((p) => p.id === state.playerId);
    const guessedRole = state.roleKey;
    const roleName = gameData.specialRoles.roleConfig[guessedRole]?.name || "未知身份";
    const resultText = document.getElementById("ability-result-text");
    const { message, success, blockedByBlessing, blockedBySanctuary } = resolveResultState();
    silent.abilityUses += 1;
    if (!silent.abilityUsage) silent.abilityUsage = {};
    silent.abilityUsage[module] = true;
    silent.abilityUsed = silent.abilityUses >= (silent.silentCharges || 0);

    // 刷新使用者信息显示，更新使用次数
    const { usedTimes, maxUses, isExhausted } = getAbilityUsageStats(silent, "silentWhisper");
    const updatedStatusText = `使用次数：${usedTimes}/${maxUses}${isExhausted ? "（已耗尽）" : ""}`;
    const updatedHintText = isExhausted
      ? "每当你偷吃一颗荔枝，就能获得一次使用机会"
      : "选择目标使者与其可能的身份，尝试封印对方的能力";
    updateAbilityUserInfo(
      "缄默",
      silent.name,
      updatedStatusText,
      updatedHintText
    );
    renderMuEnAngelBlessingHint(silent);

    if (!gameData.abilityResults) gameData.abilityResults = {};
    if (!gameData.abilityResults[module]) gameData.abilityResults[module] = {};
    if (!Array.isArray(gameData.abilityResults[module].silentWhisper)) {
      gameData.abilityResults[module].silentWhisper = [];
    }
    const blessed = isMuEnAngelBlessed(silent);
    gameData.abilityResults[module].silentWhisper.push({
      targetId: target?.id || null,
      targetName: target?.name || "未知",
      guessedRoleKey: guessedRole,
      guessedRoleName: roleName,
      success: success,
      blockedByBlessing,
      blockedBySanctuary,
      muEnBlessed: blessed,
      message,
    });

    logAbilityAction("silentWhisper", "execute", {
      targetId: target?.id || null,
      targetName: target?.name || "未知",
      guessedRoleKey: guessedRole,
      guessedRoleName: roleName,
      success,
      blockedByBlessing,
      blockedBySanctuary,
      message,
      module,
    });

    if (resultText) {
      resultText.textContent = message;
      resultText.className = "text-lg font-bold text-primary";
    }
    container.classList.add("hidden");
    const resultBox = document.getElementById("ability-result");
    if (resultBox) {
      resultBox.classList.remove("hidden");
      updateAbilityResultNarration();
      rebindConfirmButton();
    }
  };

  confirmBtn.addEventListener("click", handleConfirm);
  skipBtn.addEventListener("click", skipAbilityUse);

  document.getElementById("ability-result").classList.add("hidden");
  document.getElementById("ability-modal").classList.remove("hidden");
  gameData.currentAbilityModule = module;
}

