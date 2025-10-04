/**
 * Context-Aware Capitalization Checker
 *
 * Checks for correct capitalization of political terms based on context.
 * Fixed version using matchAll() to avoid regex memory leaks.
 */

const politicalCapDict = require('../config/political-capitalization-dictionary');
const properNounsDict = require('../config/campaign-proper-nouns-dictionary');

class CapitalizationChecker {
  constructor() {
    this.politicalCap = politicalCapDict;
    this.properNouns = properNounsDict;
  }

  /**
   * Main checking function
   */
  checkCapitalization(text) {
    const issues = [];

    try {
      // 1. Check political term capitalization
      issues.push(...this.checkPoliticalTerms(text));

      // 2. Check proper noun spelling
      issues.push(...this.checkProperNouns(text));

      // 3. Check common capitalization mistakes
      issues.push(...this.checkCommonMistakes(text));
    } catch (error) {
      console.error('Capitalization check error:', error);
      // Return empty issues rather than crashing
    }

    return issues;
  }

  /**
   * Check political terms (Democratic vs democratic, etc.)
   */
  checkPoliticalTerms(text) {
    const issues = [];

    // Check "Democratic" vs "democratic"
    this.checkDemocraticCapitalization(text, issues);

    // Check "Republican" vs "republican"
    this.checkRepublicanCapitalization(text, issues);

    // Check titles
    this.checkTitleCapitalization(text, issues);

    // Check "Federal"
    this.checkFederalCapitalization(text, issues);

    // Check "administration"
    this.checkAdministrationCapitalization(text, issues);

    return issues;
  }

  /**
   * Check "Democratic" capitalization
   */
  checkDemocraticCapitalization(text, issues) {
    // Should be capitalized: "Democratic Party", "Democratic candidates"
    const matches = [...text.matchAll(/democratic\s+(?:Party|candidate|candidates|nominee|senator|representative|governor)/gi)];
    for (const match of matches) {
      if (match[0].charAt(0) === 'd') { // lowercase 'd'
        issues.push({
          category: 'capitalization',
          type: 'party_name',
          message: 'Capitalize "Democratic" when referring to the Democratic Party',
          context: this.getContext(text, match.index, match[0].length),
          offset: match.index,
          length: match[0].length,
          correction: match[0].replace(/^d/, 'D'),
          severity: 'error',
          ruleId: 'cap_democratic_party'
        });
      }
    }

    // Should be lowercase: "democratic process", "democratic values"
    const lowercaseMatches = [...text.matchAll(/Democratic\s+(?:process|principles|values|system|society|government|institution|way)/g)];
    for (const match of lowercaseMatches) {
      issues.push({
        category: 'capitalization',
        type: 'political_concept',
        message: 'Use lowercase "democratic" when referring to democratic principles, not the party',
        context: this.getContext(text, match.index, match[0].length),
        offset: match.index,
        length: match[0].length,
        correction: match[0].replace(/Democratic/, 'democratic'),
        severity: 'error',
        ruleId: 'cap_democratic_concept'
      });
    }
  }

  /**
   * Check "Republican" capitalization
   */
  checkRepublicanCapitalization(text, issues) {
    const matches = [...text.matchAll(/republican\s+(?:Party|candidate|candidates|nominee|senator|representative|governor)/gi)];
    for (const match of matches) {
      if (match[0].charAt(0) === 'r') { // lowercase 'r'
        issues.push({
          category: 'capitalization',
          type: 'party_name',
          message: 'Capitalize "Republican" when referring to the Republican Party',
          context: this.getContext(text, match.index, match[0].length),
          offset: match.index,
          length: match[0].length,
          correction: match[0].replace(/^r/, 'R'),
          severity: 'error',
          ruleId: 'cap_republican_party'
        });
      }
    }
  }

