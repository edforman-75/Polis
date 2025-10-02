// Test different pattern variations
const contextAfter = ' said Rep. Dave Min.';

console.log('Context:', JSON.stringify(contextAfter));
console.log('');

// Try 1: Use [^,]+ to capture anything except comma (includes periods)
const try1 = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([A-Z][^,]+?)(?:\s+at\s|\s+in\s|\s+during\s|\s+on\s|\.$|$)/i;
const match1 = contextAfter.match(try1);
console.log('Try 1 ([A-Z][^,]+? with \\.$):', match1 ? match1[2] : 'NO MATCH');

// Try 2: Use greedy instead of non-greedy
const try2 = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([A-Z][\w\s.-]+)(?:\s+at\s|\s+in\s|\s+during\s|\s+on\s|$)/i;
const match2 = contextAfter.match(try2);
console.log('Try 2 ([A-Z][\\w\\s.-]+ greedy):', match2 ? match2[2] : 'NO MATCH');

// Try 3: Match up to period followed by end/space
const try3 = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([A-Z][^,]+?)\.\s*$/i;
const match3 = contextAfter.match(try3);
console.log('Try 3 ([A-Z][^,]+? with \\. at end):', match3 ? match3[2] : 'NO MATCH');

// Try 4: Don't include period in capture, match it separately
const try4 = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([A-Z].*?)(?:\s+(?:at|in|during|on)\s|\.|$)/i;
const match4 = contextAfter.match(try4);
console.log('Try 4 ([A-Z].*? with separate \\.):', match4 ? match4[2] : 'NO MATCH');
