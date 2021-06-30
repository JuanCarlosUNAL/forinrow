
export const Players = {
  ONE: 1,
  TWO: 2,
};

export default class RandomAgent {
  constructor() {
    onmessage = this.#onMessage.bind(this);
  }

  #setConfig(player, cols, rows) {
    this.player = player;
    this.cols = cols;
    this.rows = rows;
  }

  async #onMessage({ data }) {
    const [type, ...payload] = data;
    switch (type) {
      case 'config':
        this.#setConfig(...payload);
        this.setup();
        if (this.player !== Players.ONE) break;
      case 'move':
        const nextColumn = await this.move(...payload);
        if (!Number.isInteger(nextColumn)) throw new Error(`invalid movement, player: ${this.player} got ${nextColumn}`)
        postMessage([nextColumn]);
        break;
    }
  }
}