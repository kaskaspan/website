// 自动记录系统
import { saveUserScore, getCurrentUser } from "./user-storage";

export interface GameSession {
  gameId: string;
  gameName: string;
  startTime: number;
  endTime?: number;
  score: number;
  isActive: boolean;
}

class AutoRecorder {
  private currentSession: GameSession | null = null;
  private scoreUpdateInterval: NodeJS.Timeout | null = null;

  // 开始游戏会话
  startGameSession(gameName: string, gameId: string = "") {
    this.currentSession = {
      gameId: gameId || generateGameId(),
      gameName,
      startTime: Date.now(),
      score: 0,
      isActive: true,
    };

    console.log(`🎮 开始游戏会话: ${gameName}`);

    // 开始监听分数变化
    this.startScoreMonitoring();
  }

  // 结束游戏会话
  endGameSession(finalScore: number) {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.score = finalScore;
    this.currentSession.isActive = false;

    // 自动保存分数
    this.autoSaveScore(finalScore);

    console.log(
      `🏁 游戏结束: ${this.currentSession.gameName}, 分数: ${finalScore}`
    );

    this.currentSession = null;
    this.stopScoreMonitoring();
  }

  // 更新当前分数
  updateScore(newScore: number) {
    if (this.currentSession) {
      this.currentSession.score = newScore;
    }
  }

  // 获取当前会话信息
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  // 开始监听分数变化
  private startScoreMonitoring() {
    this.scoreUpdateInterval = setInterval(() => {
      if (this.currentSession && this.currentSession.isActive) {
        // 尝试从游戏元素获取分数
        const score = this.extractScoreFromGame();
        if (score !== null && score !== this.currentSession.score) {
          this.updateScore(score);
        }
      }
    }, 1000); // 每秒检查一次
  }

  // 停止监听分数变化
  private stopScoreMonitoring() {
    if (this.scoreUpdateInterval) {
      clearInterval(this.scoreUpdateInterval);
      this.scoreUpdateInterval = null;
    }
  }

  // 从游戏元素中提取分数
  private extractScoreFromGame(): number | null {
    if (typeof window === "undefined") return null;

    // 尝试多种可能的分数元素选择器
    const scoreSelectors = [
      '[data-testid="score"]',
      ".score",
      "#score",
      '[class*="score"]',
      '[id*="score"]',
      ".game-score",
      "#game-score",
    ];

    for (const selector of scoreSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || (element as HTMLElement).innerText;
        const score = parseInt(text.replace(/[^\d]/g, ""));
        if (!isNaN(score)) {
          return score;
        }
      }
    }

    // 如果找不到分数元素，返回当前会话的分数
    return this.currentSession?.score || 0;
  }

  // 自动保存分数
  private autoSaveScore(score: number) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log("⚠️ 没有登录用户，无法自动保存分数");
      return;
    }

    if (!this.currentSession) return;

    const today = new Date().toISOString().split("T")[0];

    try {
      const savedScore = saveUserScore({
        username: currentUser,
        score: score,
        game: this.currentSession.gameName,
        date: today,
      });

      console.log(
        `✅ 自动保存分数成功: ${currentUser} - ${this.currentSession.gameName} - ${score}分`
      );

      // 触发排行榜更新事件
      this.triggerLeaderboardUpdate();

      return savedScore;
    } catch (error) {
      console.error("❌ 自动保存分数失败:", error);
    }
  }

  // 触发排行榜更新事件
  private triggerLeaderboardUpdate() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("leaderboardUpdate", {
          detail: { timestamp: Date.now() },
        })
      );
    }
  }

  // 检查是否有活跃的游戏会话
  isGameActive(): boolean {
    return this.currentSession?.isActive || false;
  }

  // 获取当前分数
  getCurrentScore(): number {
    return this.currentSession?.score || 0;
  }
}

// 生成游戏ID
const generateGameId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 创建全局实例
export const autoRecorder = new AutoRecorder();

// 游戏集成辅助函数
export const integrateGameWithAutoRecorder = (
  gameName: string,
  gameId?: string
) => {
  // 开始游戏会话
  autoRecorder.startGameSession(gameName, gameId);

  // 返回游戏控制函数
  return {
    updateScore: (score: number) => autoRecorder.updateScore(score),
    endGame: (finalScore: number) => autoRecorder.endGameSession(finalScore),
    getCurrentScore: () => autoRecorder.getCurrentScore(),
    isActive: () => autoRecorder.isGameActive(),
  };
};

// 监听页面卸载，自动保存当前分数
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (autoRecorder.isGameActive()) {
      const currentScore = autoRecorder.getCurrentScore();
      if (currentScore > 0) {
        autoRecorder.endGameSession(currentScore);
      }
    }
  });
}
