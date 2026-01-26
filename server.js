const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', (req, res) => {
  res.json({
    project: 'Blood Suite - Smart Blood Bank',
    status: 'Development',
    modules: {
      frontend: 'In Progress',
      backend: 'Pending',
      database: 'In Progress',
      mobile: 'Pending',
      aiml: 'Pending'
    }
  });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Blood Suite server running on http://0.0.0.0:${PORT}`);
});
