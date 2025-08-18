
import express from "express";
import { createTimer, deleteTimer, getTimers, updateTimer } from "../Controller/TimerController.js";

const router = express.Router();

router.post("/timers", createTimer);
router.get("/timers", getTimers);
router.put("/timers/:id", updateTimer);
router.delete("/timers/:id", deleteTimer);

export default router;
