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
    'montpellier', 'auxerre', 'angers', 'saint-etienne', 'le havre'
  ],
  'MLS': [
    'mls', 'major league soccer', 'inter miami', 'miami', 'la galaxy', 'lafc',
    'los angeles fc', 'columbus crew', 'seattle sounders', 'atlanta united',
    'new york red bulls', 'ny red bulls', 'new york city', 'nycfc', 'philadelphia union',
    'fc cincinnati', 'orlando city', 'nashville sc', 'portland timbers', 'houston dynamo',
    'austin fc', 'chicago fire', 'toronto fc', 'vancouver whitecaps', 'montreal',
    'sporting kansas city', 'real salt lake', 'minnesota united', 'san jose earthquakes',
    'colorado rapids', 'd.c. united', 'new england revolution', 'st. louis city', 'charlotte fc'
  ],
  'Eredivisie': [
    'eredivisie', 'dutch', 'ajax', 'psv', 'psv eindhoven', 'feyenoord', 'az alkmaar', 'az',
    'fc twente', 'twente', 'fc utrecht', 'utrecht', 'heerenveen', 'vitesse', 'nec nijmegen',
    'sparta rotterdam', 'go ahead eagles', 'fortuna sittard', 'pec zwolle', 'almere city',
    'heracles', 'nac breda', 'willem ii', 'rkc waalwijk', 'groningen'
  ],
  'Europa League': [
    'europa league', 'uel', 'uefa europa', 'manchester united', 'tottenham',
    'roma', 'lazio', 'porto', 'athletic bilbao', 'real sociedad', 'ajax',
    'galatasaray', 'fenerbahce', 'eintracht frankfurt', 'lyon', 'nice', 'olympiacos'
  ],
  'Brasileiro': [
    'brasileiro', 'brasileirao', 'serie a brazil', 'flamengo', 'palmeiras',
    'botafogo', 'sao paulo', 'corinthians', 'fluminense', 'gremio', 'internacional',
    'atletico mineiro', 'cruzeiro', 'vasco da gama', 'bahia', 'fortaleza', 'santos'
  ],
  'SAF Primera': [
    'argentina', 'primera division argentina', 'liga profesional', 'boca juniors',
    'boca', 'river plate', 'river', 'racing club', 'independiente', 'san lorenzo',
    'velez sarsfield', 'estudiantes', 'rosario central', 'newells old boys'
  ],
  'World Cup 2026': [
    'world cup', 'fifa world cup', 'world cup qualifiers', 'conmebol qualifiers',
    'uefa qualifiers', 'concacaf qualifiers', 'afc qualifiers', 'caf qualifiers',
    'brazil', 'argentina', 'france', 'england', 'germany', 'spain', 'italy',
    'portugal', 'netherlands', 'usa', 'mexico', 'canada', 'japan', 'morocco', 'colombia'
  ],
  'Nations League': [
    'nations league', 'uefa nations league', 'croatia', 'poland', 'portugal',
    'scotland', 'italy', 'belgium', 'france', 'israel', 'germany', 'bosnia',
    'hungary', 'netherlands', 'spain', 'serbia', 'switzerland', 'denmark'
  ],
  'Copa America': [
    'copa america', 'conmebol', 'argentina', 'colombia', 'uruguay', 'canada',
    'brazil', 'venezuela', 'panama', 'ecuador', 'chile', 'peru', 'mexico', 'usa'
  ],
  'Asian Cup': [
    'asian cup', 'afc asian cup', 'qatar', 'jordan', 'iran', 'south korea',
    'australia', 'japan', 'uzbekistan', 'saudi arabia', 'iraq', 'tajikistan'
  ],
  'International Friendlies': [
    'friendly', 'friendlies', 'international friendly', 'club friendly'
  ],
};

export const COMPETITIONS_LIST = [
  { id: 'Premier League', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'England', color: 'from-purple-600 to-indigo-800' },
  { id: 'Champions League', name: 'Champions League', flag: '🇪🇺', country: 'Europe', color: 'from-blue-700 to-indigo-950' },
  { id: 'La Liga', name: 'La Liga', flag: '🇪🇸', country: 'Spain', color: 'from-orange-500 to-red-700' },
  { id: 'Serie A', name: 'Serie A', flag: '🇮🇹', country: 'Italy', color: 'from-cyan-600 to-blue-800' },
  { id: 'Bundesliga', name: 'Bundesliga', flag: '🇩🇪', country: 'Germany', color: 'from-red-600 to-amber-700' },
  { id: 'Ligue 1', name: 'Ligue 1', flag: '🇫🇷', country: 'France', color: 'from-emerald-600 to-teal-800' },
  { id: 'MLS', name: 'Major League Soccer', flag: '🇺🇸', country: 'USA', color: 'from-blue-600 to-red-700' },
  { id: 'Eredivisie', name: 'Eredivisie', flag: '🇳🇱', country: 'Netherlands', color: 'from-orange-600 to-amber-700' },
];

export const POPULAR_TEAMS = [
  'Real Madrid', 'Arsenal', 'Barcelona', 'Manchester City',
  'Liverpool', 'Bayern Munich', 'PSG', 'Juventus', 'Inter Milan',
  'Chelsea', 'Borussia Dortmund', 'Atletico Madrid', 'AC Milan'
];

export function normalizeSport(sport) {
  if (!sport) return 'football';
  const s = String(sport).toLowerCase().replace(/[\s-_]+/g, '');
  if (s === 'basketball' || s === 'nba') return 'basketball';
  if (s === 'hockey' || s === 'icehockey' || s === 'nhl') return 'hockey';
  if (s === 'tennis' || s === 'atp' || s === 'wta') return 'tennis';
  if (s === 'wrestling' || s === 'prowrestling') return 'wrestling';
  if (s === 'football' || s === 'soccer') return 'football';
  return s;
}

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
