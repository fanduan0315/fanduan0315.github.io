/**
 * 最终投票模块（module5）
 * 
 * 本模块负责最终投票环节，包括：
 * - 投票前讨论阶段（5分钟倒计时，显示四轮审查结果汇总）
 * - 票数分配（根据荔枝瘾人数动态计算上限）
 * - 投票界面控制
 * - 票数统计与验证
 * - 返回按钮逻辑（讨论阶段可返回第四轮结果，投票阶段可返回讨论阶段）
 *
 * 函数分类：
 *
 * 【初始化与配置】
 * - initModule5(): 初始化讨论阶段，显示四轮审查结果汇总，隐藏投票区域
 * - initDiscussionTimer(): 初始化讨论阶段倒计时（5分钟），设置"开始投票"按钮始终启用
 * - startDiscussionTimer(): 开始讨论倒计时，倒计时结束后显示通知
 * - resetDiscussionTimer(): 重置讨论倒计时到初始状态
 * - startVoting(): 从讨论阶段进入投票阶段，隐藏讨论区域，显示投票区域
 * - randomAssignVotes(): 在动态票数上限下随机分配票数
 *
 * 【投票计算】
 * - getVotesPerPerson(): 获取每人可投票数（基于荔枝瘾人数）
 * - getTotalVoteLimit(): 获取总票数上限
 * - getTotalVotes(): 计算当前总票数
 *
 * 【UI渲染】
 * - renderVoteControls(): 生成投票控制器界面
 * - updateVoteInput(playerId): 更新单个玩家的票数输入框
 * - updateVoteStats(): 更新票数统计和提交按钮状态
 *
 * 【事件处理】
 * - attachVoteEvents(): 绑定投票按钮事件监听器
 * - setupModule5EventListeners(): 设置模块5投票阶段事件监听器（包括返回讨论阶段的按钮）
 * - setupDiscussionEventListeners(): 设置讨论阶段事件监听器（包括返回第四轮结果的按钮）
 */


function getVotesPerPerson() {
  const configured = gameData.composition?.addict ?? 0;
  const actual = gameData.lycheeAddicts ? gameData.lycheeAddicts.length : 0;
  const value = actual || configured;
  return Math.max(1, value);
}

function getTotalVoteLimit() {
  return getVotesPerPerson() * getTotalPlayers();
}

