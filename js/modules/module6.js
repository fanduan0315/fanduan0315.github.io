/**
 * 游戏结果模块（module6）
 * 
 * 本模块负责游戏最终结果的展示，包括：
 * - 投票结果计算与排名
 * - 胜利条件判定（普通阵营/荔枝瘾阵营/憨巴郎单独胜利）
 * - 玩家身份与能力使用情况展示
 * - 游戏复盘信息
 *
 * 函数分类：
 *
 * 【主要功能】
 * - showModule6(): 显示游戏结果模块（入口函数）
 * - calculateVotingResults(): 计算投票结果并按荔枝瘾人数动态判定胜负
 *
 * 【结果展示】
 * - renderGameReplay(): 渲染游戏复盘区域（含圣域揭示、缄默驱散提示、基于当轮快照的祝福/能力结果等）
 * - formatRoomRealCountsForReplay(module): 格式化复盘用的房间真实人数
 *
 * 【工具函数】
 * - getPlayerAbilityMaxUses(player): 统一计算展示用的能力上限（含缄默动态次数和憨巴郎被动能力）
 */



// 显示模块6并刷新结果
function showModule6() {
  // 隐藏所有模块，显示模块6
  document.querySelectorAll('section[id^="module-"]').forEach((section) => {
    section.classList.add("hidden");
  });
  document.getElementById("module-6").classList.remove("hidden");

  // 关键：每次显示模块6时重新计算并渲染结果
  calculateVotingResults();
  
  // 渲染游戏复盘
  renderGameReplay();

  // 更新游戏状态
  gameData.currentPhase = 6;
  updateGameStatus();
}


// 完整的计算投票结果函数
function getPlayerAbilityMaxUses(player) {
  if (!player || !player.specialRole) return 0;
  if (player.specialRole === "silentWhisper") {
    return typeof player.silentCharges === "number" ? player.silentCharges : 0;
  }
  if (player.specialRole === "hanBaLang") {
    return Infinity;
  }
  if (typeof getAbilityMaxUses === "function") {
    return getAbilityMaxUses(player.specialRole);
  }
  return player.specialRole === "boneWhistleKing" ? 1 : 4;
}

