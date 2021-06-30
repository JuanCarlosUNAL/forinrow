const PADDING_RATE = 0.1;
export const Players = {
  ONE: 1,
  TWO: 2,
};

export default class Board {
  #circleDiameter;
  #padding;
  #boardWidth;
  #boardHeight;
  #stage;
  #layer;
  #board;
  #nextFree

  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.#initMeasures(50);
    this.#initKonva();
    this.#initBoard()
  }

  #initMeasures(pieceSize) {
    this.#circleDiameter = pieceSize;
    this.#padding = pieceSize * PADDING_RATE;
    this.#boardWidth = pieceSize * this.cols + this.#padding * (this.cols + 1);
    this.#boardHeight = pieceSize * this.rows + this.#padding * (this.rows + 1);
  }

  #initKonva() {
    this.#stage = new Konva.Stage({
      container: 'board',
      width: this.#boardWidth,
      height: this.#boardHeight,
    });
    this.#layer = new Konva.Layer();
    this.#stage.add(this.#layer);

    this.#drawBoardBase()
    for (var i=0; i < this.cols; i++) {
      for (var j=0; j < this.rows; j++) {
        this.#drawCircleInBoardPosition(i, j, 'white', 'brown');
      }
    }
    this.#layer.draw();
  }

  #drawBoardBase() {
    var boardSquare = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.#boardWidth,
      height: this.#boardHeight,
      fill: 'green',
      stroke: 'brown',
    })
    this.#layer.add(boardSquare);
  }

  #drawCircleInBoardPosition(i, j, color, strokeColor='black') {
    var x = this.#circleDiameter * i + this.#circleDiameter/2 + this.#padding * (i+1);
    var y = this.#circleDiameter * j + this.#circleDiameter/2 + this.#padding * (j+1);
    var circle = new Konva.Circle({
      x, y,
      radius: this.#circleDiameter / 2,
      fill: color,
      stroke: strokeColor,
      strokeWidth: 3,
    });
    this.#layer.add(circle);
  }

  #initBoard() {
    this.#board = new Array(this.cols);
    this.#nextFree = new Array(this.rows);
    for (var i = 0; i < this.cols; i++) {
      this.#board[i] = new Array(this.rows);
      this.#nextFree[i] = this.rows-1;
    }
  }

  #updateBoardState(player, col, row) {
    this.#board[col][row] = player;
    this.#nextFree[col] = row - 1
  }

  #drawBoardState(player, col, row) {
    const color = player === Players.ONE ? 'blue' : 'red';
    this.#drawCircleInBoardPosition(col, row, color);

    this.#layer.draw();
  }

  #isInLimits(i, j) {
    return i < this.cols && j < this.rows && i >= 0 && j >= 0;
  }

  #testDirection(col, row, a, b) {
    const pieceColor = this.#board[col][row];
    
    var conunterDirectionA = 0
    var conunterDirectionB = 0
    
    // positive direction
    var i = col + a;
    var j = row + b;
    while (this.#isInLimits(i,j) && this.#board[i][j] === pieceColor) {
      conunterDirectionA++;
      i+= a;
      j+= b;
    }
    
    // nagative direction
    var i = col - a;
    var j = row - b;
    while (this.#isInLimits(i,j) && this.#board[i][j] === pieceColor) {
      conunterDirectionB++;
      i-= a;
      j-= b;
    }
    return 1 + conunterDirectionA + conunterDirectionB;
  }

  #hasWon(col, row) {
    const directions = [
      [1, 1],
      [1, 0],
      [0, 1],
      [-1, 1],
    ];
    var maxScore = 0;
    for (const direction of directions) {
      const [a, b] = direction;
      const score = this.#testDirection(col, row, a, b);
      maxScore = score > maxScore ? score : maxScore;
    }

    return maxScore;
  }

  putPieceInColumn(player, col) {
    if ( !Object.values(Players).includes(player) ) 
      throw new Error(`${player} is not a valid player. Please use Players constant.`);
    if ( col < 0 || col >= this.cols ) 
      throw new Error(`Invalid col ${col}. use a value between 0 and ${this.cols}.`);
      
    const row = this.#nextFree[col];
    if (row < 0)
      throw new Error(`Invalid col ${col}. that colum is already full`);

    this.#updateBoardState(player, col, row);
    this.#drawBoardState(player, col, row);
    
    return this.#hasWon(col, row);
  };
}
