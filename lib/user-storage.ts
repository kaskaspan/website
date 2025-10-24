// 用户数据存储系统
export interface UserScore {
  id: string;
  username: string;
  score: number;
  game: string;
  date: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  totalScore: number;
  gamesPlayed: number;
  joinDate: string;
  lastActive: string;
}

// 获取所有用户分数
export const getUserScores = (): UserScore[] => {
  if (typeof window === "undefined") return [];

  try {
    const scores = localStorage.getItem("userScores");
    return scores ? JSON.parse(scores) : [];
  } catch (error) {
    console.error("Error loading user scores:", error);
    return [];
  }
};

// 保存用户分数
export const saveUserScore = (
  score: Omit<UserScore, "id" | "timestamp">
): UserScore => {
  const newScore: UserScore = {
    id: generateId(),
    timestamp: Date.now(),
    ...score,
  };

  const scores = getUserScores();
  scores.push(newScore);

  try {
    localStorage.setItem("userScores", JSON.stringify(scores));
  } catch (error) {
    console.error("Error saving user score:", error);
  }

  return newScore;
};

// 获取用户档案
export const getUserProfiles = (): UserProfile[] => {
  if (typeof window === "undefined") return [];

  try {
    const profiles = localStorage.getItem("userProfiles");
    return profiles ? JSON.parse(profiles) : [];
  } catch (error) {
    console.error("Error loading user profiles:", error);
    return [];
  }
};

// 保存或更新用户档案
export const saveUserProfile = (
  profile: Omit<UserProfile, "id" | "joinDate" | "lastActive">
): UserProfile => {
  const profiles = getUserProfiles();
  const existingProfile = profiles.find((p) => p.username === profile.username);

  if (existingProfile) {
    // 更新现有档案
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...profile,
      lastActive: new Date().toISOString().split("T")[0],
    };

    const index = profiles.findIndex((p) => p.username === profile.username);
    profiles[index] = updatedProfile;
  } else {
    // 创建新档案
    const newProfile: UserProfile = {
      id: generateId(),
      joinDate: new Date().toISOString().split("T")[0],
      lastActive: new Date().toISOString().split("T")[0],
      ...profile,
    };
    profiles.push(newProfile);
  }

  try {
    localStorage.setItem("userProfiles", JSON.stringify(profiles));
  } catch (error) {
    console.error("Error saving user profile:", error);
  }

  return existingProfile || profiles[profiles.length - 1];
};

// 获取排行榜数据（真实用户数据）
export const getLeaderboardData = (): UserScore[] => {
  const scores = getUserScores();
  return scores.sort((a, b) => b.score - a.score);
};

// 获取特定游戏的排行榜
export const getGameLeaderboard = (game: string): UserScore[] => {
  const scores = getUserScores();
  return scores
    .filter((score) => score.game === game)
    .sort((a, b) => b.score - a.score);
};

// 获取用户的最佳分数
export const getUserBestScore = (
  username: string,
  game?: string
): UserScore | null => {
  const scores = getUserScores();
  let userScores = scores.filter((score) => score.username === username);

  if (game) {
    userScores = userScores.filter((score) => score.game === game);
  }

  if (userScores.length === 0) return null;

  return userScores.sort((a, b) => b.score - a.score)[0];
};

// 获取用户统计信息
export const getUserStats = (username: string) => {
  const scores = getUserScores();
  const userScores = scores.filter((score) => score.username === username);

  if (userScores.length === 0) {
    return {
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      gamesPlayed: {},
    };
  }

  const totalScore = userScores.reduce((sum, score) => sum + score.score, 0);
  const gamesPlayed = userScores.reduce((games, score) => {
    games[score.game] = (games[score.game] || 0) + 1;
    return games;
  }, {} as Record<string, number>);

  return {
    totalGames: userScores.length,
    totalScore,
    averageScore: Math.round(totalScore / userScores.length),
    bestScore: Math.max(...userScores.map((s) => s.score)),
    gamesPlayed,
  };
};

// 清除所有数据
export const clearAllUserData = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("userScores");
    localStorage.removeItem("userProfiles");
  } catch (error) {
    console.error("Error clearing user data:", error);
  }
};

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 获取当前用户信息
export const getCurrentUser = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("currentUser");
};

// 设置当前用户
export const setCurrentUser = (username: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("currentUser", username);
};

// 登出用户
export const logoutUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("currentUser");
};
