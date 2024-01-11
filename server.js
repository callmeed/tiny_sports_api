const express = require('express');
const app = express();
const axios = require('axios');
const port = 3000;

const NBA_API_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'
const CACHE_DURATION = 5 * 60 * 1000; // 15 minutes in milliseconds

let cache = {
  data: null,
  lastFetch: 0
};

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/nba', async (req, res) => {
  try {
    const currentTime = Date.now();
    const isCacheValid = (currentTime - cache.lastFetch) < CACHE_DURATION;
    if (isCacheValid && cache.data) {
      res.setHeader('X-Cache-Hit', 'true');
      return res.json(cache.data); // Return cached data if valid
    }
    const apiResponse = await axios.get(NBA_API_URL);
    const modifiedData = transformNbaData(apiResponse.data);
    // Update cache
    cache = {
      data: modifiedData,
      lastFetch: Date.now()
    };
    res.setHeader('X-Cache-Hit', 'false');
    res.json(modifiedData);
  } catch (error) {
    console.error("Error occurred in /nba endpoint:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

const transformNbaData = (data) => {
  // Your complex data manipulation logic goes here
  // For example:
  const result = [];
  data['events'].forEach(event => {
    const game = event.shortName;
    const gameTime = event.status.type.shortDetail.split(" - ");
    const gameMsg = gameTime.length > 1 ? gameTime[1] : gameTime[0];
    const team1 = event.competitions[0].competitors[0].team.abbreviation;
    const team2 = event.competitions[0].competitors[1].team.abbreviation;
    const score1 = event.competitions[0].competitors[0].score;
    const score2 = event.competitions[0].competitors[1].score;
  
    const status = event.competitions[0].status;
    let info = '';
    if (status.type.name === 'STATUS_FINAL') {
      info = 'F';
    } else if (status.type.name === 'STATUS_SCHEDULED') {
      info = 'PRE';
    } else {
      info = `Q${status.period}`;
    }
  
    result.push({
      game,
      time: gameMsg,
      teams: [
        { name: team1, score: score1 },
        { name: team2, score: score2 }
      ],
      status: info
    });

  });
  return result;
};


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});