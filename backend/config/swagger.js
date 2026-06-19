const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "CampusCart API",
    version: "1.0.0",
    description:
      "Backend API documentation for CampusCart campus buy-and-sell marketplace."
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Garry Sangha" },
          email: { type: "string", example: "garrysangha@dal.ca" },
          password: { type: "string", example: "Password1!" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "garrysangha@dal.ca" },
          password: { type: "string", example: "Password1!" }
        }
      },
      ResendVerificationRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", example: "garrysangha@dal.ca" }
        }
      },
      ListingRequest: {
        type: "object",
        required: ["title", "description", "price", "category", "condition"],
        properties: {
          title: { type: "string", example: "Used Calculus Textbook" },
          description: {
            type: "string",
            example: "Good condition textbook for first-year calculus."
          },
          price: { type: "number", example: 35 },
          category: {
            type: "string",
            enum: [
              "textbooks",
              "electronics",
              "furniture",
              "clothing",
              "school supplies",
              "other"
            ],
            example: "textbooks"
          },
          condition: {
            type: "string",
            enum: ["new", "like new", "used", "fair"],
            example: "used"
          },
          imageUrls: {
            type: "array",
            items: { type: "string" },
            example: ["https://example.com/book.jpg"]
          }
        }
      },
      InquiryRequest: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            example: "Hi, is this textbook still available?"
          }
        }
      }
    }
  },
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "API root",
        responses: {
          200: { description: "API running" }
        }
      }
    },
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: { description: "Backend health check" }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new student account",
        description:
          "Creates a student account, hashes the password, creates an email verification token, and sends a verification email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          201: { description: "User registered and verification email sent" },
          400: { description: "Registration failed" }
        }
      }
    },
    "/api/auth/verify-email/{token}": {
      get: {
        tags: ["Auth"],
        summary: "Verify user email",
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Email verified" },
          400: { description: "Invalid or expired token" }
        }
      }
    },
    "/api/auth/resend-verification": {
      post: {
        tags: ["Auth"],
        summary: "Resend verification email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ResendVerificationRequest"
              }
            }
          }
        },
        responses: {
          200: { description: "Verification email sent" },
          400: { description: "Email already verified" },
          404: { description: "User not found" }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        description:
          "Only verified and active users can log in. Returns JWT token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid email or password" },
          403: { description: "Email not verified" }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current logged-in user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Current user returned" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/listings": {
      get: {
        tags: ["Listings"],
        summary: "Get all active listings",
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            example: "calculus"
          },
          {
            name: "category",
            in: "query",
            schema: { type: "string" },
            example: "textbooks"
          },
          {
            name: "condition",
            in: "query",
            schema: { type: "string" },
            example: "used"
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer" },
            example: 1
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer" },
            example: 10
          }
        ],
        responses: {
          200: { description: "Listings returned" }
        }
      },
      post: {
        tags: ["Listings"],
        summary: "Create a listing",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ListingRequest" }
            }
          }
        },
        responses: {
          201: { description: "Listing created" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/listings/{id}": {
      get: {
        tags: ["Listings"],
        summary: "Get listing by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Listing returned" },
          404: { description: "Listing not found" }
        }
      },
      put: {
        tags: ["Listings"],
        summary: "Update listing by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ListingRequest" }
            }
          }
        },
        responses: {
          200: { description: "Listing updated" },
          403: { description: "Forbidden" },
          404: { description: "Listing not found" }
        }
      },
      delete: {
        tags: ["Listings"],
        summary: "Soft delete listing by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Listing removed" },
          403: { description: "Forbidden" },
          404: { description: "Listing not found" }
        }
      }
    },
    "/api/listings/my/listings": {
      get: {
        tags: ["Listings"],
        summary: "Get logged-in user's listings",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "User listings returned" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/listings/{id}/save": {
      post: {
        tags: ["Saved Listings"],
        summary: "Save or unsave a listing",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Listing saved or removed from saved listings" },
          404: { description: "Listing not found" }
        }
      }
    },
    "/api/listings/saved/me": {
      get: {
        tags: ["Saved Listings"],
        summary: "Get logged-in user's saved listings",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Saved listings returned" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/inquiries/listings/{listingId}": {
      post: {
        tags: ["Inquiries"],
        summary: "Send inquiry for a listing",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "listingId",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InquiryRequest" }
            }
          }
        },
        responses: {
          201: { description: "Inquiry sent" },
          400: { description: "Invalid inquiry" },
          404: { description: "Listing not found" }
        }
      }
    },
    "/api/inquiries/received": {
      get: {
        tags: ["Inquiries"],
        summary: "Get inquiries received by seller",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Received inquiries returned" }
        }
      }
    },
    "/api/inquiries/sent": {
      get: {
        tags: ["Inquiries"],
        summary: "Get inquiries sent by buyer",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Sent inquiries returned" }
        }
      }
    },
    "/api/admin/metrics": {
      get: {
        tags: ["Admin"],
        summary: "Get admin dashboard metrics",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Metrics returned" },
          403: { description: "Admin only" }
        }
      }
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Get all users",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Users returned" },
          403: { description: "Admin only" }
        }
      }
    },
    "/api/admin/listings": {
      get: {
        tags: ["Admin"],
        summary: "Get all listings including removed listings",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Admin listings returned" },
          403: { description: "Admin only" }
        }
      }
    },
    "/api/admin/users/{id}/deactivate": {
      patch: {
        tags: ["Admin"],
        summary: "Deactivate user",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "User deactivated" },
          403: { description: "Admin only" },
          404: { description: "User not found" }
        }
      }
    },
    "/api/admin/listings/{id}/remove": {
      patch: {
        tags: ["Admin"],
        summary: "Remove listing as admin",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Listing removed" },
          403: { description: "Admin only" },
          404: { description: "Listing not found" }
        }
      }
    }
  }
};

module.exports = swaggerDocument;