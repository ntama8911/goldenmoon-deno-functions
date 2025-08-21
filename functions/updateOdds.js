const SUPABASE_URL = Deno.env.get("SUPABASE_URL"); 
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_ROLE");
const API_KEY = Deno.env.get("ODDS_API");

const SPORTS = [
  'soccer_uefa_european_championship',
  'soccer_epl', // Английская премьер-лига 
  'soccer_spain_la_liga', // Ла Лига
  'soccer_germany_bundesliga', // Бундеслига
  'icehockey_nhl', // NHL
  'mma_mixed_martial_arts' // MMA
];
const MARKETS = 'h2h,spreads,totals';
const REGIONS = 'us';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function supabaseRequest(path, method, body) {
  method = method || 'GET';
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  if (method === 'POST') {
    headers['Prefer'] = 'return=representation';
  }

  const options = {
    method: method,
    headers: headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase ${method} error: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Необходимые секреты не установлены (ODDS_API, SUPABASE_URL, SERVICE_ROLE)");
    }
    
    let allEventsData = [];
    
    for (const sport of SPORTS) {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${REGIONS}&markets=${MARKETS}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Ошибка API для ${sport}: ${await response.text()}`);
        continue;
      }

      const data = await response.json();
      allEventsData = allEventsData.concat(data);
    }
    
    if (allEventsData.length === 0) {
      return new Response(JSON.stringify({ message: 'Событий для обновления не найдено.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventsToInsert = allEventsData.map(event => {
      let bestH2H = null, bestSpreads = null, bestTotals = null;
      for (const bookmaker of event.bookmakers) {
        if (bookmaker.markets) {
          for (const market of bookmaker.markets) {
            if (market.key === 'h2h' && !bestH2H) bestH2H = market;
            if (market.key === 'spreads' && !bestSpreads) bestSpreads = market;
            if (market.key === 'totals' && !bestTotals) bestTotals = market;
          }
        }
      }

      let homeOutcome = null, awayOutcome = null, drawOutcome = null;
      if (bestH2H && bestH2H.outcomes) {
        homeOutcome = bestH2H.outcomes.find(o => o.name === event.home_team);
        awayOutcome = bestH2H.outcomes.find(o => o.name === event.away_team);
        drawOutcome = bestH2H.outcomes.find(o => o.name === 'Draw');
      }
      
      let homeSpread = null, awaySpread = null;
      if (bestSpreads && bestSpreads.outcomes) {
        homeSpread = bestSpreads.outcomes.find(o => o.name === event.home_team);
        awaySpread = bestSpreads.outcomes.find(o => o.name === event.away_team);
      }
      
      let overTotal = null, underTotal = null;
      if (bestTotals && bestTotals.outcomes) {
        overTotal = bestTotals.outcomes.find(o => o.name === 'Over');
        underTotal = bestTotals.outcomes.find(o => o.name === 'Under');
      }

      return {
        id: event.id,
        sport: event.sport_title,
        league: event.sport_key,
        home_team: event.home_team,
        away_team: event.away_team,
        commence_time: event.commence_time,
        status: 'scheduled',
        home_odds: homeOutcome ? homeOutcome.price : null,
        away_odds: awayOutcome ? awayOutcome.price : null,
        draw_odds: drawOutcome ? drawOutcome.price : null,
        spreads_home_odds: homeSpread ? homeSpread.price : null,
        spreads_away_odds: awaySpread ? awaySpread.price : null,
        spreads_home_point: homeSpread ? homeSpread.point : null,
        spreads_away_point: awaySpread ? awaySpread.point : null,
        totals_over_odds: overTotal ? overTotal.price : null,
        totals_under_odds: underTotal ? underTotal.price : null,
        totals_point: overTotal ? overTotal.point : null,
      };
    }).filter(e => e.home_odds && e.away_odds);

    await supabaseRequest('/events?status=eq.scheduled', 'DELETE');
    await supabaseRequest('/events', 'POST', eventsToInsert);

    const message = `✅ Успешно обновлено ${eventsToInsert.length} событий.`;
    
    return new Response(JSON.stringify({ message: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