// 初始化模块5：最终投票
function initModule5() {
  // 重置投票数据
  gameData.voteCounts = {}; // 存储每个使者的票数
  gameData.players.forEach((player) => {
    gameData.voteCounts[player.id] = 0; // 初始票数为0
  });

  const totalVoteLimit = getTotalVoteLimit();
  const totalPlayers = getTotalPlayers();

  // 显示讨论阶段，隐藏投票区域
  const discussionDiv = document.getElementById("module-5-discussion");
  const votingDiv = document.getElementById("module-5-voting");
  if (discussionDiv) discussionDiv.classList.remove("hidden");
  if (votingDiv) votingDiv.classList.add("hidden");

  // 显示审查结果汇总
  const summaryContainer = document.getElementById("vote-results-summary");
  summaryContainer.innerHTML = "";

  const getStateBadge = (state) => {
    if (state === null || typeof state === "undefined") {
      return `<span class="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600 border border-gray-300">未判定</span>`;
    }
    return state
      ? `<span class="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/30">荔枝被偷吃</span>`
      : `<span class="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">荔枝完好</span>`;
  };

  const createMemberChipsHtml = (members = [], guardId = null) => {
    if (!members.length) {
      return `<span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-400 border border-dashed border-gray-300">暂无成员</span>`;
    }
    return members
      .map((playerId) => {
        const player = gameData.players.find((p) => p.id === playerId);
        const isGuard = guardId === playerId;
        const baseClass = isGuard
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-white text-gray-700 border border-gray-200";
        return `<span class="px-2 py-0.5 rounded text-xs ${baseClass}">${
          player ? player.name : String(playerId)
        }</span>`;
      })
      .join("");
  };

  const createRoomCardHtml = (label, state, members, guardId) => {
    return `
      <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-600">${label}</span>
          ${getStateBadge(state)}
        </div>
        <div class="flex flex-wrap gap-1 mt-2">
          ${createMemberChipsHtml(members, guardId)}
        </div>
      </div>
    `;
  };

  const renderRoundCard = (title, roomsHtml, accentClass = "border-gray-200") => {
    if (!summaryContainer) return;
    const columnsClass =
      roomsHtml.length >= 3
        ? "grid grid-cols-1 md:grid-cols-3 gap-3"
        : "grid grid-cols-1 md:grid-cols-2 gap-3";
    summaryContainer.insertAdjacentHTML(
      "beforeend",
      `
        <div class="bg-white border-2 ${accentClass} rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-semibold text-primary">${title}</h4>
            <span class="text-xs text-gray-400">房间配置</span>
          </div>
          <div class="${columnsClass}">
            ${roomsHtml.join("")}
          </div>
        </div>
      `
    );
  };

  const totalLimitEl = document.getElementById("total-votes-limit");
  if (totalLimitEl) {
    totalLimitEl.textContent = totalVoteLimit;
  }

  // 第一轮结果（module1）
  if (gameData.module1) {
    const rooms = [
      createRoomCardHtml(
        "小房间",
        gameData.module1.smallRoom.surfaceLycheeState,
        gameData.module1.smallRoom.surfaceMembers,
        gameData.module1.smallGuard
      ),
      createRoomCardHtml(
        "大房间",
        gameData.module1.largeRoom.surfaceLycheeState,
        gameData.module1.largeRoom.surfaceMembers,
        gameData.module1.largeGuard
      ),
    ];
    renderRoundCard("第一轮审查", rooms, "border-blue-200");
  }

  // 第二轮结果（module2）
  if (gameData.module2) {
    const rooms = [
      createRoomCardHtml(
        "小房间",
        gameData.module2.smallRoom.surfaceLycheeState,
        gameData.module2.smallRoom.surfaceMembers,
        gameData.module2.smallGuard
      ),
      createRoomCardHtml(
        "大房间",
        gameData.module2.largeRoom.surfaceLycheeState,
        gameData.module2.largeRoom.surfaceMembers,
        gameData.module2.largeGuard
      ),
    ];
    renderRoundCard("第二轮审查", rooms, "border-green-200");
  }

  // 第三轮结果（module3）
  if (gameData.module3) {
    const rooms = [
      createRoomCardHtml(
        "小房间",
        gameData.module3.smallRoom.surfaceLycheeState,
        gameData.module3.smallRoom.surfaceMembers,
        gameData.module3.smallGuard
      ),
      createRoomCardHtml(
        "大房间",
        gameData.module3.largeRoom.surfaceLycheeState,
        gameData.module3.largeRoom.surfaceMembers,
        gameData.module3.largeGuard
      ),
    ];
    renderRoundCard("第三轮审查", rooms, "border-amber-200");
  }

  // 第四轮结果（module4）
  if (gameData.module4) {
    const rooms = [
      createRoomCardHtml(
        "房间 1",
        gameData.module4.room1.surfaceLycheeState,
        gameData.module4.room1.surfaceMembers,
        gameData.module4.guard1
      ),
      createRoomCardHtml(
        "房间 2",
        gameData.module4.room2.surfaceLycheeState,
        gameData.module4.room2.surfaceMembers,
        gameData.module4.guard2
      ),
      createRoomCardHtml(
        "房间 3",
        gameData.module4.room3.surfaceLycheeState,
        gameData.module4.room3.surfaceMembers,
        gameData.module4.guard3
      ),
    ];
    renderRoundCard("第四轮审查", rooms, "border-purple-200");
  }

  // 关键修复：如果已有投票数据，则复用，否则初始化
  if (!gameData.voteCounts || Object.keys(gameData.voteCounts).length === 0) {
    gameData.voteCounts = {};
    gameData.players.forEach((player) => {
      gameData.voteCounts[player.id] = 0;
    });
  }

  // 初始化讨论阶段倒计时
  initDiscussionTimer();

  // 设置讨论阶段事件监听器
  setupDiscussionEventListeners();
}

// 初始化讨论阶段倒计时
function initDiscussionTimer() {
  const timerEl = document.getElementById("discussion-timer-5");
  if (!timerEl) return;
  
  // 重置倒计时为5分钟
  timerEl.textContent = "05:00";
  
  // 重置开始按钮状态
  const startBtn = document.getElementById("start-discussion-timer-5");
  const resetBtn = document.getElementById("reset-discussion-timer-5");
  const startVotingBtn = document.getElementById("start-voting-5");
  
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = "开始";
  }
  if (resetBtn) {
    resetBtn.disabled = false;
  }
  if (startVotingBtn) {
    startVotingBtn.disabled = false; // 一直启用
  }
  
  // 清除之前的定时器
  if (gameData.discussionTimerInterval) {
    clearInterval(gameData.discussionTimerInterval);
    gameData.discussionTimerInterval = null;
  }
  gameData.discussionTimerSeconds = 300; // 5分钟 = 300秒
}

