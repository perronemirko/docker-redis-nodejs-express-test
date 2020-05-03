const express = require('express');
const app = express();
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);
// set response function 
const setRedisResponse = (username, repos) => `<h2>${username} has ${repos} GitHub repos</h2>`;

// make request to Github fot data
const getRepos = async (req, res, next) => {
    try {
        console.log('Fetching Data...');
        const {username} = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`);
        
        const data = await response.json();

        const repos = data.public_repos;
        //Set Resdi cache with expiration date 
        client.setex(username, 20, repos);


        res.send(setRedisResponse(username, repos));

    } catch (error) {
        console.error(error);
        res.status(500);
    }
}

// Cache Middleware

function redisCache(req, res, next){
    const { username } = req.params;
    client.get(username, (err, data)=>{
        if (err) throw err;
        if (data !== null) {
            res.send(setRedisResponse(username, data));
        } else {
            next();
        }
    });
}


app.get('/repos/:username', redisCache, getRepos)
app.listen(PORT, () => console.log(`Example app listening on http://localhost:${PORT} port!`))