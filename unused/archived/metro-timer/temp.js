class Cards{
  constructor(){
    // this.cards = [];
    this.reset();
    this.shuffle();
  }

  reset(){
    this.cards = [];

    const suits = ['Hearts', 'Spades', 'Clubs', 'Diamonds'];
    const values = ['Ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'Jack', 'Queen', 'King'];

    for (let suit in suits) {
      for (let value in values) {
        this.cards.push(`${values[value]} of ${suits[suit]}`);
      }
    }
  }

  shuffle(){
    const { cards } = this;
    let m = cards.length, i;

    while(m){
      i = Math.floor(Math.random() * m--);
      [cards[m], cards[i]] = [cards[i], cards[m]];
    }

    return this;
  }

  deal(){
    return this.cards.pop();
  }
}
