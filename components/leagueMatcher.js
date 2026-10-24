// Intelligent league matcher for football fixtures
// Cross-references tournament names, titles, and team rosters against top football competitions

export const LEAGUE_KEYWORDS = {
  'Premier League': [
    'premier league', 'epl', 'english premier', 'premier',
    'arsenal', 'chelsea', 'liverpool', 'manchester city', 'man city',
    'manchester united', 'man utd', 'tottenham', 'spurs',
    'newcastle', 'aston villa', 'west ham', 'brighton', 'everton',
    'fulham', 'brentford', 'crystal palace', 'wolves', 'wolverhampton',
    'bournemouth', 'nottingham forest', 'forest', 'leicester', 'ipswich', 'southampton'
  ],
  'Champions League': [
    'champions league', "champion's league", "champion’s league", 'uefa champions league', 'ucl', 'uefa champions', 'champions',
    'real madrid', 'barcelona', 'manchester city', 'bayern munich', 'bayern',
    'paris saint-germain', 'psg', 'inter milan', 'inter', 'arsenal',
    'bayer leverkusen', 'leverkusen', 'atletico madrid', 'atletico', 'atalanta',
    'juventus', 'benfica', 'sporting cp', 'sporting', 'porto', 'monaco',
    'aston villa', 'celtic', 'feyenoord', 'shakhtar', 'bologna', 'stuttgart',
    'leipzig', 'borussia dortmund', 'dortmund', 'galatasaray', 'lille', 'como'
  ],
  'La Liga': [
    'la liga', 'laliga', 'primera division', 'spanish',
    'real madrid', 'barcelona', 'atletico madrid', 'atletico', 'valencia',
    'sevilla', 'real betis', 'betis', 'athletic bilbao', 'bilbao',
    'real sociedad', 'sociedad', 'villarreal', 'girona', 'celta vigo', 'celta',
    'mallorca', 'osasuna', 'getafe', 'rayo vallecano', 'rayo', 'espanyol',
    'alaves', 'las palmas', 'leganes', 'valladolid', 'racing de santander', 'racing'
  ],
  'Serie A': [
    'serie a', 'seriea', 'calcio', 'italian',
    'inter', 'inter milan', 'milan', 'ac milan', 'juventus', 'napoli',
    'roma', 'as roma', 'lazio', 'atalanta', 'fiorentina', 'torino',
    'bologna', 'como', 'cagliari', 'genoa', 'parma', 'udinese',
    'verona', 'hellas verona', 'empoli', 'lecce', 'monza', 'venezia'
  ],
  'Bundesliga': [
    'bundesliga', 'german',
    'bayern munich', 'bayern', 'borussia dortmund', 'dortmund',
    'bayer leverkusen', 'leverkusen', 'rb leipzig', 'leipzig',
    'vfb stuttgart', 'stuttgart', 'eintracht frankfurt', 'frankfurt',
    'wolfsburg', 'freiburg', 'borussia monchengladbach', 'gladbach',
    'union berlin', 'mainz', 'hoffenheim', 'werder bremen', 'bremen',
    'augsburg', 'heidenheim', 'st. pauli', 'bochum', 'holstein kiel'
  ],
  'Ligue 1': [
    'ligue 1', 'ligue1', 'french',
    'paris saint-germain', 'paris sg', 'psg', 'marseille', 'om', 'olympique marseille',
    'lyon', 'ol', 'olympique lyonnais', 'monaco', 'lille', 'rennes', 'lens',
    'nice', 'strasbourg', 'toulouse', 'reims', 'brest', 'nantes',
    'auxerre', 'montpellier', 'le havre', 'saint-etienne', 'troyes', 'angers'
  ]
};

export const COMPETITIONS_LIST = [
  { id: 'Premier League', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', color: 'from-purple-600 to-indigo-800' },
  { id: 'Champions League', name: 'Champions League', flag: '🇪🇺', country: 'Europe', color: 'from-blue-700 to-indigo-950' },
  { id: 'La Liga', name: 'La Liga', flag: '🇪🇸', country: 'Spain', color: 'from-orange-500 to-red-700' },
  { id: 'Serie A', name: 'Serie A', flag: '🇮🇹', country: 'Italy', color: 'from-cyan-600 to-blue-800' },
  { id: 'Bundesliga', name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', color: 'from-red-600 to-amber-700' },
  { id: 'Ligue 1', name: 'Ligue 1', flag: '🇫🇷', country: 'France', color: 'from-emerald-600 to-teal-800' },
];

export const POPULAR_TEAMS = [
  'Real Madrid', 'Arsenal', 'Barcelona', 'Manchester City',
  'Liverpool', 'Bayern Munich', 'PSG', 'Juventus', 'Inter Milan',
  'Chelsea', 'Borussia Dortmund', 'Atletico Madrid', 'AC Milan'
];

export function matchBelongsToLeague(match, leagueName) {
  if (!leagueName || leagueName === 'All') return true;
  const keywords = LEAGUE_KEYWORDS[leagueName];
  if (!keywords) {
    const q = leagueName.toLowerCase();
    return (
      (match.tournament || '').toLowerCase().includes(q) ||
      (match.title || '').toLowerCase().includes(q)
    );
  }

  const textToSearch = [
    match.tournament || '',
    match.title || '',
    match.homeTeam?.name || '',
    match.awayTeam?.name || '',
    match.sport || '',
  ].join(' ').toLowerCase();

  return keywords.some((k) => textToSearch.includes(k));
}
