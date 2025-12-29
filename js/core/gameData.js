/**
 * 游戏核心数据定义
 *
 * 包含：
 * - gameData: 全局游戏状态数据
 * - chineseNumbers: 中文数字映射
 * - 特殊角色配置与能力次数上限
 */

// 数据定义，不包含函数

// 游戏数据
const gameData = {
  players: [],
  lycheeAddicts: [],
  currentPhase: 1,
  currentAbilitySelection: null, // 当前能力选择的目标
  currentAbilityModule: null, // 当前正在进行的模块
  currentArrestModule: null, // 当前关押的模块
  totalPlayers: 10,
  composition: {
    ordinary: 6,
    addict: 3,
    neutral: 1,
  },
  abilityLimits: {
    medicineShaman: 4,
    disguiseMaster: 2,
    songMessenger: 4,
    boneWhistleKing: 1,
    silentWhisper: 0,
    muEnAngel: 1,
    hanBaLang: Infinity,
    goldenMonk: 1,
  },
  module1: {
    smallRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    largeRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    smallGuard: null,
    smallGuardReal: null,
    largeGuard: null,
    largeGuardReal: null,
  },

  // 更新特殊角色相关数据
  specialRoles: {
    // 特殊角色配置 - 更新为四个新身份
    roleConfig: {
      medicineShaman: {
        name: "胡庭药巫",
        maxCount: 1,
        faction: "ordinary", // 普通阵营
      },
      disguiseMaster: {
        name: "易容术士",
        maxCount: 1,
        faction: "lycheeAddict", // 荔枝瘾阵营
      },
      songMessenger: {
        name: "牧歌传讯者",
        maxCount: 1,
        faction: "ordinary", // 普通阵营
      },
      muEnAngel: {
        name: "沐恩天使",
        maxCount: 1,
        faction: "ordinary", // 普通阵营
      },
      goldenMonk: {
        name: "金刚僧",
        maxCount: 1,
        faction: "ordinary",
      },
      boneWhistleKing: {
        name: "骨哨虫王",
        maxCount: 1,
        faction: "lycheeAddict", // 荔枝瘾阵营
      },
      silentWhisper: {
        name: "缄默",
        maxCount: 1,
        faction: "lycheeAddict",
      },
      hanBaLang: {
        name: "憨巴郎",
        maxCount: 1,
        faction: "neutral",
      },
    },
    // 已分配的特殊角色
    assignedRoles: {},
  },

  module2: {
    // 双重系统：真实数据 vs 表面数据
    smallRoom: {
      realMembers: [], // 真实成员
      surfaceMembers: [], // 表面成员
      realLycheeState: null, // 真实荔枝状态
      surfaceLycheeState: null, // 表面荔枝状态
    },
    largeRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    smallGuard: null,
    largeGuard: null,
  },
  module3: {
    smallRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    largeRoom: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    smallGuard: null,
    largeGuard: null,
  },
  module4: {
    room1: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    room2: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    room3: {
      realMembers: [],
      surfaceMembers: [],
      realLycheeState: null,
      surfaceLycheeState: null,
    },
    guard1: null,
    guard2: null,
    guard3: null,
  },
  goldenMonkSanctuary: {},
  discussionTimerInterval: null, // 讨论阶段倒计时定时器
  discussionTimerSeconds: 300, // 讨论阶段剩余秒数（5分钟 = 300秒）
  roundMeta: {
    module1: {
      settlementStartId: null,
      settlementOrder: [],
      settlementTimer: {
        duration: 60,
        remaining: 60,
        running: false,
        intervalId: null,
      },
    },
    module2: {
      captainId: null,
      selectionStartId: null,
      selectionOrder: [],
      timer: {
        duration: 300,
        remaining: 300,
        running: false,
        intervalId: null,
      },
      settlementStartId: null,
      settlementOrder: [],
      settlementTimer: {
        duration: 60,
        remaining: 60,
        running: false,
        intervalId: null,
      },
    },
    module3: {
      captainId: null,
      selectionStartId: null,
      selectionOrder: [],
      timer: {
        duration: 300,
        remaining: 300,
        running: false,
        intervalId: null,
      },
      settlementStartId: null,
      settlementOrder: [],
      settlementTimer: {
        duration: 60,
        remaining: 60,
        running: false,
        intervalId: null,
      },
    },
    module4: {
      captainId: null,
      selectionStartId: null,
      selectionOrder: [],
      timer: {
        duration: 300,
        remaining: 300,
        running: false,
        intervalId: null,
      },
      settlementStartId: null,
      settlementOrder: [],
      settlementTimer: {
        duration: 60,
        remaining: 60,
        running: false,
        intervalId: null,
      },
    },
  },
  currentVoter: 0,
  neutralPlayers: [],
  currentAbilityNarration: null,
  // 存储能力使用结果，用于复盘
  abilityResults: {
    // 格式: { module1: { medicineShaman: { targetId: 1, isAddict: true }, ... }, ... }
  },
};

// 中文数字（一到十）
const chineseNumbers = [
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
];
