// Imports the index.js file to be tested.
const server = require('../index.js'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries


// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;


describe('Server!', () => {
 // Sample test case given to test / endpoint.
 it('Returns the default welcome message', done => {
   chai
     .request(server)
     .get('/welcome')
     .end((err, res) => {
       expect(res).to.have.status(200);
       console.log(res);
       expect(res.body.status).to.equals('success');
       assert.strictEqual(res.body.message, 'Welcome!');
       done();
     });
 });
});


 // ===========================================================================
 // TO-DO: Part A Login unit test case



var Cookies;

describe('Testing Login APIs', () => {
   // Sample test case given to test / endpoint.
   it('Successfull Login', done => {
     chai
       .request(server)
       .post('/login')
       .send({username: 'testmatt', password: '123' })
       .redirects(0)
       .end((err, res) => {
        console.log("Cookies" + res.headers['set-cookie']);
        Cookies = res.headers['set-cookie'].pop().split(';')[0];
         expect(res).to.have.status(302);
         expect(res).to.redirectTo('/home');
         done();
       });
   });


   it('Negative Login', done => {
     chai
       .request(server)
       .post('/login')
       .send({username: 'mattfregahgjnd', password: '123' })
       .redirects(0)
       .end((err, res) => {
         expect(res).to.have.status(200);
         expect(res).to.not.redirect;
         done();
       });
   });
 });


describe('Testing home APIs', () => {
  // Test case for successful visit to /home
 it('Should successfully render the home page', done => {
   // Assuming you need to log in to access the home page
   // First log in to obtain a session or token
       chai
       .request(server)
         .get('/home')
         .set('Cookie', Cookies)
         .end((err, res) => {
           expect(res).to.have.status(200);
           expect(res.text).to.include('Welcome'); // Check for some text unique to the home page
           done();
         });
     });
 });





it('Should not render the home page without authentication', done => {
 // Assuming you need to log in to access the home page
 // First log in to obtain a session or token
 // not setting the cookie
     chai
     .request(server)
        .get('/logout')
        .redirects(0)
       .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res).to.redirectTo('/login');
         done();
       });
   });