const express = require('express');
const apiRoutes = require('./routes'); 
const app = express();
const port = 3000;

app.use(express.json());       
app.use('/api', apiRoutes); 

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.listen(port, () => {
    console.log(`Telegram app listening on port ${port}`);
});
