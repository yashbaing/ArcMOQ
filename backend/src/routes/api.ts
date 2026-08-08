import { Router } from "express";
import { getArcTestnetStatus, initializeArcTestnetDemo } from "../blockchain/service.js";
import { getGroupOrders, getGroupOrderById } from "../services/groupOrders.js";
import { getReceipts, getReceiptById } from "../services/receipts.js";
import { getFxRates, convertCurrency } from "../services/fx.js";
import { runAgentDemo } from "../agent/orchestrator.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/chain/status", async (_req, res) => {
  try {
    const status = await getArcTestnetStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/chain/setup", async (_req, res) => {
  try {
    const result = await initializeArcTestnetDemo();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/group-orders", async (_req, res) => {
  try {
    const orders = await getGroupOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/group-orders/:id", async (req, res) => {
  try {
    const order = await getGroupOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/receipts", async (_req, res) => {
  try {
    const receipts = await getReceipts();
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/receipts/:id", async (req, res) => {
  try {
    const receipt = await getReceiptById(req.params.id);
    if (!receipt) return res.status(404).json({ error: "Receipt not found" });
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/fx/rates", async (_req, res) => {
  try {
    const rates = await getFxRates();
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/fx/convert", async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    const result = await convertCurrency(from, to, amount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/agent/demo", async (_req, res) => {
  try {
    const result = await runAgentDemo();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
