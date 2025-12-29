/**
 * 憨巴郎（Han Ba Lang）被动能力模块
 *
 * 能力：若在最终投票中以第一名被投出，则无视普通/荔枝瘾的胜利条件，
 *      立即判定憨巴郎单独胜利。若能力被缄默封印，则无法触发。若提前受到沐恩天使祝福，则最终结算时会额外获得“荔枝瘾人数”张虚拟票。
 *
 * 说明：本身份没有主动操作界面，仅在模块6结果结算时调用。
 *
 * 函数列表：
 * - evaluateHanBaLangPassive(rankedPlayers): 评估憨巴郎被动能力是否触发
 * - getHanBaLangSilhouette(): 获取憨巴郎身份按钮的图标 HTML
 */

/**
 * 获取憨巴郎身份按钮的图标 HTML
 * @returns {string} 图标 HTML 字符串
 */
function getHanBaLangLoreLine() {
  return "汝可引怨为冕，首票加身则独享胜果。";
}

function getHanBaLangSilhouette() {
  // 使用爪印图标，但保持和其他身份一致的样式结构
  return `<i class="fa fa-solid fa-paw fa-silhouette" style="font-size:102px;" aria-hidden="true"></i>`;
}

/**
 * 评估憨巴郎被动能力是否触发
 * @param {Array} rankedPlayers - 按票数排序的玩家排名数组
 * @returns {Object|null} 能力结果对象，包含触发状态、封印状态等信息
 */
function evaluateHanBaLangPassive(rankedPlayers) {
  const moduleLabel = gameData?.currentAbilityModule || "module6";
  const validInput = Array.isArray(rankedPlayers) && !!gameData?.players;
  logAbilityAction("hanBaLang", "evaluate", { module: moduleLabel, validInput });
  if (!validInput) {
    return null;
  }

  const hanBaLangPlayer = gameData.players.find(
    (player) => player.specialRole === "hanBaLang"
  );
  if (!hanBaLangPlayer) {
    logAbilityAction("hanBaLang", "skip-no-role", { module: moduleLabel });
    return null;
  }

  const rankingEntry = rankedPlayers.find(
    (entry) => entry?.player?.id === hanBaLangPlayer.id
  );
  const topVotes = rankedPlayers.length > 0 ? rankedPlayers[0].votes : 0;
  const isTop = Boolean(rankingEntry && rankingEntry.rank === 1 && rankingEntry.votes === topVotes);
  const sealed = !!hanBaLangPlayer.abilitySealed;
  const triggered = isTop && !sealed;

  const outcome = {
    player: hanBaLangPlayer,
    triggered,
    sealed,
    isTop,
    votes: rankingEntry ? rankingEntry.votes : 0,
  };

  logAbilityAction("hanBaLang", "passive-check", {
    module: moduleLabel,
    player: hanBaLangPlayer.name,
    triggered,
    sealed,
    isTop,
    votes: outcome.votes,
  });

  gameData.hanBaLangOutcome = outcome;
  return outcome;
}

