app.post("/registration", function(req, res){
    console.log("got info")
    lastId.user += 1
    var user = new User({
        first_name: req.body.f_name,
        last_name: req.body.l_name,
        birthday: req.body.bday,
        email: req.body.email,
        user_id: lastId.user
    });
    console.log("prossesed info")
    bcrypt.hash(req.body.password, 10)
    .then( hashed => {
        user.password = hashed;
        console.log("hashing")
        user.save(function (err, user) {
            console.log("saved")
            if (err) {
                for (var key in err.errors) {
                    req.flash("form_validation", err.errors[key].message);
                }
                res.redirect("/");
            }
            else {
                lastId.save(function(err){ console.log('not incrementing')})
                req.session.id = user.user_id;
                req.session.email = user.email;
                console.log(user.email)
                res.redirect("/");
            }
    })
    .catch(error => {
        console.log("oops! something went wrong", error);
        req.flash("user", error.message);
        res.redirect("/");
        });  
    });
});   

app.post('/login', (req, res) => {
    console.log(" req.body: ", req.body);
    User.findOne({ email: req.body.email}, function(err, user){
        if (err) {
            res.redirect("/");
        }
        else {
            bcrypt.compare(req.body.password, user.password)
                .then(result => {
                    req.session.id = user.user_id;
                    req.session.email = user.email;
                    res.rendirect("/");
                })
                .catch(error => {
                    console.log("oops! something went wrong", error);
                    req.flash("user", error.message);
                    res.redirect("/");
                });
            
        }
    });
});