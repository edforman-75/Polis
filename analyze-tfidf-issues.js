#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple tokenizer and text cleaner
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were',
  'will', 'have', 'has', 'had', 'been', 'said', 'but', 'not', 'all', 'can',
  'their', 'they', 'would', 'could', 'should', 'who', 'what', 'when', 'where',
  'why', 'how', 'about', 'which', 'than', 'more', 'most', 'only', 'just',
  'its', 'our', 'out', 'our', 'into', 'such', 'these', 'those', 'his', 'her',
  'also', 'any', 'some', 'other', 'much', 'very', 'may', 'many', 'must', 'over',
  'through', 'during', 'before', 'after', 'above', 'below', 'between', 'both',
  'each', 'few', 'more', 'most', 'same', 'such', 'then', 'there', 'here',
  'being', 'does', 'did', 'doing', 'you', 'your', 'yours', 'him', 'she',
  'release', 'statement', 'press', 'today', 'new', 'now', 'one', 'two', 'three',
  'first', 'year', 'years', 'day', 'week', 'month', 'time', 'make', 'get', 'see'
]);

// Calculate term frequency for a document
function calculateTF(tokens) {
  const tf = {};
  const total = tokens.length;

  for (const token of tokens) {
    if (!STOP_WORDS.has(token)) {
      tf[token] = (tf[token] || 0) + 1;
    }
  }

  // Normalize by document length
  for (const term in tf) {
    tf[term] = tf[term] / total;
  }

  return tf;
}

// Calculate inverse document frequency
function calculateIDF(documents) {
  const idf = {};
  const totalDocs = documents.length;

  // Count how many documents contain each term
  const docFreq = {};
  for (const doc of documents) {
    const uniqueTerms = new Set(doc.tokens.filter(t => !STOP_WORDS.has(t)));
    for (const term of uniqueTerms) {
      docFreq[term] = (docFreq[term] || 0) + 1;
    }
  }

  // Calculate IDF: log(total docs / docs containing term)
  for (const term in docFreq) {
    idf[term] = Math.log(totalDocs / docFreq[term]);
  }

  return idf;
}

// Calculate TF-IDF scores
function calculateTFIDF(documents) {
  const idf = calculateIDF(documents);
  const results = [];

  for (const doc of documents) {
    const tf = calculateTF(doc.tokens);
    const tfidf = {};

    for (const term in tf) {
      tfidf[term] = tf[term] * (idf[term] || 0);
    }

    results.push({
      file: doc.file,
      tfidf: tfidf
    });
  }

  return results;
}

// Extract top terms across all documents
function getTopTermsGlobal(tfidfResults, topN = 100) {
  const termScores = {};

  // Aggregate scores across all documents
  for (const result of tfidfResults) {
    for (const term in result.tfidf) {
      termScores[term] = (termScores[term] || 0) + result.tfidf[term];
    }
  }

  // Sort by score
  const sorted = Object.entries(termScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return sorted;
}

// Group related terms into clusters (simple co-occurrence based)
function clusterTerms(documents, topTerms, minCooccurrence = 5) {
  const termSet = new Set(topTerms.map(t => t[0]));
  const cooccurrence = {};

  // Calculate co-occurrence matrix
  for (const doc of documents) {
    const docTerms = doc.tokens.filter(t => termSet.has(t));
    const unique = [...new Set(docTerms)];

    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const pair = [unique[i], unique[j]].sort().join('|');
        cooccurrence[pair] = (cooccurrence[pair] || 0) + 1;
      }
    }
  }

  // Find strongly associated terms
  const clusters = {};
  for (const term of topTerms.slice(0, 30)) { // Focus on top 30 terms
    const related = [];
    const termName = term[0];

    for (const pairKey in cooccurrence) {
      if (cooccurrence[pairKey] >= minCooccurrence) {
        const [t1, t2] = pairKey.split('|');
        if (t1 === termName) {
          related.push({ term: t2, count: cooccurrence[pairKey] });
        } else if (t2 === termName) {
          related.push({ term: t1, count: cooccurrence[pairKey] });
        }
      }
    }

    if (related.length > 0) {
      clusters[termName] = related.sort((a, b) => b.count - a.count).slice(0, 5);
    }
  }

  return clusters;
}

