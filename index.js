var express = require('express');
var bodyParser = require('body-parser');
var User = require('./user-model');

var app = express();

app.use(passport.initialize());

var jsonParser = bodyParser.json();

app.get('/users', function(req, res) {
    User.find({}).then(function(users) {
        res.json(users);
    });
});

app.post('/users', jsonParser, function(req, res) {
    if (!req.body) {
        return res.status(400).json({
            message: "No request body"
        });
    }

    if (!('username' in req.body)) {
        return res.status(422).json({
            message: 'Missing field: username'
        });
    }

    if (typeof req.body.username !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: username'
        });
    }

    var user = new User({
        username: req.body.username
    });

    user.save().then(function(user) {
        res.location('/users/' + user._id).status(201).json({});
    }).catch(function(err) {
        console.log(err);
        res.status(500).send({
            message: 'Internal server error'
        });
    });
});

app.get('/users/:userId', function(req, res) {
    User.findOne({
        _id: req.params.userId
    }).then(function(user) {
        if (!user) {
            res.status(404).json({
                message: 'User not found'
            });
            return;
        }
        res.json(user);
    }).catch(function(err) {
        console.log(err);
        res.status(500).send({
            message: 'Internal server error'
        });
    });
});

app.put('/users/:userId', jsonParser, function(req, res) {
    if (!req.body) {
        return res.status(400).json({
            message: "No request body"
        });
    }

    if (!('username' in req.body)) {
        return res.status(422).json({
            message: 'Missing field: username'
        });
    }

    if (typeof req.body.username !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: username'
        });
    }

    User.findOneAndUpdate({
        _id: req.params.userId
    }, {
        username: req.body.username
    }, {
        upsert: true
    }).then(function(user) {
        res.status(200).json({});
    }).catch(function(err) {
        console.log(err);
        res.status(500).send({
            message: 'Internal server error'
        });
    });
});

app.delete('/users/:userId', function(req, res) {
    User.findOneAndRemove({
        _id: req.params.userId
    }).then(function(user) {
        if (!user) {
            res.status(404).json({
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({});
    }).catch(function(err) {
        console.log(err);
        res.status(500).send({
            message: 'Internal server error'
        });
    });

});

app.get('/messages', function(req, res) {
    var filter = {};
    if ('to' in req.query) {
        filter.to = req.query.to;
    }
    if ('from' in req.query) {
        filter.from = req.query.from;
    }
    Message.find(filter)
        .populate('from')
        .populate('to')
        .then(function(messages) {
            res.json(messages);
        });
});

app.post('/messages', jsonParser, function(req, res) {
    if (!req.body) {
        return res.status(400).json({
            message: "No request body"
        });
    }

    if (!('text' in req.body)) {
        return res.status(422).json({
            message: 'Missing field: text'
        });
    }

    if (typeof req.body.text !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: text'
        });
    }

    if (!('to' in req.body)) {
        return res.status(422).json({
            message: 'Missing field: to'
        });
    }

    if (typeof req.body.to !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: to'
        });
    }

    if (!('from' in req.body)) {
        return res.status(422).json({
            message: 'Missing field: from'
        });
    }

    if (typeof req.body.from !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: from'
        });
    }

    var message = new Message({
        from: req.body.from,
        to: req.body.to,
        text: req.body.text
    });

    var findFrom = User.findOne({
        _id: message.from
    });
    var findTo = User.findOne({
        _id: message.to
    });

    return Promise.all([findFrom, findTo]).then(function(results) {
        if (!results[0]) {
            res.status(422).json({
                message: 'Incorrect field value: from'
            });
            return null;
        }
        else if (!results[1]) {
            res.status(422).json({
                message: 'Incorrect field value: to'
            });
            return null;
        }
        else {
            return message.save()
        }
    }).then(function(user) {
        if (!user) {
            // Incorrect field values - handled above.
            return;
        }
        res.location('/messages/' + message._id).status(201).json({});
    }).catch(function(err) {
        console.log(err);
        res.status(500).send({
            message: 'Internal server error'
        });
    });
});

app.get('/messages/:messageId', function(req, res) {
    Message.findOne({
        _id: req.params.messageId
    })
    .populate('from')
    .populate('to')
    .then(function(message) {
        if (!message) {
            res.status(404).json({
                message: 'Message not found'
            });
            return;
        }
        res.json(message);
    }).catch(function(err) {
        console.log(err);
        res.status(500).send({
            message: 'Internal server error'
        });
    });
});

mongoose.connect('mongodb://localhost/auth').then(function() {
    app.listen(8080);
});
