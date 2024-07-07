const { generateToken } = require('../config/jwtToken');
const jwt = require('jsonwebtoken');

describe('Token Generation', () => {
  it('should generate a token with correct user details', () => {
    const userId = 'testUserId';
    const token = generateToken(userId);

    // Verify token expiration
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeDefined();

    // Verify user details in token
    expect(decoded.userId).toEqual(userId);
  });
});


describe('Organization Access', () => {
    it('should retrieve only organizations user has access to', async () => {
      // Mock authenticated user ID
      const authenticatedUserId = 'testUserId';
  
      // Mock organizations data
      const organizations = [
        { orgId: '1', name: 'Org1', description: 'Description1', userId: 'anotherUserId' },
        { orgId: '2', name: 'Org2', description: 'Description2', userId: authenticatedUserId },
      ];
  
      // Mock Prisma findMany function
      prisma.organization.findMany.mockResolvedValue(organizations);
  
      // Call getUserOrganisations function
      const res = await getUserOrganisations({ user: { userId: authenticatedUserId } }, {});
  
      // Verify the response
      expect(res.status).toBe(200);
      expect(res.data.organisations.length).toBe(1);
      expect(res.data.organisations[0].orgId).toBe('2');
    });
  });

  describe('POST /auth/register', () => {
    it('should register user successfully with default organization', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password',
        phone: '1234567890',
      };
  
      const res = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);
  
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.firstName).toBe(userData.firstName);
      expect(res.body.data.organization.name).toBe(`${userData.firstName}'s Organization`);
    });
  });

  describe('POST /auth/register', () => {
    it('should fail registration if required fields are missing', async () => {
      const missingFields = [
        { firstName: 'John' },
      { lastName: 'Doe' },
      {email: 'jane.doe@example.com'},
      {password: 'password'},
     {phone: '1234567890'}
      ];
  
      for (const data of missingFields) {
        const res = await request(app)
          .post('/auth/register')
          .send(data)
          .expect(422);
  
        expect(res.body.errors.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('POST /auth/register', () => {
    it('should fail registration if email is already in use', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: 'password',
        phone: '1234567890',
      };
  
      // Register user with first set of data
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);
  
      // Attempt to register user with same email
      const res = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);
  
      expect(res.body.message).toBe('User with this email already exists');
    });
  });

  