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

    const maxOccurences = 2;
    const topLettersRatioMinimum = 200;

    for(const language of this.languages) {      
      scoreWord[language] = 0;     // initialize score for words
      let matchWords : IObjectKeys = {};  // keep track of words seen 
      let scoreLetter = 0;        // initialize score for letters
      let scoreWordsLetters = 0;  // initialize score for words thst include a special letter
      let totalLetters = 0;
      let matchLetters = 0;
      let matchLetterWords = 0;
      let totalWords = 0;
      let noASCII =  stats[language].noASCII || false;;

      const topLettersRatio = stats[language]['topLettersTotal'];

      const lettersOK = topLettersRatio >= topLettersRatioMinimum;
      const lettersOnly = lettersOK && Object.keys(stats[language]["topWords"] || {}).length == 0;

      this.debug(`Language ${language} lettersOK: ${lettersOK}, lettersOnly: ${lettersOnly}, topLettersRatio: ${topLettersRatio}`);

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

        let match = false; // used to check if the word is in the top words
        
        

        if (lettersOK || lettersOnly) {
          totalLetters += word.length; // used only with letters
        }

        if (!lettersOnly && word.length >= 2) {
          if (stats[language]['topWords'].hasOwnProperty(word)) { 
            match = true;
            scoreWord[language] = scoreWord[language] + stats[language]['topWords'][word] * Math.pow(word.length - 1, 2);
          }
        }

        //TODO: move check on topLettersRatio to letterOK
        if (!lettersOnly && lettersOK && !match) { // add condition used in formula
          // Use the word stripped of ASCII characters for languages that don't use ASCII
          if (noASCII) {
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
          
          // Check if the word contains a special letter
          for (const letter of word) {
            const value = stats[language]['topLetters'][letter];
            // this.debug(`Letter ${letter} value: ${value} for word ${word} in language ${language}`);
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

        if (lettersOnly) {
          totalWords++;
          if (noASCII) {
            let asciiWord = this.noASCII(word);
            word = asciiWord;
          }

          for (const letter of word) {
            const value = stats[language]['topLetters'][letter];
            if (value && value > 0) {
              scoreLetter += value;

              this.debug(`Letter ${letter} value: ${value} for word ${word} in language ${language}`);

              matchLetters++;
            }
          }
        }
      }

      // Formula
      if (!lettersOK && !lettersOnly)
        continue;

      const expected = stats[language]['topLettersTotal'];
      const seen = matchLetters / totalLetters * 1000; // ratio of special letters

      const lettersComputeOK = (totalWords / matchLetterWords < 10) && (scoreWord[language] > 0); // at least one word matches 

      this.debug(`Language ${language} scoreWord: ${scoreWord[language]}`);

      if (!lettersOnly && lettersOK && lettersComputeOK) {
        if (seen < expected * 0.2 && totalWords / matchLetterWords > 10) { // low ratio: penalty
          const penalty = expected * totalLetters / 1000;
          scoreWord[language] -= penalty;
          this.debug(`Letter penalty for ${language}: ${penalty} (seen: ${seen}, expected: ${expected}, totalWords: ${totalWords}, matchLetterWords: ${matchLetterWords})`);
        }
        else if (seen >= expected * 0.5) { // high ratio: bonus
          // let bonus = scoreWordsLetters  * matchLetters / totalLetters;// add letters to words, original
          // let bonus = (scoreWordsLetters / totalWords) * matchLetters / totalLetters; // add letters to words, use ratio of words
          let bonus = (matchLetterWords / totalWords) * (matchLetters / totalLetters) * Math.max(scoreWord[language], 10) * 2;
          scoreWord[language] += bonus;
          this.debug(`Letter bonus for ${language}: ${bonus} (seen: ${seen}, expected: ${expected}, totalWords: ${totalWords}, matchLetterWords: ${matchLetterWords}, scoreWordsLetters: ${scoreWordsLetters}, matchLetters: ${matchLetters}, totalLetters: ${totalLetters})`);
        }
        else {
          this.debug(`No letter penalty/bonus for ${language} (seen: ${seen}, expected: ${expected}, totalWords: ${totalWords}, matchLetterWords: ${matchLetterWords})`);
        }
      }

      if (lettersOnly) {
        scoreWord[language] = scoreLetter / totalLetters * 1000; // only letters
        this.debug(`Language ${language} scoreLetter: ${scoreWord[language]} (totalLetters: ${totalLetters}, matchLetters: ${matchLetters})`);

        const bonus = expected * totalLetters / 1000 * (scoreLetter / matchLetters);

        if (seen >= expected * 0.5 || (matchLetters >= totalWords / 2 && this.languageInfo.compact.includes(language))) { // high ratio: bonus
          this.debug(`Letter max bonus for ${language}: ${bonus} (seen: ${seen}, expected: ${expected}, totalWords: ${totalWords}, matchLetterWords: ${matchLetterWords})`);
          scoreWord[language] += bonus;
        }
        else if (seen >= expected * 0.3) { // Mix of chinese and english
          scoreWord[language] += bonus/2;
          this.debug(`Letter mix bonus for ${language}: ${bonus/2} (seen: ${seen}, expected: ${expected}, totalWords: ${totalWords}, matchLetterWords: ${matchLetterWords})`);
        }
        else if (seen >= expected * 0.2) { // Mix of chinese and english
          scoreWord[language] += bonus/4;
          this.debug(`Letter mix bonus for ${language}: ${bonus/4} (seen: ${seen}, expected: ${expected}, totalWords: ${totalWords}, matchLetterWords: ${matchLetterWords})`);
        }
        else if (seen < expected * 0.2) {
          scoreWord[language] -= bonus;
          this.debug(`Letter penalty for ${language}: ${bonus} (seen: ${seen}, expected: ${expected}, totalWords: ${totalWords}, matchLetterWords: ${matchLetterWords})`);
        } 
      }

      this.debug(`Language ${language} score: ${scoreWord[language]} (seen: ${seen}, expected: ${expected}, totalLetters: ${totalLetters}, matchLetters: ${matchLetters}, totalWords: ${totalWords}, matchLetterWords: ${matchLetterWords})`);
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

        scoreWord[destination] = Math.max(scoreWord[destination], scoreWord[source]);
        
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
        while (similar.includes(results[0]) && similar.includes(results[1]) && scoreWord[results[2]] > 0) {
          this.debug(`Similar languages ${results[0]} ${results[1]} => ${results[2]}`);
          results.splice(1, 1);
        }
      }
    }
    

    return results;
  }

  private noASCII(word : string = '') : string {
    return word.replace(/[!-~]/g, '');
  }

  private debug(message : string = '') {
    if (this.debugOn) {
      console.log(message);
    }
  }
}