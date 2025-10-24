
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { title: "Welcome to Rushi Technologies Private Ltd" });
});

// REST API
app.get('/api/data', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data', 'trainer.json');
    const fs = require('fs').promises;
    const jsonData = await fs.readFile(dataPath, 'utf-8');
    const { trainer, courses } = JSON.parse(jsonData);
    if (!trainer || !courses) {
      return res.status(404).json({ error: 'Data not found' });
    }
    // Return only the trainer name and course titles
    res.json({ trainer, courses});
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});
app.use('/api', require('./routes/api'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
