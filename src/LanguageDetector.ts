"use strict";

//@ts-ignore
const stats = require("./languages.json"); // loads top words and letters for all languages


interface IObjectKeys {
  [key: string]: number;
}

interface IStringKeys {
  [key: string]: string;
}

interface IArrayKeys {
  [key: string]: string[];
}

const minChars = 2;

export default class LanguageDetector {
  private languageInfo : any = {
    // no ASCII characters
    // noASCII: ['ja', 'zh', 'te', 'he', 'ko', 'ml', 'my', 'ne', 'pa', 'ps', 'sa', 'si', 'ta', 'th', 'zhs', 'zht', 'yi'],
    // languages with special letters
    // letters: ['bg', 'cs', 'el', 'et', 'is', 'ru', 'sr', 'az', 'bn', 'fa', 'fr', 'hu', 'is', 'kk', 'lt', 'lv', 'mk', 'mn', 'pl', 'ro', 'sk', 'sv', 'tr', 'uk', 'vi', 'he', 'ka'], // , 'da', 'de', 'fi', 'fr' - , 'gu', 'hi', 'ar', 'am', 'hy', 'ka', 'km', 'kn', 'ko', 'ml', 'ne', 'ps', 'sa', 'si', 'ta', 'te', 'th', 'ur', 'pt'
    // languages with only characters (no words)
    // lettersOnly: ['ja', 'th', 'ko', 'zh', 'zhs', 'zht', 'km'],
    // compact languages (languages with few signs to convey a lot of information)
    compact: ['ja', 'ko', 'zh', 'zhs', 'zht'],
    // languages which are similar to another
    similar: [
      ['es', 'ca', 'gl'], // Spanish, Catalan and Galician
      ['id', 'ms'], // Indonesian and Malay 
      ['no', 'nb'], // Norwegian Bokmål and Norwegian
      ['nl', 'af'], // Dutch and Afrikaans
      ['tr', 'az'], // Turkish and Azerbaijani
      ['he', 'yi'], // Hebrew and Yiddish
      ['bs', 'hr', 'sl'], // Bosnian, Croatian, Slovenian
      ['sr', 'mk', 'bg'], // Serbian, Macedonian, Bulgarian
      ['pl', 'ln'], // Polish and Lingala
      ['uk', 'bg'], // Ukrainian and Bulgarian
      ['ru', 'uk', 'be'], // Russian and Ukrainian
      ['ru', 'bg'], // Russian, Bulgarian, Belarusian
      ['be', 'bg'], // Belarusian and Bulgarian
      ['sk', 'ln'], // Slovak and Lingala
      ['cs', 'sk'], // Czech and Slovak
      ['mk', 'bg'], // Macedonian and Bulgarian
      ['li', 'af'], // Limburgish and Afrikaans
      ['xh', 'zu'], // Xhosa and Zulu
      ['ky', 'kk'], // Kyrgyz and Kazakh
      ['ku', 'ln'], // Kurdish and Lingala
      ['pt', 'gl'], // Portuguese and Galician
      ['az', 'ln'], // Azerbaijani and Lingala
      ['so', 'eo'], // Somali and Esperanto
      ['hr', 'sr'], // Croatian and Serbian
      ['zh', 'ja'], // Chinese and Japanese
    ]
  };
  private languages : string[] = [];
  private debugOn = false;
  private skipSimilarOn = false;
  private mergeResults : IArrayKeys = { };

