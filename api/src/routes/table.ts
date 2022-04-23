import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { createTable, deleteTable, getTables } from "../lib/table";

import { requireAdmin, requireRole } from "../middleware"
import { isNewTable, tableExists } from "../validators";

const router = Router();

router.get("/all", requireAdmin, async (req, res) => {
    try {
        const tables = await getTables()
        return res.status(200).json({ tables })
    } catch (error) {
        console.error(error)
        res.status(500).send()
    }
})

router.post("/create", requireAdmin,
    body("tableNumber").isInt().withMessage("table number (id) must be an integer")
        .custom(isNewTable),
    body("numSeats").isInt({ min: 1, max: 12 }).withMessage("numSeats must be an integer within range [1:12]"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { tableNumber: id, numSeats } = req.body;
            const table = await createTable({ id, numSeats })
            return res.status(200).send(table)
        } catch (error) {
            console.error(error)
            res.status(500).send()
        }
    })


router.delete("/delete", requireAdmin,
    query("id").isNumeric().withMessage("Table id must be numerical").custom(tableExists),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //@ts-expect-error express defined query values as an string or array of strings.
            // in this case, however, req.query.id must be a string for it to pass validation
            const id = parseInt(req.query.id) // express defines query as a string or an array of strings
            await deleteTable(id)
            return res.status(200).send()
        } catch (error) {
            console.error(error)
            return res.status(500).send()
        }
    })



export default router;