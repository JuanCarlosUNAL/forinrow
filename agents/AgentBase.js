
export default class RandomAgent {
  constructor() {
    onmessage = this.#onMessage.bind(this);
  }

  #setConfig(player, cols, rows) {
    this.player = player;
    this.cols = cols;
    this.rows = rows;
    if (player === 1) {
      const nextColumn = this.move();
      postMessage([nextColumn]);
    }
  }

  #onMessage({data}) {
    const [type, ...payload] = data;
    switch(type) {
      case 'config':
        this.#setConfig(...payload);
        try {
          this.setup(); 
        } catch(e) {}
        break;
      case 'move': 
        const nextColumn = this.move(...payload);
        postMessage([nextColumn]);
        break;
    }
  }
}