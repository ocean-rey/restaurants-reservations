import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import { getAvailableSlots, getReservations, getTodayReservations, reserveTable } from "../lib/reservation";
import { requireAdmin, requireRole } from "../middleware";
import { validReservationFilters } from "../validators";

const router = Router();

router.get("/available-slots", query("seats").isNumeric(), requireRole, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        var seats = req.query.seats as string
        const availableSlots = await getAvailableSlots(parseInt(seats)).catch(err => {
            return res.status(404).send(err)
        })
        return res.status(200).json(availableSlots).send()

    } catch (error) {
        console.error(error)
        return res.status(500).send()
    }
})

router.post("/book", body("startTime").isAfter(), body("endTime").isAfter(), body("numSeats").isInt({ min: 1, max: 12 }).withMessage("Must be between in range [1:12]"), requireRole, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { startTime, endTime, numSeats } = req.body
        const booking = await reserveTable({ startTime, endTime, numSeats }).catch(err => {
            return res.status(404).send(err)
        })
        return res.status(200).json(booking).send()
    } catch (error) {
        console.error(error)
        return res.status(500).send()
    }
})

router.get("/today", requireRole, query("page").isNumeric(), query("sort").isIn(["asc", "desc"]).withMessage("must be one of ['asc', 'desc']"), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const page = req.query.page as string;
        const sort = req.query.sort as "asc" | "desc";
        const reservations = await getTodayReservations(sort, parseInt(page))
        return res.status(200).json(reservations).send();
    } catch (error) {
        console.error(error)
        return res.status(500).send()
    }
})

router.post("/", requireAdmin, body("page").isInt({ min: 1 }), body("filters").isObject().custom(validReservationFilters), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { page, filters } = req.body;
        const { to, from, tableId } = filters
        const reservations = await getReservations({page, filters})
        return res.status(200).json(reservations).send();
    } catch (error) {
        console.error(error)
        return res.status(500).send()
    }
})

export default router