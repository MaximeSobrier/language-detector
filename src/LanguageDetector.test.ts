import {describe, expect, test,  beforeEach} from '@jest/globals';
import LanguageDetector from './LanguageDetector';
const fs = require('fs');


describe('LanguageDetector', () => {
    let detector: LanguageDetector;

    beforeEach(() => {
        detector = new LanguageDetector();
    });

    test('should support many languages', () => {
      const languages = detector.getSupportedLanguages();
      expect(languages.length).toBeGreaterThan(0);
    });



    const data = fs.readdirSync('testdata', { withFileTypes: true })
    .filter((dirent : any) => dirent.isDirectory())
    .map((dirent : any) => dirent.name)

    data.forEach((language : string) => {
        test(`should detect ${language} language`, () => {
            const text = fs.readFileSync(`testdata/${language}/short.txt`, 'utf8');
            const results = detector.getLanguages(text);
            console.log(results);
            expect(results[0]).toBe(language);
        });
    });



    test('should return null for unknown language', () => {
        const text = 'Dies ist ein deutscher Text.';
        const results = detector.getLanguages(text);
        expect(results[0]).toBe('de');
    });

    test('should return null for empty text', () => {
        const text = '';
        const results = detector.getLanguages(text);
        expect(results.length).toBe(0);
    });

    test('should return null for empty text', () => {
        const text = ' 1 222 !@#';
        const results = detector.getLanguages(text);
        expect(results.length).toBe(0);
    });
});