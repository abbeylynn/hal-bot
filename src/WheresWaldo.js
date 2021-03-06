"use strict"

const nlp                = require("naivenlp");
const celebs             = require("../node_modules/celebs/data/json/no-views/pantheon.json");

const DistanceSearch     = require("./distancesearch.js");
const DistanceComparator = require("./distancecomparator.js");

const FAME_THRESHOLD = 0.2;

function isMath(str) {
   let ops = ["+", "*", "^", "-", "/", "="];
   let split = str.split(" ");
   let inds = ops.map((e) => split.indexOf(e) !== -1);
   return inds.reduce((a,c) => a||c,false);
}

function WheresWaldo() {
   this.action = function(str) {
      // Parse Math
      let mathParse = nlp.parse(str, { stems: true });
      if(isMath(mathParse)) return {action:"math",query:mathParse};

      let twitParse = nlp.parse(str, {isoMath: true});
      let isTwit = (twitParse.split(" ").indexOf("twitter") !== -1)
                || (twitParse.split(" ").indexOf("tweet") !== -1);
      if(isTwit) {
         let outStr = twitParse.replace("twitter","");
         outStr = outStr.replace("tweet","");
         outStr = outStr.replace(/ /g,"");
         return {action: "twitter", query: outStr};
      }

      // Parse for weather
      let weatherWordParse = nlp.parse(str, {stems:true, isoMath: true});
      let weatherSplit = weatherWordParse.split(" ");
      let isWeather = weatherSplit.indexOf("weather") !== -1 || weatherSplit.indexOf("temperature") !== -1;
      let weatherLocParse = nlp.parse(str, {stems:true, fixSp:true, isoMath: true});
      if(isWeather) {
         weatherLocParse = weatherLocParse.replace("weather","");
         weatherLocParse = weatherLocParse.replace("temperature","");
         weatherLocParse = weatherLocParse.trim();
      }
      if(isWeather) return {action:"weather", query: weatherLocParse};

      let isMovie = nlp.lower(weatherWordParse).indexOf("movie") !== -1;
      let movieQ  = nlp.trim(nlp.lower(str).replace("movie", ""));
      if(isMovie) return {action:"movie", query: movieQ};

      // Parse Famous Name
      let nameParse = nlp.parse(str, {stems:true, fixSp:true, w2n:true, isoMath: true});
      let split     = nameParse.split(" ");
      let fames =[];
      let dc = new DistanceComparator({dice:{val:nameParse}},{human:true});
      let ds = new DistanceSearch({data: celebs, comparator: dc});
      let out = ds.findN({search:["name"],ret:["name","industry"],minOrMax:"max"}, 3);
      let famous;
      if(out[0].pri >  FAME_THRESHOLD) {
         famous = true;
      }

      if(out[0].data.industry === "FILM AND THEATRE") return {action:"movie", query:out[0].data.name};

      if(famous) return {action:"wiki", query:out[0].data.name};
      else return {action:"wiki", query:str};
   }
}

module.exports = WheresWaldo;