function calculateVotingResults() {
  // 确保投票结果容器存在
  const topVoteContainer = document.getElementById("top-vote-results");
  const specialOutcomeEl = document.getElementById("special-outcome");
  if (!topVoteContainer) {
    console.error("投票结果元素未找到");
    return;
  }

  // 清空现有内容
  topVoteContainer.innerHTML = "";
  if (specialOutcomeEl) {
    specialOutcomeEl.textContent = "";
    specialOutcomeEl.className = "text-sm text-gray-600 hidden";
  }

  // 1. 直接使用gameData.voteCounts作为票数统计
  const voteCounts = gameData.voteCounts || {};
  const adjustedVoteCounts = { ...voteCounts };
  const hanBaLangPlayer = gameData.players.find((p) => p.specialRole === "hanBaLang");
  const hanBaLangBonus =
    hanBaLangPlayer && isMuEnAngelBlessed(hanBaLangPlayer)
      ? Math.max(gameData.lycheeAddicts.length, 0)
      : 0;
  if (hanBaLangPlayer && hanBaLangBonus > 0) {
    adjustedVoteCounts[hanBaLangPlayer.id] =
      (adjustedVoteCounts[hanBaLangPlayer.id] || 0) + hanBaLangBonus;
  }

  // 2. 按票数排序所有使者
  const sortedPlayers = [...gameData.players].sort(
    (a, b) => (adjustedVoteCounts[b.id] || 0) - (adjustedVoteCounts[a.id] || 0)
  );

  // 3. 正确计算排名（处理并列情况）
  let rankedPlayers = [];
  let currentRank = 1;
  let previousVotes = -1;
  let skipCount = 0;

  sortedPlayers.forEach((player, index) => {
    const votes = adjustedVoteCounts[player.id] || 0;

    if (votes !== previousVotes) {
      // 票数不同，正常增加排名
      currentRank = index + 1 - skipCount;
      previousVotes = votes;
    }
    // 票数相同，排名相同（不增加currentRank）

    rankedPlayers.push({
      player: player,
      votes: votes,
      originalVotes: voteCounts[player.id] || 0,
      rank: currentRank,
      muEnBonusApplied:
        player.specialRole === "hanBaLang" &&
        isMuEnAngelBlessed(player) &&
        votes !== (voteCounts[player.id] || 0),
    });

    console.log(`玩家 ${player.name}: ${votes}票, 排名 ${currentRank}`);
  });

  const hanBaLangOutcome =
    typeof evaluateHanBaLangPassive === "function"
      ? evaluateHanBaLangPassive(rankedPlayers)
      : null;

  // 4. 获取前 N 名（包括并列）并判定胜负，N 为荔枝瘾阵营人数
  const addictsCount = Math.max(gameData.lycheeAddicts.length, 1);
  const cutoffIndex = Math.min(rankedPlayers.length, addictsCount) - 1;
  const cutoffRank =
    cutoffIndex >= 0
      ? rankedPlayers[cutoffIndex].rank
      : rankedPlayers[rankedPlayers.length - 1]?.rank || 1;
  const topPlayers = rankedPlayers.filter(
    (item) => item.rank <= cutoffRank
  );
  const topPlayerIds = topPlayers.map((item) => item.player.id);

  // 正确判断胜利条件：前 N 名中是否包含所有荔枝瘾成员
  const allAddictsCaught = gameData.lycheeAddicts.every((addictId) =>
    topPlayerIds.includes(addictId)
  );
  const ordinaryWin = allAddictsCaught;
  let winnerState = ordinaryWin ? "ordinary" : "lycheeAddict";
  if (hanBaLangOutcome?.triggered) {
    winnerState = "hanBaLang";
  }

  console.log("前 N 名排名阈值:", cutoffRank);
  console.log("荔枝瘾成员:", gameData.lycheeAddicts);
  console.log(
    "前三名玩家:",
    topPlayers.map((p) => p.player.name)
  );
  console.log("是否全部被抓:", allAddictsCaught);

  // 5. 显示获胜方
  const winnerBanner = document.getElementById("winner-banner");
  if (winnerBanner) {
    if (winnerState === "hanBaLang") {
      winnerBanner.textContent = "憨巴郎单独胜利！";
      winnerBanner.className =
        "text-3xl font-bold mb-4 py-4 rounded-lg bg-amber-300 text-amber-900";
    } else if (winnerState === "ordinary") {
      winnerBanner.textContent = "普通成员阵营胜利！";
      winnerBanner.className =
        "text-3xl font-bold mb-4 py-4 rounded-lg bg-dark text-white";
    } else {
      winnerBanner.textContent = "荔枝瘾阵营胜利！";
      winnerBanner.className =
        "text-3xl font-bold mb-4 py-4 rounded-lg bg-primary text-white";
    }
  }

  if (specialOutcomeEl && hanBaLangOutcome) {
    let outcomeText = "";
    let classes = "text-sm mt-1";
    if (hanBaLangOutcome.triggered) {
      outcomeText = `${hanBaLangOutcome.player.name}（憨巴郎）以最高票被投出，触发单独胜利。`;
      if (hanBaLangBonus > 0 && isMuEnAngelBlessed(hanBaLangOutcome.player)) {
        outcomeText += `（沐恩祝福赐票 +${hanBaLangBonus}）`;
      }
      classes += " text-amber-700 font-semibold";
    } else if (hanBaLangOutcome.sealed && hanBaLangOutcome.isTop) {
      outcomeText = `${hanBaLangOutcome.player.name}（憨巴郎）原本以最高票被投出，但能力已被缄默封印，无法生效。`;
      classes += " text-amber-800";
    } else if (hanBaLangOutcome.sealed) {
      outcomeText = `${hanBaLangOutcome.player.name}（憨巴郎）的能力被缄默封印，本局无法触发。`;
      classes += " text-amber-800";
    } else {
      outcomeText = `${hanBaLangOutcome.player.name}（憨巴郎）未成为最高票，被动能力未触发。`;
      classes += " text-gray-600";
    }
    const loreLine =
      typeof getHanBaLangLoreLine === "function"
        ? getHanBaLangLoreLine()
        : "";
    specialOutcomeEl.innerHTML = "";
    if (loreLine) {
      const loreEl = document.createElement("div");
      loreEl.className = "text-xs text-amber-700 font-tang mb-1";
      loreEl.textContent = loreLine;
      specialOutcomeEl.appendChild(loreEl);
    }
    const outcomeEl = document.createElement("div");
    outcomeEl.textContent = outcomeText;
    specialOutcomeEl.appendChild(outcomeEl);
    specialOutcomeEl.className = classes;
  }

  // 6. 显示得票情况（紧凑布局）
  const voteResultsContainer = document.getElementById("top-vote-results");
  if (voteResultsContainer) {
    voteResultsContainer.innerHTML = "";

    // 创建紧凑的表格布局
    const tableContainer = document.createElement("div");
    tableContainer.className = "w-full overflow-x-auto";

    const table = document.createElement("table");
    table.className = "w-full bg-white rounded-lg overflow-hidden shadow-sm";

    // 表头
    const thead = document.createElement("thead");
    thead.innerHTML = `
            <tr class="bg-dark text-white">
                <th class="py-2 px-3 text-left">排名</th>
                <th class="py-2 px-3 text-left">使者</th>
                <th class="py-2 px-3 text-center">票数</th>
                <th class="py-2 px-3 text-left">身份</th>
                <th class="py-2 px-3 text-left">特殊身份</th>
            </tr>
        `;
    table.appendChild(thead);

    // 表格内容
    const tbody = document.createElement("tbody");

    rankedPlayers.forEach((item, index) => {
      const { player, votes, rank, muEnBonusApplied, originalVotes } = item;

      const row = document.createElement("tr");
      row.className = `border-b ${
        rank <= cutoffRank
          ? rank === 1
            ? "bg-yellow-50"
            : rank === 2
            ? "bg-gray-50"
            : "bg-orange-50"
          : "hover:bg-gray-50"
      }`;

      // 排名列
      const rankCell = document.createElement("td");
      rankCell.className = "py-2 px-3 font-bold";
      if (rank <= cutoffRank) {
        rankCell.innerHTML = `
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      rank === 1
                        ? "bg-yellow-500 text-white"
                        : rank === 2
                        ? "bg-gray-500 text-white"
                        : "bg-orange-500 text-white"
                    } text-sm">
                        ${rank}
                    </span>
                `;
      } else {
        rankCell.textContent = rank;
      }

      // 使者名列
      const nameCell = document.createElement("td");
      nameCell.className = "py-2 px-3 font-medium";
      nameCell.textContent = player.name;

      // 票数列
      const votesCell = document.createElement("td");
      votesCell.className = "py-2 px-3 text-center font-bold";
      if (muEnBonusApplied) {
        votesCell.innerHTML = `
          <div>${votes}</div>
          <div class="text-[11px] text-primary font-normal">含祝福加成（原始 ${originalVotes}）</div>
        `;
      } else {
        votesCell.textContent = votes;
      }

      // 身份列
      const identityCell = document.createElement("td");
      let identityLabel = "普通";
      let identityClass = "text-dark";
      if (player.isLycheeAddict) {
        identityLabel = "荔枝瘾";
        identityClass = "text-primary font-medium";
      } else if (player.isNeutral) {
        identityLabel = "中立";
        identityClass = "text-amber-600 font-medium";
      }
      identityCell.className = `py-2 px-3 text-sm ${identityClass}`;
      identityCell.textContent = identityLabel;

      // 特殊身份列
      const specialCell = document.createElement("td");
      specialCell.className = "py-2 px-3 text-sm text-gray-600";
      if (player.specialRole) {
        const roleConfig = gameData.specialRoles.roleConfig[player.specialRole];
        const usedTimes = typeof player.abilityUses === 'number' ? player.abilityUses : 0;
        const maxUses = getPlayerAbilityMaxUses(player);
        specialCell.textContent = roleConfig ? roleConfig.name : "";
        if (maxUses === Infinity) {
          specialCell.innerHTML += `<span class="text-xs text-amber-600 ml-1">(被动能力)</span>`;
        } else {
          specialCell.innerHTML += `<span class="text-xs text-gray-500 ml-1">(使用次数 ${usedTimes}/${maxUses})</span>`;
        }
      } else {
        specialCell.textContent = "-";
      }

      row.appendChild(rankCell);
      row.appendChild(nameCell);
      row.appendChild(votesCell);
      row.appendChild(identityCell);
      row.appendChild(specialCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    voteResultsContainer.appendChild(tableContainer);
  }

  // 7. 显示真实身份
  const identitiesContainer = document.getElementById("player-identities");
  if (identitiesContainer) {
    identitiesContainer.innerHTML = "";

    gameData.players.forEach((player) => {
      const playerCard = document.createElement("div");
      const cardClass = player.isLycheeAddict
        ? "bg-primary/10 border-primary"
        : player.isNeutral
        ? "bg-amber-50 border-amber-300"
        : "bg-dark/10 border-dark";
      playerCard.className = `text-center p-2 rounded-lg border ${cardClass}`;

      // 构建身份信息
      let identityText = player.isLycheeAddict ? "荔枝瘾" : player.isNeutral ? "中立" : "普通";
      let specialRoleText = "";
      let abilityStatus = "";

      // 如果有特殊身份，添加显示
      if (player.specialRole) {
        const roleConfig = gameData.specialRoles.roleConfig[player.specialRole];
        if (roleConfig) {
          specialRoleText = roleConfig.name;
          const usedTimes = typeof player.abilityUses === 'number' ? player.abilityUses : 0;
          const maxUses = getPlayerAbilityMaxUses(player);
          // 憨巴郎为被动能力，不显示“使用次数：0/Infinity”
          if (player.specialRole === "hanBaLang") {
            abilityStatus = `<div class="text-xs text-amber-700 font-semibold mt-1">被动能力</div>`;
          } else {
            abilityStatus = `<div class="text-xs text-dark font-medium mt-1">使用次数：${usedTimes}/${maxUses}</div>`;
          }
        }
      }

      playerCard.innerHTML = `
                <div class="font-medium text-sm mb-1 truncate" title="${
                  player.name
                }">${player.name}</div>
                <div class="text-xs ${
                  player.isLycheeAddict
                    ? "text-primary"
                    : player.isNeutral
                    ? "text-amber-600"
                    : "text-dark"
                } font-bold mb-1">
                    ${identityText}
                </div>
                ${
                  specialRoleText
                    ? `
                    <div class="text-xs px-1 py-0.5 bg-white/80 rounded border border-gray-300 text-gray-700 mb-1 truncate" title="${specialRoleText}">
                        ${specialRoleText}
                    </div>
                `
                    : `
                    <div class="text-xs text-gray-400 mb-1">无特殊身份</div>
                `
                }
                ${abilityStatus}
                <div class="text-xs font-bold text-dark mt-1">${
                  voteCounts[player.id]
                }票</div>
            `;
      identitiesContainer.appendChild(playerCard);
    });
  }
}

// 渲染游戏复盘
function renderGameReplay() {
  const replayContainer = document.getElementById("game-replay");
  if (!replayContainer) return;

  replayContainer.innerHTML = "";

  // 说明：复盘中所有“是否被沐恩祝福”的展示，均以各能力在当轮结算时写入的 abilityResults 快照为准，
  // 不再依赖当前玩家身上的 muEnAngelBlessed 标记，避免之后被封印/重置影响历史轮次的展示。

  // 遍历每个轮次（module1-4）
  const rounds = [
    { key: "module1", name: "第一轮审查", hasCaptain: false },
    { key: "module2", name: "第二轮审查", hasCaptain: true },
    { key: "module3", name: "第三轮审查", hasCaptain: true },
    { key: "module4", name: "第四轮审查", hasCaptain: true },
  ];

  rounds.forEach((round) => {
    const roundCard = document.createElement("div");
    roundCard.className = "bg-white border border-gray-200 rounded-lg p-4 shadow-sm";

    const roundTitle = document.createElement("h4");
    roundTitle.className = "text-lg font-bold text-primary mb-3";
    roundTitle.textContent = round.name;
    roundCard.appendChild(roundTitle);

    // 队长信息（第一轮没有）
    if (round.hasCaptain) {
      const meta = gameData.roundMeta?.[round.key];
      const captainId = meta?.captainId;
      if (captainId) {
        const captain = gameData.players.find((p) => p.id === captainId);
        const captainInfo = document.createElement("div");
        captainInfo.className = "mb-3 text-sm";
        captainInfo.innerHTML = `<span class="font-semibold">队长：</span><span class="text-primary">${captain ? captain.name : `使者${captainId}`}</span>`;
        roundCard.appendChild(captainInfo);
      }
    }

    // 房间配置
    const roomConfig = document.createElement("div");
    roomConfig.className = "mb-3";
    const roomConfigTitle = document.createElement("div");
    roomConfigTitle.className = "font-semibold text-sm mb-2";
    roomConfigTitle.textContent = "房间配置：";
    roomConfig.appendChild(roomConfigTitle);

    if (round.key === "module4") {
      // 第四轮有3个房间
      const rooms = ["room1", "room2", "room3"];
      const roomList = document.createElement("div");
      roomList.className = "space-y-2 text-sm";
      rooms.forEach((roomKey) => {
        const roomData = gameData[round.key][roomKey];
        const guardId = gameData[round.key][`guard${roomKey.slice(-1)}`];
        const members = roomData.surfaceMembers || [];
        const lycheeState = roomData.realLycheeState;
        const lycheeStateText = lycheeState === true ? "荔枝被偷吃了" : lycheeState === false ? "荔枝完好" : "未判定";
        const lycheeStateClass = lycheeState === true ? "text-primary font-semibold" : lycheeState === false ? "text-emerald-600" : "text-gray-400";
        
        const roomItem = document.createElement("div");
        roomItem.className = "pl-4 border-l-2 border-gray-200";
        
        // 创建成员标签容器
        const membersContainer = document.createElement("div");
        membersContainer.className = "text-gray-600 ml-2 mb-1";
        const membersLabel = document.createElement("span");
        membersLabel.textContent = "成员：";
        membersContainer.appendChild(membersLabel);
        
        // 创建成员标签
        const membersTags = document.createElement("div");
        membersTags.className = "inline-flex flex-wrap gap-1 mt-1";
        if (members.length === 0) {
          membersTags.innerHTML = '<span class="text-gray-400">无</span>';
        } else {
          members.forEach((playerId) => {
            const player = gameData.players.find((p) => p.id === playerId);
            const tag = document.createElement("span");
            tag.className = `px-2 py-0.5 rounded text-xs ${
              playerId === guardId
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-gray-100 text-gray-700"
            }`;
            tag.textContent = player ? player.name : `使者${playerId}`;
            membersTags.appendChild(tag);
          });
        }
        membersContainer.appendChild(membersTags);
        
        const roomTitle = document.createElement("div");
        roomTitle.className = "font-medium";
        roomTitle.textContent = `${getRoomLabel(round.key, roomKey)}：`;
        roomItem.appendChild(roomTitle);
        roomItem.appendChild(membersContainer);
        
        const lycheeStateDiv = document.createElement("div");
        lycheeStateDiv.className = `ml-2 ${lycheeStateClass}`;
        lycheeStateDiv.textContent = `荔枝状态：${lycheeStateText}`;
        roomItem.appendChild(lycheeStateDiv);
        roomList.appendChild(roomItem);
      });
      roomConfig.appendChild(roomList);
    } else {
      // 前3轮有小房间和大房间
      const smallRoom = gameData[round.key].smallRoom;
      const largeRoom = gameData[round.key].largeRoom;
      const smallGuardId = gameData[round.key].smallGuard;
      const largeGuardId = gameData[round.key].largeGuard;

      const smallLycheeState = smallRoom.realLycheeState;
      const smallLycheeStateText = smallLycheeState === true ? "荔枝被偷吃了" : smallLycheeState === false ? "荔枝完好" : "未判定";
      const smallLycheeStateClass = smallLycheeState === true ? "text-primary font-semibold" : smallLycheeState === false ? "text-emerald-600" : "text-gray-400";
      
      const largeLycheeState = largeRoom.realLycheeState;
      const largeLycheeStateText = largeLycheeState === true ? "荔枝被偷吃了" : largeLycheeState === false ? "荔枝完好" : "未判定";
      const largeLycheeStateClass = largeLycheeState === true ? "text-primary font-semibold" : largeLycheeState === false ? "text-emerald-600" : "text-gray-400";
      
      const roomList = document.createElement("div");
      roomList.className = "space-y-2 text-sm";
      
      // 小房间
      const smallRoomItem = document.createElement("div");
      smallRoomItem.className = "pl-4 border-l-2 border-gray-200";
      const smallRoomTitle = document.createElement("div");
      smallRoomTitle.className = "font-medium";
      smallRoomTitle.textContent = "小房间：";
      smallRoomItem.appendChild(smallRoomTitle);
      
      const smallMembersContainer = document.createElement("div");
      smallMembersContainer.className = "text-gray-600 ml-2 mb-1";
      const smallMembersLabel = document.createElement("span");
      smallMembersLabel.textContent = "成员：";
      smallMembersContainer.appendChild(smallMembersLabel);
      
      const smallMembersTags = document.createElement("div");
      smallMembersTags.className = "inline-flex flex-wrap gap-1 mt-1";
      const smallMembers = smallRoom.surfaceMembers || [];
      if (smallMembers.length === 0) {
        smallMembersTags.innerHTML = '<span class="text-gray-400">无</span>';
      } else {
        smallMembers.forEach((playerId) => {
          const player = gameData.players.find((p) => p.id === playerId);
          const tag = document.createElement("span");
          tag.className = `px-2 py-0.5 rounded text-xs ${
            playerId === smallGuardId
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-gray-100 text-gray-700"
          }`;
          tag.textContent = player ? player.name : `使者${playerId}`;
          smallMembersTags.appendChild(tag);
        });
      }
      smallMembersContainer.appendChild(smallMembersTags);
      smallRoomItem.appendChild(smallMembersContainer);
      
      const smallLycheeStateDiv = document.createElement("div");
      smallLycheeStateDiv.className = `ml-2 ${smallLycheeStateClass}`;
      smallLycheeStateDiv.textContent = `荔枝状态：${smallLycheeStateText}`;
      smallRoomItem.appendChild(smallLycheeStateDiv);
      roomList.appendChild(smallRoomItem);
      
      // 大房间
      const largeRoomItem = document.createElement("div");
      largeRoomItem.className = "pl-4 border-l-2 border-gray-200";
      const largeRoomTitle = document.createElement("div");
      largeRoomTitle.className = "font-medium";
      largeRoomTitle.textContent = "大房间：";
      largeRoomItem.appendChild(largeRoomTitle);
      
      const largeMembersContainer = document.createElement("div");
      largeMembersContainer.className = "text-gray-600 ml-2 mb-1";
      const largeMembersLabel = document.createElement("span");
      largeMembersLabel.textContent = "成员：";
      largeMembersContainer.appendChild(largeMembersLabel);
      
      const largeMembersTags = document.createElement("div");
      largeMembersTags.className = "inline-flex flex-wrap gap-1 mt-1";
      const largeMembers = largeRoom.surfaceMembers || [];
      if (largeMembers.length === 0) {
        largeMembersTags.innerHTML = '<span class="text-gray-400">无</span>';
      } else {
        largeMembers.forEach((playerId) => {
          const player = gameData.players.find((p) => p.id === playerId);
          const tag = document.createElement("span");
          tag.className = `px-2 py-0.5 rounded text-xs ${
            playerId === largeGuardId
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-gray-100 text-gray-700"
          }`;
          tag.textContent = player ? player.name : `使者${playerId}`;
          largeMembersTags.appendChild(tag);
        });
      }
      largeMembersContainer.appendChild(largeMembersTags);
      largeRoomItem.appendChild(largeMembersContainer);
      
      const largeLycheeStateDiv = document.createElement("div");
      largeLycheeStateDiv.className = `ml-2 ${largeLycheeStateClass}`;
      largeLycheeStateDiv.textContent = `荔枝状态：${largeLycheeStateText}`;
      largeRoomItem.appendChild(largeLycheeStateDiv);
      roomList.appendChild(largeRoomItem);
      
      roomConfig.appendChild(roomList);
    }
    roundCard.appendChild(roomConfig);

    if (round.key === "module2") {
      const blessRecord = gameData?.muEnAngelBlessTarget?.module2;
      if (blessRecord) {
        const blessBox = document.createElement("div");
        const statusActive = blessRecord.active !== false;
        const statusClass = statusActive ? "text-emerald-600" : "text-red-600";
        const statusText = statusActive ? "祝福生效中" : "祝福已失效";
        const reasonText = !statusActive
          ? blessRecord.suspendedReason === "sealed"
            ? "（被缄默封印后失效）"
            : "（主持人重置）"
          : "";
        blessBox.className = "mb-3 bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-gray-800";
        blessBox.innerHTML = `
          <p class="font-semibold text-primary mb-1">沐恩天使祝福记录</p>
          <p>被祝福者：<span class="font-bold">${blessRecord.targetName || "未知"}</span></p>
          <p>强化效果：<span>${blessRecord.effectText || "（未记录效果）"}</span></p>
          <p class="${statusClass}">当前状态：${statusText}${reasonText}</p>
        `;
        roundCard.appendChild(blessBox);
      }
    }

    // 特殊能力使用情况
    const abilitySection = document.createElement("div");
    abilitySection.className = "mt-3";
    const abilityTitle = document.createElement("div");
    abilityTitle.className = "font-semibold text-sm mb-2";
    abilityTitle.textContent = "特殊能力使用：";
    abilitySection.appendChild(abilityTitle);

    const abilityList = document.createElement("div");
    abilityList.className = "space-y-2 text-sm";
    const abilityResultsForRound = gameData.abilityResults?.[round.key] || {};

    // 检查每个特殊身份是否在本轮使用了能力
    const specialRoles = [
      { key: "muEnAngel", name: "沐恩天使" },
      { key: "goldenMonk", name: "金刚僧" },
      { key: "silentWhisper", name: "缄默" },
      { key: "medicineShaman", name: "胡庭药巫" },
      { key: "disguiseMaster", name: "易容术士" },
      { key: "songMessenger", name: "牧歌传讯者" },
      { key: "boneWhistleKing", name: "骨哨虫王" },
    ];

    specialRoles.forEach((role) => {
      const player = gameData.players.find((p) => p.specialRole === role.key);
      if (!player) return;

      const resultForRole = abilityResultsForRound[role.key];
      const used =
        (player.abilityUsage && player.abilityUsage[round.key] === true) ||
        Boolean(resultForRole);
      if (!used) return;

      const abilityItem = document.createElement("div");
      abilityItem.className = "pl-4 border-l-2 border-primary/30 bg-primary/5 rounded p-2";

      let resultText = "";
      let blessingExtra = "";
      let dispelNote = "";
      // 是否在该轮结算时被沐恩祝福：完全依赖各能力在当轮写入的快照字段
      const isBlessedThisRound = Boolean(
        (role.key === "goldenMonk" && resultForRole && resultForRole.muEnBlessed) ||
          (role.key === "medicineShaman" && resultForRole && resultForRole.muEnBlessed) ||
          (role.key === "disguiseMaster" && resultForRole && resultForRole.muEnBlessed) ||
          (role.key === "songMessenger" && resultForRole && resultForRole.muEnBlessed) ||
          (role.key === "silentWhisper" &&
            Array.isArray(resultForRole) &&
            resultForRole.some((entry) => entry.muEnBlessed))
      );
      
      if (role.key === "muEnAngel") {
        const result = resultForRole;
        if (result) {
          const targetName = result.targetName || "未知使者";
          const effectText = result.effectText || "祝福强化效果已生效";
          resultText = `${player.name} 在本轮施放了祝福，目标：${targetName}，效果：${effectText}`;
          if (result.note) {
            blessingExtra += `<div class="text-xs text-gray-600 mt-1 ml-2">${result.note}</div>`;
          }
        } else {
          resultText = `${player.name} 完成了祝福（详情仅主持人知悉）。`;
        }
      } else if (role.key === "goldenMonk") {
        const result = resultForRole;
        if (result) {
          const resolvedRoomLabel =
            result.roomLabel || getRoomLabel(round.key, result.roomProp);
          const hasBlocked =
            Array.isArray(result.blockedTypes) && result.blockedTypes.length > 0;
          if (hasBlocked && result.muEnBlessed) {
            const details = result.blockedTypes.map((t) => `【${t}】`).join("、");
            resultText = `${player.name} 将 ${resolvedRoomLabel} 化为圣域，抵御了：${details}`;
          } else if (hasBlocked) {
            resultText = `${player.name} 将 ${resolvedRoomLabel} 化为圣域，成功抵御来犯（具体能力未公开）`;
          } else {
            resultText = `${player.name} 将 ${resolvedRoomLabel} 化为圣域，庇护本轮行动`;
          }
          if (result.muEnBlessed) {
            blessingExtra = `<div class="text-xs text-primary mt-1 ml-2">沐恩祝福：圣域揭示被抵御的能力类型</div>`;
          }
          if (result.dispelledBy === "silentWhisper") {
            dispelNote = `<div class="text-xs text-red-600 mt-1 ml-2">圣域被缄默驱散</div>`;
          }
        } else {
          resultText = `${player.name} 使用了能力，将某个房间化为圣域`;
        }
      } else if (role.key === "medicineShaman") {
        // 胡庭药巫：从存储的结果中获取查验信息
        const result = resultForRole;
        if (result) {
          const resultDesc = result.isAddict ? "是荔枝瘾成员" : "不是荔枝瘾成员";
          resultText = `${player.name} 查验了 ${result.targetName}，结果：${resultDesc}`;
          if (isBlessedThisRound && result.revealedRoleName) {
            blessingExtra = `<div class="text-xs text-primary mt-1 ml-2">沐恩祝福：额外得知 ${result.targetName} 的特殊身份为「${result.revealedRoleName}」</div>`;
          } else if (isBlessedThisRound && result.revealedRoleKey === null) {
            blessingExtra = `<div class="text-xs text-primary mt-1 ml-2">沐恩祝福：额外得知 ${result.targetName} 没有特殊身份</div>`;
          }
        } else {
          resultText = `${player.name} 使用了能力（查验身份）`;
        }
      } else if (role.key === "disguiseMaster") {
        // 易容术士：从存储的结果中获取移动信息
        const result = resultForRole;
        if (result) {
          if (result.blockedBySanctuary) {
            if (result.message) {
              resultText = result.message;
            } else if (result.blockedSwap) {
              const masterFromLabel =
                result.masterFromLabel || getRoomLabel(round.key, result.masterFrom);
              const targetFromLabel =
                result.targetFromLabel || getRoomLabel(round.key, result.targetFrom);
              resultText = `${player.name} 与 ${
                result.targetName || "目标"
              } 试图互换房间（${player.name} 于 ${masterFromLabel}，目标在 ${targetFromLabel}），但被圣域阻挡。`;
            } else {
              const fromLabel =
                result.fromLabel || getRoomLabel(round.key, result.fromRoom);
              const toLabel =
                result.toLabel || getRoomLabel(round.key, result.toRoom);
              resultText = `${player.name} 试图从 ${fromLabel} 前往 ${toLabel}，但被圣域阻挡。`;
            }
          } else if (result.swapped) {
            resultText = `${player.name} 与 ${result.targetName} 互换了真实房间（${player.name} → ${getRoomLabel(round.key, result.masterTo)}，${result.targetName} → ${getRoomLabel(round.key, result.targetTo)}）`;
            if (isBlessedThisRound) {
              blessingExtra = `<div class="text-xs text-primary mt-1 ml-2">沐恩祝福：能力强化为互换房间</div>`;
            }
          } else {
            resultText = `${player.name} 从 ${result.fromLabel} 移动到 ${result.toLabel}（仅影响真实成员）`;
          }
        } else {
          resultText = `${player.name} 使用了能力（移动位置）`;
        }
      } else if (role.key === "songMessenger") {
        // 牧歌传讯者：显示真实人数
        const counts = formatRoomRealCountsForReplay(round.key);
        resultText = `${player.name} 使用了能力，获知：${counts}`;
        if (isBlessedThisRound) {
          const prevModule = getPreviousModuleKey(round.key);
          const bugMoved = prevModule ? Boolean(gameData.boneWhistleKingTarget?.[prevModule]) : null;
          let bugHint = "";
          if (bugMoved === true) {
            bugHint = "上一轮骨哨虫王曾发动行动";
          } else if (bugMoved === false) {
            bugHint = "上一轮未检测到骨哨虫王行动";
          } else {
            bugHint = "上一轮暂无骨哨虫王行动数据";
          }
          blessingExtra = `<div class="text-xs text-primary mt-1 ml-2">沐恩祝福（当时）：额外得知${bugHint}</div>`;
        }
      } else if (role.key === "boneWhistleKing") {
        // 骨哨虫王：显示目标房间
        const result = resultForRole;
        const target = gameData.boneWhistleKingTarget?.[round.key];
        if (result) {
          const roomLabel = result.roomLabel || getRoomLabel(round.key, result.roomProp);
          if (result.blockedBySanctuary) {
            resultText = `${player.name} 试图以虫群侵袭 ${roomLabel}，但圣域庇护使其无功。`;
          } else {
            resultText = `${player.name} 使用了能力，强制 ${roomLabel} 的荔枝被偷吃`;
          }
        } else if (target) {
          const roomLabel = getRoomLabel(round.key, target);
          resultText = `${player.name} 使用了能力，强制 ${roomLabel} 的荔枝被偷吃`;
        } else {
          resultText = `${player.name} 使用了能力（强制偷吃）`;
        }
      } else if (role.key === "silentWhisper") {
        const silentResults = resultForRole;
        if (Array.isArray(silentResults) && silentResults.length > 0) {
          resultText = silentResults
            .map((entry) => {
              const targetName = entry.targetName || "未知目标";
              const guessedRole = entry.guessedRoleName || "未知身份";
              const statusText = entry.blockedBySanctuary
                ? "被圣域庇护"
                : entry.blockedByBlessing
                ? "被祝福阻挡"
                : entry.success
                ? "封印成功"
                : "封印失败";
              return `${player.name} 猜测 ${targetName} 为 ${guessedRole}，${statusText}`;
            })
            .join("；");
          if (isBlessedThisRound) {
            blessingExtra = `<div class="text-xs text-primary mt-1 ml-2">沐恩祝福：每次猜测时天使会排除一个错误身份</div>`;
          }
        } else {
          resultText = `${player.name} 使用了能力（封印猜测）`;
        }
      }

      abilityItem.innerHTML = `
        <div class="font-medium text-primary">${role.name}：</div>
        <div class="text-gray-700 ml-2">${resultText}</div>
        ${blessingExtra}
        ${dispelNote}
      `;
      abilityList.appendChild(abilityItem);
    });

    if (abilityList.children.length === 0) {
      const noAbility = document.createElement("div");
      noAbility.className = "text-gray-400 text-sm italic pl-4";
      noAbility.textContent = "本轮无特殊能力使用";
      abilityList.appendChild(noAbility);
    }

    abilitySection.appendChild(abilityList);
    roundCard.appendChild(abilitySection);

    replayContainer.appendChild(roundCard);
  });
}

// 格式化房间真实人数用于复盘显示
function formatRoomRealCountsForReplay(module) {
  if (module === "module1" || module === "module2" || module === "module3") {
    const s = gameData[module].smallRoom.realMembers.length;
    const l = gameData[module].largeRoom.realMembers.length;
    return `小房间${s}人，大房间${l}人`;
  } else if (module === "module4") {
    const r1 = gameData.module4.room1.realMembers.length;
    const r2 = gameData.module4.room2.realMembers.length;
    const r3 = gameData.module4.room3.realMembers.length;
    return `房间1有${r1}人，房间2有${r2}人，房间3有${r3}人`;
  }
  return "";
}