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

// Утилиты для красивых логов
const log = {
  header: (text) => console.log(`\n🔥 ========== ${text} ==========`),
  success: (text) => console.log(`✅ ${text}`),
  info: (text) => console.log(`ℹ️  ${text}`),
  warning: (text) => console.log(`⚠️  ${text}`),
  error: (text) => console.log(`❌ ${text}`),
  debug: (text) => console.log(`🔍 ${text}`),
  separator: () => console.log(`${'─'.repeat(50)}`),
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Необходимые секреты не установлены (ODDS_API, SUPABASE_URL, SERVICE_ROLE)");
    }
    
    log.header('ОБНОВЛЕНИЕ КОЭФФИЦИЕНТОВ');
    log.info(`Запрашиваем данные из ${SPORTS.length} источников`);
    log.info(`Рынки: ${MARKETS}`);

    let allEventsData = [];
    const sportStats = {};

    log.separator();

    for (const sport of SPORTS) {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${REGIONS}&markets=${MARKETS}`;
      log.info(`🏈 Запрашиваем: ${sport}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        log.error(`Ошибка API для ${sport}: ${errorText}`);
        sportStats[sport] = { count: 0, error: errorText };
        continue;
      }

      const data = await response.json();
      sportStats[sport] = { count: data.length, error: null };
      log.success(`Получено ${data.length} событий для ${sport}`);
      allEventsData = allEventsData.concat(data);
    }
    
    log.separator();
    log.header('СТАТИСТИКА ЗАГРУЗКИ');
    Object.entries(sportStats).forEach(([sport, stats]) => {
      if (stats.error) {
        log.error(`${sport}: ОШИБКА - ${stats.error}`);
      } else {
        log.success(`${sport}: ${stats.count} событий`);
      }
    });

    if (allEventsData.length === 0) {
      log.warning('Нет событий для обновления');
      return new Response(JSON.stringify({ message: 'Событий для обновления не найдено.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log.info(`📊 ВСЕГО ПОЛУЧЕНО: ${allEventsData.length} событий`);

    log.separator();
    log.header('АНАЛИЗ РЫНКОВ');

    const marketAnalysis = {
      withH2H: 0,
      withSpreads: 0,
      withTotals: 0,
      football: { total: 0, withSpreads: 0, withTotals: 0 },
      hockey: { total: 0, withSpreads: 0, withTotals: 0 }
    };

    const eventsToInsert = allEventsData.map(event => {
      let bestH2H = null;
      let bestSpreads = null;
      let bestTotals = null;

      for (const bookmaker of event.bookmakers) {
        if (bookmaker.markets) {
          for (const market of bookmaker.markets) {
            if (market.key === 'h2h' && !bestH2H) {
              bestH2H = market;
            }
            if (market.key === 'spreads' && !bestSpreads) {
              bestSpreads = market;
            }
            if (market.key === 'totals' && !bestTotals) {
              bestTotals = market;
            }
          }
        }
      }

      if (bestH2H) marketAnalysis.withH2H++;
      if (bestSpreads) marketAnalysis.withSpreads++;
      if (bestTotals) marketAnalysis.withTotals++;

      if (event.sport_key.includes('soccer')) {
        marketAnalysis.football.total++;
        if (bestSpreads) marketAnalysis.football.withSpreads++;
        if (bestTotals) marketAnalysis.football.withTotals++;
      }

      if (event.sport_key.includes('icehockey')) {
        marketAnalysis.hockey.total++;
        if (bestSpreads) marketAnalysis.hockey.withSpreads++;
        if (bestTotals) marketAnalysis.hockey.withTotals++;
      }

      let homeOutcome = null;
      let awayOutcome = null;
      let drawOutcome = null;
      
      if (bestH2H && bestH2H.outcomes) {
        homeOutcome = bestH2H.outcomes.find(o => o.name === event.home_team);
        awayOutcome = bestH2H.outcomes.find(o => o.name === event.away_team);
        drawOutcome = bestH2H.outcomes.find(o => o.name === 'Draw');
      }
      
      let homeSpread = null;
      let awaySpread = null;
      
      if (bestSpreads && bestSpreads.outcomes) {
        homeSpread = bestSpreads.outcomes.find(o => o.name === event.home_team);
        awaySpread = bestSpreads.outcomes.find(o => o.name === event.away_team);
      }
      
      let overTotal = null;
      let underTotal = null;
      
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

    log.separator();
    log.header('АНАЛИТИКА РЫНКОВ');
    log.info(`📈 События с H2H: ${marketAnalysis.withH2H}/${allEventsData.length}`);
    log.info(`📊 События с Форами: ${marketAnalysis.withSpreads}/${allEventsData.length}`);
    log.info(`📉 События с Тоталами: ${marketAnalysis.withTotals}/${allEventsData.length}`);
    
    log.separator();
    log.info(`⚽ ФУТБОЛ: ${marketAnalysis.football.total} событий`);
    log.info(`   └─ с Форами: ${marketAnalysis.football.withSpreads}/${marketAnalysis.football.total}`);
    log.info(`   └─ с Тоталами: ${marketAnalysis.football.withTotals}/${marketAnalysis.football.total}`);
    
    log.info(`🏒 ХОККЕЙ: ${marketAnalysis.hockey.total} событий`);
    log.info(`   └─ с Форами: ${marketAnalysis.hockey.withSpreads}/${marketAnalysis.hockey.total}`);
    log.info(`   └─ с Тоталами: ${marketAnalysis.hockey.withTotals}/${marketAnalysis.hockey.total}`);

    log.separator();
    log.info(`🔄 После фильтрации: ${eventsToInsert.length} событий`);

    log.header('ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ');
    log.info('🔄 Обновляем/вставляем события (Upsert)...');
    
    const upsertUrl = `${SUPABASE_URL}/rest/v1/events?on_conflict=id`;
    const upsertHeaders = {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    };

    const upsertResponse = await fetch(upsertUrl, {
      method: 'POST',
      headers: upsertHeaders,
      body: JSON.stringify(eventsToInsert),
    });

    if (!upsertResponse.ok) {
      const errorText = await upsertResponse.text();
      throw new Error(`Supabase UPSERT error: ${upsertResponse.status} - ${errorText}`);
    }

    log.success(`Вставлено/обновлено ${eventsToInsert.length} событий`);

    const message = `✅ Успешно обновлено ${eventsToInsert.length} событий.`;
    
    log.separator();
    log.header('РЕЗУЛЬТАТ');
    log.success(message);
    log.separator();

    return new Response(JSON.stringify({ message: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    log.error('КРИТИЧЕСКАЯ ОШИБКА: ' + e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
