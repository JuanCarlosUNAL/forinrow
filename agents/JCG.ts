// tsc --target ES6 --esModuleIterop
import AgentBase, { Players } from './AgentBase.js'

type Board = Array<string[]>
type Score = [number, number, string];

interface MinimaxNode {
  id: string,
  deep: number,
  freeCells: number[],
  player: number,
  board: Board,
  columnMoved: number,
  children?: string[],
  score?: number,
  nextNode?: string,
}

const log = console.log
const MAX_VALUE = Number.MAX_SAFE_INTEGER
const MIN_VALUE = Number.MIN_SAFE_INTEGER

String.prototype.replaceAt = function (index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

class MinimaxTree {
  #tree: Record<string, MinimaxNode> = {}
  #rows: number
  #cols: number
  #currentNode: string
  #bornNodes: number;

  constructor(rows: number, cols: number) {
    this.#rows = rows;
    this.#cols = cols;

    const firstNode = this.#generateInitialNode()
    this.#currentNode = firstNode.id
    this.#tree[firstNode.id] = firstNode
  }
  
  /**
   * Explores the tree until the deep in param
   * @param maxDeep: max deep to explore
   * @returns Amount of new nodes in the last execution
   */
  execute = (maxDeep: number = 2): number => {
    this.#bornNodes = 0;
    const { deep } = this.#tree[this.#currentNode]
    const correctedDeep = maxDeep + deep
    this.#dfs(this.#currentNode, correctedDeep)
    return this.#bornNodes
  }

  /**
   * Set the new current state of the minimaxtree
   * 
   * @param col next colum to put the piece
   */
  moveInColumn = (col: number): string => {
    const currentNode = this.#tree[this.#currentNode];
    const row = currentNode.freeCells[col];
    const piece = currentNode.player == Players.ONE ? 'O' : 'X';
    this.#currentNode = currentNode.id.replaceAt(row * this.#cols + col, piece);

    return this.#currentNode
  }

  /**
   * @returns next column to move
   */
  getNextMove = (): number => {
    const currentNode = this.#tree[this.#currentNode];
    const { nextNode } = currentNode;
    this.#printBoard(nextNode)
    const { columnMoved } = this.#tree[nextNode]
    return columnMoved
  }

  #printBoard = (id: string): void => {
    if (!this.#tree[id]) return
    const { board } = this.#tree[id];
    const boardFormated = board.map(line => line.join("")).join("\n")
    log(Array(this.#cols+3).join("-"))
    log(boardFormated);
    log(Array(this.#cols+3).join("-"))
  }

  #dfs = (id: string, maxDeep: number): Score => {
    const currentNode = this.#tree[id];
    const { deep, score, player } = currentNode;

    if (deep >= maxDeep || score >= 4)
      return player === Players.ONE
        ? [score, deep, id]
        : [-score, deep, id];
    
    let scoreData: Score = player === Players.ONE
      ? [MIN_VALUE, MAX_VALUE, 'Nan']
      : [MAX_VALUE, MAX_VALUE, 'Nan']
    const children = this.#getChildren(id);
    for(const childId of children) {
      const childScore = this.#dfs(childId, maxDeep)
      scoreData = player === Players.ONE
        ? this.#maximizeScore(scoreData, childScore)
        : this.#minimizeScore(scoreData, childScore)
        
    }

    const [bestScore, bestDeep, childId] = scoreData;
    currentNode.nextNode = childId;
    return [bestScore, bestDeep, id]
  }

  #maximizeScore = (currentData: Score, childData: Score): Score => {
    const [currentScore, currentDeep] = currentData;
    const [childScore, childDeep] = childData;

    if(currentScore < childScore) return childData;
    if(currentScore > childScore) return currentData;
    if(currentDeep > childDeep) return childData;
    return currentData
  }

  #minimizeScore = (currentData: Score, childData: Score): Score => {
    const [currentScore, currentDeep] = currentData;
    const [childScore, childDeep] = childData;

    if(currentScore > childScore) return childData;
    if(currentScore < childScore) return currentData;
    if(currentDeep > childDeep) return childData;
    return currentData
  }

  #generateInitialNode = (): MinimaxNode => {
    const id = Array(this.#cols * this.#rows + 1).join('-');
    const freeCells = []
    for (let i = 0; i < this.#cols; i++) {
      freeCells.push(this.#rows - 1)
    }

    return {
      id,
      deep: 0,
      freeCells,
      player: Players.TWO,
      board: this.#boardFromId(id),
      score: 0,
      columnMoved: -1,
    }
  }

  #boardFromId = (id: string): Board => {
    const ans = []
    for (let i = 0; i < this.#rows; i++) {
      ans.push([])
      for (let j = 0; j < this.#cols; j++) {
        ans[i].push(id[i * this.#cols + j])
      }
    }

    return ans
  }

  #getChildren = (id: string): string[] => {
    const currentNode = this.#tree[id]
    if (currentNode.children) return currentNode.children;

    currentNode.children = []
    for (let col = 0; col < this.#cols; col++) {
      const row = currentNode.freeCells[col]
      if (row < 0) continue;
      
      const piece = currentNode.player == Players.ONE ? 'O' : 'X';
      const childId = currentNode.id.replaceAt(row * this.#cols + col, piece);
      const nodeAlreadyCreated = childId in this.#tree
      if(!nodeAlreadyCreated) {
        this.#bornNodes++;
        const freeCells = currentNode.freeCells.slice();
        freeCells[col] -= 1;
        const player = currentNode.player == Players.ONE ? Players.TWO : Players.ONE;
        const board = this.#boardFromId(childId);
        const deep = currentNode.deep + 1;
        const moveScore = this.#getMoveScore(board, col, row,)
        const score = Math.abs(moveScore) > Math.abs(currentNode.score)
          ? moveScore
          : currentNode.score
        
        this.#tree[childId] = { 
          id: childId, 
          columnMoved: col, 
          board, 
          freeCells, 
          player, 
          deep,
          score
        };
      }

      currentNode.children.push(childId);
    }
    return currentNode.children
  }

  #getMoveScore = (board: Board, col: number, row: number) => {
    const directions: [number, number][] = [
      [1, 1],
      [1, 0],
      [0, 1],
      [-1, 1],
    ];
    let maxScore = 0;
    for (const direction of directions) {
      const score = this.#testDirection(board, col, row, ...direction);
      maxScore = score > maxScore ? score : maxScore;
    }

    return maxScore;
  }

  #testDirection = (board: Board, col: number, row: number, a: number, b: number) => {
    const pieceColor = board[row][col];
    if (pieceColor === '-')
      log("error:", col, row, board, board[col])
    
    let conunterDirectionA = 0
    let conunterDirectionB = 0
    
    // positive direction
    let i = row + a;
    let j = col + b;
    while (this.#isInLimits(i,j) && board[i][j] === pieceColor) {
      conunterDirectionA++;
      i+= a;
      j+= b;
    }
    
    // nagative direction
    i = row - a;
    j = col - b;
    while (this.#isInLimits(i,j) && board[i][j] === pieceColor) {
      conunterDirectionB++;
      i-= a;
      j-= b;
    }
    return 1 + conunterDirectionA + conunterDirectionB;
  }

  #isInLimits = (i: number, j: number): boolean => i < this.#rows && j < this.#cols && i >= 0 && j >= 0
}

class JCG extends AgentBase {
  #movements = 0;
  #minimaxTree: MinimaxTree = null;

  setup() {
    this.#minimaxTree = new MinimaxTree(this.rows, this.cols)
  }

  move(lastMove: number): number {
    const exploredNodes = this.#minimaxTree.execute(7);

    if (this.player === Players.ONE && !this.#movements) {
      this.#movements++;
      log("explored Nodes:", exploredNodes)
      const nextMove = Math.floor(Math.random() * this.cols)
      this.#minimaxTree.moveInColumn(nextMove)
      
      return nextMove;
    }
    this.#minimaxTree.moveInColumn(lastMove)
    
    this.#movements++;
    const nextColumn = this.#minimaxTree.getNextMove()
    this.#minimaxTree.moveInColumn(nextColumn)
    return nextColumn
  }
}

log("Juan carlos")
new JCG()
