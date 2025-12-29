/**
 * 能力系统基类
 *
 * 本文件包含所有特殊能力系统共用的通用函数，包括：
 * - 能力分配与管理
 * - 能力使用流程控制
 * - 能力状态重置
 * - 能力界面渲染工具
 * - 能力结果确认
 *
 * 函数分类：
 *
 * 【能力分配与初始化】
 * - assignSpecialRoles(): 分配特殊角色给所有玩家
 * - assignSpecialRole(roleType): 手动分配单个特殊角色
 * - updateSpecialRoleButtons(): 更新特殊角色按钮状态
 *
 * 【能力使用流程控制】
 * - skipAbilityUse(): 跳过能力使用
 * - confirmAbilityResult(): 确认能力使用结果
 * - showModuleResult(module): 显示指定模块的审查结果
 * - proceedNextAbilityOrResult(module): 队列流转：继续下一个能力或显示结果
 * - lockAbilityAction() / unlockAbilityAction(): 锁定/解锁能力操作（防止重复点击）
 *
 * 【能力状态重置】
 * - resetModuleAbilities(module): 重置模块的能力使用状态
 * - resetSilentWhisperSeals(module): 回滚缄默封印及复盘记录
 * - resetSilentWhisperCharges(module): 回滚缄默本轮偷吃获得的能力上限
 * - recordSilentWhisperChargeGain(playerId, module, gain): 记录缄默在指定轮次新增的使用次数
 * - shouldResetAbilityForModule(module, roleType, player): 判断是否应该为指定模块重置能力
 * - resetPlayerAbilityUsage(player, module): 重置玩家能力使用状态（含使用次数回退）
 *
 * 【能力可用性检查】
 * - canUseAbility(player): 检查玩家是否可以使用能力
 * - checkAbilityActivation(player): 保留的兼容检查（当前所有角色随时可用）
 * - wasAbilityUsedInModule(module, player): 检查能力是否在指定模块中被使用过
 * - getAbilityMaxUses(roleType): 获取身份能力的使用上限（支持基础设定中的自定义）
 * - getAbilityUsageStats(player, roleType): 统一获取能力使用次数及耗尽状态
 *
 * 【能力界面渲染工具】
 * - getPlayerNameById(playerId): 根据玩家 ID 获取名称
 * - createMemberChips(members, guardId): 生成房间成员标签 HTML
 * - renderAbilityContextInfo(module): 渲染能力使用界面的房间配置概览
 * - getRoomLabel(module, roomProp): 获取房间标签（公用函数）
 * - getRoomOptions(module): 获取房间选项列表（公用函数）
 * - updateAbilityUserInfo(roleName, playerName, statusText, hintText): 更新能力使用者信息显示
 * - createAbilityExhaustedElement(options): 渲染"能力耗尽"提示
 * - createAbilityContainer(containerId): 创建或获取能力容器
 * - rebindConfirmButton(): 重绑确认按钮事件
 * - showAbilitySealedMessage(roleName, playerName, module): 显示能力被封印的消息
 * - showLycheeAddictAction(module): 显示荔枝瘾进房前的秘密讨论
 * - processLycheeAddictEating(module): 处理荔枝瘾成员偷吃逻辑（在能力使用后自动执行，并确保缄默每轮仅增一次使用次数）
 *
 * 【能力叙述与结果】
 * - getAbilityNarrationHTML(mainText, subtitle): 生成能力叙述 HTML
 * - rememberAbilityNarration(mainText, subtitle): 记录并返回能力叙述 HTML
 * - updateAbilityResultNarration(): 更新能力结果区域的叙述显示
 */

const abilityRoleNameMap = {
  system: "系统",
  muEnAngel: "沐恩天使",
  goldenMonk: "金刚僧",
  medicineShaman: "胡庭药巫",
  disguiseMaster: "易容术士",
  songMessenger: "牧歌传讯者",
  boneWhistleKing: "骨哨虫王",
  silentWhisper: "缄默",
  hanBaLang: "憨巴郎",
  lycheeAction: "荔枝瘾进房前的秘密讨论",
};

const abilityActionLabels = {
  show: "进入界面",
  "skip-no-role": "无此身份，直接跳过",
  skip: "跳过",
  "confirm-result": "确认结果",
  execute: "执行能力",
  sealed: "能力被封印",
  unavailable: "次数耗尽",
  "target-selected": "选择目标",
  "role-selected": "选择身份",
  "queue-pop": "进入队列",
  "queue-skip": "跳过队列项",
  "show-module-result": "展示模块结果",
  complete: "完成行动",
  evaluate: "评估结果",
  "passive-check": "被动结算",
};

const abilityFriendlyKeyMap = {
  module: "模块",
  reason: "原因",
  assigned: "是否存在身份",
  player: "使者",
  targetName: "目标",
  targetId: "目标ID",
  roomLabel: "房间",
  roomProp: "房间代号",
  fromRoom: "原房间",
  fromLabel: "原房间",
  toRoom: "目标房间",
  toLabel: "目标房间",
  counts: "人数详情",
  remaining: "剩余待处理",
  guessedRoleName: "猜测身份",
  guessedRoleKey: "猜测代号",
  success: "是否成功",
  isLycheeAddict: "是否荔枝瘾",
  triggered: "是否触发",
  sealed: "是否被封",
  isTop: "是否最高票",
  votes: "票数",
  roleName: "身份名",
  roleKey: "身份代号",
  candidateRoles: "候选身份",
  eligiblePlayers: "可选使者",
  message: "信息",
  validInput: "输入有效",
};

const MU_EN_ABILITY_MODULE = "module2";

const muEnAngelBlessingEffectMap = {
  silentWhisper: "每次猜测身份时，天使会排除一个错误身份。",
  medicineShaman: "查验后会额外看见目标的特殊身份（若有）。",
  disguiseMaster: "可直接与其他房间的一名使者互换真实位置。",
  songMessenger: "获得人数结果的同时，得知上一轮骨哨虫王是否发动行动。",
  boneWhistleKing: "能力使用上限 +1。",
  hanBaLang: "最终票数固定额外 +荔枝瘾人数。",
  goldenMonk: "圣域结算时会揭示被抵御的能力类型。",
  default: "能力免疫缄默封印，且强化效果持续生效。",
};

function isMuEnAngelBlessed(playerOrId) {
  if (!playerOrId) return false;
  if (typeof playerOrId === "object") {
    return !!playerOrId.muEnAngelBlessed;
  }
  const numericId =
    typeof playerOrId === "number"
      ? playerOrId
      : parseInt(playerOrId, 10);
  if (!numericId || !Array.isArray(gameData?.players)) return false;
  const found = gameData.players.find((p) => p.id === numericId);
  return !!found?.muEnAngelBlessed;
}

function applyMuEnAngelBlessing(target, module) {
  if (!target || !gameData) return;
  const blessModule = module || MU_EN_ABILITY_MODULE;
  const store = ensureMuEnAngelStore();
  const roleKey = target.specialRole || null;
  markPlayerAsMuEnBlessed(target, blessModule);
  store[blessModule] = {
    targetId: target.id,
    targetName: target.name,
    roleKey,
    effectKey: roleKey || "default",
    effectText: getMuEnAngelBlessingEffect(roleKey),
    active: true,
    suspendedReason: null,
  };
  gameData.muEnAngelBlessing = {
    targetId: target.id,
    targetName: target.name,
    module: blessModule,
    timestamp: Date.now(),
  };
}

