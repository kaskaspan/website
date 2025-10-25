"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

// 游戏常量
const TILE_WIDTH = 40;
const TILE_HEIGHT = 50;
const BOARD_WIDTH = 800;
const BOARD_HEIGHT = 600;

// 麻将牌类型
interface MahjongTile {
  id: string;
  suit: "bamboo" | "character" | "dot" | "wind" | "dragon" | "flower";
  value: number;
  name: string;
  x: number;
  y: number;
  layer: number;
  isSelected: boolean;
  isMatched: boolean;
  isBlocked: boolean;
}

// 游戏状态
interface GameState {
  tiles: MahjongTile[];
  selectedTiles: MahjongTile[];
  score: number;
  moves: number;
  timeLeft: number;
  gameOver: boolean;
  isPaused: boolean;
  matchedPairs: number;
  totalPairs: number;
}

export function MahjongGame() {
  const [gameState, setGameState] = useState<GameState>({
    tiles: [],
    selectedTiles: [],
    score: 0,
    moves: 0,
    timeLeft: 300, // 5分钟
    gameOver: false,
    isPaused: false,
    matchedPairs: 0,
    totalPairs: 0,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (score: number) => void;
  } | null>(null);

  // 创建麻将牌
  const createTiles = useCallback((): MahjongTile[] => {
    const tiles: MahjongTile[] = [];
    // let id = 0;

    // 创建基本牌型（每种4张）
    const basicSuits = [
      { suit: "bamboo" as const, name: "Bamboo", count: 9 },
      { suit: "character" as const, name: "Character", count: 9 },
      { suit: "dot" as const, name: "Dot", count: 9 },
    ];

    basicSuits.forEach(({ suit, name, count }) => {
      for (let value = 1; value <= count; value++) {
        for (let copy = 0; copy < 4; copy++) {
          tiles.push({
            id: `${suit}-${value}-${copy}`,
            suit,
            value,
            name: `${name} ${value}`,
            x: 0,
            y: 0,
            layer: 0,
            isSelected: false,
            isMatched: false,
            isBlocked: false,
          });
        }
      }
    });

    // 创建风牌（每种4张）
    const winds = ["East", "South", "West", "North"];
    winds.forEach((wind, index) => {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({
          id: `wind-${index}-${copy}`,
          suit: "wind",
          value: index + 1,
          name: wind,
          x: 0,
          y: 0,
          layer: 0,
          isSelected: false,
          isMatched: false,
          isBlocked: false,
        });
      }
    });

    // 创建箭牌（每种4张）
    const dragons = ["Red", "Green", "White"];
    dragons.forEach((dragon, index) => {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({
          id: `dragon-${index}-${copy}`,
          suit: "dragon",
          value: index + 1,
          name: dragon,
          x: 0,
          y: 0,
          layer: 0,
          isSelected: false,
          isMatched: false,
          isBlocked: false,
        });
      }
    });

    // 创建花牌（每种1张）
    const flowers = ["Plum", "Orchid", "Chrysanthemum", "Bamboo"];
    flowers.forEach((flower, index) => {
      tiles.push({
        id: `flower-${index}`,
        suit: "flower",
        value: index + 1,
        name: flower,
        x: 0,
        y: 0,
        layer: 0,
        isSelected: false,
        isMatched: false,
        isBlocked: false,
      });
    });

    return tiles;
  }, []);

  // 洗牌
  const shuffleTiles = useCallback((tiles: MahjongTile[]): MahjongTile[] => {
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // 布局麻将牌
  const layoutTiles = useCallback((tiles: MahjongTile[]): MahjongTile[] => {
    const layout = [
      // 第一层
      { x: 50, y: 50, width: 14, height: 4 },
      { x: 50, y: 200, width: 14, height: 4 },
      { x: 50, y: 350, width: 14, height: 4 },
      { x: 50, y: 500, width: 14, height: 4 },
      // 第二层
      { x: 100, y: 100, width: 12, height: 3 },
      { x: 100, y: 250, width: 12, height: 3 },
      { x: 100, y: 400, width: 12, height: 3 },
      // 第三层
      { x: 150, y: 150, width: 10, height: 2 },
      { x: 150, y: 300, width: 10, height: 2 },
      // 第四层
      { x: 200, y: 200, width: 8, height: 1 },
    ];

    let tileIndex = 0;
    const layoutTiles: MahjongTile[] = [];

    layout.forEach((layer, layerIndex) => {
      for (let row = 0; row < layer.height; row++) {
        for (let col = 0; col < layer.width; col++) {
          if (tileIndex < tiles.length) {
            const tile = tiles[tileIndex];
            layoutTiles.push({
              ...tile,
              x: layer.x + col * (TILE_WIDTH + 2),
              y: layer.y + row * (TILE_HEIGHT + 2),
              layer: layerIndex,
            });
            tileIndex++;
          }
        }
      }
    });

    return layoutTiles;
  }, []);

  // 检查牌是否被阻挡
  const checkBlocked = useCallback(
    (tile: MahjongTile, allTiles: MahjongTile[]): boolean => {
      // 检查左右两侧是否有牌阻挡
      const leftBlocked = allTiles.some(
        (t) =>
          t.layer === tile.layer &&
          t.y === tile.y &&
          t.x === tile.x - (TILE_WIDTH + 2) &&
          !t.isMatched
      );

      const rightBlocked = allTiles.some(
        (t) =>
          t.layer === tile.layer &&
          t.y === tile.y &&
          t.x === tile.x + (TILE_WIDTH + 2) &&
          !t.isMatched
      );

      // 检查上层是否有牌阻挡
      const upperBlocked = allTiles.some(
        (t) =>
          t.layer > tile.layer &&
          t.x <= tile.x + TILE_WIDTH &&
          t.x + TILE_WIDTH >= tile.x &&
          t.y <= tile.y + TILE_HEIGHT &&
          t.y + TILE_HEIGHT >= tile.y &&
          !t.isMatched
      );

      return leftBlocked || rightBlocked || upperBlocked;
    },
    []
  );

  // 更新阻挡状态
  const updateBlockedStatus = useCallback(
    (tiles: MahjongTile[]): MahjongTile[] => {
      return tiles.map((tile) => ({
        ...tile,
        isBlocked: checkBlocked(tile, tiles),
      }));
    },
    [checkBlocked]
  );

  // 检查两张牌是否匹配
  const isMatchingPair = useCallback(
    (tile1: MahjongTile, tile2: MahjongTile): boolean => {
      return tile1.suit === tile2.suit && tile1.value === tile2.value;
    },
    []
  );

  // 处理牌点击
  const handleTileClick = useCallback(
    (tile: MahjongTile) => {
      if (
        gameState.gameOver ||
        gameState.isPaused ||
        tile.isMatched ||
        tile.isBlocked
      )
        return;

      setGameState((prev) => {
        if (prev.selectedTiles.length === 0) {
          // 选择第一张牌
          return {
            ...prev,
            selectedTiles: [tile],
            tiles: prev.tiles.map((t) =>
              t.id === tile.id
                ? { ...t, isSelected: true }
                : { ...t, isSelected: false }
            ),
          };
        } else if (prev.selectedTiles.length === 1) {
          const firstTile = prev.selectedTiles[0];

          if (firstTile.id === tile.id) {
            // 取消选择
            return {
              ...prev,
              selectedTiles: [],
              tiles: prev.tiles.map((t) => ({ ...t, isSelected: false })),
            };
          } else if (isMatchingPair(firstTile, tile)) {
            // 匹配成功
            const newTiles = prev.tiles.map((t) =>
              t.id === firstTile.id || t.id === tile.id
                ? { ...t, isMatched: true, isSelected: false }
                : { ...t, isSelected: false }
            );

            const updatedTiles = updateBlockedStatus(newTiles);
            const newMatchedPairs = prev.matchedPairs + 1;
            const newScore = prev.score + 100 * (prev.moves + 1);

            // 更新自动记录器
            if (gameRecorder) {
              gameRecorder.updateScore(newScore);
            }

            return {
              ...prev,
              tiles: updatedTiles,
              selectedTiles: [],
              score: newScore,
              moves: prev.moves + 1,
              matchedPairs: newMatchedPairs,
              gameOver: newMatchedPairs === prev.totalPairs,
            };
          } else {
            // 匹配失败
            return {
              ...prev,
              selectedTiles: [tile],
              tiles: prev.tiles.map((t) =>
                t.id === tile.id
                  ? { ...t, isSelected: true }
                  : { ...t, isSelected: false }
              ),
            };
          }
        }

        return prev;
      });
    },
    [gameState, isMatchingPair, updateBlockedStatus, gameRecorder]
  );

  // 初始化游戏
  const initializeGame = useCallback(() => {
    const tiles = createTiles();
    const shuffledTiles = shuffleTiles(tiles);
    const layoutTiles = layoutTiles(shuffledTiles);
    const tilesWithBlocked = updateBlockedStatus(layoutTiles);

    return {
      tiles: tilesWithBlocked,
      selectedTiles: [],
      score: 0,
      moves: 0,
      timeLeft: 300,
      gameOver: false,
      isPaused: false,
      matchedPairs: 0,
      totalPairs: tiles.length / 2,
    };
  }, [createTiles, shuffleTiles, updateBlockedStatus]);

  // 重置游戏
  const resetGame = useCallback(() => {
    const newGameState = initializeGame();
    setGameState(newGameState);
    setIsPlaying(false);
  }, [initializeGame]);

  // 开始游戏
  const startGame = useCallback(() => {
    const newGameState = initializeGame();
    setGameState(newGameState);
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder("Mahjong", "mahjong-game");
    setGameRecorder(recorder);
  }, [initializeGame]);

  // 结束游戏
  const endGame = useCallback(() => {
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
    setIsPlaying(false);
  }, [gameRecorder, gameState.score]);

  // 计时器
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft <= 0) {
          return {
            ...prev,
            gameOver: true,
          };
        }
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, gameState.gameOver, gameState.isPaused]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameOver || !isPlaying) return;

      switch (e.key.toLowerCase()) {
        case "p":
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState.gameOver, isPlaying]);

  // 渲染麻将牌
  const renderTile = useCallback(
    (tile: MahjongTile) => {
      const getTileSymbol = (tile: MahjongTile): string => {
        switch (tile.suit) {
          case "bamboo":
            return "🎋";
          case "character":
            return "🀄";
          case "dot":
            return "🔴";
          case "wind":
            return "🌪️";
          case "dragon":
            return "🐉";
          case "flower":
            return "🌸";
          default:
            return "🀄";
        }
      };

      const getTileColor = (tile: MahjongTile): string => {
        if (tile.isMatched) return "bg-green-200";
        if (tile.isSelected) return "bg-yellow-200";
        if (tile.isBlocked) return "bg-gray-300";
        return "bg-white";
      };

      return (
        <div
          key={tile.id}
          className={`absolute cursor-pointer border-2 border-gray-400 rounded transition-all duration-200 ${
            tile.isMatched ? "opacity-50" : ""
          } ${tile.isBlocked ? "cursor-not-allowed" : "hover:shadow-lg"}`}
          style={{
            left: tile.x,
            top: tile.y,
            width: TILE_WIDTH,
            height: TILE_HEIGHT,
            zIndex: tile.layer + (tile.isSelected ? 1000 : 0),
            backgroundColor: getTileColor(tile),
          }}
          onClick={() => handleTileClick(tile)}
        >
          <div className="w-full h-full flex flex-col items-center justify-center p-1">
            <div className="text-lg">{getTileSymbol(tile)}</div>
            <div className="text-xs font-bold text-gray-700">{tile.value}</div>
            <div className="text-xs text-gray-600">{tile.name}</div>
          </div>
        </div>
      );
    },
    [handleTileClick]
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="p-6 bg-gradient-to-br from-red-900 via-yellow-900 to-green-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🀄 Mahjong</h2>
          <p className="text-white/70">
            Match pairs of tiles to clear the board! Click on unblocked tiles.
          </p>
        </div>

        {/* 游戏信息 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Score: {gameState.score}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Moves: {gameState.moves}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Pairs: {gameState.matchedPairs}/{gameState.totalPairs}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Time: {Math.floor(gameState.timeLeft / 60)}:
              {(gameState.timeLeft % 60).toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* 游戏区域 */}
        <div
          className="relative mx-auto mb-6 bg-green-800 border-4 border-green-600 rounded-lg overflow-hidden"
          style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
        >
          {gameState.tiles.map(renderTile)}
        </div>

        {/* 游戏结束 */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            {gameState.matchedPairs === gameState.totalPairs ? (
              <>
                <p className="text-2xl font-bold text-green-400 mb-2">
                  🎉 You Win!
                </p>
                <p className="text-white/70">Final Score: {gameState.score}</p>
                <p className="text-white/70">Moves: {gameState.moves}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-red-400 mb-2">
                  ⏰ Time&apos;s Up!
                </p>
                <p className="text-white/70">Final Score: {gameState.score}</p>
                <p className="text-white/70">
                  Pairs Matched: {gameState.matchedPairs}/{gameState.totalPairs}
                </p>
              </>
            )}
          </div>
        )}

        {/* 控制按钮 */}
        <div className="flex justify-center space-x-4">
          {!isPlaying ? (
            <Button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Start Game
            </Button>
          ) : (
            <>
              <Button
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    isPaused: !prev.isPaused,
                  }))
                }
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {gameState.isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                onClick={resetGame}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reset
              </Button>
              <Button
                onClick={endGame}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                End Game
              </Button>
            </>
          )}
        </div>

        {/* 游戏说明 */}
        <div className="mt-6 text-center text-white/70 text-sm">
          <p>
            Click on unblocked tiles to match pairs. Tiles are blocked if they
            have tiles on top or on both sides.
          </p>
        </div>
      </Card>
    </div>
  );
}