  /** 
    Build the dataset for all supported languages
    @param languages - List of languages to support (default: all supported languages)
    @param mergeResults -  Merge languages with different alphabets
    @param mergeDatasets - Merge special datasets with a language
    @param skipSimilar - Skip similar languages (for top result only)
    @param debug - Enable debug mode
  */
  constructor(
    languages : string[] = [],
    mergeResults : IArrayKeys = { 'zh': ['zhs', 'zht'] , 'bn': ['bn', 'bnr'], 'hi': ['hi', 'hir'] },  
    mergeDatasets: IStringKeys = {'code': 'en', 'misc': 'en'}, 
    skipSimilar : boolean = false, 
    debug : boolean = false
  ) {
    this.debugOn = debug;
    this.mergeResults = mergeResults;
    this.skipSimilarOn = skipSimilar;

    // Merge code dataset
    if ((stats['code'] && mergeDatasets.hasOwnProperty('code')) && stats[mergeDatasets['code']]) {
      const destination = mergeDatasets['code'];
      for (let word of Object.keys(stats['code']['topWords'])) {
        if (! stats[destination]['topWords'][word]) {
          stats[destination]['topWords'][word] = stats['code']['topWords'][word] / 2;
        }
        else {
          stats[destination]['topWords'][word] += stats['code']['topWords'][word] / 2;
        }
      }

      delete stats['code'];
    }

    // Merge misc dataset
    if ((stats['misc'] && mergeDatasets.hasOwnProperty('misc')) && stats[mergeDatasets['misc']]) {
      const destination = mergeDatasets['misc'];
      for(let word of Object.keys(stats['misc']['topWords'])) {
        if (! stats[destination]['topWords'][word]) {
          stats[destination]['topWords'][word] = stats['misc']['topWords'][word] / 10;
        }
        else {
          stats[destination]['topWords'][word] += stats['misc']['topWords'][word] / 10;
        }
      }

      delete stats['misc'];
    }

    if (languages.length > 0) {
      // Expand with merged languages
      Object.keys(this.mergeResults).forEach((destination: string) => {
        if (languages.includes(destination)) {
          this.mergeResults[destination].forEach((source: string) => {
            if (!languages.includes(source)) {
              languages.push(source);
            }
          });
        }
      });

      // Filter languages
      this.languages = languages.filter((language: string) => stats.hasOwnProperty(language));

    }
    else {
      // Get all languages from stats
      this.languages = Object.keys(stats);
    }
  }

  /** 
    Get the list of supported languages
    @returns List of supported languages
  */
  getSupportedLanguages() : string[] {
    // Merge languages
    let add : string[] = []
    let remove : string[] = []

    for (const destination of Object.keys(this.mergeResults)) { // 'zh': ['zhs', 'zht']
      const merged = this.mergeResults[destination].filter((language: string) => language != destination);
      remove = remove.concat(merged);

      if (!this.languages.includes(destination)) {
        add.push(destination);
      }
    }

    return this.languages.filter((language: string) => !remove.includes(language)).concat(add);
  }

