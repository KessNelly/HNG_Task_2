const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {generateToken} = require("../config/jwtToken")


// POST /auth/register
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Validation of fields
  if ( !firstName || !lastName || !email || !password || !phone) {
    return res.status(422).json(
        { 
            errors:
             [
                // { field: "userId",
                //   message: "userId is required!" 
                // },
                { field: "firstName",
                  message: "First Name is required!"
                },
                { field: "lastName",
                  message: "Last Name is required!" 
                },
                { field: "email",
                  message: "Email is required!" 
                },
                { field: "password",
                  message: "Password is required!" 
                },
                { field: "phone",
                  message: "Phone number is required!" 
                }
            ] 
        }
    );
  }


  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(422).json({
        status: 'Bad request',
        message: 'User with this email already exists',
        statusCode: 422,
      });
    }

     // Hash the password
     const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
      },
    });

    // Create a default organization for the user
    const newOrganisation = await prisma.organization.create({
      data: {
       // orgId:,
        name: `${firstName}'s Organisation`,
        description: `Default organisation for ${firstName}`,
        userId: newUser.userId,
      },
    });

    //Generate token
    const accessToken = generateToken(newUser.userId);

    // Return success response
    return res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        accessToken,
        user: {
          userId: newUser.userId,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
        },
        // organization: {
        //     orgId: newOrganization.orgId,
        //     name: newOrganization.name,
        //     description: newOrganization.description,
        //   },
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(400).json({
      status: 'Bad request',
      message: 'Registration unsuccessful',
      statusCode: 400,
    });
  }
};


// POST /auth/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({ message: "Email and Password are required" });
      }
  
    try {
      // Check if the user exists
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });
  
      if (!user) {
        return res.status(401).json({
          status: 'Bad request',
          message: 'Authentication failed',
          statusCode: 401,
        });
      }
  
      // Validate password
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ 
          errors: [{
               field: "password",
               message: "Incorrect password" 
              }]
           });
      }
  
      // If login is successful, create and return accessToken
      const accessToken = generateToken(user.userId); 
  
      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          accessToken: accessToken,
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          },
        },
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      return res.status(401).json({
        status: 'Bad request',
        message: 'Authentication failed',
        statusCode: 401,
      });
    }
  };
  
  // GET /api/users/:id (Protected route)
const getUser = async (req, res) => {

    const userId = req.params.userId;
    const authenticatedUserId = req.user.userId; // Assuming you have middleware to extract authenticated user details
  
    try {
      // Check if the requested user is the authenticated user or is part of their organizations
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            {
              userId: userId,
            },
            {
              userId: authenticatedUserId,
              organizations: {
                some: {
                  userId: userId,
                },
              },
            },
          ],
        },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });
  
      if (!user) {
        return res.status(404).json({
          status: 'Not Found',
          message: 'User not found or unauthorized to access this user',
        });
      }
  
      return res.status(200).json({
        status: 'success',
        message: 'User details retrieved successfully',
        data: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
        }
      });
    } catch (error) {
      console.error('Error retrieving user details:', error);
      return res.status(500).json({
        status: 'Internal Server Error',
        message: 'Failed to retrieve user details',
      });
    }
  };

// GET /api/organisations (Protected route)
const getUserOrganisations = async (req, res) => {
  const authenticatedUserId = req.user.userId; 

  try {
    // Retrieve organisations where the user is either the creator or a member
    const userOrganisations = await prisma.organization.findMany({
      where: {
        OR: [
          {
            userId: authenticatedUserId,
         },
         {
            members: {
            some: {
            userId: authenticatedUserId,
          },
        },
     },
    ],
      },
      select: {
        orgId: true,
        name: true,
        description: true,
      },
    });

    // Construct the response
    const organisations = userOrganisations.map(org => ({
        orgId: org.orgId,
        name: org.name,
        description: org.description,
      }));

    return res.status(200).json({
      status: 'success',
      message: 'User organisations retrieved successfully',
      data: {
        organisations: organisations,
      },
    });
  } catch (error) {
    console.error('Error retrieving user organisations:', error);
    return res.status(500).json({
      status: 'Internal Server Error',
      message: 'Failed to retrieve user organisations',
    });
  }
};


// GET /api/organisations/:orgId (Protected route)
const getOrganizationById = async (req, res) => {
    const authenticatedUserId = req.user.userId;
    const { orgId } = req.params.orgId;
  
    try {
      // Check if the organization exists and if the user has access to it
      const organization = await prisma.organization.findFirst({
        where: {
          orgId: orgId,
          OR: [
            {
              userId: authenticatedUserId,
            },
            {
              members: {
                some: {
                  userId: authenticatedUserId,
                },
              },
            },
          ],
        },
        select: {
          orgId: true,
          name: true,
          description: true,
        },
      });
  
      if (!organization) {
        return res.status(404).json({
          status: 'Not Found',
          message: 'Organization not found or you do not have access to it',
        });
      }
  
      // Return the organization details
      return res.status(200).json({
        status: 'success',
        message: 'Organisation retrieved successfully',
        data: {
          orgId: organization.orgId,
          name: organization.name,
          description: organization.description,
        },
      });
    } catch (error) {
      console.error('Error retrieving organization:', error);
      return res.status(500).json({
        status: 'Internal Server Error',
        message: 'Failed to retrieve organization',
      });
    }
  };
  
  // POST /api/organisations (Protected route)
const createOrganization = async (req, res) => {
    const authenticatedUserId = req.user.userId;
    const { name, description } = req.body;
  
    // Validate request body
    if (!name) {
      return res.status(400).json({
        status: 'Bad Request',
        message: 'Client Error',
        statusCode: 400,
      });
    }
  
    try {
      // Create the organization
      const newOrganization = await prisma.organization.create({
        data: {
          name,
          description,
          userId: authenticatedUserId,
        },
        select: {
          orgId: true,
          name: true,
          description: true,
        },
      });
  
      // Return success response
      return res.status(201).json({
        status: 'success',
        message: 'Organisation created successfully',
        data: {
          orgId: newOrganization.orgId,
          name: newOrganization.name,
          description: newOrganization.description,
        },
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      return res.status(400).json({
        status: 'Bad Request',
        message: 'Client Error',
        statusCode: 400,
      });
    }
  };
  
  // POST /api/organisations/:orgId/users (Protected route)
const addUserToOrganization = async (req, res) => {
    const { orgId } = req.params;
    const { userId } = req.body;
  
    try {
      // Check if the organization exists
      const organization = await prisma.organization.findUnique({
        where: { orgId },
      });
  
      if (!organization) {
        return res.status(404).json({
          status: 'error',
          message: 'Organization not found',
        });
      }
  
      // Check if the user exists
      const user = await prisma.user.findUnique({
        where: { userId },
      });
  
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }
  
      // Create a new entry in UserOrganization
      await prisma.userOrganization.create({
        data: {
          userId,
          orgId,
        },
      });
  
      return res.status(200).json({
        status: 'success',
        message: 'User added to organisation successfully',
      });
    } catch (error) {
      console.error('Error adding user to organization:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to add user to organization',
      });
    }
}
  
  

module.exports = {
  registerUser,
  loginUser,
  getUser,
  getUserOrganisations,
  getOrganizationById,
  createOrganization,
  addUserToOrganization
};
