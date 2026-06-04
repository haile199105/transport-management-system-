import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { LedgerState, IncomeEntry, CostEntry, GlobalComment, Comment } from "./src/types";

const DATA_FILE = path.join(process.cwd(), "ledger_data.json");

const initialLedger: LedgerState = {
  previousNetIncome: 120000, // Reasonable starting default net income
  incomes: [
    {
      id: "inc-1",
      date: "2026-06-01",
      route: "Hawassa to Wolayta Sodo",
      tripType: "One-Way",
      amount: 18500,
      passengers: 45,
      description: "Full trip morning tickets",
      comments: [
        {
          id: "c-1",
          author: "Mr. Amare",
          text: "Very good passenger count today. Let's maintain this.",
          timestamp: "2026-06-01T14:30:00Z"
        }
      ]
    },
    {
      id: "inc-2",
      date: "2026-06-02",
      route: "Hawassa to Butajira",
      tripType: "Round-Trip",
      amount: 14200,
      passengers: 38,
      description: "Afternoon express service",
      comments: []
    }
  ],
  costs: [
    {
      id: "cost-1",
      date: "2026-06-01",
      category: "Fuel",
      amount: 6800,
      description: "60 Liters Diesel fuel refilling",
      comments: []
    },
    {
      id: "cost-2",
      date: "2026-06-01",
      category: "Driver Food",
      amount: 450,
      description: "Lunch and water for driver and conductor",
      comments: []
    },
    {
      id: "cost-3",
      date: "2026-06-02",
      category: "Terminal & Station Cost",
      amount: 800,
      description: "Hawassa terminal exit tax and association fee",
      comments: []
    },
    {
      id: "cost-4",
      date: "2026-06-03",
      category: "Mechanical & Oil",
      amount: 3200,
      description: "Engine Oil replacement & filter clean",
      comments: [
        {
          id: "c-2",
          author: "Mr. Amare",
          text: "Did you use the synthetic oil or regular? Synthetic lasts longer.",
          timestamp: "2026-06-03T09:12:00Z"
        },
        {
          id: "c-3",
          author: "Mr. Haile",
          text: "Yes, we purchased the Premium Synthetic grade oil. Next change matches 5000km.",
          timestamp: "2026-06-03T11:45:00Z"
        }
      ]
    }
  ],
  globalComments: [
    {
      id: "gc-1",
      author: "Mr. Amare",
      text: "Welcome to our new joint dashboard! Haile, always log fuel and driver daily pay immediately so we don't forget.",
      timestamp: "2026-06-03T08:00:00Z"
    }
  ]
};

function readLedger(): LedgerState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("Error reading data file, falling back to initial data:", error);
  }
  return initialLedger;
}

function writeLedger(state: LedgerState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing data to file:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GET Ledger State
  app.get("/api/ledger", (req, res) => {
    const data = readLedger();
    res.json(data);
  });

  // POST update previousNetIncome
  app.post("/api/ledger/previous-income", (req, res) => {
    const { amount } = req.body;
    const ledger = readLedger();
    ledger.previousNetIncome = Number(amount) || 0;
    writeLedger(ledger);
    res.json(ledger);
  });

  // POST Add Income
  app.post("/api/ledger/income", (req, res) => {
    const { date, route, amount, passengers, description, tripType } = req.body;
    if (!route || amount === undefined) {
       res.status(400).json({ error: "Route and amount are required." });
       return;
    }

    const ledger = readLedger();
    const newIncome: IncomeEntry = {
      id: "inc-" + Date.now(),
      date: date || new Date().toISOString().split("T")[0],
      route,
      tripType,
      amount: Number(amount) || 0,
      passengers: passengers ? Number(passengers) : undefined,
      description: description || "",
      comments: []
    };

    ledger.incomes.unshift(newIncome); // Add to local state (top)
    writeLedger(ledger);
    res.json(ledger);
  });

  // DELETE Income
  app.delete("/api/ledger/income/:id", (req, res) => {
    const { id } = req.params;
    const ledger = readLedger();
    ledger.incomes = ledger.incomes.filter(i => i.id !== id);
    writeLedger(ledger);
    res.json(ledger);
  });

  // POST Add Cost
  app.post("/api/ledger/cost", (req, res) => {
    const { date, category, amount, description } = req.body;
    if (!category || amount === undefined) {
       res.status(400).json({ error: "Category and amount are required." });
       return;
    }

    const ledger = readLedger();
    const newCost: CostEntry = {
      id: "cost-" + Date.now(),
      date: date || new Date().toISOString().split("T")[0],
      category,
      amount: Number(amount) || 0,
      description: description || "",
      comments: []
    };

    ledger.costs.unshift(newCost);
    writeLedger(ledger);
    res.json(ledger);
  });

  // DELETE Cost
  app.delete("/api/ledger/cost/:id", (req, res) => {
    const { id } = req.params;
    const ledger = readLedger();
    ledger.costs = ledger.costs.filter(c => c.id !== id);
    writeLedger(ledger);
    res.json(ledger);
  });

  // POST Add Comment to Item or Global board
  app.post("/api/ledger/comment", (req, res) => {
    const { targetType, targetId, text, author } = req.body;
    if (!text || !author) {
       res.status(400).json({ error: "Text and author are required." });
       return;
    }

    const ledger = readLedger();
    const newComment: Comment = {
      id: "c-" + Date.now(),
      author,
      text,
      timestamp: new Date().toISOString()
    };

    if (targetType === "global") {
      const newGlobal: GlobalComment = {
        id: "gc-" + Date.now(),
        author,
        text,
        timestamp: new Date().toISOString()
      };
      ledger.globalComments.push(newGlobal);
    } else if (targetType === "income") {
      const idx = ledger.incomes.findIndex(i => i.id === targetId);
      if (idx !== -1) {
        ledger.incomes[idx].comments.push(newComment);
      } else {
         res.status(404).json({ error: "Income transaction not found." });
         return;
      }
    } else if (targetType === "cost") {
      const idx = ledger.costs.findIndex(c => c.id === targetId);
      if (idx !== -1) {
        ledger.costs[idx].comments.push(newComment);
      } else {
         res.status(404).json({ error: "Cost transaction not found." });
         return;
      }
    } else {
       res.status(400).json({ error: "Invalid target type." });
       return;
    }

    writeLedger(ledger);
    res.json(ledger);
  });

  // POST Reset State
  app.post("/api/ledger/reset", (req, res) => {
    writeLedger(initialLedger);
    res.json(initialLedger);
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express API running on port ${PORT}`);
  });
}

startServer();
