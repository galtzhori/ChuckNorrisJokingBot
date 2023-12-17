
const {Telegraf, Scenes, session} = require('telegraf');
const axios = require('axios').default;
const {v4: uuidv4} = require('uuid');
const countries = require('iso-639-1');
const {response} = require("express");
const fs = require('fs');
const cheerio = require("cheerio");
const { ZenRows } = require("zenrows");
// tokens of translator and bot
const key = "e19e8ef57d4542c1af6e7ba2a88f0758";
const endpoint = "https://api.cognitive.microsofttranslator.com";
const botToken = '6706534572:AAHV4PmvziuVhyluQB86HPOKY8kClhMNDvE';
const location = "northeurope";
const scrapingKey="7cd2f706772a1a0b67afb9f31f9899664b803fdb";
const scrapingUrl = "https://parade.com/968666/parade/chuck-norris-jokes/";

const contactWizard = new Scenes.WizardScene(
    'CONVERSATION_ID', // first argument is Scene_ID, same as for BaseScene
    (ctx) => {
        ctx.reply('choose a language: set language <language_name>');
        ctx.wizard.state.data = {};
        return ctx.wizard.next();
    },
    (ctx) => {
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
            ((translated)=>{
                ctx.reply(translated.data[0]["translations"][0]["text"]);
                return ctx.wizard.next();
            })
        );
    },
    (ctx) => {
        const match = ctx.message.text.match(/^[0-9]+$/);
        ctx.wizard.state.data.jokeCode = ctx.message.text;
        if(!match||(match&& (1>ctx.message.text)||ctx.message.text>101)){
            translate("Enter a number in the range 1-101", ctx.wizard.state.data.language).then(
                ((translated)=>{
                    ctx.reply(translated.data[0]["translations"][0]["text"]);
                })
            );
            return;
        }
        axios.get("https://parade.com/968666/parade/chuck-norris-jokes/")
            .then((res)=>{console.log(res.data);});
        // ctx.reply('Thank you for your replies, well contact your soon');
        return ctx.scene.leave();
    },
);

const bot = new Telegraf(botToken);

const stage = new Scenes.Stage([contactWizard]);
bot.use(session());
bot.use(stage.middleware());
bot.command('start', (ctx) => ctx.scene.enter('CONVERSATION_ID'));
bot.launch();



async function getJoke(jokeNumber) {

        // const client = new ZenRows(scrapingKey);

        // try {
        //     const { data } = await client.get(scrapingUrl, {
        //         "js_render": "true",
        //         "antibot": "true",
        //         "premium_proxy": "true"
        //     });
        //     const $ = cheerio.load(data.toString());
        //     let joke = $('ol').find("li:nth-child(jokeNumber)").text();
        //     joke = joke.replace(/(\r\n|\n|\r)/gm, "");
        //     return joke;
        //
        // } catch (error) {
        //     console.error(error.message);
        //     if (error.response) {
        //         console.error(error.response.data);
        //     }
        // }

    fs.readFile('C:/Users/galx/IdeaProjects/LetsTryNow/htmlData', function (err, data) {
        if (err) {
            throw err;
        }
        const $ = cheerio.load(data.toString());
        let joke = $('ol').find("li:nth-child(jokeNumber)").text();
        joke = joke.replace(/(\r\n|\n|\r)/gm, "");
        console.log(joke);
    });
}

function languageNameToCode(languageName) {
    try {
        return countries.getCode(languageName);
    } catch (error) {
        return null;
    }
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
    }).then((response) => response).catch(err => console.log(err));
}