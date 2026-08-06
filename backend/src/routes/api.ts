import { Router } from 'express';
import {
  aggregateDemand,
  acceptSupplierOffer,
  compareSuppliers,
  executeSettlement,
  getFxQuote,
  getState,
  mintReceipts,
  negotiateWithSupplier,
  redeemReceipt,
  resetState,
  runPolicyChecks,
  verifyShipment,
  addMandate,
  estimateMandateAED,
} from '../agent/orchestrator';
import { BuyerMandateInput } from '@arcmoq/shared';
import { getDeployments, EXPLORER_URL } from '../config/chain';

const router = Router();

router.get('/state', (_req, res) => {
  res.json({ ...getState(), deployments: getDeployments(), explorerUrl: EXPLORER_URL });
});

router.post('/reset', (_req, res) => {
  resetState();
  res.json(getState());
});

router.get('/orders', (_req, res) => {
  const state = getState();
  res.json({ orders: [state.groupOrder] });
});

router.get('/mandates', (_req, res) => {
  res.json(getState().mandates);
});

router.post('/mandates', (req, res) => {
  const body = req.body as BuyerMandateInput;
  const mandate = addMandate(body);
  res.json(mandate);
});

router.post('/mandates/estimate', (req, res) => {
  const { quantity, unitPriceEUR } = req.body;
  res.json(estimateMandateAED(Number(quantity), unitPriceEUR ? Number(unitPriceEUR) : undefined));
});

router.get('/suppliers', (_req, res) => {
  res.json(getState().suppliers);
});

router.get('/activities', (_req, res) => {
  res.json(getState().activities);
});

router.post('/agent/aggregate', (_req, res) => {
  res.json(aggregateDemand());
});

router.post('/agent/compare', (_req, res) => {
  res.json(compareSuppliers());
});

router.post('/agent/negotiate', (req, res) => {
  const supplierId = req.body.supplierId || 'oliva-sur';
  res.json(negotiateWithSupplier(supplierId));
});

router.post('/agent/accept', (_req, res) => {
  res.json(acceptSupplierOffer());
});

router.post('/agent/policy-check', (_req, res) => {
  res.json(runPolicyChecks());
});

router.get('/agent/fx-quote', (_req, res) => {
  res.json(getFxQuote());
});

router.post('/agent/settle', (req, res) => {
  const { txHash } = req.body;
  res.json(executeSettlement(txHash));
});

router.post('/agent/verify-shipment', (_req, res) => {
  verifyShipment();
  res.json({ verified: true, batchId: 'EVOO-ES-UAE-001' });
});

router.post('/agent/mint-receipts', (_req, res) => {
  mintReceipts();
  res.json({ minted: true });
});

router.post('/agent/redeem', (req, res) => {
  const { buyerName, quantity, txHash } = req.body;
  redeemReceipt(buyerName, Number(quantity), txHash);
  res.json({ success: true });
});

router.post('/agent/run-demo', async (_req, res) => {
  resetState();
  aggregateDemand();
  compareSuppliers();
  negotiateWithSupplier('oliva-sur');
  acceptSupplierOffer();
  runPolicyChecks();
  getFxQuote();
  executeSettlement();
  verifyShipment();
  mintReceipts();
  redeemReceipt('Restaurant A — Al Barsha', 100);
  res.json(getState());
});

router.get('/deployments', (_req, res) => {
  res.json(getDeployments());
});

export default router;
