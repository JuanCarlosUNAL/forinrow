import AgentBase from './AgentBase.js'

class RandomAgent extends AgentBase {
  setup() {
    console.log('Start Agent');
  }
  move(lastMoveColumn) {
    let nextColumn = Math.floor(Math.random() * this.cols);
    return nextColumn;
  }
}

new RandomAgent()
