import {describe, expect, test,  beforeEach, afterEach} from '@jest/globals';
import LanguageDetector from './LanguageDetector';
import fs from 'fs';


// These tests must be isolated from the other tests
describe('LanguageDetector constructor options', () => {

  test(`should return more languages (dataset not merged)`, () => {
    const detector = new LanguageDetector(undefined, undefined, {'misc': 'en'});
    const languages = detector.getSupportedLanguages();

    expect(languages).toContain('code');
    expect(languages).not.toContain('misc');
  });
});