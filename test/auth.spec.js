const request = require('supertest');
//const server = require('../index'); 
const app = require('../index');
//const prisma = require('../node_modules/.prisma/client');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//Test for Token Generation
const jwt = require('jsonwebtoken');
const { generateToken } = require('../config/jwtToken');

// Mock process.env.JWT_SECRET
process.env.JWT_SECRET = 'test_secret';

describe('Token Generation', () => {
    // afterAll(async () => {
    //     await prisma.$disconnect();
    //     server.close();
    //   });

    it('should generate a valid JWT token', () => {
      const userId = 'testUserId';
      const token = generateToken(userId);
  
      // Verify the token is not empty
      expect(token).toBeTruthy();
  
      // Verify the token is a string
      expect(typeof token).toBe('string');
  
      // Decode the token to verify user details
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // Verify the token contains correct user details
      expect(decoded.userId).toBe(userId);
  
      // Verify the token expires in 1 day (86400 seconds)
      const expiration = decoded.exp - decoded.iat;
      expect(expiration).toBe(86400); // 86400 seconds = 1 day
    });
  });
  
  //Test to Register New user with default organization

describe('POST /auth/register', () => {
    // beforeEach(async () => {
    //     await
    // }) 
  it('should register user successfully with default organization', async () => {
    const email = "dojjjjjjjjjjjjj@example.com"

    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email,
      password: 'password',
      phone: '1234567890',
    };

    const organization = {
        name: `${userData.firstName}'s Organisation`,
        description: `Default organisation for ${userData.firstName}` 
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData);
      
     // console.log(response);
      expect(response.statusCode).toEqual(201);

    // Verify the response structure
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message', 'Registration successful');
    expect(response.body).toHaveProperty('data.accessToken');
    expect(response.body.data.user.email).toEqual(email);

    // Verify default organization details
    // expect(response.data.organization.name).toEqual("John's Organization")
    // expect(response.data.organization.description).toEqual("Default organization for John")
  });
});

describe('POST /auth/register', () => {
    it('should fail if required fields are missing', async () => {
      const incompleteUserData = {
        firstName: 'John',
        lastName: 'Doe',
        // Missing email, password, and phone
      };
  
      const response = await request(app)
        .post('/auth/register')
        .send(incompleteUserData)
        .expect(422);
  
      // Verify the response structure
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(5); // One error for each missing field
  
      // Example: Verify error message for missing email
      const emailError = response.body.errors.find(err => err.field === 'email');
      expect(emailError).toHaveProperty('message', 'Email is required!');
    });
  });

  describe('POST /auth/register', () => {
    it('should fail if there is a duplicate email', async () => {
           const email = "roooooooooooo@example.com"
      // Register the first user
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email,
        password: 'password',
        phone: '1234567890',
      };
  
     const result = await request(app)
        .post('/auth/register')
        .send(userData);

      //console.log(result, 'first');
      expect(result.statusCode).toEqual(201);
  
      // Attempt to register a second user with the same email
      const duplicateUserData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email, // Same email as the first user
        password: 'password',
        phone: '0987654321',
      };
  
      const response = await request(app)
        .post('/auth/register')
        .send(duplicateUserData);

        //console.log(response, 'second');
        expect(response.statusCode).toEqual(422);
  
      // Verify the response structure
      expect(response.body).toHaveProperty('status', 'Bad request');
      expect(response.body).toHaveProperty('message', 'User with this email already exists');
    });
  });

  //Tests for Login
  describe('POST /auth/login', () => {
    it('should log the user in successfully with valid credentials', async () => {
         const email = "ann@gmail.co"
      // First, register a user (assuming registration works as expected)
    //   const registerUserData = {
    //     firstName: 'John',
    //     lastName: 'Doe',
    //     email,
    //     password: 'password',
    //     phone: '1234567890',
    //   };
  
    // const result =  await request(app)
    //     .post('/api/auth/register')
    //     .send(registerUserData);

    //      console.log(result, 'first');
    //      expect(result.statusCode).toEqual(201);
    
  
      // Now, attempt to login with the registered user's credentials
      const loginCredentials = {
        email,
        password: 'ann',
      };
  
      const response = await request(app)
        .post('/auth/login')
        .send(loginCredentials);

        console.log(response, 'second');
        expect(response.statusCode).toEqual(200);
  
      // Verify the response structure
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data.accessToken).toBeDefined();
  
      // Verify user details returned
      expect(response.body.data.user).toEqual({
        firstName: 'Collins',
        lastName: 'ann',
        email,
        phone: '9932260800',
      });
    });
  
    it('should fail to log in with invalid credentials', async () => {
         const email = "kkkkkkkkkkk@example.com"
      // Attempt to login with incorrect password
      const loginCredentials = {
        email,
        password: 'wrongpassword',
      };
  
      const response = await request(app)
        .post('/auth/login')
        .send(loginCredentials);

       // console.log(response, 'third');
        expect(response.statusCode).toEqual(401);
  
      // Verify the response structure
      expect(response.body).toHaveProperty('status', 'Bad request');
      expect(response.body).toHaveProperty('message', 'Authentication failed');
    });
  
    it('should fail to log in with non-existent email', async () => {
        const email = 'iiiiiiiii@example.com'
      // Attempt to login with a non-existent email
      const loginCredentials = {
        email,
        password: 'password',
      };
  
      const response = await request(app)
        .post('/auth/login')
        .send(loginCredentials);

        //console.log(response, 'fourth');
        expect(response.statusCode).toEqual(401);
  
      // Verify the response structure
      expect(response.body).toHaveProperty('status', 'Bad request');
      expect(response.body).toHaveProperty('message', 'Authentication failed');
    });
  });

  //Test Organisation

describe('GET /api/organisations/:orgId', () => {
  let accessToken; 

  beforeAll(async () => {

    async function registerAndLoginUser() {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password',
        phone: '1234567890',
      };

      // Register user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login user to get access token
      const loginCredentials = {
        email: 'john.doe@example.com',
        password: 'password',
      };

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials)
        .expect(200);

      accessToken = loginResponse.body.data.accessToken;
    }

    // Register and login user before tests start
    await registerAndLoginUser();
  });

  it('should allow access to organization data if user is a member', async () => {
    
    const orgId = 'org1';

    const response = await request(app)
      .get(`/api/organisations/${orgId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Verify the response structure
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message', 'Organization retrieved successfully');
    expect(response.body.data.orgId).toEqual(orgId);
    expect(response.body.data.name).toBeDefined();
    expect(response.body.data.description).toBeDefined();
  });

  it('should not allow access to organization data if user is not a member', async () => {
    
    const orgId = 'org2';

    const response = await request(app)
      .get(`/api/organisations/${orgId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    // Verify the response structure
    expect(response.body).toHaveProperty('status', 'Not Found');
    expect(response.body).toHaveProperty('message', 'Organization not found or you do not have access to it');
  });
});