// 开始讨论倒计时
function startDiscussionTimer() {
  const timerEl = document.getElementById("discussion-timer-5");
  const startBtn = document.getElementById("start-discussion-timer-5");
  const resetBtn = document.getElementById("reset-discussion-timer-5");
  const startVotingBtn = document.getElementById("start-voting-5");
  
  if (!timerEl || gameData.discussionTimerInterval) return;
  
  // 禁用开始按钮
  if (startBtn) startBtn.disabled = true;
  if (resetBtn) resetBtn.disabled = false;
  
  // 开始倒计时
  gameData.discussionTimerInterval = setInterval(() => {
    gameData.discussionTimerSeconds--;
    
    if (gameData.discussionTimerSeconds <= 0) {
      // 倒计时结束
      clearInterval(gameData.discussionTimerInterval);
      gameData.discussionTimerInterval = null;
      timerEl.textContent = "00:00";
      
      // 显示通知
      showNotification("讨论时间已到，请开始投票！");
    } else {
      // 更新显示
      const minutes = Math.floor(gameData.discussionTimerSeconds / 60);
      const seconds = gameData.discussionTimerSeconds % 60;
      timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
  }, 1000);
  
  // 立即更新一次显示
  const minutes = Math.floor(gameData.discussionTimerSeconds / 60);
  const seconds = gameData.discussionTimerSeconds % 60;
  timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// 重置讨论倒计时
function resetDiscussionTimer() {
  if (gameData.discussionTimerInterval) {
    clearInterval(gameData.discussionTimerInterval);
    gameData.discussionTimerInterval = null;
  }
  initDiscussionTimer();
}

// 开始投票（从讨论阶段进入投票阶段）
function startVoting() {
  // 隐藏讨论阶段，显示投票区域
  const discussionDiv = document.getElementById("module-5-discussion");
  const votingDiv = document.getElementById("module-5-voting");
  if (discussionDiv) discussionDiv.classList.add("hidden");
  if (votingDiv) votingDiv.classList.remove("hidden");
  
  // 初始化投票界面
  const totalVoteLimit = getTotalVoteLimit();
  const totalLimitEl = document.getElementById("total-votes-limit");
  if (totalLimitEl) {
    totalLimitEl.textContent = totalVoteLimit;
  }
  
  // 重新渲染投票控制器（确保使用最新数据）
  renderVoteControls();
  
  // 设置投票阶段事件监听器
  setupModule5EventListeners();
}

// 设置讨论阶段事件监听器
function setupDiscussionEventListeners() {
  const startBtn = document.getElementById("start-discussion-timer-5");
  const resetBtn = document.getElementById("reset-discussion-timer-5");
  const startVotingBtn = document.getElementById("start-voting-5");
  const backTo4Btn = document.getElementById("back-to-4-from-discussion");
  
  if (startBtn) {
    startBtn.replaceWith(startBtn.cloneNode(true));
    document.getElementById("start-discussion-timer-5").addEventListener("click", startDiscussionTimer);
  }
  
  if (resetBtn) {
    resetBtn.replaceWith(resetBtn.cloneNode(true));
    document.getElementById("reset-discussion-timer-5").addEventListener("click", resetDiscussionTimer);
  }
  
  if (startVotingBtn) {
    startVotingBtn.replaceWith(startVotingBtn.cloneNode(true));
    document.getElementById("start-voting-5").addEventListener("click", startVoting);
  }
  
  if (backTo4Btn) {
    backTo4Btn.replaceWith(backTo4Btn.cloneNode(true));
    document.getElementById("back-to-4-from-discussion").addEventListener("click", () => {
      showModule(4);
      document.getElementById("result-4").classList.remove("hidden");
      document.querySelector("#module-4 > div:first-child").classList.add("hidden");
    });
  }
}


// 随机分配票数函数
function randomAssignVotes() {
  // 重置所有票数为0
  gameData.players.forEach((player) => {
    gameData.voteCounts[player.id] = 0;
  });

  const totalVotesLimit = getTotalVoteLimit();
  const votesPerPerson = getVotesPerPerson();
  const totalPlayers = getTotalPlayers();
  let remainingVotes = totalVotesLimit;
  const maxVotesPerPlayer = totalPlayers;

  // 创建可投票的使者列表（打乱顺序）
  const shuffledPlayers = [...gameData.players].sort(() => 0.5 - Math.random());

  // 随机分配票数
  while (remainingVotes > 0) {
    // 随机选择一个使者
    const randomPlayer =
      shuffledPlayers[Math.floor(Math.random() * shuffledPlayers.length)];

    // 如果该使者还未达到最大票数，且还有剩余票数
    if (gameData.voteCounts[randomPlayer.id] < maxVotesPerPlayer) {
      // 随机分配1-3票，但不超过剩余票数
      const maxPossibleVotes = Math.min(
        3,
        maxVotesPerPlayer - gameData.voteCounts[randomPlayer.id],
        remainingVotes
      );
      if (maxPossibleVotes > 0) {
        const votesToAdd = Math.floor(Math.random() * maxPossibleVotes) + 1;
        gameData.voteCounts[randomPlayer.id] += votesToAdd;
        remainingVotes -= votesToAdd;
      }
    }

    // 防止无限循环：如果所有使者都达到最大票数但还有剩余票数，强制分配
    const allPlayersMaxed = gameData.players.every(
      (player) => gameData.voteCounts[player.id] >= maxVotesPerPlayer
    );

    if (allPlayersMaxed && remainingVotes > 0) {
      // 找到票数最少的使者分配剩余票数
      const playerWithLeastVotes = gameData.players.reduce(
        (minPlayer, player) =>
          gameData.voteCounts[player.id] < gameData.voteCounts[minPlayer.id]
            ? player
            : minPlayer
      );

      const votesToAdd = Math.min(
        remainingVotes,
        maxVotesPerPlayer - gameData.voteCounts[playerWithLeastVotes.id]
      );
      gameData.voteCounts[playerWithLeastVotes.id] += votesToAdd;
      remainingVotes -= votesToAdd;
    }

    // 额外保护：如果循环次数过多，强制退出
    if (remainingVotes <= 0) break;
  }

  // 验证总票数是否正确
  const totalVotes = getTotalVotes();
  if (totalVotes !== totalVotesLimit) {
    console.warn(`票数分配异常: 总票数=${totalVotes}, 期望=${totalVotesLimit}`);
    // 修正票数差异
    const difference = totalVotesLimit - totalVotes;
    if (difference > 0) {
      // 随机选择一个使者增加票数
      const randomPlayer =
        shuffledPlayers[Math.floor(Math.random() * shuffledPlayers.length)];
      const maxPossible = Math.min(
        difference,
        maxVotesPerPlayer - gameData.voteCounts[randomPlayer.id]
      );
      gameData.voteCounts[randomPlayer.id] += maxPossible;
    } else if (difference < 0) {
      // 随机选择一个使者减少票数
      const randomPlayer =
        shuffledPlayers[Math.floor(Math.random() * shuffledPlayers.length)];
      const maxPossible = Math.min(
        -difference,
        gameData.voteCounts[randomPlayer.id]
      );
      gameData.voteCounts[randomPlayer.id] -= maxPossible;
    }
  }

  // 更新显示
  renderVoteControls();
  updateVoteStats();

  showNotification("票数已随机分配完成");
}


// 生成投票控制器（新函数）
function renderVoteControls() {
  const container = document.getElementById("voting-controls");
  container.innerHTML = "";
  const votesPerPerson = getVotesPerPerson();
  const totalLimit = getTotalVoteLimit();
  const totalPlayers = getTotalPlayers();

  gameData.players.forEach((player) => {
    // 关键：使用gameData.voteCounts中存储的当前票数
    const currentVotes = gameData.voteCounts[player.id] || 0;

    const controlEl = document.createElement("div");
    controlEl.className =
      "flex items-center justify-between bg-gray-50 p-3 rounded-lg";
    controlEl.innerHTML = `
            <div class="font-medium">${player.name}</div>
            <div class="flex items-center gap-2">
                <button class="decrease-vote bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center" data-player-id="${player.id}">
                    <i class="fa fa-minus"></i>
                </button>
                <!-- 关键：输入框值设置为当前存储的票数 -->
                <input type="number" min="0" max="${totalPlayers}" value="${currentVotes}" class="vote-input w-12 h-8 text-center border rounded" data-player-id="${player.id}">
                <button class="increase-vote bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center" data-player-id="${player.id}">
                    <i class="fa fa-plus"></i>
                </button>
            </div>
        `;
    container.appendChild(controlEl);
  });

  attachVoteEvents();
  updateVoteStats(); // 重新计算状态
}


// 添加票数调整事件（新函数）
function attachVoteEvents() {
  // 减票按钮
  document.querySelectorAll(".decrease-vote").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const playerId = parseInt(
        e.target.closest("[data-player-id]").dataset.playerId
      );
      if (gameData.voteCounts[playerId] > 0) {
        gameData.voteCounts[playerId]--;
        updateVoteInput(playerId);
        updateVoteStats();
      }
    });
  });

  // 加票按钮
  document.querySelectorAll(".increase-vote").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const playerId = parseInt(
        e.target.closest("[data-player-id]").dataset.playerId
      );
      const totalVotes = getTotalVotes();
      const votesPerPerson = getVotesPerPerson();
      const totalLimit = getTotalVoteLimit();
      const totalPlayers = getTotalPlayers();
      if (gameData.voteCounts[playerId] < totalPlayers && totalVotes < totalLimit) {
        gameData.voteCounts[playerId]++;
        updateVoteInput(playerId);
        updateVoteStats();
      }
    });
  });

  // 输入框直接修改
  document.querySelectorAll(".vote-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const playerId = parseInt(e.target.dataset.playerId);
      let value = parseInt(e.target.value) || 0;
      // 限制范围0-10
      const votesPerPerson = getVotesPerPerson();
      const totalPlayers = getTotalPlayers();
      const totalLimit = getTotalVoteLimit();
      value = Math.max(0, Math.min(totalPlayers, value));
      // 检查总票数是否超过限制
      const totalVotes =
        getTotalVotes() - gameData.voteCounts[playerId] + value;
      if (totalVotes <= totalLimit) {
        gameData.voteCounts[playerId] = value;
      } else {
        // 超过时自动调整为最大可能值
        gameData.voteCounts[playerId] =
          totalLimit - (getTotalVotes() - gameData.voteCounts[playerId]);
      }
      updateVoteInput(playerId);
      updateVoteStats();
    });
  });
}


