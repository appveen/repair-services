const request = require('request');

const FQDN = process.argv[2];
const username = process.argv[3];
const password = process.argv[4];


if (!FQDN || !username || !password) {
    console.log('Please provide FQDN with protocol, Superadmin Username and Password as arguments');
    process.exit(0);
}

let token;

request.post(`${FQDN}/api/a/rbac/login`, {
    headers: {
        'Content-Type': 'application/json'
    },
    body: {
        username: username,
        password: password
    },
    json: true
}, (err1, res1, body1) => {
    if (err1) {
        console.error(err1);
        process.exit(0);
    }
    token = body1.token;
    async function execute() {
        const services = await getData('get', '/api/a/sm/service', {
            count: -1,
            select: '_id',
            filter: JSON.stringify({
                status: 'Active'
            })
        });
        const arr = [];
        if(services && services.length > 0){
            services.forEach(srvc => {
                arr.push(getData('put',`/api/a/sm/${srvc._id}/repair`));
            });
        }
        const result = await Promise.all(arr);
        console.log(result);
    }
    execute().catch(err => {
        console.error(err);
    });
});


function getData(method, path, qs) {
    return new Promise((resolve, reject) => {
        request(`${FQDN}${path}`, {
            method,
            json: true,
            headers: {
                'Authorization': 'JWT ' + token,
                'Content-Type': 'application/json'
            },
            qs: qs
        }, (err, res, body) => {
            if (err) {
                reject(err);
            } else if (res.statusCode === 200 || res.statusCode === 202) {
                resolve(body);
            } else {
                reject(body);
            }
        });
    });
}