  /**
   * Check title capitalization
   */
  checkTitleCapitalization(text, issues) {
    // Check for lowercase before names: "rep. Smith" should be "Rep. Smith"
    const titleMatches = [...text.matchAll(/\b(rep|sen|gov)\.\s+([A-Z][a-z]+)/gi)];
    for (const match of titleMatches) {
      const title = match[1];
      if (title === title.toLowerCase()) {
        issues.push({
          category: 'capitalization',
          type: 'title_before_name',
          message: `Capitalize title "${title}" before a name`,
          context: this.getContext(text, match.index, match[0].length),
          offset: match.index,
          length: match[0].length,
          correction: match[0].replace(title, this.capitalizeFirst(title)),
          severity: 'error',
          ruleId: 'cap_title_before_name'
        });
      }
    }

    // Check for capitalized generic usage: "the Representative of" should be "the representative of"
    const genericMatches = [...text.matchAll(/\b(?:the|a|an)\s+(Representative|Senator|Governor)\s+(?:of|from|for)\b/g)];
    for (const match of genericMatches) {
      issues.push({
        category: 'capitalization',
        type: 'generic_title',
        message: 'Lowercase title when used generically without a name',
        context: this.getContext(text, match.index, match[0].length),
        offset: match.index,
        length: match[0].length,
        correction: match[0].replace(match[1], match[1].toLowerCase()),
        severity: 'error',
        ruleId: 'cap_generic_title'
      });
    }
  }

  /**
   * Check "Federal" capitalization
   */
  checkFederalCapitalization(text, issues) {
    const matches = [...text.matchAll(/Federal\s+(?:government|workers|employees|law|funding|workforce)/g)];
    for (const match of matches) {
      issues.push({
        category: 'capitalization',
        type: 'federal_adjective',
        message: 'Lowercase "federal" when used as adjective',
        context: this.getContext(text, match.index, match[0].length),
        offset: match.index,
        length: match[0].length,
        correction: match[0].replace(/Federal/, 'federal'),
        severity: 'error',
        ruleId: 'cap_federal_lowercase'
      });
    }
  }

  /**
   * Check "administration" capitalization
   */
  checkAdministrationCapitalization(text, issues) {
    const matches = [...text.matchAll(/\b([A-Z][a-z]+)\s+Administration\b/g)];
    for (const match of matches) {
      issues.push({
        category: 'capitalization',
        type: 'administration',
        message: 'AP Style: lowercase "administration"',
        context: this.getContext(text, match.index, match[0].length),
        offset: match.index,
        length: match[0].length,
        correction: match[0].replace('Administration', 'administration'),
        severity: 'error',
        ruleId: 'cap_administration_lowercase'
      });
    }
  }

  /**
   * Check proper noun spelling
   */
  checkProperNouns(text) {
    const issues = [];

    // Check for "Earl-Sears" (missing hyphen)
    if (/Earle\s+Sears|Earl-Sears/i.test(text)) {
      const matches = [...text.matchAll(/Earle\s+Sears|Earl-Sears/gi)];
      for (const match of matches) {
        issues.push({
          category: 'capitalization',
          type: 'name_spelling',
          message: 'Incorrect spelling - must be "Earle-Sears" with hyphen',
          context: this.getContext(text, match.index, match[0].length),
          offset: match.index,
          length: match[0].length,
          correction: 'Earle-Sears',
          severity: 'error',
          ruleId: 'cap_earle_sears_hyphen'
        });
      }
    }

    return issues;
  }

  /**
   * Check common mistakes
   */
  checkCommonMistakes(text) {
    const issues = [];

    // "democratic Party" should be "Democratic Party"
    const democraticPartyMatches = [...text.matchAll(/democratic\s+Party/g)];
    for (const match of democraticPartyMatches) {
      issues.push({
        category: 'capitalization',
        type: 'common_mistake',
        message: 'Capitalize "Democratic" when referring to party name',
        context: this.getContext(text, match.index, match[0].length),
        offset: match.index,
        length: match[0].length,
        correction: 'Democratic Party',
        severity: 'error',
        ruleId: 'cap_common_mistake'
      });
    }

    return issues;
  }

  /**
   * Helper: Get context around position
   */
  getContext(text, offset, length, contextLength = 60) {
    const start = Math.max(0, offset - contextLength);
    const end = Math.min(text.length, offset + length + contextLength);
    const context = text.substring(start, end);

    return {
      text: context,
      highlightStart: offset - start,
      highlightLength: length
    };
  }

  /**
   * Helper: Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = CapitalizationChecker;
