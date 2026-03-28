import express from "express";
import cors from "cors";
import axios from "axios";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const EXA_API_KEY = process.env.EXA_API_KEY;
const EXA_BASE_URL = "https://api.exa.ai";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

app.use(cors());
app.use(express.json());

// --- OpenAPI Spec ---

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Ametyst Merchant API",
    version: "1.0.0",
    description:
      "Merchant service exposing AI services (Exa, Firecrawl, Resend). Called by MCP Server Ametyst.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/": {
      get: {
        summary: "Health check",
        operationId: "healthCheck",
        responses: {
          "200": {
            description: "Service status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/services": {
      get: {
        summary: "List available services",
        operationId: "listServices",
        responses: {
          "200": {
            description: "Catalog of available services",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      description: { type: "string" },
                      endpoint: { type: "string" },
                      method: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/search": {
      post: {
        summary: "Search the web using Exa AI",
        operationId: "exaSearch",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["query"],
                properties: {
                  query: {
                    type: "string",
                    description: "The search query",
                  },
                  numResults: {
                    type: "integer",
                    description: "Number of results to return (default: 5)",
                    default: 10,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Exa search results",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          "500": {
            description: "Error calling Exa API",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    details: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/find-similar": {
      post: {
        summary: "Find web pages similar to a given URL using Exa AI",
        operationId: "exaFindSimilar",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: {
                    type: "string",
                    description: "The reference URL to find similar pages for",
                  },
                  numResults: {
                    type: "integer",
                    description: "Number of results to return (default: 5)",
                    default: 10,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Similar pages found by Exa",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          "500": {
            description: "Error calling Exa API",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    details: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/scrape": {
      post: {
        summary: "Scrape a webpage and get clean content using Firecrawl",
        operationId: "firecrawlScrape",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: {
                    type: "string",
                    description: "The URL of the webpage to scrape",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Scraped webpage content",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          "500": {
            description: "Error calling Firecrawl API",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    details: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/send-email": {
      post: {
        summary: "Send an email using Resend",
        operationId: "resendSendEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["to", "subject", "text"],
                properties: {
                  to: {
                    type: "string",
                    description: "Recipient email address",
                  },
                  subject: {
                    type: "string",
                    description: "Email subject line",
                  },
                  text: {
                    type: "string",
                    description: "Email body text",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Email sent successfully",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          "500": {
            description: "Error sending email",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    details: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// --- Routes ---

app.get("/", (_req, res) => {
  res.json({ name: "Ametyst Merchant", status: "ok" });
});

app.get("/services", (_req, res) => {
  res.json([
    {
      id: "exa-search",
      name: "Exa Search",
      description: "Search the web using Exa AI neural search",
      endpoint: "/api/search",
      method: "POST",
    },
    {
      id: "exa-find-similar",
      name: "Exa Find Similar",
      description: "Find web pages similar to a given URL",
      endpoint: "/api/find-similar",
      method: "POST",
    },
    {
      id: "resend-email",
      name: "Resend Email",
      description: "Send an email to any recipient",
      endpoint: "/api/send-email",
      method: "POST",
    },
    {
      id: "firecrawl-scrape",
      name: "Firecrawl Scrape",
      description: "Scrape a webpage and get clean markdown content",
      endpoint: "/api/scrape",
      method: "POST",
    },
  ]);
});

app.post("/api/search", async (req, res) => {
  try {
    const { query, numResults = 10 } = req.body;

    const response = await axios.post(
      `${EXA_BASE_URL}/search`,
      { query, numResults },
      { headers: { "x-api-key": EXA_API_KEY } }
    );

    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({
      error: "Exa API call failed",
      details: err.response?.data || err.message,
    });
  }
});

app.post("/api/find-similar", async (req, res) => {
  try {
    const { url, numResults = 10 } = req.body;

    const response = await axios.post(
      `${EXA_BASE_URL}/findSimilar`,
      { url, numResults },
      { headers: { "x-api-key": EXA_API_KEY } }
    );

    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({
      error: "Exa API call failed",
      details: err.response?.data || err.message,
    });
  }
});

app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "Ametyst <onboarding@resend.dev>",
        to,
        subject,
        text,
      },
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } }
    );

    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({
      error: "Resend API call failed",
      details: err.response?.data || err.message,
    });
  }
});

app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;

    const response = await axios.post(
      `${FIRECRAWL_BASE_URL}/scrape`,
      { url, formats: ["markdown"] },
      { headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}` } }
    );

    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({
      error: "Firecrawl API call failed",
      details: err.response?.data || err.message,
    });
  }
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// --- Start ---

app.listen(PORT, () => {
  console.log(`Ametyst Merchant running on port ${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
  console.log(`OpenAPI spec: http://localhost:${PORT}/openapi.json`);
});
