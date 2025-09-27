const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const total_seats = 10;
const seats = {}

for (let i = 1; i <= total_seats; i++) {
    seats[i] = { status: 'available', lockedBy: null, lockExpiresAt: null };
}

function clearExpiredLocks() {
    const now = Date.now();
    for (let seatId in seats) {
        if (seats[seatId].status === 'locked' && seats[seatId].lockExpiresAt < now) {
            seats[seatId] = {
                status: 'available',
                lockedBy: null,
                lockExpiresAt: null
            };
            console.log(`Seat ${seatId} lock expired and is now available.`);
        }
    }
}
setInterval(clearExpiredLocks, 5000);

app.get('/seats', (req, res) => {
    clearExpiredLocks();
    res.json({ seats });
});

app.post('/lock', (req, res) => {
    const { seatId, userId } = req.body;

    if (!seatId || !userId) {
        return res.status(400).json({error: 'seatID and userID are required.'});
    }

    clearExpiredLocks();

    const seat = seats[seatId];
    if (!seat) {
        return res.status(404).json({ error: 'Seat not Found!' });
    }

    if (seat.status === 'booked') {
        return res.status(400).json({ error: 'Seat is already Booked!' });
    }

    if (seat.status === 'locked') {
        return res.status(400).json({ error: 'Seat is currently booked by another User!' });
    }

    seat.status = 'locked';
    seat.lockedBy = userId;
    seat.lockExpiresAt = Date.now() + 60 * 1000;

    res.json({
        message: `Seat ${seatId} locked successfully for user ${userId}. Confirm within 1 minute!`,
        seat,
    });
});

app.post('/confirm', (req, res) => {
    const { seatId, userId } = req.body;
    if (!seatId || !userId) {
        return res.status(400).json({ error: 'Both SeatID and UserID are required!' });
    }

    clearExpiredLocks();

    const seat = seats[seatId];
    if (!seat) {
        return res.status(404).json({ error: 'Seat not Found!' });
    }

    if (seat.status === 'available') {
        return res.status(400).json({ error: 'Seat is not locked and cannot be booked' });
    }

    if (seat.status === 'locked' && seat.lockedBy !== userId) {
        return res.status(403).json({ error: 'You cannot book a seat locked by another user!' });
    }

    if (seat.status === 'locked' && seat.lockedBy === userId) {
        seat.status = 'booked';
        seat.lockedBy = null;
        seat.lockExpiresAt = null;
        return res.json({
            message: `Seat ${seatId} successfully booked.`,
            seats
        });
    }

    if (seat.status === 'booked') {
        return res.status(400).json({ error: 'Seat is already booked!' });
    }
});

app.listen(port, () => {
    console.log(`Ticket Booking Server is running on http://localhost:${port}`);
})