const inquirer = require('inquirer');
const request = require('request');

let FQDN;
let token;

async function execute() {
    const answers = await inquirer.prompt([
        {
            message: 'Please select the protocol',
            choices: ['https', 'http'],
            name: 'protocol',
            default: 'https',
            type: 'list'
        },
        {
            message: 'Please Enter the FQDN',
            name: 'fqdn',
            type: 'input'
        },
        {
            message: 'Please Enter the username of User',
            name: 'username',
            type: 'input'
        },
        {
            message: 'Please Enter the password of User',
            name: 'password',
            type: 'password'
        },
        {
            message: 'Restrict to one App?',
            name: 'oneApp',
            type: 'confirm'
        },
        {
            when: function (ans) {
                return ans.oneApp;
            },
            message: 'Enter App Name',
            name: 'app',
            type: 'input'
        },
        {
            message: 'Only Active Services?',
            name: 'active',
            type: 'confirm'
        },
    ]);
    FQDN = answers.protocol + '://' + answers.fqdn;
    const userData = await login(answers.username, answers.password);
    token = userData.token;
    const filter = {};
    if (answers.active) {
        filter.status = 'Active';
    }
    if (answers.oneApp) {
        filter.app = answers.app;
    }
    const services = await getData('get', '/api/a/sm/service', {
        count: -1,
        select: '_id',
        filter: JSON.stringify(filter)
    });
    const arr = [];
    if (services && services.length > 0) {
        services.forEach(srvc => {
            arr.push(getData('put', `/api/a/sm/${srvc._id}/repair`));
        });
    }
    const result = await Promise.all(arr);
    result.forEach(e => console.log(e));
}
execute().catch(err => {
    console.error(err);
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

function login(username, password) {
    return new Promise((resolve, reject) => {
        request.post(`${FQDN}/api/a/rbac/login`, {
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                username: username,
                password: password
            },
            json: true
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