function getMuEnAngelBlessingEffect(roleKey) {
  if (!roleKey) return muEnAngelBlessingEffectMap.default;
  return (
    muEnAngelBlessingEffectMap[roleKey] ||
    muEnAngelBlessingEffectMap.default
  );
}

function renderMuEnAngelBlessingHint(player) {
  const container = document.getElementById("ability-user-info");
  if (!container) return;
  const existing = container.querySelector(".mu-en-angel-hint");
  if (existing) existing.remove();
  if (!isMuEnAngelBlessed(player)) return;
  const roleKey = player?.specialRole || gameData?.currentAbilityRoleKey || null;
  const effectText = getMuEnAngelBlessingEffect(roleKey);
  const hintEl = document.createElement("div");
  hintEl.className =
    "mu-en-angel-hint mt-3 flex items-start gap-2 text-sm text-primary border border-primary/30 bg-white/80 rounded-lg px-3 py-2 shadow-sm";
  hintEl.innerHTML = `
    <i class="fa fa-angellist text-primary mt-0.5"></i>
    <div>
      <p class="font-semibold">沐恩祝福：你的能力免疫封印。</p>
      <p>${effectText}</p>
    </div>
  `;
  container.appendChild(hintEl);
}

function ensureMuEnAngelStore() {
  if (!gameData.muEnAngelBlessTarget) {
    gameData.muEnAngelBlessTarget = {};
  }
  return gameData.muEnAngelBlessTarget;
}

function resolveMuEnBlessModule(module) {
  if (!gameData?.muEnAngelBlessTarget) return null;
  if (module && gameData.muEnAngelBlessTarget[module]) return module;
  if (gameData.muEnAngelBlessTarget[MU_EN_ABILITY_MODULE]) return MU_EN_ABILITY_MODULE;
  return null;
}

function getMuEnAngelBlessRecord(module = MU_EN_ABILITY_MODULE) {
  const resolved = resolveMuEnBlessModule(module);
  if (!resolved) return null;
  return gameData.muEnAngelBlessTarget[resolved] || null;
}

function markPlayerAsMuEnBlessed(player, module) {
  if (!player) return;
  player.muEnAngelBlessed = true;
  player.muEnAngelBlessedModule = module || null;
  player.abilitySealed = false;
}

function unmarkPlayerMuEnBless(player, module) {
  if (!player) return;
  if (module && player.muEnAngelBlessedModule && player.muEnAngelBlessedModule !== module) {
    return;
  }
  player.muEnAngelBlessed = false;
  player.muEnAngelBlessedModule = null;
}

function updateMuEnAngelAbilityResultStatus(module, status, extra = {}) {
  const targetModule = module && gameData?.abilityResults?.[module]?.muEnAngel
    ? module
    : (gameData?.abilityResults?.[MU_EN_ABILITY_MODULE] ? MU_EN_ABILITY_MODULE : null);
  if (!targetModule) return;
  if (!gameData.abilityResults[targetModule].muEnAngel) return;
  gameData.abilityResults[targetModule].muEnAngel.status = status;
  if (extra.reason) {
    gameData.abilityResults[targetModule].muEnAngel.reason = extra.reason;
  }
  if (extra.note) {
    gameData.abilityResults[targetModule].muEnAngel.note = extra.note;
  }
}

function deactivateMuEnAngelBlessing(module = MU_EN_ABILITY_MODULE, reason = "manual") {
  const targetModule = resolveMuEnBlessModule(module);
  const record = targetModule ? getMuEnAngelBlessRecord(targetModule) : null;
  if (!record || !record.active) return;
  const player = gameData.players.find((p) => p.id === record.targetId);
  if (player) {
    unmarkPlayerMuEnBless(player, targetModule);
  }
  record.active = false;
  record.suspendedReason = reason;
  gameData.muEnAngelBlessing = null;
  updateMuEnAngelAbilityResultStatus(targetModule, "inactive", { reason });
}

function reactivateMuEnAngelBlessing(module = MU_EN_ABILITY_MODULE) {
  const targetModule = resolveMuEnBlessModule(module);
  const record = targetModule ? getMuEnAngelBlessRecord(targetModule) : null;
  if (!record || record.active !== false) return;
  if (record.suspendedReason !== "sealed") return;
  const player = gameData.players.find((p) => p.id === record.targetId);
  if (!player) return;
  markPlayerAsMuEnBlessed(player, targetModule);
  record.active = true;
  record.suspendedReason = null;
  gameData.muEnAngelBlessing = {
    targetId: player.id,
    targetName: player.name,
    module: targetModule,
  };
  updateMuEnAngelAbilityResultStatus(targetModule, "active");
}

function removeMuEnAngelBlessing(module = MU_EN_ABILITY_MODULE) {
  const store = gameData?.muEnAngelBlessTarget;
  if (!store) return;
  const targetModule = resolveMuEnBlessModule(module);
  if (!targetModule || !store[targetModule]) return;
  const record = store[targetModule];
  const player = gameData.players.find((p) => p.id === record.targetId);
  if (player) {
    unmarkPlayerMuEnBless(player, targetModule);
  }
  delete store[targetModule];
  if (gameData.muEnAngelBlessing?.module === targetModule) {
    gameData.muEnAngelBlessing = null;
  }
  if (gameData?.abilityResults && gameData.abilityResults[targetModule]) {
    delete gameData.abilityResults[targetModule].muEnAngel;
  }
}

function formatAbilityLogValue(value) {
  if (value === undefined || value === null) return "无";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "number") return `${value}`;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[对象]";
    }
  }
  return `${value}`;
}

function logAbilityAction(roleKey, action, payload = {}) {
  if (typeof console === "undefined" || typeof console.log !== "function") return;
  const roleLabel = abilityRoleNameMap[roleKey || "system"] || roleKey;
  const actionLabel = abilityActionLabels[action] || action || "动作";
  const data = { ...(payload || {}) };
  const fallbackModule = gameData?.currentAbilityModule ?? null;
  if (!("module" in data) && fallbackModule) {
    data.module = fallbackModule;
  }
  const orderedEntries = [];
  if ("module" in data) {
    orderedEntries.push(["module", data.module]);
    delete data.module;
  }
  Object.entries(data).forEach((entry) => orderedEntries.push(entry));
  const detail = orderedEntries
    .map(([key, val]) => `${abilityFriendlyKeyMap[key] || key}：${formatAbilityLogValue(val)}`)
    .join(" ｜ ");

  const tag = `[能力][${roleLabel}]`;
  console.log(`${tag}【${actionLabel}】${detail ? ` ${detail}` : ""}`);
}

let abilityActionLocked = false;

function lockAbilityAction() {
  if (abilityActionLocked) return false;
  abilityActionLocked = true;
  return true;
}

function unlockAbilityAction() {
  abilityActionLocked = false;
}

