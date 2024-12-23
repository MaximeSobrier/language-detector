import {describe, expect, test,  beforeEach} from '@jest/globals';
import LanguageDetector from './LanguageDetector';


describe('LanguageDetector', () => {
    let detector: LanguageDetector;

    beforeEach(() => {
        detector = new LanguageDetector();
    });

    test('should support many languages', () => {
      const languages = detector.getSupportedLanguages();
      expect(languages.length).toBeGreaterThan(0);
    });

    test('should detect English language', () => {
        const text = 'This is an English text.';
        const results = detector.getLanguages(text);
        expect(results[0]).toBe('en');
        expect(results.length).toBe(1)
    });

    test('should detect Spanish language', () => {
        const text = 'Este es un texto en Español.';
        const results = detector.getLanguages(text);
        expect(results[0]).toBe('es');
    });

    test('should detect French language', () => {
        const text = 'Ceci est un texte en Français.';
        const results = detector.getLanguages(text);
        expect(results[0]).toBe('fr');
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