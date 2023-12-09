// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
//
// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
//
// var app = express();
//
// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');
//
// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
//
// app.use('/', indexRouter);
// app.use('/users', usersRouter);
//
// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });
//
// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });
//
// module.exports = app;

const { Telegraf } = require('telegraf');
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');

// tokens of translator and bot
let key = "e19e8ef57d4542c1af6e7ba2a88f0758";
let endpoint = "https://api.cognitive.microsofttranslator.com";
const botToken = '6706534572:AAHV4PmvziuVhyluQB86HPOKY8kClhMNDvE';
// location, also known as region.
let location = "northeurope";

const bot = new Telegraf(botToken);
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.launch()

let params = new URLSearchParams();
params.append("api-version", "3.0");
params.append("from", "en");
params.append("to", "he");

axios({
  baseURL: endpoint,
  url: '/translate',
  method: 'post',
  headers: {
    'Ocp-Apim-Subscription-Key': key,
    'Ocp-Apim-Subscription-Region': location,
    'Content-type': 'application/json',
    'X-ClientTraceId': uuidv4().toString()
  },
  params: params,
  data: [{
    'text': 'Hello, friend! What did you do today?'
  }],
  responseType: 'json'
}).then(function(response){
  console.log(JSON.stringify(response.data, null, 4));
})