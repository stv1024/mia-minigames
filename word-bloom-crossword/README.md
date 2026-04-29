# Mia's Word Bloom

给小学低年级使用的固定关卡英文 crossword 拼词小游戏。

## 启动

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 目录结构

- `src/App.vue`：应用外壳和页面切换。
- `src/components/`：展示组件，包含棋盘、线索、关卡地图、徽章页和奖励弹窗。
- `src/composables/useCrosswordGame.js`：游戏流程、键盘输入、检查答案、宝箱和关卡跳转。
- `src/composables/useProgress.js`：本地进度持久化。
- `src/utils/crossword.js`：根据关卡单词生成 crossword 棋盘。
- `src/data/words.js`：词库释义、提示和图标。
- `src/data/badges.js`：10 个固定章节徽章。
- `src/data/chapters.js`：10 个章节配置。
- `src/data/levels/*.json`：50 个固定关卡，每关一个数据文件。

## 调整关卡

每个关卡文件格式如下：

```json
{
  "number": 1,
  "title": "Small Sprouts",
  "words": ["arm", "pig", "hop"]
}
```

后续精修难度时，优先调整 `src/data/levels/` 里的单词组合和顺序。新增单词时，需要先在 `src/data/words.js` 里补充释义、提示和图标。
