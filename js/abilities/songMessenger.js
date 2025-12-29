/**
 * 牧歌传讯者能力模块
 * 
 * 角色信息：
 * - 阵营：普通阵营
 * - 能力：查验某一轮所有房间的真实人数（信息获取，不改变配置）；若获沐恩祝福，会额外获知上一轮骨哨虫王是否出手
 * - 使用上限：默认每局最多 4 次，在易容术士之后行动
 * 
 * 函数列表：
 * 
 * 【主要功能】
 * - showSongMessengerAbility(module): 显示牧歌传讯者能力界面（入口函数）
 * - useSongMessengerAbility(module): 执行人数查验并展示结果
 * 
 * 【工具函数】
 * - formatRoomRealCounts(module): 按模块格式化真实人数结果（用于显示）
 */

// 显示牧歌传讯者能力界面
function showSongMessengerAbility(module) {
  if (gameData) gameData.currentAbilityRoleKey = "songMessenger";
  const messenger = gameData.players.find((p) => p.specialRole === "songMessenger");
  logAbilityAction("songMessenger", "show", {
    module,
    assigned: !!messenger,
    player: messenger?.name || null,
  });

  // 未配置：直接进入结果
  if (!messenger) {
    logAbilityAction("songMessenger", "skip-no-role", { module });
    showModuleResult(module);
    return;
  }

  const mainText =
    "牧歌传讯者，请睁眼。你要获知本轮各房间的真实人数吗？你获知到的人数如下所示。行动结束请闭眼。";
  const subText = "汝可闻风知数。";

  if (messenger.abilitySealed) {
    logAbilityAction("songMessenger", "sealed", { player: messenger.name, module });
    // 被封印时也使用同一段“睁眼/闭眼”口播文案
    if (typeof rememberAbilityNarration === "function") {
      rememberAbilityNarration(mainText, subText);
    }
    showAbilitySealedMessage("牧歌传讯者", messenger.name, module);
    return;
  }

  // 进入该能力前，隐藏其它能力区块，确保互斥
  if (typeof hideAllAbilitySections === "function") hideAllAbilitySections();

  if (typeof renderAbilityContextInfo === "function") {
    renderAbilityContextInfo(module);
  }

  // 创建能力容器
  const abilityContainer = createAbilityContainer("song-messenger-ability");
  abilityContainer.innerHTML = rememberAbilityNarration(mainText, subText);

  // 更新使用者信息
  const { usedTimes, maxUses, isExhausted } = getAbilityUsageStats(messenger, 'songMessenger');
  updateAbilityUserInfo(
    "牧歌传讯者",
    messenger.name,
    `使用次数：${usedTimes}/${maxUses}${isExhausted ? '（已耗尽）' : ''}`,
    isExhausted ? "能力次数已耗尽，无法再次使用" : "查验本轮所有房间的真实人数（不改变任何配置）"
  );
  renderMuEnAngelBlessingHint(messenger);

  // 检查能力是否可用
  const canUse = canUseAbility(messenger);

  // 本能力专属按钮（避免影响药巫界面）
  abilityContainer.className = "";
  if (!canUse) {
    logAbilityAction("songMessenger", "unavailable", { reason: "exhausted", module });
    const exhaustedEl = createAbilityExhaustedElement({
      roleName: "牧歌传讯者",
      usedTimes,
      maxUses,
      description: "牧歌传讯者的能力使用次数已用尽，无法再次使用",
    });
    exhaustedEl.classList.add("mt-4");
    abilityContainer.appendChild(exhaustedEl);
    const actionsEl = document.createElement("div");
    actionsEl.className = "mt-4 flex justify-center space-x-4";
    actionsEl.innerHTML = `
      <button id="song-skip" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover">静候来音</button>
    `;
    abilityContainer.appendChild(actionsEl);
    actionsEl.querySelector("#song-skip").addEventListener("click", skipAbilityUse);
  } else {
    const actionsEl = document.createElement("div");
    actionsEl.className = "mt-4 flex justify-center space-x-4";
    actionsEl.innerHTML = `
        <button id="song-use" class="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-md scale-hover">请风报数</button>
        <button id="song-skip" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md scale-hover">静候来音</button>
      `;
    abilityContainer.appendChild(actionsEl);

    // 绑定本地按钮事件
    const useBtn = actionsEl.querySelector("#song-use");
    const skipBtn = actionsEl.querySelector("#song-skip");
    useBtn.replaceWith(useBtn.cloneNode(true));
    skipBtn.replaceWith(skipBtn.cloneNode(true));
    actionsEl.querySelector("#song-use").addEventListener("click", () =>
      useSongMessengerAbility(module)
    );
    actionsEl.querySelector("#song-skip").addEventListener("click", skipAbilityUse);
  }

  // 显示模态
  document.getElementById("ability-result").classList.add("hidden");
  document.getElementById("ability-modal").classList.remove("hidden");
  gameData.currentAbilityModule = module;

  // 重绑确认按钮
  rebindConfirmButton();
}

