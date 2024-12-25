"use strict";

//@ts-ignore
const stats = require("./languages.json"); // loads top words and letters for all languages


interface IObjectKeys {
  [key: string]: number;
}

export default class LanguageDetector {
  private languageInfo : any = {
    // no Ascii characters
    noASCII: ['ja', 'zh', 'te', 'he', 'ko', 'ml', 'my', 'ne', 'pa', 'ps', 'sa', 'si', 'ta', 'th', 'zhs', 'zht'],
    // languages with special letters
    letters: ['bg', 'cs', 'el', 'et', 'is', 'ru', 'sr', 'az', 'bn', 'fa', 'fr', 'hu', 'is', 'kk', 'lt', 'lv', 'mk', 'mn', 'pl', 'ro', 'sk', 'sv', 'tr', 'uk', 'vi', 'he', 'ka'], // , 'da', 'de', 'fi', 'fr' - , 'gu', 'hi', 'ar', 'am', 'hy', 'ka', 'km', 'kn', 'ko', 'ml', 'ne', 'ps', 'sa', 'si', 'ta', 'te', 'th', 'ur', 'pt'
    // languages with only characters (no words)
    lettersOnly: ['ja', 'th', 'ko', 'zh', 'zhs', 'zht', 'km'],
    // compact languages (languages wit few signs to convey a lot of information)
    compact: ['ja', 'ko', 'zh', 'zhs', 'zht'],
    // languages which are similiar to another
    similar: [
      ['es', 'ca', 'gl'], // Spanish, Catalan and Galician
      ['id', 'ms'], // Indonesian and Malay 
      ['no', 'nb'], // Norwegian
      ['zh', 'ja'], // Chinese and Japanese -- remove later
      ['nl', 'af'], // Dutch and Afrikaans
      ['tr', 'az']
    ]
  };
  private languages: string[] = [];
  private debugOn = false;

  /** 
    Build the dataset for all supported languages

    @param debug - Enable debug mode
  */
  constructor(debug : boolean = false) {
    this.debugOn = debug;

    // Merge top words and letters from code to english
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

    // Merge top words and letters from misc to english
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

  /** 
    Get the list of supported languages
    @returns List of supported languages
  */
  getSupportedLanguages() : string[] {
    //TODO: check if zhs or zht is present
    //TODO: merge other languages
    // Merge different alphabets into one (like simplified nd traditional chinese into chinese)
    return this.languages.filter((language: string) => !['zhs', 'zht'].includes(language)).concat(['zh']);
  }

  /** 
    Get the score for all languages supported
    @param text - Text to analyze
    @returns <language>: <score> key pairs
  */
  getLanguagesWithScores(rawText: string = '') : IObjectKeys {
    let scoreWord : IObjectKeys = {};
    
    const words = rawText.replace(/-+|[’'´‘]|[\/,&•‎…\-±…»·\–¶±·\– ³¯\—›；；《》〔〕\(\)．–\u200B\u2588\u2000-\u2BFF\u2E00-\u2E7F\uE000-\uF8FF\uFE00-\uFE2F\uFF00-\uFFFF]|https?\:\/\/\S+|mmMwWLliI0fiflO&1|BESbswy/gi, ' ') // no change
      .replace(/word word word word\s/g, '')
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

    const maxOccurences = 2;

    for(const language of this.languages) {      
      scoreWord[language] = 0;     // initialize score for words
      let matchWords : IObjectKeys = {};  // keep track of words seen 
      let scoreLetter = 0;        // initialize score for letters
      let scoreWordsLetters = 0;  // initialie score for words thst include a special letter
      let totalLetters = 0;
      let matchLetters = 0;
      let matchLetterWords = 0;
      let totalWords = 0;

      //TODO: check the content of the dataset to get these attributes intead of hardcoding them
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


        let match = false; // used to check if the word is in the top words
        const topLettersRatio = stats[language]['topLettersTotal'];
        

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
        if (lettersOK && !match && topLettersRatio >= 200) { // add condition used in formula
          // Use the word stripped of ASCII characters for languages taht don't use ASCII
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
          
          // Check if the word contains a special letter
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

        if (lettersOnly) {
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
      const seen = matchLetters / totalLetters * 1000; // ratio of special letters

      const lettersComputeOK = (totalWords / matchLetterWords < 10) && (scoreWord[language] > 0); // at least one word matches 

      if (lettersOK && (expected >= 200 || lettersComputeOK)) { // minimum ratio expected to be useful

        if (seen < expected * 0.2 && totalWords / matchLetterWords > 10) { // low ratio: penalty
          const penalty = expected * totalLetters / 1000;
          scoreWord[language] -= penalty;
        }
        else if (seen >= expected * 0.5) { // high ratio: bonus
          scoreWord[language] += scoreWordsLetters * matchLetters / totalLetters; // add letters to words
        }
      }

      if (lettersOnly) {
        scoreWord[language] = scoreLetter / totalLetters * 1000; // only letters

        const bonus = expected * totalLetters / 1000;

        if (seen >= expected * 0.5 || (matchLetters >= totalWords / 2 && this.languageInfo.compact.includes(language))) { // high ratio: bonus
          scoreWord[language] += bonus;
        }
        else if (seen >= expected * 0.3) { // Mix of chinese and english
          scoreWord[language] += bonus/2;
        }
        else if (seen >= expected * 0.2) { // Mix of chinese and english
          scoreWord[language] += bonus/4;
        }
        else if (seen < expected * 0.2) {
          scoreWord[language] -= bonus;
        } 
      }
    }

    // Merge simplified and traditional chinese
    scoreWord['zh'] = Math.max(scoreWord['zh'] || 0, scoreWord['zhs'] || 0, scoreWord['zht'] || 0);
    delete scoreWord['zhs'];
    delete scoreWord['zht'];

    // Merge languages with multiple alphabets
    scoreWord['bn'] = Math.max(scoreWord['bn'] || 0, scoreWord['bnr'] || 0);
    delete scoreWord['bnr'];

    scoreWord['hi'] = Math.max(scoreWord['hi'] || 0, scoreWord['hir'] || 0);
    delete scoreWord['hir'];

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

    //TODO: make this optional
    // For similar languages, keep the languages with the highest score
    for(let similar of this.languageInfo.similar) {
      while (similar.includes(results[0]) && similar.includes(results[1]) && scoreWord[results[2]] > 0) {
        this.debug(`Similar languages ${results[0]} ${results[1]} => ${results[2]}`);
        results.splice(1, 1);
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