const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../../api/stageClient.js');
const source = fs.readFileSync(sourcePath, 'utf8');

describe('mobile stageClient parity wrappers', () => {
  it('exposes backend-owned founder club creation', () => {
    expect(source).toMatch(/const clubs\s*=\s*{/);
    expect(source).toMatch(/createFounder\(body\s*=\s*{}\)/);
    expect(source).toMatch(/http\.post\('\/clubs\/founder',\s*body\)/);
    expect(source).toMatch(/leave\(clubId,\s*body\s*=\s*{}\)/);
    expect(source).toMatch(/\/clubs\/\$\{encodeURIComponent\(clubId\)\}\/leave/);
    expect(source).toMatch(/stageClient\s*=\s*{[^}]*clubs/s);
  });

  it('exposes server-owned feed like and comment actions', () => {
    expect(source).toMatch(/const posts\s*=\s*{/);
    expect(source).toMatch(/likeToggle\(postId\)/);
    expect(source).toMatch(/encodeURIComponent\(postId\)/);
    expect(source).toMatch(/like-toggle/);
    expect(source).toMatch(/const comments\s*=\s*{/);
    expect(source).toMatch(/createForPost\(body\s*=\s*{}\)/);
    expect(source).toMatch(/http\.post\('\/comments',\s*body\)/);
    expect(source).toMatch(/stageClient\s*=\s*{[^}]*posts[^}]*comments/s);
  });

  it('documents legacy President as compatibility fallback only', () => {
    expect(source).toMatch(/player-president flows use clubs\.president_player_id as the public identity/);
    expect(source).toMatch(/legacy first-class President entity/i);
  });
});
