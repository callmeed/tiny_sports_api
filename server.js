const express = require('express');
const app = express();
const axios = require('axios');
const date = require('date-and-time');
const port = 3000;

const NBA_API_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'
const NFL_API_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
const MLB_API_URL = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard'
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cache = {
  mlb: {
    data: null,
    lastFetch: 0
  },
  nfl: {
    data: null,
    lastFetch: 0
  },
  nba: {
    data: null,
    lastFetch: 0
  }
};

app.get('/', (req, res) => {
  payload = {
    profile: {
      name: 'Your Name',
      email: 'email@example.com'
    },
    messages: [
      'Message 1',
      'Message 2'
    ]
  }
  res.json(payload);
});

app.get('/mlb', async (req, res) => {
  try {
    const currentTime = Date.now();
    const isCacheValid = (currentTime - cache.mlb.lastFetch) < CACHE_DURATION;
    if (isCacheValid && cache.mlb.data) {
      res.setHeader('X-Cache-Hit', 'true');
      return res.json(cache.mlb.data); // Return cached data if valid
    }
    const apiResponse = await axios.get(MLB_API_URL);
    const modifiedData = transformMlbData(apiResponse.data);
    // Update cache
    cache.mlb = {
      data: modifiedData,
      lastFetch: Date.now()
    };
    res.setHeader('X-Cache-Hit', 'false');
    res.json(modifiedData);
  } catch (error) {
    console.error("Error occurred in /mlb endpoint:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

app.get('/nfl', async (req, res) => {
  try {
    const currentTime = Date.now();
    const isCacheValid = (currentTime - cache.nfl.lastFetch) < CACHE_DURATION;
    if (isCacheValid && cache.nfl.data) {
      res.setHeader('X-Cache-Hit', 'true');
      return res.json(cache.nfl.data); // Return cached data if valid
    }
    const apiResponse = await axios.get(NFL_API_URL);
    const modifiedData = transformData(apiResponse.data);
    // Update cache
    cache.nfl = {
      data: modifiedData,
      lastFetch: Date.now()
    };
    res.setHeader('X-Cache-Hit', 'false');
    res.json(modifiedData);
  } catch (error) {
    console.error("Error occurred in /nfl endpoint:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

app.get('/nba', async (req, res) => {
  try {
    const currentTime = Date.now();
    const isCacheValid = (currentTime - cache.nba.lastFetch) < CACHE_DURATION;
    if (isCacheValid && cache.nba.data) {
      res.setHeader('X-Cache-Hit', 'true');
      return res.json(cache.nba.data); // Return cached data if valid
    }
    // Today 
    const apiResponse = await axios.get(NBA_API_URL);
    const modifiedData = transformData(apiResponse.data);
    // Yesterday 
    today = new Date();
    yesterday = yesterday = date.addDays(today, -1);
    // ESPN wants format of YYYYMMDD
    yesterday_param = date.format(yesterday, 'YYYYMMDD');
    const apiResponseYesterday = await axios.get(NBA_API_URL + '?dates=' + yesterday_param);
    const modifiedDataYesterday = transformData(apiResponseYesterday.data);
    // Loop through yesterday and append to modifiedData
    modifiedDataYesterday.forEach(game => {
      modifiedData.push(game);
    });
    // Update cache
    cache.nba = {
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

const transformData = (data) => {
  return transformNflData(data);
}

const transformNbaData = (data) => {
  // Your complex data manipulation logic goes here
  // For example:
  const result = [];
  data['events'].forEach(event => {
    const game = event.shortName;
    const gameTime = event.status.type.shortDetail.split(" - ");
    const gameMsg = gameTime.length > 1 ? gameTime[1].replace(' PM', 'PM') : gameTime[0];
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

const transformMlbData = (data) => {
  // Your complex data manipulation logic goes here
  // For example:
  const result = [];
  data['events'].forEach(event => {
    const game = event.shortName;
    const gameTime = event.status.type.shortDetail.split(" - ");
    const gameMsg = gameTime.length > 1 ? gameTime[1].replace(' PM', 'PM') : gameTime[0];
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
      info = gameMsg;
    }
  
    result.push({
      game,
      time: gameMsg,
      teams: [
        { name: team1, score: score1 },
        { name: team2, score: score2 }
      ],
      status: info,
      status_short: info
    });

  });
  return result;
};

const transformNflData = (data) => {
  // Your complex data manipulation logic goes here
  // For example:
  const result = [];
  data['events'].forEach(event => {
    const game = event.shortName;
    var gameTimeLong = event.status.type.shortDetail;
    const gameTime = event.status.type.shortDetail.split(" - ");
    const gameMsg = gameTime.length > 1 ? gameTime[1].replace(' PM', 'PM') : gameTime[0];
    const team1 = event.competitions[0].competitors[0].team.abbreviation;
    const team2 = event.competitions[0].competitors[1].team.abbreviation;
    const score1 = event.competitions[0].competitors[0].score;
    const score2 = event.competitions[0].competitors[1].score;
  
    // Manipulate the status data to make smaller 
    gameTimeLong = gameTimeLong.replace(/(:00)?\s([A|P]M)/, "$2");
    gameTimeLong = gameTimeLong.replace(' - ', ' ');

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
      status: gameTimeLong,
      time: gameMsg,
      teams: [
        { name: team1, score: score1 },
        { name: team2, score: score2 }
      ],
      status_short: info
    });

  });
  return result;
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});