/**
 * 沐恩天使能力模块
 *
 * 角色信息：
 * - 阵营：普通阵营
 * - 能力：第二轮审查中必须祝福一名使者，使其能力永久免疫缄默封印，并按身份获得对应强化
 * - 限制：只在第二轮审查（module2）行动一次，能力使用次数恒为 1 且不可更改
 * - 行动顺序：在缄默之前（能力队列中排在缄默前）
 *
 * 祝福强化效果：
 * - 缄默：每次猜测会排除一个错误身份；即便命中也无法封印
 * - 胡庭药巫：查验时可得知被查验者的具体特殊身份（若有）
 * - 易容术士：可与其他房间的一名使者互换真实位置
 * - 牧歌传讯者：除了人数，还能得知上一轮骨哨虫王是否行动
 * - 骨哨虫王：能力使用上限 +1
 * - 憨巴郎：最终票数额外 +荔枝瘾人数
 * - 其他身份：获得永久的“免疫封印”效果
 *
 * 函数列表：
 * - showMuEnAngelAbility(module): 显示沐恩天使能力界面（仅在第二轮真正生效）
 * - executeMuEnAngelAbility(module): 执行祝福逻辑并展示结果
 */

/**
 * 显示沐恩天使能力界面
 * @param {string} module - 当前模块名称，如 "module2"
 */
