let envPath = __dirname + "/../.env"
require('dotenv').config({path:envPath});
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let db = require('../db')();
chai.should();

chai.use(chaiHttp);

let login_details = {
    name: 'test',
    username: 'email@email.com',
    password: '123@abc'
}

describe('Register, Login and Call Test Collection with Basic Auth and JWT Auth', () => {
   beforeEach((done) => { //Before each test initialize the database to empty
       db.userList = [];
       done();
    })

    after((done) => { //after this test suite empty the database
        db.userList = [];
        done();
    })

    //Test the GET route
    describe('/signup', () => {
        it('it should register, login and check our token', (done) => {
          chai.request(server)
              .post('/signup')
              .send(login_details)
              .end((err, res) =>{
                res.should.have.status(200);
                res.body.success.should.be.eql(true);
                //follow-up to get the JWT token
                chai.request(server)
                    .post('/signin')
                    .send(login_details)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');

                        let token = res.body.token;
                        //console.log('got token ' + token)
                        //lets call a protected API
                        chai.request(server)
                            .put('/testcollection')
                            .set('Authorization', token)
                            .send({echo: ''})
                            .end((err, res) => {
                                res.should.have.status(200);
                                res.body.body.should.have.property('echo');
                                done();
                            })
                    })
              })
        })
    });

   describe('/testcollection fail auth', () => {
      it('delete requires basic auth failed login', (done) => {
          chai.request(server)
              .delete('/testcollection')
              .auth('cu_user', 'cu_rulez1')
              .send({ echo: '' })
              .end((err, res) => {
                  res.should.have.status(401);
                  done();
              })
      });
   });
});