// 分配特殊角色
function assignSpecialRoles() {
  gameData.players.forEach((player) => {
    player.abilityActivated = true; // 初始即标记为可用
    // 使用次数以上限为准；以 abilityUses 计数，abilityUsed 表示是否已耗尽
    player.abilityUses = 0;
    player.abilityUsed = false; // 是否已耗尽（达到各自上限）
    player.activationHistory = [];
    player.abilityUsage = {}; // 按模块记录能力使用情况，例如 { module2: true }
    player.muEnAngelBlessed = false;
    player.muEnAngelBlessedModule = null;
  });
  if (gameData) {
    gameData.muEnAngelBlessing = null;
    if (gameData.muEnAngelBlessTarget) {
      gameData.muEnAngelBlessTarget = {};
    }
    gameData.goldenMonkSanctuary = {};
  }
  updateSpecialRoleButtons();
}


// 手动分配特殊角色
function assignSpecialRole(roleType) {
  const roleConfig = gameData.specialRoles.roleConfig[roleType];
  if (!roleConfig) {
    showNotification("无效的特殊身份");
    return;
  }

  if (Object.values(gameData.specialRoles.assignedRoles).includes(roleType)) {
    showNotification(`${roleConfig.name} 已经分配，无法重复分配`);
    return;
  }

  const currentCount = Object.values(
    gameData.specialRoles.assignedRoles
  ).filter((r) => r === roleType).length;
  if (currentCount >= roleConfig.maxCount) {
    showNotification(`${roleConfig.name} 已经分配完毕`);
    return;
  }

  let availablePlayers;
  if (roleConfig.faction === "ordinary") {
    availablePlayers = gameData.players.filter(
      (player) => !player.isLycheeAddict && !player.isNeutral && !player.specialRole
    );
  } else if (roleConfig.faction === "neutral") {
    availablePlayers = gameData.players.filter(
      (player) => player.isNeutral && !player.specialRole
    );
  } else {
    availablePlayers = gameData.players.filter(
      (player) => player.isLycheeAddict && !player.specialRole
    );
  }

  if (availablePlayers.length === 0) {
    const factionName =
      roleConfig.faction === "ordinary"
        ? "普通阵营"
        : roleConfig.faction === "neutral"
        ? "中立阵营"
        : "荔枝瘾阵营";
    showNotification(`没有可用的${factionName}使者来担任${roleConfig.name}`);
    return;
  }

  const randomPlayer =
    availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

  randomPlayer.specialRole = roleType;
  gameData.specialRoles.assignedRoles[randomPlayer.id] = roleType;

  // 不论阵营，特殊身份一经分配即视为可用
    randomPlayer.abilityActivated = true;
  // 初始化次数与标记
  randomPlayer.abilityUses = 0;
  randomPlayer.abilityUsed = false;
  if (!randomPlayer.activationHistory) randomPlayer.activationHistory = [];
  if (!randomPlayer.abilityUsage) randomPlayer.abilityUsage = {};

  showNotification(`${roleConfig.name} 已加入游戏`);

  refreshPlayerIdentities();
  updateSpecialRoleButtons();
}

// 获取不同身份的最大使用次数（可由模块0配置）
function getAbilityMaxUses(roleType) {
  const defaultLimits = {
    muEnAngel: 1,
    goldenMonk: 1,
    medicineShaman: 4,
    disguiseMaster: 2,
    songMessenger: 4,
    boneWhistleKing: 1,
    silentWhisper: 0,
    hanBaLang: Infinity,
  };
  const limits = (typeof gameData !== "undefined" && gameData.abilityLimits) ? gameData.abilityLimits : defaultLimits;
  if (typeof limits[roleType] === "number") {
    return limits[roleType];
  }
  return defaultLimits[roleType] ?? 4;
}

// 获取玩家名称
function getPlayerNameById(playerId) {
  if (!playerId) return "未指定";
  const player = gameData.players.find((p) => p.id === playerId);
  return player ? player.name : `使者${playerId}`;
}

// 创建成员标签列表 HTML
function createMemberChips(members, guardId) {
  if (!members || members.length === 0) {
    return `<span class="px-2 py-1 rounded bg-gray-100 text-gray-400">暂无成员</span>`;
  }
  return members
    .map((playerId) => {
      const playerName = getPlayerNameById(playerId);
      const isGuard = guardId === playerId;
      const chipClass = isGuard
        ? "bg-primary/10 text-primary border border-primary/30"
        : "bg-gray-100 text-gray-700";
      return `<span class="px-2 py-1 rounded ${chipClass}">${playerName}</span>`;
    })
    .join("");
}