// Main analysis
console.log('=== TF-IDF ISSUE DISCOVERY ANALYSIS ===\n');

// Load all press releases
const dir = 'cpo_examples';
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.txt') && !f.includes('.txt.'));

console.log(`Loading ${files.length} press releases...\n`);

const documents = files.map(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  const tokens = tokenize(content);
  return { file, content, tokens };
});

// Calculate TF-IDF
console.log('Calculating TF-IDF scores...\n');
const tfidfResults = calculateTFIDF(documents);

// Get top distinctive terms
console.log('=== TOP 50 DISTINCTIVE TERMS (by TF-IDF) ===\n');
const topTerms = getTopTermsGlobal(tfidfResults, 100);

topTerms.slice(0, 50).forEach((term, idx) => {
  console.log(`${(idx + 1).toString().padStart(2)}. ${term[0].padEnd(25)} (score: ${term[1].toFixed(3)})`);
});

// Cluster related terms
console.log('\n\n=== TERM CLUSTERS (co-occurring terms) ===\n');
const clusters = clusterTerms(documents, topTerms, 5);

for (const [mainTerm, related] of Object.entries(clusters).slice(0, 15)) {
  console.log(`\n${mainTerm.toUpperCase()}:`);
  related.forEach(r => {
    console.log(`  → ${r.term} (co-occurs ${r.count}x)`);
  });
}

// Suggest potential issue categories
console.log('\n\n=== SUGGESTED ISSUE CATEGORIES ===\n');
console.log('Based on term analysis, here are potential issues to track:\n');

// Group top terms into suggested categories
const suggestions = {};
const topTermsList = topTerms.slice(0, 50).map(t => t[0]);

// Pattern matching to suggest categories
const categoryPatterns = {
  'healthcare_policy': ['healthcare', 'medicaid', 'medicare', 'insurance', 'patients', 'coverage', 'affordable'],
  'elections_campaigns': ['campaign', 'election', 'voters', 'ballot', 'poll', 'primary', 'race'],
  'government_operations': ['shutdown', 'budget', 'spending', 'government', 'funding', 'congress'],
  'legislative_action': ['bill', 'legislation', 'introduced', 'act', 'law', 'passed'],
  'opposition_criticism': ['trump', 'republicans', 'gop', 'republican', 'oppose', 'against'],
  'economic_issues': ['economy', 'jobs', 'economic', 'workers', 'inflation', 'costs'],
  'education': ['education', 'school', 'schools', 'students', 'teachers', 'children'],
  'infrastructure': ['infrastructure', 'roads', 'bridges', 'transportation', 'transit'],
  'climate_energy': ['climate', 'energy', 'renewable', 'clean', 'environment'],
  'social_issues': ['abortion', 'reproductive', 'rights', 'women', 'families']
};

for (const [category, keywords] of Object.entries(categoryPatterns)) {
  const matches = topTermsList.filter(term =>
    keywords.some(keyword => term.includes(keyword) || keyword.includes(term))
  );

  if (matches.length > 0) {
    suggestions[category] = matches;
  }
}

for (const [category, terms] of Object.entries(suggestions)) {
  console.log(`${category}:`);
  console.log(`  ${terms.join(', ')}\n`);
}

// Save results
const results = {
  timestamp: new Date().toISOString(),
  total_documents: documents.length,
  top_terms: topTerms.slice(0, 100),
  clusters: clusters,
  suggested_categories: suggestions
};

fs.writeFileSync('tfidf-issue-analysis.json', JSON.stringify(results, null, 2));
console.log('\n✓ Full results saved to: tfidf-issue-analysis.json');
