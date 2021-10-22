# shapi
A tiny http router for Node.js

# example
```javascript
const Shapi = require(`shapi`)
const { logger } = require('shapi/lib/std/mw/logger')
const { html, json, redirect } = require('shapi/std/replies')
const { readFileSync } = require(`fs`)

let users = JSON.parse(readFileSync('users.json').toString())

let api = new Shapi

// api.use(logger('[api]'))

const endpoint = api.with('users')

endpoint.with('/get')
    .on('/')
        .do(()=>json(users))
    .on('{id: int}')
        .do(id =>{
            return json({user: users[id]})
        } )
    .on('{data: string}')
        .do(data => {
            data = data.toLowerCase()
            let result = []
            for(let id in users) {
                let user = users[id]
                if(user.name.toLowerCase().includes(data) || 
                    user.surname.toLowerCase().includes(data)) {
                    result.push(user)
                }
            }
            return json(result)
        })
    .on('{name:string}/{surname: string}')
        .do((name, surname) => {
            let result = []
            for(let id in users) {
                let user = users[id]
                if(user.surname == surname && user.name == name)
                    result.push(user)
            }
            return json(result)
        })

endpoint.with('/create')
    .on('{name: string}/{surname: string}')
        .do((name, surname) => {
            const ids = Object.keys(users)
            const id = parseInt(ids[ids.length-1]) + 1
            
            users[id] = {
                id, name, surname
            }

            return redirect(`/users/get/${id}`)
        })

api.on('timeout/{ms: int}')
    .do(ms => {
        return new Promise(
            ok => setTimeout(
                    ()=>ok(json({})), ms
                )
            )
    })

api.run()
```
