"use strict";

//@ts-ignore
import stats from "./languages.json";

interface IObjectKeys {
  [key: string]: number;
}

export default class LanguageDetector {
  private languageInfo : any = {
    noASCII: ['ja', 'zh', 'te', 'he', 'ko', 'ml', 'my', 'ne', 'pa', 'ps', 'sa', 'si', 'ta', 'th', 'zhs', 'zht'],
    letters: ['bg', 'cs', 'el', 'et', 'is', 'ru', 'sr', 'az', 'bn', 'fa', 'fr', 'hu', 'is', 'kk', 'lt', 'lv', 'mk', 'mn', 'pl', 'ro', 'sk', 'sv', 'tr', 'uk', 'vi', 'he', 'ka'], // , 'da', 'de', 'fi', 'fr' - , 'gu', 'hi', 'ar', 'am', 'hy', 'ka', 'km', 'kn', 'ko', 'ml', 'ne', 'ps', 'sa', 'si', 'ta', 'te', 'th', 'ur', 'pt'
    lettersOnly: ['ja', 'th', 'ko', 'zh', 'zhs', 'zht', 'km'],
    compact: ['ja', 'ko', 'zh', 'zhs', 'zht'],
    similar: [
      ['es', 'ca', 'gl'], // Spanish, Catalan and Galician
      ['id', 'ms'], // Indonesian and Malay 
      ['no', 'nb'], // Norwegian
      // ['zh', 'zhs', 'zht'], // Chinese
      ['zh', 'ja'], // Chinese and Japanese -- remove later
      ['nl', 'af'], // Dutch and Afrikaans
      ['tr', 'az']
    ]
  };
  private languages: string[] = [];
  private debugOn = false;


  constructor(debug : boolean = false) {
    this.debugOn = debug;
    // this.load(file);

    if (stats['code'] && stats['en']) {
      for (let word of Object.keys(stats['code']['topWords'])) {
        if (! stats['en']['topWords'][word]) {
          stats['en']['topWords'][word] = stats['code']['topWords'][word] / 2;
        }
        else {
          stats['en']['topWords'][word] += stats['code']['topWords'][word] / 2;
        }
      }

      delete stats['code'];
    }

    if (stats['misc'] && stats['en']) {
      for(let word of Object.keys(stats['misc']['topWords'])) {
        if (! stats['en']['topWords'][word]) {
          stats['en']['topWords'][word] = stats['misc']['topWords'][word] / 10;
        }
        else {
          stats['en']['topWords'][word] += stats['misc']['topWords'][word] / 10;
        }
      }

      delete stats['misc'];
    }

    this.languages = Object.keys(stats);
  }

  getSupportedLanguages() : string[] {
    return this.languages.filter((language: string) => !['zhs', 'zht'].includes(language)).concat(['zh']);
  }

