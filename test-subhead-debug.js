const PressReleaseParser = require('./backend/utils/press-release-parser.js');

const content = `Spanberger Delivers Keynote Address at Hampton Convocation, Highlights University's Long History of Preparing Leaders for Lives of Service

Spanberger to Students: "Choose Character Over Convenience; Service Over Self-Interest"

HAMPTON, Va. — Congresswoman Abigail Spanberger yesterday delivered the keynote address at Hampton University's 82nd Annual Opening Convocation.

She told students:

"Choose character over convenience; service over self-interest."`;

const parser = new PressReleaseParser();
const result = parser.parse(content);

console.log('Headline:', result.content_structure.headline);
console.log('Subhead:', result.content_structure.subhead);
console.log('\nExpected subhead:', 'Spanberger to Students: "Choose Character Over Convenience; Service Over Self-Interest"');
