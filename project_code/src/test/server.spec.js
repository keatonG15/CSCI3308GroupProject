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
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

  // ===========================================================================
  // TO-DO: Part A Login unit test case


describe('server', () => {
    // Sample test case given to test / endpoint.
    it('Successfull Login', done => {
      chai
        .request(server)
        .post('/login')
        .send({username: 'matt', password: '123' })
        .redirects(0)
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  
});


// describe('server', () => {
//     // Sample test case given to test / endpoint.
//     it('Negative Login', done => {
//       chai
//         .request(server)
//         .post('/login')
//         .end((err, res) => {
//           expect(res).to.have.status(200);
//           assert.strictEqual(res.body.message, 'Invalid Input');
//           done();
//         });
//     });
  
// });



