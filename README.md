# Efficient Language Detection for Multilingual Documents

`LanguageDetector` is a TypeScript class designed to detect languages for web pages in 102 and languages. A research paper with more information will be published soon.

## Example

```js
import LanguageDetector from 'language-detector-web';

const detector = new LanguageDetector();

const languages = detector.getSupportedLanguages();
console.log(languages); // ["af", "am", "ar", "as", "az", "be", "bg", "bn", "br", "bs", …]

const results = detector.getLanguages('This is an English text.'); // ['en']
console.log(`The main languages are ${results.join(' ')}.`); // The main languages are en.
```

## Installation

```sh
npm install language-detector-web
```

## Usage

### Importing the Class

```js
import LanguageDetector from 'language-detector-web';
```

### Creating an Instance

```js
const detector = new LanguageDetector();
```

### Methods

#### LanguageDetector(mergeResults?, mergeDatasets?, skipSimilar?)

Creates an instance of LanguageDetector

* ```mergeResults```: Merge languages with different alphabets (simplified and traditional chinese, Bengali and Romanized Bengali, etc.). Example: ```{ 'zh': ['zhs', 'zht'] , 'bn': ['bnr'], 'hi': ['hir'] }```
* ```mergeDatasets```: Merge special datasets with a language. Example: ```{'code': 'en', 'misc': 'en'}```
* ```skipSimilar```: Skip similar languages (for top result only). False by default


#### getSupportedLanguages()

Returns the list of supported languages as ISO 639-1 code: en (English), fr (French), nl (Dutch), etc.


### getLanguagesWithScores(rawText)

Returns the score for each language supported:

```json
{ 'en': 25.6, 'zh': -136.0', 'nl': 0, ...}
```

Scores can be 0 or negative. This library was designed and tested with the visible text of the web page, without any HTML content. This functions cleans up the text: emojis are removed, etc. Scores will likely increase with the length of the page.


### getLanguages(rawText, minimumRatio?)

Returns the most likely language(s) used in the page


### Example


### Configuration

The list of supported languages and their attributes (top letters and words) are contained in languages.json. This library is built with the top 10,000 words and letters for each language. Other datasets are available on [][GitHub](https://github.com/MaximeSobrier/language-detector): top 1k, 2k, 5k, 10k and 20k. See the research paper (coming soon) for the performances of each dataset.

## Tests

To run tests, use this command:

```sh
npm test
```

Most test files were created with automated translation tools. Since the validity of the content has not been verified, failed tests (.txt.failed extension) have been disabled. To force these test files to be used, run this command:

```sh
FORCE_ALL_TESTS=true npm test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.