// 更新单个使者的票数输入框（新函数）
function updateVoteInput(playerId) {
  const input = document.querySelector(
    `.vote-input[data-player-id="${playerId}"]`
  );
  input.value = gameData.voteCounts[playerId];
}


// 计算总票数（新函数）
function getTotalVotes() {
  // 遍历所有使者的票数并求和
  return Object.values(gameData.voteCounts).reduce(
    (sum, count) => sum + count,
    0
  );
}


// 更新票数统计和提交按钮状态（新函数）
function updateVoteStats() {
  const totalVotes = getTotalVotes();
  const totalLimit = getTotalVoteLimit();
  console.log("当前总票数:", totalVotes); // 调试用

  document.getElementById("used-votes").textContent = totalVotes;

  const submitBtn = document.getElementById("submit-vote");
  console.log("提交按钮状态:", totalVotes === totalLimit ? "可用" : "禁用"); // 调试用
  submitBtn.disabled = totalVotes !== totalLimit;

  // 高亮显示总票数
  const usedVotesEl = document.getElementById("used-votes");
  const totalLimitEl = document.getElementById("total-votes-limit");
  if (totalLimitEl) {
    totalLimitEl.textContent = totalLimit;
  }
  if (totalVotes > totalLimit) {
    usedVotesEl.className = "text-primary font-bold";
  } else {
    usedVotesEl.className = "";
  }
}


// 设置模块5事件监听器
function setupModule5EventListeners() {
    // 随机分配票数按钮
    document.getElementById('random-vote').addEventListener('click', randomAssignVotes);
    
    // 返回按钮（返回到讨论阶段）
    document.getElementById('back-to-4').addEventListener('click', () => {
        // 隐藏投票区域，显示讨论阶段
        const discussionDiv = document.getElementById("module-5-discussion");
        const votingDiv = document.getElementById("module-5-voting");
        if (discussionDiv) discussionDiv.classList.remove("hidden");
        if (votingDiv) votingDiv.classList.add("hidden");
    });
    
    // 提交投票按钮
    document.getElementById('submit-vote').addEventListener('click', () => {
        const totalVotes = getTotalVotes();
        if (totalVotes === getTotalVoteLimit()) {
            showModule6();
        }
    });
}


