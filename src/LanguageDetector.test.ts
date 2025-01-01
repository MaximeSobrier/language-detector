import {describe, expect, test,  beforeEach, afterEach} from '@jest/globals';
import LanguageDetector from './LanguageDetector';
import fs from 'fs';


describe('LanguageDetector', () => {
    let detector: LanguageDetector;

    beforeEach(() => {
        detector = new LanguageDetector();
    });

    test('should support many languages', () => {
      const languages = detector.getSupportedLanguages();
      expect(languages.length).toBeGreaterThan(0);

      expect(languages).not.toContain('zhs');
      expect(languages).not.toContain('zht');
      expect(languages).toContain('zh');

      expect(languages).toContain('bn');
      expect(languages).not.toContain('bnr');
    });



    // Test for all languages in testdata
    const path = 'testdata';
    const folders = fs.readdirSync(path, { withFileTypes: true })
        .filter((dirent : any) => dirent.isDirectory())
        .map((dirent : any) => dirent.name)

    folders.forEach((language : string) => {
        const files = fs.readdirSync(`${path}/${language}`, { withFileTypes: true })
            .filter((dirent : any) => dirent.isFile())
            .map((dirent : any) => dirent.name)

        files.forEach((file : string) => {
            test(`should detect ${language} language (${file})`, () => {
                const text = fs.readFileSync(`${path}/${language}/${file}`, 'utf8');
                const results = detector.getLanguages(text);
                expect(results[0]).toBe(language);
            });
        });
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


describe('LanguageDetector constructor options', () => {
    
    test(`should return more languages (results not merged)`, () => {
        let detector = new LanguageDetector({});
        const languages = detector.getSupportedLanguages();

        expect(languages).toContain('zhs');
        expect(languages).toContain('zht');
        expect(languages).not.toContain('zh');

        expect(languages).toContain('bn');
        expect(languages).toContain('bnr');
    });

    test(`should return zhs (results not merged)`, () => {
        let detector = new LanguageDetector({});

        const text = fs.readFileSync(`testdata/zh/short_zhs.txt`, 'utf8');
        const results = detector.getLanguages(text);
        expect(results[0]).toBe('zhs');
    });

    test(`should return zht (results not merged)`, () => {
        let detector = new LanguageDetector({});

        const text = fs.readFileSync(`testdata/zh/short_zht.txt`, 'utf8');
        const results = detector.getLanguages(text);
        expect(results[0]).toBe('zht');
    });
});