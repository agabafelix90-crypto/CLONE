const bcrypt = require('bcryptjs');

(async () => {
  const newhash = await bcrypt.hash('8017', 10);
  console.log('New hash for "8017":', newhash);
})();
