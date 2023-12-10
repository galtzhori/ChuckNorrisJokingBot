// let createError = require('http-errors');
// let express = require('express');
// let path = require('path');
// let cookieParser = require('cookie-parser');
// let logger = require('morgan');
//
// let indexRouter = require('./routes/index');
// let usersRouter = require('./routes/users');
//
// let app = express();
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
const {Telegraf, Scenes, session} = require('telegraf');
// const { enter, leave } = Scenes.Stage;

// const { Scenes } = require('telegraf');

// import { Scenes } from "telegraf";
// const { s } = require('telegraf/Scenes');

const axios = require('axios').default;
const {v4: uuidv4} = require('uuid');

// tokens of translator and bot
let key = "e19e8ef57d4542c1af6e7ba2a88f0758";
let endpoint = "https://api.cognitive.microsofttranslator.com";
let botToken = '6706534572:AAHV4PmvziuVhyluQB86HPOKY8kClhMNDvE';
// location, also known as region.
let location = "northeurope";

const contactWizard = new Scenes.WizardScene(
    'CONVERSATION_ID', // first argument is Scene_ID, same as for BaseScene
    (ctx) => {
        ctx.reply('choose a language: set language <language_name>');
        ctx.wizard.state.data = {};
        return ctx.wizard.next();
    },
    (ctx) => {
        // validation example
        let re = new RegExp("set language (?<lan>[a-zA-Z]+)", "g");
        const match = ctx.message.text.match(re);
        if (!match) {
            ctx.reply('enter a legal language');
            return;
        }
        if (match[0])
            ctx.wizard.state.contactData.fio = ctx.message.text;
        ctx.reply('Enter your e-mail');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.contactData.email = ctx.message.text;
        ctx.reply('Thank you for your replies, well contact your soon');
        await mySendContactDataMomentBeforeErase(ctx.wizard.state.contactData);
        return ctx.scene.leave();
    },
);

const bot = new Telegraf(botToken);

// // bot.start((ctx) => ctx.reply('Welcome'))
// // bot.help((ctx) => ctx.reply('Send me a sticker'))
const stage = new Scenes.Stage([contactWizard]);
bot.use(session());
bot.use(stage.middleware());
bot.command('start', (ctx) => ctx.scene.enter('CONVERSATION_ID'));
bot.launch();

function translate(strToTranslate, language) {
    let params = new URLSearchParams();
    params.append("api-version", "3.0");
    params.append("from", "en");
    params.append("to", language);

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
            'textToTranslate': strToTranslate
        }],
        responseType: 'json'
    }).then(function (response) {
        // console.log(JSON.stringify(response.data, null, 4));
        console.log(response.data[0].text)
    })
}