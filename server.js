const express = require('express');
const app = express();
const axios = require('axios');
const port = 3000;

const NBA_API_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/nba', async (req, res) => {
  try {
    const apiResponse = await axios.get(NBA_API_URL);
    const modifiedData = transformNbaData(apiResponse.data);
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
    const name = event.shortName;
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
      name,
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