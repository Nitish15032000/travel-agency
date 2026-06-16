import app from './src/server.js';


app.get('/', (req, res) => {
   res.send('Welcome to the Travel Agency API');
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