// 执行牧歌传讯者查验
function useSongMessengerAbility(module) {
  if (typeof lockAbilityAction === "function" && !lockAbilityAction()) return;
  const messenger = gameData.players.find(
    (p) =>
      p.specialRole === "songMessenger" &&
      (p.abilityUses ?? 0) <
        (typeof getAbilityMaxUses === "function"
          ? getAbilityMaxUses("songMessenger")
          : 4)
  );
  if (!messenger) {
    if (typeof unlockAbilityAction === "function") unlockAbilityAction();
    return;
  }

  // 增加使用次数与记录
  if (typeof messenger.abilityUses !== "number") messenger.abilityUses = 0;
  messenger.abilityUses += 1;
  const { maxUses } = getAbilityUsageStats(messenger, "songMessenger");
  messenger.abilityUsed = messenger.abilityUses >= maxUses;
  if (!messenger.abilityUsage) messenger.abilityUsage = {};
  messenger.abilityUsage[module] = true;

  // 刷新使用者信息，更新使用次数
  updateAbilityUserInfo(
    "牧歌传讯者",
    messenger.name,
    `使用次数：${messenger.abilityUses}/${maxUses}${messenger.abilityUsed ? '（已耗尽）' : ''}`,
    messenger.abilityUsed ? "能力次数已耗尽，无法再次使用" : "查验本轮所有房间的真实人数（不改变任何配置）"
  );
  renderMuEnAngelBlessingHint(messenger);

  // 生成结果：显示本轮所有房间的真实人数（不改变任何数据）
  const result = formatRoomRealCounts(module);
  const countsPayload = getSongMessengerCounts(module);
  logAbilityAction("songMessenger", "execute", { module, counts: countsPayload });

  // 记录复盘数据快照（包含当时是否被沐恩祝福）
  if (!gameData.abilityResults) gameData.abilityResults = {};
  if (!gameData.abilityResults[module]) gameData.abilityResults[module] = {};
  gameData.abilityResults[module].songMessenger = {
    counts: countsPayload,
    muEnBlessed: isMuEnAngelBlessed(messenger),
  };

  // 展示结果
  const resultTextEl = document.getElementById("ability-result-text");
  resultTextEl.innerHTML = result;
  resultTextEl.className = "text-lg font-bold text-dark";
  if (isMuEnAngelBlessed(messenger)) {
    const prevModule = getPreviousModuleKey(module);
    const bugMoved = prevModule ? Boolean(gameData.boneWhistleKingTarget?.[prevModule]) : null;
    const hint = document.createElement("div");
    hint.className = "mt-3 text-sm text-primary bg-primary/5 border border-primary/20 rounded p-2";
    let hintText = "上一轮暂无虫子出动数据。";
    if (bugMoved === true) {
      hintText = "经回忆，你发现上一轮虫子曾经出动过。";
    } else if (bugMoved === false) {
      hintText = "经回忆，你上一轮没有听到虫子出动过。（虫子没有出动或被「不动明王咒」成功阻挡）";
    }
    hint.innerHTML = `<span class="font-semibold">沐恩祝福提示：</span>${hintText}`;
    resultTextEl.appendChild(hint);
  }

  // 隐藏其它能力区块（除结果区），避免与易容术士界面重叠
  if (typeof hideAllAbilitySections === "function") hideAllAbilitySections();

  // 单独展示结果区
  document.getElementById("ability-result").classList.remove("hidden");
  updateAbilityResultNarration();

  // 重绑确认按钮
  rebindConfirmButton();
  if (typeof unlockAbilityAction === "function") unlockAbilityAction();
}

// 工具：按模块格式化真实人数结果
function formatRoomRealCounts(module) {
  if (module === "module1") {
    const s = gameData.module1.smallRoom.realMembers.length;
    const l = gameData.module1.largeRoom.realMembers.length;
    return `
      <div class="text-center">
        <div>本轮真实人数</div>
        <div class="mt-1">小房间：<span class="font-bold text-primary">${s}</span> 人</div>
        <div>大房间：<span class="font-bold text-primary">${l}</span> 人</div>
      </div>
    `;
  } else if (module === "module2") {
    const s = gameData.module2.smallRoom.realMembers.length;
    const l = gameData.module2.largeRoom.realMembers.length;
    return `
      <div class="text-center">
        <div>本轮真实人数</div>
        <div class="mt-1">小房间：<span class="font-bold text-primary">${s}</span> 人</div>
        <div>大房间：<span class="font-bold text-primary">${l}</span> 人</div>
      </div>
    `;
  } else if (module === "module3") {
    const s = gameData.module3.smallRoom.realMembers.length;
    const l = gameData.module3.largeRoom.realMembers.length;
    return `
      <div class="text-center">
        <div>本轮真实人数</div>
        <div class="mt-1">小房间：<span class="font-bold text-primary">${s}</span> 人</div>
        <div>大房间：<span class="font-bold text-primary">${l}</span> 人</div>
      </div>
    `;
  } else if (module === "module4") {
    const r1 = gameData.module4.room1.realMembers.length;
    const r2 = gameData.module4.room2.realMembers.length;
    const r3 = gameData.module4.room3.realMembers.length;
    return `
      <div class="text-center">
        <div>本轮真实人数</div>
        <div class="mt-1">房间1：<span class="font-bold text-primary">${r1}</span> 人</div>
        <div>房间2：<span class="font-bold text-primary">${r2}</span> 人</div>
        <div>房间3：<span class="font-bold text-primary">${r3}</span> 人</div>
      </div>
    `;
  }
  return `<div class="text-center">未识别的模块</div>`;
}

function getSongMessengerCounts(module) {
  if (!gameData) return {};
  if (module === "module1" || module === "module2" || module === "module3") {
    const moduleData = gameData[module];
    if (!moduleData) return {};
    return {
      smallRoom: moduleData.smallRoom?.realMembers?.length ?? 0,
      largeRoom: moduleData.largeRoom?.realMembers?.length ?? 0,
    };
  }
  if (module === "module4") {
    const moduleData = gameData.module4;
    if (!moduleData) return {};
    return {
      room1: moduleData.room1?.realMembers?.length ?? 0,
      room2: moduleData.room2?.realMembers?.length ?? 0,
      room3: moduleData.room3?.realMembers?.length ?? 0,
    };
  }
  return {};
}