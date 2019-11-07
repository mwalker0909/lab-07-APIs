'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();
const pg = require('pg');

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));


app.get('/', (request,response) => {
  response.send('Home Page!');
});

app.get('/bad', (request,response) => {
  throw new Error('poo');
});

// The callback can be a separate function. Really makes things readable
app.get('/about', aboutUsHandler);

function aboutUsHandler(request,response) {
  response.status(200).send('About Us Page');
}

// API Routes

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/events', handleEvent);

//Route Handlers
function handleLocation(request,response) {

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  superagent.get(url)
    .then( data=> {
      const geoData = data.body;
      const location = new Location(request.query.data, geoData);
      if (!isLocationInDB(location)) saveLocation(location);
      response.send(location);
      response.send(data);
    })
    .catch( error => {
      console.error(error);
      response.status(500).send('Status: 500. Sorry, there is something not quite right');
    })
}

function handleEvent(request, reponse) {
  const url = `https://www.eventbriteapi.com/v3/events/search?token=${process.env.EVENTBRITE_API_KEY}&location.address=${data.formatted_query}`;
  const data = request.query.data;
  return superagent.get('`https://www.eventbriteapi.com/v3/events/search/?location.address=bend&token=${process.env.EVENTBRITE_API_KEY}`')
    .then(result => {
      const eventInfo = result.body.events.map( eventInfo => {
        return new Events(eventInfo);
      });
      response.send(eventInfo);
    })
    .catch(error => errorMessage(error, response));
};

function handleWeather(request, response) {

  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  superagent.get(url)
    .then( data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch( ()=> {
      errorHandler('So sorry, something went really wrong', request, response);
    });

}


 // CONSTRUCTOR FUNCTION //


function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0,15);
}


function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}

//sudo code taken from classmates to validate working server dishing data back. This is due to new api's not currently validating
function Events(location) {
  let time = Date.parse(location.start.local);
  let newDate = new Date(time).toDateString();
  this.event_date = newDate;
  this.link = location.url;
  this.name = location.name.text;
  this.summary = location.summary;
}

app.use('*', notFoundHandler);
app.use(errorHandler);

function  notFoundHandler(request,response) {
  response.status(404).send('huh?');
}

function errorHandler(error,request,response) {
  response.status(500).send(error);
}


client.connect()
  .then( ()=> {
    app.listen(PORT, ()=> {
      console.log('server and db are up, listening on port ', PORT);
    });
  });