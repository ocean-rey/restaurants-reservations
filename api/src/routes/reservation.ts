import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { getAvailableSlots, getReservations, reserveTable } from "../lib/reservation";
import { requireAdmin, requireRole } from "../middleware";

const router = Router();

router.get("/available-slots", query("seats").isNumeric(), requireRole, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        var seats = req.query.seats as string
        const availableSlots = await getAvailableSlots(parseInt(seats))
        return res.status(200).json(availableSlots).send()
    } catch (error) {
        console.error(error)
        return res.status(500).send()
    }
})

router.post("/book", body("startTime").isAfter(), body("endTime").isAfter(), body("numSeats").isInt(), requireRole, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { startTime, endTime, numSeats } = req.body
        const booking = await reserveTable({ startTime, endTime, numSeats })
        return res.status(200).json(booking).send()
    } catch (error) {
        console.error(error)
        return res.status(500).send(error)
    }
})

router.get("/today", requireRole, async (req, res) => {

})

router.get("/", requireAdmin, async (req, res) => {
    const reservations = await getReservations()
    return res.status(200).json(reservations).send();
})

export default router