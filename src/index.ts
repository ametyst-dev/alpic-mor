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

app.use(cors());
app.use(express.json());

// --- OpenAPI Spec ---

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Exa Merchant API",
    version: "1.0.0",
    description:
      "Merchant service exposing Exa AI search and answer capabilities. Called by MCP Server Ametyst.",
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
                    default: 5,
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
    "/api/answer": {
      post: {
        summary: "Get an AI-generated answer with citations using Exa AI",
        operationId: "exaAnswer",
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
                    description: "The question to answer",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Exa AI answer with citations",
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
  },
};

// --- Routes ---

app.get("/", (_req, res) => {
  res.json({ name: "Exa Merchant", status: "ok" });
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
      id: "exa-answer",
      name: "Exa Answer",
      description: "Get an AI-generated answer with citations",
      endpoint: "/api/answer",
      method: "POST",
    },
  ]);
});

app.post("/api/search", async (req, res) => {
  try {
    const { query, numResults = 5 } = req.body;

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

app.post("/api/answer", async (req, res) => {
  try {
    const { query } = req.body;

    const response = await axios.post(
      `${EXA_BASE_URL}/answer`,
      { query },
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

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// --- Start ---

app.listen(PORT, () => {
  console.log(`Exa Merchant running on port ${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
  console.log(`OpenAPI spec: http://localhost:${PORT}/openapi.json`);
});
