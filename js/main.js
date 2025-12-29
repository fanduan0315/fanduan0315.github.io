/**
 * 荔枝谜案 - 主入口文件
 *
 * 功能：
 * - DOM加载完成后初始化游戏
 * - 创建开场故事模态框
 * - 调用各模块初始化函数
 * - 包含所有事件监听器设置函数 setupEventListeners()
 */


// main.js
console.log('=== main.js 开始执行 ===');

// 测试所有依赖是否加载
console.log('gameData:', typeof gameData);
console.log('initModule0:', typeof initModule0);
console.log('assignLycheeAddicts:', typeof assignLycheeAddicts);

/**
 * 设置全局事件监听器（分发到各模块）
 */
function setupEventListeners() {
    console.log('设置全局事件监听器');
    
    // 帮助按钮和模态框
    document.getElementById('help-btn').addEventListener('click', () => {
        document.getElementById('help-modal').classList.remove('hidden');
    });

    document.getElementById('close-help').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('help-modal').classList.add('hidden');
    });

    document.getElementById('help-modal').addEventListener('click', (e) => {
        if (e.target.id === 'help-modal') {
            document.getElementById('help-modal').classList.add('hidden');
        }
    });

    // 关押界面事件
    document.getElementById('confirm-arrest').addEventListener('click', confirmArrest);
    
    // 重新开始游戏
    document.getElementById('restart-game').addEventListener('click', () => {
        // 调用完整的游戏重置函数
        if (typeof resetGameCompletely === 'function') {
            resetGameCompletely();
        }
        // 重新初始化模块0
        if (typeof initModule0 === 'function') {
            initModule0();
        }
        // 显示模块0
        if (typeof showModule === 'function') {
            showModule(0);
        }
    });
    
    // 从模块6返回模块5
    document.getElementById('back-to-5').addEventListener('click', () => {
        hideAllModules();
        document.getElementById('module-5').classList.remove('hidden');
        gameData.currentPhase = 5;
        updateGameStatus();
        document.getElementById('submit-vote').disabled = false;
    });
}

// DOM 元素加载完成后初始化
document.addEventListener("DOMContentLoaded", function () {
  // 创建开场故事模态框
  const introModal = document.createElement("div");
  introModal.id = "intro-modal";
  introModal.className =
    "fixed inset-0 bg-black/80 flex items-center justify-center z-50";
  introModal.innerHTML = `
        <div class="bg-secondary rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 m-4 tang-border">
            <div class="text-center mb-6">
                <h2 class="text-3xl font-bold text-primary font-tang mb-4">荔枝谜案</h2>
                <div class="w-20 h-1 bg-primary mx-auto mb-6"></div>
            </div>
            <div class="space-y-6 text-gray-700 text-justify">
                <p>大唐天宝年间，长安城实行严格的宵禁制度。今夜，十位来自西域的胡人使者，携稀世贡品入宫朝觐。鸿胪寺设荔枝宴为诸位接风，这岭南快马送来的鲜荔，本是圣上钦赐的恩典...</p>
                <p>然而三更鼓响时，二十一颗御赐荔枝竟不翼而飞！更蹊跷的是...</p>
                <p class="text-primary font-semibold">大理寺卿发现，这二十一颗被吃的荔枝有七颗是嘴咬，有七颗是刀砍，有七颗是手剥，所以盗荔者有三人。并且根据外壳的腐烂程度，这二十一颗荔枝分七个时辰七个批次被吃完。种种迹象无不和传说中的『荔枝瘾』吻合——此症需每时辰食荔枝一颗，否则瘙痒难耐！而能趁宵禁行动的...只有你们十位使者！所以这三个荔枝瘾一定在你们之中。</p>
                <p>经查证：盗荔者必是三人结伙作案，患病者无法抗拒荔枝诱惑。大理寺卿提出姜太公钓鱼行动，利用剩下的九颗荔枝在接下来的时辰中找出荔枝瘾！</p>
                <p class="text-center text-lg font-tang text-dark mt-6">更鼓将尽，诸君切记——每个选择...都可能让你成为下一个...瘾 君 子！</p>
            </div>
            <div class="text-center mt-8">
                <button id="close-intro" class="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full shadow-md scale-hover font-tang">
                    开始确认身份
                </button>
            </div>
        </div>
    `;
  document.body.appendChild(introModal);

  // 关闭开场故事
  document.getElementById("close-intro").addEventListener("click", function () {
    document.getElementById("intro-modal").remove();
  });

  // 原有的初始化代码
  initModule0();
  assignLycheeAddicts();
  setupEventListeners();
});
