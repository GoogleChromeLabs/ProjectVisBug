const { spawn, exec } = require('child_process')

const server  = spawn('npm run dev:server', {shell:true})

exec('npm test', (error, stdout, stderr) => 
  error
    ? server.kill(error)
    : console.log(stdout))

server.kill('SIGHUP')