// 渲染能力模态框中的局势信息（房间与被监管者，表面状态）
function renderAbilityContextInfo(module) {
  const container = document.getElementById("ability-context-info");
  if (!container) return;

  if (!module) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  const moduleData = gameData?.[module];
  if (!moduleData) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  const moduleLabel =
    module === "module1"
      ? "第一轮审查"
      : module === "module2"
      ? "第二轮审查"
      : module === "module3"
      ? "第三轮审查"
      : module === "module4"
      ? "第四轮审查"
      : "";

  const isThreeRooms = module === "module4";
  const roomsConfig =
    module === "module1" || module === "module2" || module === "module3"
      ? [
          {
            label: "小房间",
            roomKey: "smallRoom",
            guardKey: "smallGuard",
          },
          {
            label: "大房间",
            roomKey: "largeRoom",
            guardKey: "largeGuard",
          },
        ]
      : module === "module4"
      ? [
          { label: "房间 1", roomKey: "room1", guardKey: "guard1" },
          { label: "房间 2", roomKey: "room2", guardKey: "guard2" },
          { label: "房间 3", roomKey: "room3", guardKey: "guard3" },
        ]
      : [];

  if (roomsConfig.length === 0) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  const roomCards = roomsConfig
    .map(({ label, roomKey, guardKey }) => {
      const roomInfo = moduleData[roomKey] || {};
      const surfaceMembers = roomInfo.surfaceMembers || [];
      const guardId = moduleData[guardKey];
      const guardName = guardId ? getPlayerNameById(guardId) : "未指定";
      const chipsHtml = createMemberChips(surfaceMembers, guardId);
      const guardBadgeClass = guardId
        ? "bg-primary/10 text-primary border border-primary/30"
        : "bg-gray-100 text-gray-400 border border-gray-200";
      return `
        <div class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-primary">${label}</span>
            <span class="text-xs text-gray-500">${surfaceMembers.length} 人</span>
          </div>
          <div class="flex flex-wrap gap-2 mt-3 text-sm">
            ${chipsHtml}
          </div>
          <div class="mt-4 text-xs text-gray-600">
            被监管者：
            <span class="inline-flex items-center px-2 py-1 rounded ${guardBadgeClass}">
              ${guardName}
            </span>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-primary font-tang">房间配置（表面状态）</h3>
        ${
          moduleLabel
            ? `<span class="text-xs text-gray-500">${moduleLabel}</span>`
            : ""
        }
      </div>
      <div class="${isThreeRooms ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}">
        ${roomCards}
      </div>
    </div>
  `;

  container.classList.remove("hidden");
}

// 更新特殊角色按钮状态
function updateSpecialRoleButtons() {
  // 重置所有按钮状态
  document.querySelectorAll(".special-role-btn").forEach((btn) => {
    const roleType = btn.dataset.role;
    let statusIndicator = btn.querySelector(".role-status");
    const isAssigned = Object.values(
      gameData.specialRoles.assignedRoles
    ).includes(roleType);

    // 若状态点被先前替换丢失，则补回
    if (!statusIndicator) {
      statusIndicator = document.createElement('div');
      statusIndicator.className = "role-status absolute -top-1 -right-1 w-4 h-4 bg-gray-300 rounded-full hidden";
      statusIndicator.dataset.roleStatus = roleType;
      btn.appendChild(statusIndicator);
    }

    // 保存原始内容，便于恢复
    if (!btn.dataset.originalHtml) {
      btn.dataset.originalHtml = btn.innerHTML;
    }

    if (isAssigned) {
      // 保留按钮原有尺寸与外观，不添加可能改变尺寸/动画的类
      btn.classList.add("ring-2", "ring-primary", "no-anim");
      statusIndicator.classList.remove("hidden");
      statusIndicator.classList.add("bg-primary");

      // 阵营背景：普通阵营与荔枝瘾阵营区分
      const roleCfg = gameData?.specialRoles?.roleConfig?.[roleType];
      const faction = roleCfg?.faction; // ordinary | addict | neutral
      btn.classList.remove('role-bg-ordinary', 'role-bg-addict', 'role-bg-neutral');
      if (faction === 'ordinary') {
        btn.classList.add('role-bg-ordinary');
        btn.classList.remove('role-bg-addict');
        btn.classList.remove('role-bg-neutral');
      } else if (faction === 'lycheeAddict') {
        btn.classList.add('role-bg-addict');
        btn.classList.remove('role-bg-ordinary');
        btn.classList.remove('role-bg-neutral');
      } else if (faction === 'neutral') {
        btn.classList.add('role-bg-neutral');
        btn.classList.remove('role-bg-ordinary', 'role-bg-addict');
      }

      // 使用现有 FontAwesome 图标（丰富图案），固定显示区域，避免尺寸变化
      const faIcon =
        roleType === "muEnAngel" ? "fa-solid fa-feather-pointed" :
        roleType === "goldenMonk" ? "fa-solid fa-gopuram" :
        roleType === "medicineShaman" ? "fa-solid fa-flask" :
        roleType === "disguiseMaster" ? "fa-solid fa-user-secret" :
        roleType === "songMessenger" ? "fa-solid fa-music" :
        roleType === "boneWhistleKing" ? "fa-solid fa-bug" :
        roleType === "silentWhisper" ? "fa-solid fa-low-vision" :
        roleType === "hanBaLang" ? null :
        "fa-solid fa-circle";

      // 在切换前锁定按钮尺寸，防止内容变化引起尺寸闪动
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        btn.dataset.baseWidth = rect.width;
        btn.dataset.baseHeight = rect.height;
        btn.style.width = `${rect.width}px`;
        btn.style.height = `${rect.height}px`;
      } else if (btn.dataset.baseWidth && btn.dataset.baseHeight) {
        btn.style.width = `${btn.dataset.baseWidth}px`;
        btn.style.height = `${btn.dataset.baseHeight}px`;
      } else {
        btn.style.width = "";
        btn.style.height = "";
      }

      // 不替换原内容：仅在顶部插入图案容器，保持原文字与字号不变
      // 先移除旧的图案容器，避免重复叠加
      const oldWrap = btn.querySelector('.fa-silhouette-wrap');
      if (oldWrap) oldWrap.parentNode.removeChild(oldWrap);
      // 移除“阵营/点击加入”两行（切换后删除）
      btn.querySelectorAll('.role-extra').forEach(el => el.parentNode.removeChild(el));
      const wrap = document.createElement('div');
      wrap.className = 'fa-silhouette-wrap no-anim';
      if (roleType === "hanBaLang") {
        // 憨巴郎使用爪印图标，由 hanBaLang.js 提供函数
        const hanBaLangIcon = typeof getHanBaLangSilhouette === "function" 
          ? getHanBaLangSilhouette() 
          : `<i class="fa fa-paw fa-silhouette" style="font-size:102px;" aria-hidden="true"></i>`;
        wrap.innerHTML = hanBaLangIcon;
      } else {
        wrap.innerHTML = `<i class="fa ${faIcon} fa-silhouette" style="font-size:102px;" aria-hidden="true"></i>`;
      }
      // 将图案插入到按钮内容的最前方
      btn.insertBefore(wrap, btn.firstChild);

      // 将标题置中并浮于图案上方
      const titleEl = btn.querySelector('.font-bold.text-primary');
      if (titleEl) {
        titleEl.classList.add('role-title');
      }
    } else {
      btn.classList.remove("ring-2", "ring-primary", "no-anim");
      btn.classList.remove('role-bg-ordinary', 'role-bg-addict', 'role-bg-neutral');
      statusIndicator.classList.add("hidden");
      statusIndicator.classList.remove("bg-primary");
      // 恢复原始内容（包含阵营与点击提示两行）
      if (btn.dataset.originalHtml) {
        btn.innerHTML = btn.dataset.originalHtml;
      }
      // 确保状态点仍在（恢复后重建）
      let rs = btn.querySelector('.role-status');
      if (!rs) {
        rs = document.createElement('div');
        rs.className = "role-status absolute -top-1 -right-1 w-4 h-4 bg-gray-300 rounded-full hidden";
        rs.dataset.roleStatus = roleType;
        btn.appendChild(rs);
      }
      // 解除尺寸锁定
      btn.style.width = "";
      btn.style.height = "";
      delete btn.dataset.baseWidth;
      delete btn.dataset.baseHeight;
    }
  });
}


// 跳过能力使用
function skipAbilityUse(reason = "manual-skip", payload = {}) {
  if (reason && typeof reason === "object" && typeof reason.preventDefault === "function") {
    reason.preventDefault();
    if (typeof reason.stopPropagation === "function") reason.stopPropagation();
    reason = "manual-skip";
    payload = {};
  }
  if (!lockAbilityAction()) return;
  const module = gameData?.currentAbilityModule || null;
  const roleKey = gameData?.currentAbilityRoleKey || "system";
  logAbilityAction(roleKey || "system", "skip", { reason, module, ...payload });
  if (typeof hideAllAbilitySections === 'function') hideAllAbilitySections();
  document.getElementById("ability-modal").classList.add("hidden");
  proceedNextAbilityOrResult(module);
}

// 确认能力使用结果
function confirmAbilityResult(context = {}) {
  if (context && typeof context === "object" && typeof context.preventDefault === "function") {
    context.preventDefault();
    if (typeof context.stopPropagation === "function") context.stopPropagation();
    context = {};
  }
  if (!lockAbilityAction()) return;
  const module = gameData?.currentAbilityModule || null;
  const roleKey = gameData?.currentAbilityRoleKey || "system";
  logAbilityAction(roleKey || "system", "confirm-result", { ...context, module });
  
  // 在缄默、易容术士、骨哨虫王使用能力后自动执行偷吃逻辑
  if (roleKey === "silentWhisper" || roleKey === "disguiseMaster" || roleKey === "boneWhistleKing") {
    if (typeof processLycheeAddictEating === "function") {
      processLycheeAddictEating(module);
    }
  }
  
  if (typeof hideAllAbilitySections === 'function') hideAllAbilitySections();
  document.getElementById("ability-modal").classList.add("hidden");
  proceedNextAbilityOrResult(module);
}

// 显示模块结果（替换原来的直接显示结果）
function showModuleResult(module) {
  if (module === "module1") {
    if (typeof confirmModule1 === "function") confirmModule1();
  } else if (module === "module2") {
    confirmModule2();
  } else if (module === "module3") {
    confirmModule3();
  } else if (module === "module4") {
    confirmModule4();
  }
}

// 队列流转：继续下一个能力或显示结果
function proceedNextAbilityOrResult(module) {
  unlockAbilityAction();
  if (!gameData.pendingAbilities || gameData.pendingAbilities.length === 0) {
    logAbilityAction("system", "show-module-result", { module });
    if (gameData) gameData.currentAbilityRoleKey = null;
    showModuleResult(module);
    return;
  }

  const next = gameData.pendingAbilities.shift();
  if (gameData) gameData.currentAbilityRoleKey = next || null;
  logAbilityAction(next || "system", "queue-pop", {
    module,
    remaining: gameData.pendingAbilities.length,
  });

  if (next === 'muEnAngel' && typeof showMuEnAngelAbility === 'function') {
    showMuEnAngelAbility(module);
  } else if (next === 'goldenMonk' && typeof showGoldenMonkAbility === 'function') {
    showGoldenMonkAbility(module);
  } else if (next === 'silentWhisper' && typeof showSilentWhisperAbility === 'function') {
    showSilentWhisperAbility(module);
  } else if (next === 'medicineShaman' && typeof showMedicineShamanAbility === 'function') {
    showMedicineShamanAbility(module);
  } else if (next === 'disguiseMaster' && typeof showDisguiseMasterAbility === 'function') {
    showDisguiseMasterAbility(module);
  } else if (next === 'songMessenger' && typeof showSongMessengerAbility === 'function') {
    showSongMessengerAbility(module);
  } else if (next === 'lycheeAction' && typeof showLycheeAddictAction === 'function') {
    showLycheeAddictAction(module);
  } else if (next === 'boneWhistleKing' && typeof showBoneWhistleKingAbility === 'function') {
    showBoneWhistleKingAbility(module);
  } else {
    logAbilityAction(next || "system", "queue-skip", { module, reason: "handler-missing" });
    proceedNextAbilityOrResult(module);
  }
}

// 重置指定模块的能力状态
function resetModuleAbilities(module, options = {}) {
    const { clearMuEnAngelBlessing = false } = options || {};
    gameData.currentAbilitySelection = null;
    gameData.currentAbilityModule = null;
    // 清除骨哨虫王的目标房间信息（返回修改时需要重新计算）
    if (gameData.boneWhistleKingTarget && gameData.boneWhistleKingTarget[module]) {
        delete gameData.boneWhistleKingTarget[module];
    }
    if (typeof resetSilentWhisperSeals === 'function') {
        resetSilentWhisperSeals(module, { allowMuEnAngelRestore: !clearMuEnAngelBlessing });
    } else if (gameData.silentWhisperSeals && gameData.silentWhisperSeals[module]) {
        delete gameData.silentWhisperSeals[module];
    }
    if (typeof resetSilentWhisperCharges === 'function') {
        resetSilentWhisperCharges(module);
    }
    gameData.players.forEach(player => {
      if (player.specialRole) {
        if (shouldResetAbilityForModule(module, player.specialRole, player)) {
          resetPlayerAbilityUsage(player, module);
        }
      }
    });

    if (clearMuEnAngelBlessing && module === "module2") {
      removeMuEnAngelBlessing(module);
    }

    if (typeof removeGoldenMonkSanctuary === "function") {
      removeGoldenMonkSanctuary(module);
    }

    const muAngelContainer = document.getElementById("mu-en-angel-ability");
    if (muAngelContainer) {
      muAngelContainer.classList.add("hidden");
      muAngelContainer.innerHTML = "";
    }
}

function resetSilentWhisperSeals(module, options = {}) {
    if (!gameData || !gameData.players) return;
    const records =
        gameData.silentWhisperSeals &&
        Array.isArray(gameData.silentWhisperSeals[module])
            ? gameData.silentWhisperSeals[module]
            : null;
    if (!records || records.length === 0) {
        if (gameData.silentWhisperSeals) {
            delete gameData.silentWhisperSeals[module];
        }
        if (gameData.abilityResults && gameData.abilityResults[module]) {
            delete gameData.abilityResults[module].silentWhisper;
        }
        return;
    }
    records.forEach(({ targetId, previouslySealed }) => {
        const target = gameData.players.find((p) => p.id === targetId);
        if (!target) return;
        target.abilitySealed = !!previouslySealed;
    });
    delete gameData.silentWhisperSeals[module];
    if (gameData.abilityResults && gameData.abilityResults[module]) {
        delete gameData.abilityResults[module].silentWhisper;
    }
    if (options.allowMuEnAngelRestore !== false) {
        reactivateMuEnAngelBlessing(module);
    }
}

function resetSilentWhisperCharges(module) {
    if (!gameData || !gameData.players) return;
    const record =
        gameData.silentWhisperChargeRecords &&
        gameData.silentWhisperChargeRecords[module];
    if (!record) return;

    const player = gameData.players.find((p) => p.id === record.playerId);
    if (player && typeof player.silentCharges === 'number') {
        player.silentCharges = Math.max(0, player.silentCharges - record.chargesGained);
        const maxUses = typeof player.silentCharges === 'number' ? player.silentCharges : 0;
        player.abilityUsed = (typeof player.abilityUses === 'number' ? player.abilityUses : 0) >= maxUses;
    }

    delete gameData.silentWhisperChargeRecords[module];
}

function recordSilentWhisperChargeGain(playerId, module, gain = 1) {
    if (!playerId || !module || gain <= 0 || !gameData) return;
    if (!gameData.silentWhisperChargeRecords) {
        gameData.silentWhisperChargeRecords = {};
    }
    if (!gameData.silentWhisperChargeRecords[module]) {
        gameData.silentWhisperChargeRecords[module] = {
            playerId,
            chargesGained: 0,
        };
    }
    const record = gameData.silentWhisperChargeRecords[module];
    record.playerId = playerId;
    record.chargesGained += gain;
}

// 判断是否应该为指定模块重置能力使用状态
function shouldResetAbilityForModule(module, roleType, player) {
    const isConfigPhase = module === 'module1' || module === 'module2' || module === 'module3' || module === 'module4';
    if (!isConfigPhase) return false;
    // 仅当本模块（上一环节）确实使用过能力时才允许重置
    const abilityUsedInThisModule = wasAbilityUsedInModule(module, player);
    switch (roleType) {
      case "muEnAngel":
        return module === "module2" && abilityUsedInThisModule;
      case "goldenMonk":
        return (module === "module1" || module === "module2" || module === "module3" || module === "module4") && abilityUsedInThisModule;
      case "medicineShaman":
        return abilityUsedInThisModule;
      case "disguiseMaster":
        return abilityUsedInThisModule;
      case "songMessenger":
        return abilityUsedInThisModule;
      case "boneWhistleKing":
        return abilityUsedInThisModule;
      case "silentWhisper":
        return abilityUsedInThisModule;
      default:
        return false;
    }
}

// 重置玩家能力使用状态
function resetPlayerAbilityUsage(player, module) {
    if (!player || !player.specialRole) return;
    if (!player.abilityUsage) player.abilityUsage = {};

    if (player.abilityUsage[module]) {
        const roleType = player.specialRole;
        if (typeof player.abilityUses !== 'number') player.abilityUses = 0;
        if (player.abilityUses > 0) {
            player.abilityUses -= 1;
        }

        let maxUses;
        if (roleType === 'silentWhisper') {
            maxUses = typeof player.silentCharges === 'number' ? player.silentCharges : 0;
        } else if (typeof getAbilityMaxUses === 'function') {
            maxUses = getAbilityMaxUses(roleType);
        } else {
            maxUses = 4;
        }

        if (player.abilityUses < maxUses) {
            player.abilityUsed = false;
        } else {
            player.abilityUsed = true;
        }

        player.abilityUsage[module] = false;
    }

    updateSpecialRoleButtons();
}

// 检查玩家是否可以使用能力
function canUseAbility(player) {
    if (!player.specialRole) return false;
    // 达到各自上限则不可再用
    const usedTimes = typeof player.abilityUses === 'number' ? player.abilityUses : 0;
    const maxUses = getEffectiveAbilityMaxUses(player, player.specialRole);
    if (usedTimes >= maxUses || player.abilityUsed) return false;
    return checkAbilityActivation(player);
}

// 检查能力激活条件
function checkAbilityActivation(player) {
    const roleType = player.specialRole;
    // 当前轮次（仅在 module2-4 生效）
    let currentRound = null;
    if (gameData && gameData.currentArrestModule) {
        currentRound = gameData.currentArrestModule === 'module2' ? 2
            : gameData.currentArrestModule === 'module3' ? 3
            : gameData.currentArrestModule === 'module4' ? 4
            : null;
    }

    switch(roleType) {
        case 'medicineShaman':
        case 'songMessenger':
        case 'disguiseMaster':
        case 'boneWhistleKing':
            return true;
            
        default:
            return true;
    }
}

// 检查能力是否在指定模块中被使用过
function wasAbilityUsedInModule(module, player) {
    // 仅依据该模块的使用记录判断
    if (!player || !player.abilityUsage) return false;
    return player.abilityUsage[module] === true;
}

// ========== 公用工具函数 ==========

/**
 * 获取房间标签
 * @param {string} module - 模块名称 (module2/module3/module4)
 * @param {string} roomProp - 房间属性名 (smallRoom/largeRoom/room1/room2/room3)
 * @returns {string} 房间标签
 */
function getRoomLabel(module, roomProp) {
  if (module === "module1" || module === "module2" || module === "module3") {
    return roomProp === "smallRoom" ? "小房间" : "大房间";
  }
  if (module === "module4") {
    return roomProp === "room1" ? "房间 1" : roomProp === "room2" ? "房间 2" : "房间 3";
  }
  return "";
}

/**
 * 获取房间选项列表
 * @param {string} module - 模块名称 (module2/module3/module4)
 * @returns {Array<{key: string, label: string}>} 房间选项数组
 */
function getRoomOptions(module) {
  const roomOptions = [];
  if (module === "module1" || module === "module2" || module === "module3") {
    roomOptions.push({ key: "smallRoom", label: "小房间" });
    roomOptions.push({ key: "largeRoom", label: "大房间" });
  } else if (module === "module4") {
    roomOptions.push({ key: "room1", label: "房间 1" });
    roomOptions.push({ key: "room2", label: "房间 2" });
    roomOptions.push({ key: "room3", label: "房间 3" });
  }
  return roomOptions;
}

function getPreviousModuleKey(module) {
  if (module === "module2") return "module1";
  if (module === "module3") return "module2";
  if (module === "module4") return "module3";
  return null;
}

/**
 * 更新能力使用者信息显示
 * @param {string} roleName - 角色名称（如"易容术士"）
 * @param {string} playerName - 玩家名称
 * @param {string} statusText - 状态文本（如"能力可用"）
 * @param {string} hintText - 提示文本
 */
function updateAbilityUserInfo(roleName, playerName, statusText, hintText) {
  const userInfoEl = document.getElementById("ability-user-info");
  if (!userInfoEl) return;
  
  // 判断状态样式：如果状态文本包含"已耗尽"或"耗尽"，使用红色样式
  const isExhausted = statusText.includes("已耗尽") || statusText.includes("耗尽");
  const statusClass = isExhausted
    ? "bg-red-100 text-red-800"
    : statusText === "能力可用" || statusText.startsWith("使用次数")
    ? "bg-green-100 text-green-800" 
    : "bg-gray-100 text-gray-800";
  const normalizedHint = typeof hintText === "string" ? hintText : "";
  const showExhaustionLine = isExhausted && !normalizedHint.includes("耗尽");
  const exhaustionNote = showExhaustionLine
    ? '<p class="text-xs text-red-600 font-semibold mt-2">能力次数已耗尽，无法再次使用</p>'
    : "";
  
  userInfoEl.innerHTML = `
    <div class="text-center">
      <div class="text-2xl md:text-3xl font-bold text-primary font-tang">${roleName}</div>
      <div class="mt-2 text-gray-700">
        <span class="font-medium">当前使用者：</span>
        <span class="font-bold">${playerName}</span>
      </div>
      <div class="mt-1">
        <span class="inline-block px-3 py-1 ${statusClass} rounded-full text-sm font-medium">
          ${statusText}
        </span>
        <p class="text-xs text-gray-500 mt-1">${hintText}</p>
        ${exhaustionNote}
      </div>
    </div>
  `;
}

function getEffectiveAbilityMaxUses(player, roleType) {
  const resolvedRoleType = roleType || player?.specialRole;
  if (!resolvedRoleType) return 0;
  if (resolvedRoleType === "silentWhisper") {
    return typeof player?.silentCharges === "number" ? player.silentCharges : 0;
  }
  let maxUses =
    typeof getAbilityMaxUses === "function"
      ? getAbilityMaxUses(resolvedRoleType)
      : 4;
  if (player?.muEnAngelBlessed && resolvedRoleType === "boneWhistleKing") {
    maxUses += 1;
  }
  return maxUses;
}

/**
 * 统一获取能力使用统计
 * @param {Object} player - 玩家对象
 * @param {string} roleType - 身份类型（可选，默认取玩家自身身份）
 * @returns {{usedTimes: number, maxUses: number, isExhausted: boolean}}
 */
function getAbilityUsageStats(player, roleType) {
  const resolvedRoleType = roleType || player?.specialRole;
  const usedTimes = typeof player?.abilityUses === "number" ? player.abilityUses : 0;
  const maxUses = getEffectiveAbilityMaxUses(player, resolvedRoleType);
  const isExhausted = usedTimes >= maxUses || !!player?.abilityUsed;
  return { usedTimes, maxUses, isExhausted };
}

/**
 * 创建统一的“能力耗尽”提示元素
 * @param {Object} options
 * @param {string} options.roleName - 角色名称
 * @param {number} options.usedTimes - 已使用次数
 * @param {number} options.maxUses - 最大使用次数
 * @param {string} [options.description] - 额外描述
 * @param {string} [options.extraClasses] - 附加类名
 * @returns {HTMLElement}
 */
function createAbilityExhaustedElement({
  roleName,
  usedTimes,
  maxUses,
  description,
  extraClasses = "",
}) {
  const wrapper = document.createElement("div");
  wrapper.className = `ability-exhausted text-center py-6 ${extraClasses}`.trim();
  wrapper.innerHTML = `
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-3">
      <i class="fa fa-ban text-3xl"></i>
    </div>
    <p class="text-xl font-bold text-red-600 mb-1">能力次数已耗尽</p>
    <p class="text-gray-600 mb-1">使用次数：${usedTimes}/${maxUses}</p>
    <p class="text-sm text-gray-500">${description || `${roleName}的能力使用次数已用尽，无法再次使用`}</p>
  `;
  return wrapper;
}

/**
 * 创建或获取能力容器
 * @param {string} containerId - 容器ID
 * @returns {HTMLElement} 能力容器元素
 */
function createAbilityContainer(containerId) {
  let abilityContainer = document.getElementById(containerId);
  if (!abilityContainer) {
    abilityContainer = document.createElement("div");
    abilityContainer.id = containerId;
  }

    const userInfoEl = document.getElementById("ability-user-info");
  const contextEl = document.getElementById("ability-context-info");
  if (contextEl && contextEl.parentNode) {
    contextEl.parentNode.insertBefore(abilityContainer, contextEl.nextSibling);
  } else if (userInfoEl && userInfoEl.parentNode) {
      userInfoEl.parentNode.insertBefore(abilityContainer, userInfoEl.nextSibling);
  }
  abilityContainer.className = "";
  abilityContainer.innerHTML = "";
  return abilityContainer;
}

function showAbilitySealedMessage(roleName, playerName, module) {
  if (typeof hideAllAbilitySections === "function") hideAllAbilitySections();
  updateAbilityUserInfo(
    roleName,
    playerName || "未知使者",
    "能力已被封印",
    "能力已被永久封印，无法再次使用"
  );
  const abilityResult = document.getElementById("ability-result");
  const resultText = document.getElementById("ability-result-text");
  if (abilityResult && resultText) {
    resultText.textContent = "能力已被永久封印！";
    resultText.className = "text-lg font-bold text-primary";
    abilityResult.classList.remove("hidden");
    updateAbilityResultNarration();
    rebindConfirmButton();
  }
  const modal = document.getElementById("ability-modal");
  if (modal) modal.classList.remove("hidden");
  gameData.currentAbilityModule = module;
  return true;
}

// 荔枝瘾进房前的秘密讨论
function showLycheeAddictAction(module) {
  if (gameData) gameData.currentAbilityRoleKey = "lycheeAction";
  logAbilityAction("lycheeAction", "show", { module });
  if (typeof hideAllAbilitySections === "function") hideAllAbilitySections();
  if (typeof renderAbilityContextInfo === "function") {
    renderAbilityContextInfo(module);
  }

  updateAbilityUserInfo(
    "荔枝瘾进房前的秘密讨论",
    "所有荔枝瘾成员",
    "战术讨论",
    "荔枝瘾成员互相确认身份并讨论本轮使用能力的战术"
  );

  const container = createAbilityContainer("lychee-addict-action");
  container.classList.remove("hidden");
  container.innerHTML = `
    ${rememberAbilityNarration(
      "所有荔枝瘾成员，请睁眼。请互相确认身份，并讨论本轮使用能力的战术。行动结束请闭眼。",
      "暗流涌动，密谋于无声。"
    )}
    <div class="bg-white/90 border border-primary/20 rounded-xl p-4 text-center space-y-4">
      <p class="text-base text-gray-700 leading-relaxed">
        请确认所有荔枝瘾成员已完成身份确认和战术讨论。若已全部完成，请点击下方按钮继续。
      </p>
      <button
        id="lychee-action-complete"
        class="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-md scale-hover"
      >
        讨论结束
      </button>
    </div>
  `;

  const doneBtn = container.querySelector("#lychee-action-complete");
  if (doneBtn) {
    doneBtn.replaceWith(doneBtn.cloneNode(true));
    container
      .querySelector("#lychee-action-complete")
      .addEventListener("click", () => {
        logAbilityAction("lycheeAction", "complete", { module });
        container.classList.add("hidden");
        const modalEl = document.getElementById("ability-modal");
        if (modalEl) modalEl.classList.add("hidden");
        const abilityResultEl = document.getElementById("ability-result");
        if (abilityResultEl) abilityResultEl.classList.add("hidden");
        if (typeof proceedNextAbilityOrResult === "function") {
          proceedNextAbilityOrResult(module);
        }
      });
  }

  const abilityResult = document.getElementById("ability-result");
  if (abilityResult) abilityResult.classList.add("hidden");

  const modal = document.getElementById("ability-modal");
  if (modal) modal.classList.remove("hidden");
  gameData.currentAbilityModule = module;
  if (typeof rebindConfirmButton === "function") {
    rebindConfirmButton();
  }
}

// 处理荔枝瘾成员偷吃逻辑（在能力使用后自动执行）
function processLycheeAddictEating(module) {
  if (!module || !gameData[module]) return;
  
  const moduleData = gameData[module];
  const roundMap = { module1: 1, module2: 2, module3: 3, module4: 4 };
  const eatenRound = roundMap[module];
  if (!eatenRound) return;

  // 初始化真实监管者（如果未初始化）
  if (module === "module1" || module === "module2" || module === "module3") {
    if (moduleData.smallGuardReal === undefined) {
      moduleData.smallGuardReal = moduleData.smallGuard;
    }
    if (moduleData.largeGuardReal === undefined) {
      moduleData.largeGuardReal = moduleData.largeGuard;
    }
    const realSmallGuard = moduleData.smallGuardReal ?? moduleData.smallGuard;
    const realLargeGuard = moduleData.largeGuardReal ?? moduleData.largeGuard;

    const smallRoomAddicts = moduleData.smallRoom.realMembers.filter(
      (id) => gameData.lycheeAddicts.includes(id) && id !== realSmallGuard
    );
    const largeRoomAddicts = moduleData.largeRoom.realMembers.filter(
      (id) => gameData.lycheeAddicts.includes(id) && id !== realLargeGuard
    );

    // 更新荔枝状态（不考虑骨哨虫王的强制效果，因为骨哨虫王会在自己能力中使用）
    // 注意：这里只更新未被骨哨虫王强制的情况，骨哨虫王会在自己能力中直接设置
    const boneWhistleKing = gameData.players.find((p) => p.specialRole === "boneWhistleKing");
    const boneWhistleKingUsed =
      boneWhistleKing && boneWhistleKing.abilityUsage && boneWhistleKing.abilityUsage[module];
    const boneWhistleKingTarget =
      gameData.boneWhistleKingTarget && gameData.boneWhistleKingTarget[module];

    // 更新荔枝状态（不考虑骨哨虫王的强制效果，因为骨哨虫王会在自己能力中直接设置）
    // 注意：即使骨哨虫王强制了某个房间，仍然需要记录该房间荔枝瘾成员的偷吃历史
    if (!(boneWhistleKingUsed && boneWhistleKingTarget === "smallRoom")) {
      moduleData.smallRoom.realLycheeState = smallRoomAddicts.length > 0;
      moduleData.smallRoom.surfaceLycheeState = moduleData.smallRoom.realLycheeState;
    }
    if (!(boneWhistleKingUsed && boneWhistleKingTarget === "largeRoom")) {
      moduleData.largeRoom.realLycheeState = largeRoomAddicts.length > 0;
      moduleData.largeRoom.surfaceLycheeState = moduleData.largeRoom.realLycheeState;
    }

    // 记录偷吃历史（无论骨哨虫王是否强制，都要记录该房间荔枝瘾成员的偷吃历史）
    const markEaten = (playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      if (!player) return;
      if (!player.activationHistory) player.activationHistory = [];
      const firstTimeThisRound = !player.activationHistory.includes(eatenRound);
      if (firstTimeThisRound) {
        player.activationHistory.push(eatenRound);
      }
      if (player.specialRole === "silentWhisper" && firstTimeThisRound) {
        player.silentCharges = (player.silentCharges || 0) + 1;
        player.abilityUsed = (player.abilityUses || 0) >= player.silentCharges;
        if (typeof recordSilentWhisperChargeGain === "function") {
          recordSilentWhisperChargeGain(player.id, module, 1);
        }
      }
    };
    smallRoomAddicts.forEach(markEaten);
    largeRoomAddicts.forEach(markEaten);
  } else if (module === "module4") {
    if (moduleData.guard1Real === undefined) {
      moduleData.guard1Real = moduleData.guard1;
    }
    if (moduleData.guard2Real === undefined) {
      moduleData.guard2Real = moduleData.guard2;
    }
    if (moduleData.guard3Real === undefined) {
      moduleData.guard3Real = moduleData.guard3;
    }
    const realGuard1 = moduleData.guard1Real ?? moduleData.guard1;
    const realGuard2 = moduleData.guard2Real ?? moduleData.guard2;
    const realGuard3 = moduleData.guard3Real ?? moduleData.guard3;

    const room1Addicts = moduleData.room1.realMembers.filter(
      (id) => gameData.lycheeAddicts.includes(id) && id !== realGuard1
    );
    const room2Addicts = moduleData.room2.realMembers.filter(
      (id) => gameData.lycheeAddicts.includes(id) && id !== realGuard2
    );
    const room3Addicts = moduleData.room3.realMembers.filter(
      (id) => gameData.lycheeAddicts.includes(id) && id !== realGuard3
    );

    // 更新荔枝状态（不考虑骨哨虫王的强制效果）
    const boneWhistleKing = gameData.players.find((p) => p.specialRole === "boneWhistleKing");
    const boneWhistleKingUsed =
      boneWhistleKing && boneWhistleKing.abilityUsage && boneWhistleKing.abilityUsage[module];
    const boneWhistleKingTarget =
      gameData.boneWhistleKingTarget && gameData.boneWhistleKingTarget[module];

    // 更新荔枝状态（不考虑骨哨虫王的强制效果，因为骨哨虫王会在自己能力中直接设置）
    // 注意：即使骨哨虫王强制了某个房间，仍然需要记录该房间荔枝瘾成员的偷吃历史
    if (!(boneWhistleKingUsed && boneWhistleKingTarget === "room1")) {
      moduleData.room1.realLycheeState = room1Addicts.length > 0;
      moduleData.room1.surfaceLycheeState = moduleData.room1.realLycheeState;
    }
    if (!(boneWhistleKingUsed && boneWhistleKingTarget === "room2")) {
      moduleData.room2.realLycheeState = room2Addicts.length > 0;
      moduleData.room2.surfaceLycheeState = moduleData.room2.realLycheeState;
    }
    if (!(boneWhistleKingUsed && boneWhistleKingTarget === "room3")) {
      moduleData.room3.realLycheeState = room3Addicts.length > 0;
      moduleData.room3.surfaceLycheeState = moduleData.room3.realLycheeState;
    }

    // 记录偷吃历史（无论骨哨虫王是否强制，都要记录该房间荔枝瘾成员的偷吃历史）
    const markEaten = (playerId) => {
      const player = gameData.players.find((p) => p.id === playerId);
      if (!player) return;
      if (!player.activationHistory) player.activationHistory = [];
      const firstTimeThisRound = !player.activationHistory.includes(eatenRound);
      if (firstTimeThisRound) {
        player.activationHistory.push(eatenRound);
      }
      if (player.specialRole === "silentWhisper" && firstTimeThisRound) {
        player.silentCharges = (player.silentCharges || 0) + 1;
        player.abilityUsed = (player.abilityUses || 0) >= player.silentCharges;
        if (typeof recordSilentWhisperChargeGain === "function") {
          recordSilentWhisperChargeGain(player.id, module, 1);
        }
      }
    };
    room1Addicts.forEach(markEaten);
    room2Addicts.forEach(markEaten);
    room3Addicts.forEach(markEaten);
  }

  logAbilityAction("lycheeAction", "auto-eating", { module });
}

/**
 * 重绑确认按钮事件
 */
function rebindConfirmButton() {
  const confirmBtn = document.getElementById("confirm-result");
  if (confirmBtn) {
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    document.getElementById("confirm-result").addEventListener("click", confirmAbilityResult);
  }
}

function getAbilityNarrationHTML(mainText, subtitle) {
  if (!mainText) return "";
  const subtitleHtml = subtitle
    ? `<p class="mt-1 text-xs text-primary/70 italic tracking-wide">${subtitle}</p>`
    : "";
  return `
    <div class="mb-4 rounded-xl border border-primary/15 bg-white/90 px-4 py-3 shadow-sm text-center">
      <p class="text-sm leading-6 text-gray-800">${mainText}</p>
      ${subtitleHtml}
    </div>
  `;
}

function rememberAbilityNarration(mainText, subtitle) {
  if (!gameData) return getAbilityNarrationHTML(mainText, subtitle);
  gameData.currentAbilityNarration = { main: mainText, subtitle };
  return getAbilityNarrationHTML(mainText, subtitle);
}

function updateAbilityResultNarration() {
  const container = document.getElementById("ability-result-narration");
  if (!container) return;
  const narration = gameData?.currentAbilityNarration;
  if (narration && narration.main) {
    container.innerHTML = getAbilityNarrationHTML(
      narration.main,
      narration.subtitle
    );
    container.classList.remove("hidden");
  } else {
    container.innerHTML = "";
    container.classList.add("hidden");
  }
}