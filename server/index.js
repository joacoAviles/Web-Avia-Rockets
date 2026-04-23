import app from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`AVIA Rockets API running on http://localhost:${config.port}`);
});
