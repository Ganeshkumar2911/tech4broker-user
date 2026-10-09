export const instruments = [

  {
    symbol: 'XAUUSD',
    name: 'Gold Spot / US Dollar',
    category: 'Major',
    bid: 2381.92,
    ask: 2382.04,
    decimals: 2,
    spread: '0.120',
    isFavorite: true,
    bidDirection: 'up',   // initial styling matching mockup
    askDirection: 'down' // initial styling matching mockup
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'Crypto',
    bid: 81922.99,
    ask: 81945.99,
    decimals: 2,
    spread: '23',
    isFavorite: false,
    bidDirection: 'up',   // initial styling matching mockup
    askDirection: 'down' // initial styling matching mockup
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'Major',
    bid: 1.08192,
    ask: 1.08215,
    decimals: 5,
    spread: '23', // 2.3 pips
    isFavorite: false,
    bidDirection: 'up',
    askDirection: 'down'
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    category: 'Crypto',
    bid: 3412.50,
    ask: 3413.25,
    decimals: 2,
    spread: '0.75',
    isFavorite: false,
    bidDirection: null,
    askDirection: null
  }
]