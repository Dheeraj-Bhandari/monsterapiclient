import { MonsterApiClient } from './index';

const func = new MonsterApiClient('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6IjU0MzNmYmYxOTNlODc4NDQyMGJhODE2ODVhMGFjMTkzIiwiY3JlYXRlZF9hdCI6IjIwMjMtMDctMjhUMTk6MTA6MDMuMDYzNDEyIn0.VoMDVoHJRywG62bSpLxLKT5yZbnPqET-Cv991IYs0zA')
func.uploadFile(__dirname + '/dheeraj.png').then((result) => {
    console.log(result)
}).catch((err) => console.log('err------------------------------', err))