  /** 
    Get the score for all languages supported
    @param rawText - Text to analyze
    @returns <language>: <score> key pairs
  */
  getLanguagesWithScores(rawText: string = '') : IObjectKeys {
    let scoreWord : IObjectKeys = {};
    
    const words = rawText.replace(/-+|[’'´‘]|[\/,&•‎…\-±…»·\–¶±·\– ³¯\—›；；《》〔〕\(\)．–¿\u200B\u2588\u2000-\u2BFF\u2E00-\u2E7F\uE000-\uF8FF\uFE00-\uFE2F\uFF00-\uFFFF]/gi, ' ') // no change
      .replace(/word word word word\s|mmMwWLliI0fiflO&1|BESbswy/g, '') // typography
      .replace(/https?\:\/\/\S+/gi, ' ') // URLs
      .replace(/[0-9²\)\(\]\[\+@#%\&\*\_\.=\{\}'",;\:><!\|“”\?„‘）（く‹‹\u200e˝¾¿¼¸…½°º‚´»€±·¯\—›\.。、「」：，•¶"‡]/g, ' ')
      .replace(/零一二三四五六七八九十百两千/g, '') // Chinese numbers
      .replace(/[\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4]/g, ' ') // Hebrew punctuation
      .replace(/\p{Extended_Pictographic}/ug, '')
      .trim()
      .toLowerCase()
      .split(/\s+/g) // split words
      .filter((word) => !word.match('�'))
      .filter((word) => word.length > 0)
      .filter((word) => word.length >= 2 || !word.match(/[a-zA-Z]/)) // Keep single letters for chinese
      .slice(0, 2048);

    rawText = '';

    const maxOccurences = 2; // change

    for(const language of this.languages) {      
      scoreWord[language] = 0;     // initialize score for words
      let matchWords : IObjectKeys = {};  // keep track of words seen 
      let scoreLetter = 0;        // initialize score for letters
      let totalLetters = 0;
      let matchLetters = 0;
      let totalMatchWords = 0;

      const lettersOnly = Object.keys(stats[language]["topWords"] || {}).length == 0;

      this.debug(`Language ${language}, lettersOnly: ${lettersOnly}`);

      for(let word of words) {
        if (lettersOnly) {
          totalLetters += word.length; // used only with letters
        }

        if (! (word in matchWords)) {
          matchWords[word] = 0;
        }
        else {
          matchWords[word] = matchWords[word] + 1;

          if (matchWords[word] >= maxOccurences) {
            continue;
          }
        }


        if (!lettersOnly && word.length >= minChars) {
          if (stats[language]['topWords'].hasOwnProperty(word)) { 
            let value = stats[language]['topWords'][word];
            totalMatchWords++;
            scoreWord[language] = scoreWord[language] + value * Math.pow(word.length - 1, 2);
            this.debug(`Word ${word} found in topWords for ${language} with score ${value} (total score: ${scoreWord[language]})`);
          }
        }

        if (lettersOnly) {
          for (const letter of word) {
            const value = stats[language]['topLetters'][letter];
            if (value && value > 0) {
              matchLetters++;

              scoreLetter += value;
            }
          }
        }
      }

      this.debug(`Language ${language} initial scoreWord: ${scoreWord[language]}`);
      scoreWord[language] = scoreWord[language] * Math.pow(totalMatchWords, 2) / words.length; // normalize by the number of words matched

      this.debug(`Language ${language} scoreWord: ${scoreWord[language]}`);

      // Formula
      if (!lettersOnly)
        continue;

      if (lettersOnly) {
        scoreWord[language] = scoreLetter * matchLetters / totalLetters * 100; // only letters
        this.debug(`Language ${language} scoreLetter: ${scoreWord[language]} (totalLetters: ${totalLetters}, matchLetters: ${matchLetters})`);

        if (this.languageInfo.compact.includes(language)) {
          scoreWord[language] *= 1.2;
        }
      }

      this.debug(`Language ${language} score: ${scoreWord[language]} (totalLetters: ${totalLetters}, matchLetters: ${matchLetters}})`);
    }

    // Merge languages with multiple alphabets
    for (const destination of Object.keys(this.mergeResults)) { // 'zh': ['zhs', 'zht']
      if (! this.languages.includes(destination) && ! this.mergeResults.hasOwnProperty(destination)) {
        continue;
      }


      this.debug(`Merging languages for ${destination}`);
      const merged = this.mergeResults[destination];

      if (! scoreWord.hasOwnProperty(destination))
        scoreWord[destination] = 0;

      for (const source of merged) {
        if (! scoreWord.hasOwnProperty(source)) {
          this.debug(`Source language ${source} not found in scoreWord`);
          continue;
        }
        this.debug(`Merging ${source} into ${destination} with score ${scoreWord[source]}`);

        scoreWord[destination] += scoreWord[source];
        
        if (source != destination)
          delete scoreWord[source];
      }
    }


    return scoreWord;
  }

  /** 
    Get the score for all languages supported
    @param text - Text to analyze
    @param minimumRatio - Minimum score ratio to report matching languages - default: 0.8
    @returns Array of languages found in the text
  */
  getLanguages(rawText: string = '', minimumRatio : number = 0.8) : string[] {
    let scoreWord : IObjectKeys = this.getLanguagesWithScores(rawText);

    let results = Object.keys(scoreWord).filter((language: string) => scoreWord[language] > 0).sort((a: string, b: string) => scoreWord[b] - scoreWord[a]);  // sort from highest score to lowest score
    results = results.filter((language: string) => scoreWord[language] >= minimumRatio * scoreWord[results[0]]); // keep only languages with a minimum ratio to the highest score

    // For similar languages, keep the languages with the highest score
    if (this.skipSimilarOn) {
      for(let similar of this.languageInfo.similar) {
        let common = results.filter((language: string) => similar.includes(language));
        if (common.length > 1) {
          // Keep the language with the highest score
          const best = common.reduce((a: string, b: string) => scoreWord[a] > scoreWord[b] ? a : b);
          results = results.filter((language: string) => !common.includes(language) || language === best);
          this.debug(`Keeping ${best} from similar languages ${common.join(', ')} with score ${scoreWord[best]}`);
        }
      }
    }
    

    return results;
  }

  private debug(message : string = '') {
    if (this.debugOn) {
      console.log(message);
    }
  }
}