  getLanguagesWithScores(rawText: string = '') : IObjectKeys {
    let scoreWord : IObjectKeys = {};
    

    const words = rawText.replace(/-+|[’'´‘]|[\/,&•‎…\-±…»·\–¶±·\– ³¯\—›；；《》〔〕\(\)．–\u200B\u2588\u2000-\u2BFF\u2E00-\u2E7F\uE000-\uF8FF\uFE00-\uFE2F\uFF00-\uFFFF]|https?\:\/\/\S+|mmMwWLliI0fiflO&1|BESbswy/gi, ' ') // no change
      .replace(/word word word word\s/g, '') // santiizeText
      .replace(/[0-9²\)\(\]\[\+@#%\&\*\_\.=\{\}'",;\:><!\|“”\?„‘）（く‹‹\u200e˝¾¿¼¸…½°º‚´»€±·¯\—›零一二三四五六七八九十百两千]/g, '')
      .replace(/\p{Extended_Pictographic}/ug, '')
      .replace(/[]/g, '') // sanitizeWords
      .trim()
      .toLowerCase()
      .split(/\s+|[。、「」：，•\‎\–¶¯\—›；；《》〔〕．\-¿´)"\.¾²»‚½¸±·°‡¼€\(\/\u200B\u2588\u2000-\u2BFF\u2E00-\u2E7F\uE000-\uF8FF\uFE00-\uFE2F\uFF00-\uFFFF]+/gi) // split words
      .filter((word) => !word.match('�'))
      .filter((word) => word.length > 0)
      .filter((word) => word.length >= 2 || !word.match(/[a-zA-Z]/)) // Keep single letters for chinese
      .slice(0, 2048);


    rawText = '';

    const maxOccurences = 2; // 3

    for(const language of this.languages) {      
      scoreWord[language] = 0;     // continue;
      let matchWords : IObjectKeys = {};
      let scoreLetter = 0;
      let scoreWordsLetters = 0;
      let totalLetters = 0;
      let matchLetters = 0;
      let matchLetterWords = 0;
      let totalWords = 0;

      const lettersOnly = this.languageInfo.lettersOnly.includes(language);
      const lettersOK = this.languageInfo.letters.includes(language);

      for(let word of words) {

        if (! (word in matchWords)) {
          matchWords[word] = 0;
        }
        else {
          matchWords[word] = matchWords[word] + 1;

          if (matchWords[word] >= maxOccurences) {
            continue;
          }
        }


        let match = false;
        const topLettersRatio = stats[language]['topLettersTotal'];
        

        if (lettersOK || lettersOnly) {
          totalLetters += word.length; // used only with letters
        }

        if (!lettersOnly && word.length >= 2) { // not necessary with condition checked earlier:  && matchOccurences] < maxOccurences
          if (stats[language]['topWords'].hasOwnProperty(word)) { 
            match = true;
            scoreWord[language] = scoreWord[language] + stats[language]['topWords'][word] * Math.pow(word.length - 1, 2);
          }
        }

        if (lettersOK && !match && topLettersRatio >= 200) { // add condition used in formula
          if (this.languageInfo.noASCII.includes(language)) {
            let asciiWord = this.noASCII(word);
            word = asciiWord;

            if (asciiWord != word && word.length >= 1) {
          
              if (! (asciiWord in matchWords)) {
                matchWords[asciiWord] = 0;
              }
              else {
                matchWords[asciiWord] = matchWords[asciiWord] + 1;
              }
            }
          }

          totalWords++;

          let score = 0;
          
          for (const letter of word) {
            const value = stats[language]['topLetters'][letter];
            if (value && value > 0) {
              score = Math.max(value, score); // only keep the most relevant letter
              matchLetters++;
            }
          }
          
          if (score > 0) {
            scoreWordsLetters += score * Math.pow(Math.min(4, word.length - 1), 2);
            matchLetterWords++;
          }
        }

        if (lettersOnly) { //  || languageInfo.letters.includes(language)
          totalWords++;
          if (this.languageInfo.noASCII.includes(language)) {
            let asciiWord = this.noASCII(word);
            word = asciiWord;
          }

          for (const letter of word) {
            const value = stats[language]['topLetters'][letter];
            if (value && value > 0) {
              scoreLetter += value;

              matchLetters++;
            }
          }
        }
      }

      // Formula
      if (!lettersOK && !lettersOnly)
        continue;

      const expected = stats[language]['topLettersTotal'];
      const seen = matchLetters / totalLetters * 1000;

      const lettersComputeOK = (totalWords / matchLetterWords < 10) && (scoreWord[language] > 0); // at least one word matches 

      if (lettersOK && (expected >= 200 || lettersComputeOK)) { // minimum ratio expected to be useful

        if (seen < expected * 0.2 && totalWords / matchLetterWords > 10) {
          const penalty = expected * totalLetters / 1000;
          scoreWord[language] -= penalty;
        }
        else if (seen >= expected * 0.5) {
          scoreWord[language] += scoreWordsLetters * matchLetters / totalLetters; // add letters to words
        }
      }

      if (lettersOnly) {
        scoreWord[language] = scoreLetter / totalLetters * 1000; // only letters

        const bonus = expected * totalLetters / 1000;

        if (seen >= expected * 0.5 || (matchLetters >= totalWords / 2 && this.languageInfo.compact.includes(language))) { // good for chinese, but probably not other languages (turkish, russian, etc => maybe a new flag for them?)
          scoreWord[language] += bonus;
        }
        else if (seen >= expected * 0.3) { // Mix of chinese and english
          scoreWord[language] += bonus/2;
        }
        else if (seen >= expected * 0.2) { // Mix of chinese and english
          scoreWord[language] += bonus/4;
        }
        else if (seen < expected * 0.2) { // problem with chinese mixed with english (00d48140-34d1-11ee-9292-1d8ae41489b4), but otherwise over score for just 2 words of thai (000d87d0-367e-11ee-b775-7de4c498fe3c)
          scoreWord[language] -= bonus;
        } 
      }
    }

    scoreWord['zh'] = Math.max(scoreWord['zh'] || 0, scoreWord['zhs'] || 0, scoreWord['zht'] || 0);
    delete scoreWord['zhs'];
    delete scoreWord['zht'];

    scoreWord['bn'] = Math.max(scoreWord['bn'] || 0, scoreWord['bnr'] || 0);
    delete scoreWord['bnr'];

    scoreWord['hi'] = Math.max(scoreWord['hi'] || 0, scoreWord['hir'] || 0);
    delete scoreWord['hir'];

    return scoreWord;
  }

  getLanguages(rawText: string = '') : string[] {
    let scoreWord : IObjectKeys = this.getLanguagesWithScores(rawText);

    let results = Object.keys(scoreWord).filter((language: string) => scoreWord[language] > 0).sort((a: string, b: string) => scoreWord[b] - scoreWord[a]); // fast

    for(let similar of this.languageInfo.similar) {
      while (similar.includes(results[0]) && similar.includes(results[1]) && scoreWord[results[2]] > 0) {
        this.debug(`Similar languages ${results[0]} ${results[1]} => ${results[2]}`);
        results.splice(1, 1);
        // break;
      }
    }

    return results;
  }

  noASCII(word : string = '') : string {
    return word.replace(/[!-~]/g, '');
  }

  debug(message : string = '') {
    if (this.debugOn) {
      console.log(message);
    }
  }
}