function showMuEnAngelAbility(module) {
  if (gameData) gameData.currentAbilityRoleKey = "muEnAngel";
  const angel = gameData.players.find((p) => p.specialRole === "muEnAngel");
  logAbilityAction("muEnAngel", "show", {
    module,
    assigned: !!angel,
    player: angel?.name || null,
  });

  // 无天使或模块非第二轮：直接跳过，进入下一能力
  if (!angel || module !== "module2") {
    logAbilityAction("muEnAngel", "skip-no-role", {
      module,
      reason: angel ? "module-mismatch" : "unassigned",
    });
    if (typeof proceedNextAbilityOrResult === "function") {
      proceedNextAbilityOrResult(module);
    }
    return;
  }

  // 若天使被封印，则直接展示“能力已被封印”提示（与其他身份一致）
  if (angel.abilitySealed) {
    logAbilityAction("muEnAngel", "sealed", { player: angel.name, module });
    if (typeof rememberAbilityNarration === "function") {
      rememberAbilityNarration(
        "沐恩天使，请睁眼。你本应可以祝福一位使者，但你的神恩之力已被封印。行动结束请闭眼。",
        "若连天使也被噤声，尘世更添几分凄冷。"
      );
    }
    if (typeof showAbilitySealedMessage === "function") {
      showAbilitySealedMessage("沐恩天使", angel.name, module);
      return;
    }
  }

  // 进入本能力前，先隐藏其他能力区块，确保界面互斥
  if (typeof hideAllAbilitySections === "function") hideAllAbilitySections();

  // 每次打开界面前重置临时选择，避免复用旧目标
  gameData.currentAbilitySelection = null;

  if (typeof renderAbilityContextInfo === "function") {
    renderAbilityContextInfo(module);
  }

  // 使用次数：固定为 1 次（由全局能力上限控制）
  const { usedTimes, maxUses, isExhausted } = getAbilityUsageStats(
    angel,
    "muEnAngel"
  );

  const mainText =
    "沐恩天使，请睁眼。你必须在第二轮祝福一位心仪的使者，使其能力自此免疫封印并获得强化。请指认你要祝福的对象。行动结束请闭眼。";
  const subText = "汝可赐人羽翼，使其于暗夜中亦得神恩庇护。";

  const abilityContainer = createAbilityContainer("mu-en-angel-ability");
  abilityContainer.classList.remove("hidden");
  abilityContainer.innerHTML = rememberAbilityNarration(mainText, subText);

  updateAbilityUserInfo(
    "沐恩天使",
    angel.name,
    `使用次数：${usedTimes}/${maxUses}${isExhausted ? "（已耗尽）" : ""}`,
    isExhausted
      ? "本局你已完成祝福，无法再次使用此能力。"
      : "你必须指定一名其他使者，立即赋予其天使祝福。"
  );
  renderMuEnAngelBlessingHint(null);

  // 若已耗尽，本版本仍展示统一“能力耗尽”面板，方便主持人理解状态
  if (isExhausted) {
    logAbilityAction("muEnAngel", "unavailable", { reason: "exhausted", module });
    const exhaustedEl = createAbilityExhaustedElement({
      roleName: "沐恩天使",
      usedTimes,
      maxUses,
      description: "沐恩天使的神恩已在本局用尽，无法再次祝福他人。",
    });
    exhaustedEl.classList.add("mt-4");
    abilityContainer.appendChild(exhaustedEl);

    const actionsEl = document.createElement("div");
    actionsEl.className = "mt-4 flex justify-center";
    actionsEl.innerHTML = `
      <button id="mu-en-angel-exhausted-next" class="bg-primary/70 hover:bg-primary text-white font-bold py-2 px-6 rounded-full shadow-md scale-hover">
        回归审查
      </button>
    `;
    abilityContainer.appendChild(actionsEl);
    actionsEl
      .querySelector("#mu-en-angel-exhausted-next")
      .addEventListener("click", () => {
        if (typeof confirmAbilityResult === "function") {
          confirmAbilityResult();
        } else if (typeof proceedNextAbilityOrResult === "function") {
          proceedNextAbilityOrResult(module);
        }
      });
  } else {
    // 渲染祝福目标选择网格
    const gridWrapper = document.createElement("div");
    gridWrapper.className =
      "mt-4 bg-white/90 border border-primary/10 rounded-xl p-4 space-y-3";
    gridWrapper.innerHTML = `
      <p class="text-sm text-gray-700 mb-1 text-center">
        请选择一位要祝福的使者。祝福立即生效，无法撤回，且本轮必须完成。
      </p>
      <div id="mu-en-angel-player-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"></div>
      <div id="mu-en-angel-selection" class="bg-primary/5 border border-primary/20 rounded-lg p-2 text-xs text-gray-700 hidden">
        当前选择：<span id="mu-en-angel-target-name" class="font-semibold text-primary"></span>
      </div>
      <div class="mt-3 flex justify-center">
        <button id="mu-en-angel-use" class="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-md scale-hover" disabled>
          赐降神恩
        </button>
      </div>
    `;
    abilityContainer.appendChild(gridWrapper);

    const gridEl = gridWrapper.querySelector("#mu-en-angel-player-grid");
    const selectionBox = gridWrapper.querySelector("#mu-en-angel-selection");
    const selectionName = gridWrapper.querySelector(
      "#mu-en-angel-target-name"
    );
    const useBtn = gridWrapper.querySelector("#mu-en-angel-use");

    // 允许祝福任意一名非自身的使者（包括荔枝瘾阵营和中立阵营）
    const candidatePlayers = gameData.players.filter(
      (player) => player.id !== angel.id
    );

    candidatePlayers.forEach((player) => {
      const btn = document.createElement("button");
      btn.className =
        "bg-white border-2 border-gray-300 hover:border-primary rounded-lg p-3 text-center text-sm transition-all";
      btn.dataset.playerId = player.id;
      btn.innerHTML = `
        <div class="font-bold mb-1">${player.name}</div>
        <div class="text-[10px] leading-none text-gray-400">使者${player.id}</div>
      `;
      btn.addEventListener("click", () => {
        gridEl.querySelectorAll("button").forEach((b) => {
          b.classList.remove("border-primary", "bg-primary/10");
          b.classList.add("border-gray-300");
        });
        btn.classList.remove("border-gray-300");
        btn.classList.add("border-primary", "bg-primary/10");
        gameData.currentAbilitySelection = player.id;
        logAbilityAction("muEnAngel", "target-selected", {
          targetId: player.id,
          targetName: player.name,
        });
        if (selectionBox && selectionName) {
          selectionBox.classList.remove("hidden");
          selectionName.textContent = player.name;
        }
        if (useBtn) useBtn.disabled = false;
      });
      gridEl.appendChild(btn);
    });

    if (useBtn) {
      useBtn.addEventListener("click", () => executeMuEnAngelAbility(module));
    }
  }

  // 隐藏结果区，显示能力模态框
  const abilityResult = document.getElementById("ability-result");
  if (abilityResult) abilityResult.classList.add("hidden");

  const modal = document.getElementById("ability-modal");
  if (modal) modal.classList.remove("hidden");
  gameData.currentAbilityModule = module;

  if (typeof rebindConfirmButton === "function") {
    rebindConfirmButton();
  }
}

