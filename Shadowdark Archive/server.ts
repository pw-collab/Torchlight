import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as Notion from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const Client = Notion.Client;
// ... (rest of the Notion client logic)

let notionClient: any = null;

function getNotionClient() {
  if (!notionClient) {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      throw new Error("NOTION_API_KEY is not set in environment variables.");
    }
    
    console.log("Initializing Notion Client...");
    
    try {
      notionClient = new Client({ auth: apiKey });
      
      if (!notionClient.databases) {
        // Fallback or more aggressive check
        if ((notionClient as any).default?.databases) {
           notionClient = (notionClient as any).default;
        }
      }
    } catch (err) {
      console.error("Failed to initialize Notion Client:", err);
      throw err;
    }
  }
  return notionClient;
}

const DATABASE_IDS = {
  weapons: "f7cd4c4e2091460d8def8fc7ed522f5c",
  armors: "835c008a093646ec96e09cd8184f8b32",
  equipments: "687ba2e047b74131b31d145abd369fec",
};

app.use(express.json());

app.get("/api/notion/items", async (req, res) => {
  try {
    const notion = getNotionClient();
    const { type } = req.query;

    const databaseId = DATABASE_IDS[type as keyof typeof DATABASE_IDS];
    if (!databaseId) {
      return res.status(400).json({ error: "Invalid item type" });
    }

    // Use databases.query to fetch pages from the database
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    const items = response.results.map((page: any) => {
      const props = page.properties;
      
      // Helper to get text from various Notion property types
      const getText = (prop: any) => {
        if (!prop) return "";
        if (prop.type === "title") return prop.title[0]?.plain_text || "";
        if (prop.type === "rich_text") return prop.rich_text[0]?.plain_text || "";
        if (prop.type === "select") return prop.select?.name || "";
        if (prop.type === "multi_select") return prop.multi_select.map((s: any) => s.name).join(", ");
        if (prop.type === "number") return prop.number?.toString() || "0";
        return "";
      };

      // Try to find properties by common names
      const name = getText(props.Name || props.Item || props.Nome);
      const description = getText(props.Description || props.Descrição || props.Notes || props.Propriedades);
      const weightStr = getText(props.Weight || props.Slots || props.Peso);
      const weight = parseFloat(weightStr) || 1;
      
      const attackBonus = parseInt(getText(props["Attack Bonus"] || props.Bonus)) || 0;
      const damageDie = getText(props.Damage || props.Dano);
      const acBonus = parseInt(getText(props.AC || props["AC Bonus"] || props.Bonus)) || 0;
      const isTorch = name.toLowerCase().includes("torch") || name.toLowerCase().includes("tocha");
      
      const weaponType = type === "weapons" ? 
        (name.toLowerCase().includes("bow") || name.toLowerCase().includes("crossbow") || name.toLowerCase().includes("sling") || name.toLowerCase().includes("dart") ? "ranged" : "melee") 
        : undefined;

      return {
        id: page.id,
        name: name || "Unknown Item",
        description: description || "No description provided.",
        weight: weight,
        quantity: 1,
        type: type === "weapons" ? "weapon" : type === "armors" ? "armor" : "gear",
        weaponType,
        attackBonus,
        damageDie,
        acBonus,
        isTorch,
        torchTimeRemaining: isTorch ? 60 : undefined,
      };
    });

    res.json(items);
  } catch (error: any) {
    console.error("Notion API Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch items from Notion" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
