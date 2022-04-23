import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { requireAdmin, requireRole } from "../middleware";

const router = Router();

router.get("/available-slots", query("seats").isNumeric(), requireRole, async(req, res)=>{

})

router.post("/create", body("startTime"), requireRole, async(req, res)=>{

})

router.get("/today", requireRole, async(req, res)=>{

})

router.get("/", requireAdmin, async(req, res)=>{
    
})