/**
 * 执行沐恩天使祝福逻辑
 * @param {string} module - 当前模块名称
 */
function executeMuEnAngelAbility(module) {
  if (typeof lockAbilityAction === "function" && !lockAbilityAction()) return;

  const angel = gameData.players.find((p) => p.specialRole === "muEnAngel");
  const targetId = gameData.currentAbilitySelection;
  const target = gameData.players.find((p) => p.id === targetId);

  if (!angel || !target) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    if (typeof proceedNextAbilityOrResult === "function") {
      proceedNextAbilityOrResult(module);
    }
    return;
  }
  logAbilityAction("muEnAngel", "execute", {
    targetId: target.id,
    targetName: target.name,
    module,
  });

  // 记录使用次数（上限固定为 1）
  if (typeof angel.abilityUses !== "number") angel.abilityUses = 0;
  angel.abilityUses += 1;
  angel.abilityUsed = true;
  if (!angel.abilityUsage) angel.abilityUsage = {};
  angel.abilityUsage[module] = true;

  // 记录本局祝福对象
  applyMuEnAngelBlessing(target, module);
  if (!gameData.abilityResults) gameData.abilityResults = {};
  if (!gameData.abilityResults[module]) gameData.abilityResults[module] = {};
  gameData.abilityResults[module].muEnAngel = {
    targetId: target.id,
    targetName: target.name,
    roleKey: target.specialRole || null,
    effectText: getMuEnAngelBlessingEffect(target.specialRole),
    status: "active",
  };
  updateMuEnAngelAbilityResultStatus(module, "active");

  // 更新使用者信息显示
  const { maxUses } = getAbilityUsageStats(angel, "muEnAngel");
  updateAbilityUserInfo(
    "沐恩天使",
    angel.name,
    `使用次数：${angel.abilityUses}/${maxUses}（已耗尽）`,
    "你已完成本局的祝福。祝福对象的能力已被加强且免疫封印。"
  );
  renderMuEnAngelBlessingHint(null);

  // 展示结果提示（避免泄露目标，仅给主持人口播）
  const resultEl = document.getElementById("ability-result-text");
  if (resultEl) {
    resultEl.innerHTML = `
      <div class="text-lg font-bold text-primary">沐恩天使已完成祝福。</div>
      <p class="mt-2 text-sm text-gray-700">具体祝福强化效果你无从得知。</p>
    `;
    resultEl.className = "text-center text-gray-700";
  }

  const abilityContainer = document.getElementById("mu-en-angel-ability");
  if (abilityContainer) abilityContainer.classList.add("hidden");

  const abilityResult = document.getElementById("ability-result");
  if (abilityResult) abilityResult.classList.remove("hidden");

  if (typeof updateAbilityResultNarration === "function") {
    updateAbilityResultNarration();
  }
  if (typeof rebindConfirmButton === "function") {
    rebindConfirmButton();
  }

  if (typeof unlockAbilityAction === "function") unlockAbilityAction();
}



