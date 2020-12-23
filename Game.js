import Board, { Players } from "./Board.js"

export default class Game {
  #duration;
  #endTime;
  #interval;
  #timeout;

  #agentA;
  #agentB;
  #agentSrcA;
  #agentSrcB;
  #currentPlayer;

  constructor(agentSrcA, agentSrcB) {
    this.#agentSrcA = `agents/${agentSrcA}.js`;
    this.#agentSrcB = `agents/${agentSrcB}.js`;

    this.#resetGame();
    const resetButton = document.getElementById('reset-board')
    const startButton = document.getElementById('start-game')
    resetButton.addEventListener('click', this.#resetGame.bind(this))
    startButton.addEventListener('click', this.#startGame.bind(this))
  }
  
  #resetGame() {
    const columns = +document.getElementById('columns').value;
    const rows = +document.getElementById('rows').value;
    const time = +document.getElementById('time').value;
    const turn = document.getElementById('turn');
    const buttonStart = document.getElementById('start-game')
    
    buttonStart.removeAttribute('disabled');
    turn.style.backgroundColor = 'blue';
    
    this.#finishGame()
    this.#duration = time * 60 * 1000;
    this.#displayTime(this.#duration);
    this.board = new Board(columns, rows);
    this.#currentPlayer = Players.TWO;
    
    this.#agentB?.terminate();
    this.#agentA?.terminate();
  }
  
  #displayTime(millis) {
    const totalSeconds = millis / 1000;
    const cents = Math.floor(millis / 100 % 10);
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60 % 60);
    
    const timerDisplay = document.getElementById('time-display');
    timerDisplay.innerHTML = `${minutes}: ${seconds} 0${cents}`;    
  }
  
  #finishGame(winner) {
    clearInterval(this.#interval);
    clearTimeout(this.#timeout);
    
    this.#agentB?.terminate();
    this.#agentA?.terminate();

    if (winner) console.log(winner);
  }

  #updateTimer() {
    const now = +new Date();
    const remainingTime = this.#endTime - now;

    this.#displayTime(remainingTime);
  }

  #updateTurn(colum) {
    const playerA = this.#currentPlayer === Players.ONE;
    const turn = document.getElementById('turn');

    this.#currentPlayer = playerA ? Players.TWO : Players.ONE;
    const agent = playerA ? this.#agentA : this.#agentB;
    turn.style.backgroundColor = playerA ? 'blue' : 'red';
    agent.postMessage(['move', colum]);
  }

  #play(player, colum) {
    if (player !== this.#currentPlayer) new Error('Wait your turn');

    const score = this.board.putPieceInColumn(player, colum);
    if (score >= 4) this.#finishGame(player);
    else this.#updateTurn(colum)
  }

  #initGameLoop() {
    const workerConfig = {
      type: 'module'
    }
    const commonConfig = [
      this.board.cols,
      this.board.rows,
    ];

    this.#agentA = new Worker(this.#agentSrcA, workerConfig);
    this.#agentB = new Worker(this.#agentSrcB, workerConfig);
    this.#agentA.postMessage(['config', Players.ONE, ...commonConfig]);
    this.#agentB.postMessage(['config', Players.TWO, ...commonConfig]);
    this.#agentA.onmessage = ({data}) => this.#play(Players.ONE, ...data)
    this.#agentB.onmessage = ({data}) => this.#play(Players.TWO, ...data)
  }
  
  #startGame() {
    const now = +new Date();
    this.#endTime = this.#duration + now;
    this.#timeout = setTimeout(this.#finishGame.bind(this), this.#duration);
    this.#interval = setInterval(this.#updateTimer.bind(this), 100);

    const buttonStart = document.getElementById('start-game');
    buttonStart.setAttribute('disabled', 'true');

    this.#initGameLoop()
  }
}
