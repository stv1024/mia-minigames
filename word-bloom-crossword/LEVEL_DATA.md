# 关卡数据格式

关卡文件放在 `src/data/levels/`。

示例：

```json
{ "number": 1, "title": "Small Sprouts", "words": ["arm", "pig", "hop"] }
```

字段说明：

- `number`: 关卡编号
- `title`: 关卡标题
- `words`: 本关使用的单词

JSON 里不保存格子位置。

格子位置是在运行时由 `src/utils/crossword.js` 自动生成的。

排格规则：

1. 第一个单词从 `row = 0`、`col = 0` 开始，横向放置。
2. 后面的单词会尝试和已有格子里的相同字母交叉。
3. 如果有多个可用位置，会按评分选择最合适的位置。
4. 如果完全无法交叉，就把单词放到新的一行。
5. 最后会整体平移棋盘，让左上角有效区域从 `row = 0`、`col = 0` 开始。

生成后的格子包含 `row`、`col`、`letter`、`active` 等信息。

`CrosswordBoard.vue` 使用这些坐标，通过 CSS Grid 摆放格子：

```vue
gridColumn: cell.col + 1
gridRow: cell.row + 1
```

所以修改 `words` 列表，尤其是调整单词顺序，可能会改变最终棋盘布局。
