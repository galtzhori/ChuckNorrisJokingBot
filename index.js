const {Telegraf, Scenes, session} = require('telegraf');
const axios = require('axios').default;
const {v4: uuidv4} = require('uuid');
const countries = require('iso-639-1');
// const fs = require('fs').promises;
const cheerio = require("cheerio");
const {ZenRows} = require("zenrows");
require('dotenv').config();

// tokens of translator and bot
const key = process.env.translateKey;
const endpoint = process.env.endpoint;
const botToken = process.env.botToken;
const location = process.env.location;
const scrapingKey = process.env.scrapingKey;
const scrapingUrl = process.env.scrapingUrl;

const contactWizard = new Scenes.WizardScene(
    'CONVERSATION_ID',
    (ctx) => {
        ctx.reply('choose a language: set language <language_name>');
        ctx.wizard.state.data = {};
        return ctx.wizard.next();
    },
    (ctx) => { //receive first input, expected format "set language <language>"
        const regex = /^set language (?<lan>[a-zA-Z]+)$/;
        const text = ctx.message.text;
        const match = text.match(regex);

        if (!match) {
            ctx.reply('enter a legal language');
            return;
        }
        ctx.wizard.state.data.language = languageNameToCode(match[1]);
        if (!ctx.wizard.state.data.language) {
            ctx.reply('enter a legal language');
            return;
        }
        return translate("No Problem", ctx.wizard.state.data.language).then(
            ((translated) => {
                ctx.reply(translated);
                return ctx.wizard.next();
            })
        );
    },
    (ctx) => {
        const match = ctx.message.text.match(/^[0-9]+$/);
        ctx.wizard.state.data.jokeCode = ctx.message.text;
        if (!match || (match && (1 > ctx.message.text) || ctx.message.text > 101)) {
            translate("Enter a number in the range 1-101", ctx.wizard.state.data.language).then(
                ((translated) => {
                    ctx.reply(translated);
                })
            );
            return;
        }
        return getJoke(ctx.message.text).then((jokeText) => {
            translate(jokeText, ctx.wizard.state.data.language).then(
                ((translated) => {
                    ctx.reply(translated);
                }));
            return ctx.scene.leave();
        });

    },
);

const bot = new Telegraf(botToken);
const stage = new Scenes.Stage([contactWizard]);
bot.use(session());
bot.use(stage.middleware());
bot.command('start', (ctx) => ctx.scene.enter('CONVERSATION_ID'));
bot.launch();


async function getJoke(jokeNumber) {

    const client = new ZenRows(scrapingKey);
    try {
        const { data } = await client.get(scrapingUrl, {
            "js_render": "true",
            "antibot": "true",
            "premium_proxy": "true"
        });
        const $ = cheerio.load(data.toString());
        let joke = $('ol').find(`li:nth-child(${jokeNumber})`).text();
        joke = joke.replace(/(\r\n|\n|\r)/gm, "");
        return jokeNumber+". "+joke;

    } catch (error) {
        console.error(error.message);
        if (error.response) {
            console.error(error.response.data);
        }
    }
    // const data = await fs.readFile('C:/Users/galx/IdeaProjects/LetsTryNow/htmlData', 'utf8');
    // const $ = cheerio.load(data.toString());
    // let joke = $('ol').find(`li:nth-child(${jokeNumber})`).text();
    // joke = joke.replace(/(\r\n|\n|\r)/gm, "");
    // return jokeNumber+". "+joke;
}

function languageNameToCode(languageName) {
    return countries.getCode(languageName);
}

function translate(strToTranslate, language) {
    let params = new URLSearchParams();
    params.append("api-version", "3.0");
    params.append("from", "en");
    params.append("to", language);
    return axios({
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
            'text': strToTranslate
        }],
        responseType: 'json'
    }).then((response) => response.data[0]["translations"][0]["text"]).catch(err => console.log(err));
}