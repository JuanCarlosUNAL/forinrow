import AgentBase from './AgentBase.js'

class RandomAgent extends AgentBase {
  setup() {
    console.log(`
      I'm the player: ${this.player}
      board has dimentions: ${this.cols} cols with ${this.rows} rows
    `)
  }

  move(lastMove) {
    console.log(`Oponent moved on: ${lastMove}`)
    const nextColumn = Math.floor(Math.random() * this.cols);
    return nextColumn
    // return new Promise((resolve) => {
    //   setTimeout(() => resolve(nextColumn), Math.floor(Math.random() * 2000))
    // });
  }
}

new RandomAgent()
