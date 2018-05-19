var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
app.use(bodyParser.urlencoded({
    extended: true
}));
const bcrypt = require('bcrypt-as-promised');

var path = require('path');

var flash = require('express-flash');

app.use(flash());
var session = require('express-session');
app.set('trust proxy', 1);
app.use(session({
    secret: 'penguinsrock',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000
    }
}));
var validate = require('mongoose-validate')

mongoose.connect('mongodb://localhost/loginandreg');

//The Last ID collection has been created in the database before hand
// It looks like this {_id: objectId, user: 0}

mongoose.model('LastId',
    new mongoose.Schema({
        user: Number
    }),
    'lastId');
var Id = mongoose.model('LastId')

var UserSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: [true, 'First name is required field'],
        minlength: [2, 'first name must be at least 2 characters long']
    },
    last_name: {
        type: String,
        required: [true, 'last name is a required field'],
        maxlength: [20, 'last name can not be more than 20 characters']
    },

    email: {
        type: String,
        unique: true,
        required: [true, 'Please enter a valid email'],
        dropDups: [true, 'Email already exists in database'],
        validate: [validate.email, 'is not a valid e-mail address']
    },

    birthday: {
        type: Date,
        required: [true, 'birthday is a required field']
    },
    password: {
        type: String,
        required: [true, 'password is a required field'],
        minlength: [6 , 'Password must be at least 6 characters long']
    },
    user_id: {
        type: Number
    }

}, {
    timestamps: true
});


mongoose.model('User', UserSchema);
var User = mongoose.model('User')

app.use(express.static(path.join(__dirname, './static')));

app.set('views', path.join(__dirname, './views'));

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render('index');
})

app.get('/login', function (req, res) {
    if (req.session.user_id == null){
        res.redirect('/')
    } else {
        res.locals.user_id = req.session.user_id
        res.locals.email = req.session.email
        res.render('login');
    }
    
})


app.post('/registration', function (req, res) {
    console.log("POST DATA", req.body);
    Id.findOne({}, function (err, lastId) {
        if (err) {
            console.log('id problems')
        } else {
            lastId.user += 1
            var user = new User({
                first_name: req.body.f_name,
                last_name: req.body.l_name,
                birthday: req.body.bday,
                email: req.body.email,
                user_id: Number(lastId.user)
            });
            console.log("prossesed info")
            bcrypt.hash(req.body.password, 10)
                .then(hashed => {
                    user.password = hashed;
                    console.log("hashing")
                    user.save(function (err, user) {
                            if (err) {
                                for (var key in err.errors) {
                                    req.flash("form_validation", err.errors[key].message);
                                }
                                return res.redirect("/");
                            } else {
                                lastId.save(function (err, data) {
                                    if (err) {
                                        console.log('error', err)
                                        console.log('not incrementing')
                                    } else {
                                        console.log(data.user)
                                        req.session.user_id = user.user_id;
                                        console.log(user.user_id)
                                        req.session.email = user.email;
                                        res.redirect("/login");
                                    }
                                })
                            }
                        })
                    })
                    .catch(error => {
                        console.log("oops! something went wrong", error);
                        req.flash("form_validation", 'Please re-enter a new password');
                        res.redirect("/");
                    });
        };
    })
})



app.post('/login', function (req, res) {
    User.findOne({ email: req.body.email}, function(err, user){
        if (err) {
            res.redirect("/");
            for (var key in err.errors) {
                req.flash("form_validation", err.errors[key].message);
            }
            return res.redirect("/");
        
        }
        else {
            bcrypt.compare(req.body.password, user.password)
                .then(result => {
                    req.session.user_id = user.user_id;
                    req.session.email = user.email;
                    res.redirect("/login");
                })
                .catch(error => {
                    console.log("oops! something went wrong", error);
                    
                    req.flash("form_validation", 'Either Username or Password is Incorrect');
                    res.redirect("/");
                });
        }
    });
});

app.listen(8000, function () {
    console.log("listening on port 8000");
})