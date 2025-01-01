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

Creating an instance of LanguageDetector

* ```mergeResults```: Merge languages with different alphabets (simplified and traditional chinese, Bengali and Romanized Bengali, etc.). Example: ```{ 'zh': ['zhs', 'zht'] , 'bn': ['bnr'], 'hi': ['hir'] }```
* ```mergeDatasets```: Merge special datasets with a language. Example: ```{'code': 'en', 'misc': 'en'}```
* ```skipSimilar```: Skip similar languages (for top result only). False by default





### Example


### Configuration

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.