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
      url: process.env.API_BASE_URL || "http://localhost:5000",
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

      ResetPasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: {
            type: "string",
            example: "Password1!"
          },
          newPassword: {
            type: "string",
            example: "NewPassword2!",
            description:
              "At least 8 characters with at least one number and one symbol."
          }
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
            example: [
              "https://res.cloudinary.com/dxvfxbine/image/upload/example.jpg"
            ]
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
      },

      InquiryMessage: {
        type: "object",
        properties: {
          _id: { type: "string" },
          listing: { type: "object" },
          buyer: { type: "object" },
          seller: { type: "object" },
          sender: { type: "object" },
          message: {
            type: "string",
            example: "Yes, it is still available."
          },
          status: {
            type: "string",
            enum: ["new", "read", "closed"]
          },
          createdAt: { type: "string", format: "date-time" }
        }
      },

      InquiryThread: {
        type: "object",
        properties: {
          threadId: { type: "string" },
          listing: { type: "object" },
          buyer: { type: "object" },
          seller: { type: "object" },
          otherUser: { type: "object" },
          currentUserRole: {
            type: "string",
            enum: ["buyer", "seller"]
          },
          messages: {
            type: "array",
            items: { $ref: "#/components/schemas/InquiryMessage" }
          }
        }
      },

      AiDescriptionRequest: {
        type: "object",
        required: ["title", "category", "condition", "price"],
        properties: {
          title: {
            type: "string",
            example: "Used Calculus Textbook"
          },
          category: {
            type: "string",
            example: "textbooks"
          },
          condition: {
            type: "string",
            example: "used"
          },
          price: {
            type: "number",
            example: 35
          },
          notes: {
            type: "string",
            example: "Some highlighting"
          }
        }
      },

      AiDescriptionResponse: {
        type: "object",
        properties: {
          description: {
            type: "string",
            example:
              "Used calculus textbook in good condition with some highlighting. It is a practical and affordable option for a student who needs a course copy without paying full retail price. Available for $35."
          },
          generatedFrom: {
            type: "object",
            properties: {
              title: { type: "string", example: "Used Calculus Textbook" },
              category: { type: "string", example: "textbooks" },
              condition: { type: "string", example: "used" },
              price: { type: "number", example: 35 },
              notes: { type: "string", example: "Some highlighting" }
            }
          }
        }
      },

      ImageUploadResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Image uploaded successfully"
          },
          image: {
            type: "object",
            properties: {
              url: {
                type: "string",
                example:
                  "https://res.cloudinary.com/dxvfxbine/image/upload/campuscart/listings/example.jpg"
              },
              publicId: {
                type: "string",
                example: "campuscart/listings/example"
              },
              width: {
                type: "number",
                example: 1200
              },
              height: {
                type: "number",
                example: 800
              },
              format: {
                type: "string",
                example: "jpg"
              },
              bytes: {
                type: "number",
                example: 240000
              }
            }
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
          200: { description: "API running with detected runtime and email verification mode" }
        }
      }
    },

    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: { description: "Backend health check with detected runtime and email verification mode" }
        }
      }
    },

    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new student account",
        description:
          "Creates a student account and hashes the password. Locally, it sends a verification email. On Render, the account is automatically verified because email delivery is disabled for this deployment.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          201: { description: "User registered; verification email sent locally or automatically verified on Render" },
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

    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user",
        description:
          "Invalidates all JWTs previously issued to the logged-in user by incrementing tokenVersion. The frontend must also remove its stored bearer token.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Logout successful and existing tokens invalidated" },
          401: { description: "Unauthorized or token already invalidated" },
          500: { description: "Logout failed" }
        }
      }
    },

    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset the logged-in user's password",
        description:
          "Requires the current password. On success, the password is replaced and all existing JWTs are invalidated. Works locally and on Render without sending email.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" }
            }
          }
        },
        responses: {
          200: { description: "Password reset successfully; log in again" },
          400: { description: "Missing, weak, or reused new password" },
          401: { description: "Unauthorized or current password is incorrect" },
          404: { description: "User not found" },
          500: { description: "Password reset failed" }
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

    "/api/uploads/listing-image": {
      post: {
        tags: ["Uploads"],
        summary: "Upload listing image to Cloudinary",
        description:
          "Uploads a single image to Cloudinary and returns the secure image URL. Use form-data with key named image.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    format: "binary"
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Image uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ImageUploadResponse"
                }
              }
            }
          },
          400: { description: "No image uploaded or invalid file type" },
          401: { description: "Unauthorized" },
          500: { description: "Cloudinary upload failed" }
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
            name: "sortBy",
            in: "query",
            schema: { type: "string" },
            example: "createdAt"
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string" },
            example: "desc"
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
          200: { description: "Listings returned" },
          500: { description: "Failed to fetch listings" }
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
          400: { description: "Failed to create listing" },
          401: { description: "Unauthorized" }
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
          401: { description: "Unauthorized" },
          500: { description: "Failed to fetch your listings" }
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
          401: { description: "Unauthorized" },
          500: { description: "Failed to fetch saved listings" }
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
          404: { description: "Listing not found" },
          500: { description: "Failed to fetch listing" }
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
          400: { description: "Failed to update listing" },
          401: { description: "Unauthorized" },
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
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Listing not found" },
          500: { description: "Failed to delete listing" }
        }
      }
    },

    "/api/listings/{id}/images": {
      post: {
        tags: ["Listings"],
        summary: "Upload image and save URL to listing",
        description:
          "Uploads a single image to Cloudinary and pushes the returned secure URL into the listing imageUrls array. Use form-data with key named image.",
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
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    format: "binary"
                  }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Image uploaded and saved to listing" },
          400: { description: "No image uploaded or invalid file type" },
          401: { description: "Unauthorized" },
          403: { description: "Not listing owner or admin" },
          404: { description: "Listing not found" },
          500: { description: "Cloudinary upload failed" }
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
          401: { description: "Unauthorized" },
          404: { description: "Listing not found" },
          500: { description: "Failed to save listing" }
        }
      }
    },

    "/api/inquiries/unread-count": {
      get: {
        tags: ["Inquiries"],
        summary: "Get unread inquiry message count",
        description:
          "Returns the number of unread messages sent to the logged-in user. Opening a conversation marks its incoming messages as read.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Unread message count returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    unreadCount: { type: "integer", example: 2 }
                  }
                }
              }
            }
          },
          401: { description: "Unauthorized" },
          500: { description: "Failed to fetch unread inquiry count" }
        }
      }
    },

    "/api/inquiries/threads": {
      get: {
        tags: ["Inquiries"],
        summary: "Get grouped inquiry conversations",
        description:
          "Returns one thread per listing, buyer, and seller. Messages from the same buyer about the same listing are grouped together.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Conversation summaries returned" },
          401: { description: "Unauthorized" },
          500: { description: "Failed to fetch inquiry conversations" }
        }
      }
    },

    "/api/inquiries/threads/{threadId}": {
      get: {
        tags: ["Inquiries"],
        summary: "Get one inquiry conversation",
        description:
          "Returns all messages in a conversation and marks unread incoming messages as read.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "threadId",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Conversation returned" },
          401: { description: "Unauthorized" },
          403: { description: "Not a participant in this conversation" },
          404: { description: "Conversation not found" },
          500: { description: "Failed to fetch conversation" }
        }
      }
    },

    "/api/inquiries/threads/{threadId}/messages": {
      post: {
        tags: ["Inquiries"],
        summary: "Reply in an inquiry conversation",
        description:
          "Allows either the buyer or seller in the thread to send a reply. The message is added to the same conversation.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "threadId",
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
          201: { description: "Reply sent" },
          400: { description: "Invalid message" },
          401: { description: "Unauthorized" },
          403: { description: "Not a participant in this conversation" },
          404: { description: "Conversation not found" }
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
          401: { description: "Unauthorized" },
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
          200: { description: "Received inquiries returned" },
          401: { description: "Unauthorized" },
          500: { description: "Failed to fetch received inquiries" }
        }
      }
    },

    "/api/inquiries/sent": {
      get: {
        tags: ["Inquiries"],
        summary: "Get inquiries sent by buyer",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Sent inquiries returned" },
          401: { description: "Unauthorized" },
          500: { description: "Failed to fetch sent inquiries" }
        }
      }
    },

    "/api/ai/generate-description": {
      post: {
        tags: ["AI"],
        summary: "Generate an editable product description",
        description:
          "Uses the existing listing title, category, condition, price, and optional seller notes to create a short description. The API key remains on the backend.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AiDescriptionRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Description generated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AiDescriptionResponse" }
              }
            }
          },
          400: { description: "Required listing data is invalid or missing" },
          401: { description: "Unauthorized" },
          403: { description: "Email verification required" },
          502: { description: "AI provider request failed" },
          503: { description: "GEMINI_API_KEY is not configured" },
          504: { description: "AI provider request timed out" }
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
          401: { description: "Unauthorized" },
          403: { description: "Admin only" },
          500: { description: "Failed to fetch metrics" }
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
          401: { description: "Unauthorized" },
          403: { description: "Admin only" },
          500: { description: "Failed to fetch users" }
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
          400: { description: "Admin cannot deactivate their own account" },
          401: { description: "Unauthorized" },
          403: { description: "Admin only" },
          404: { description: "User not found" },
          500: { description: "Failed to deactivate user" }
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
          401: { description: "Unauthorized" },
          403: { description: "Admin only" },
          500: { description: "Failed to fetch listings" }
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
          401: { description: "Unauthorized" },
          403: { description: "Admin only" },
          404: { description: "Listing not found" },
          500: { description: "Failed to remove listing" }
        }
      }
    }
  }
};

module.exports = swaggerDocument;