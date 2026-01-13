import axios from "axios";

const CONFIG = {
    BASE_URL: "http://localhost:3000/v1",
    TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NjY0OWM1ZTI3ZmE2MDcyM2QyMjI1MyIsInJvbGVJZCI6MiwiaWF0IjoxNzY4MzExMjQzfQ.VHGn2tl29XMBkN5eK51Bb8ADxBR770c-5_hodcvT9n8",
    EVENT_ID: "696649eae27fa60723d22256",
    SECTION_ID: "696649eae27fa60723d22257",
    TOTAL_REQUESTS: 10,
    QTY_PER_REQUEST: 5
};

interface BookingResult {
    success: boolean;
    statusCode?: number;
    message: string;
}

const getRemainingSeats = async (): Promise<number> => {
    try {
        const res = await axios.get(`${CONFIG.BASE_URL}/event/${CONFIG.EVENT_ID}`, {
            headers: { Authorization: `Bearer ${CONFIG.TOKEN}` }
        });

        const section = res.data.event.sections.find((s: any) => s._id === CONFIG.SECTION_ID);
        
        if (!section) {
            throw new Error(`Section ${CONFIG.SECTION_ID} not found`);
        }

        return section.remaining;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Fatal] Failed to fetch event details: ${message}`);
        process.exit(1);
    }
};

const createBooking = async (index: number): Promise<BookingResult> => {
    try {
        const res = await axios.post(
            `${CONFIG.BASE_URL}/bookings/create-booking`,
            {
                eventId: CONFIG.EVENT_ID,
                sectionId: CONFIG.SECTION_ID,
                quantity: CONFIG.QTY_PER_REQUEST,
                idempotencyKey: `race-test-${Date.now()}-${index}`
            },
            {
                headers: {
                    Authorization: `Bearer ${CONFIG.TOKEN}`,
                    "Content-Type": "application/json"
                },
                validateStatus: () => true 
            }
        );

        return {
            success: res.status >= 200 && res.status < 300,
            statusCode: res.status,
            message: res.data?.message || res.statusText
        };
    } catch (error) {
        return { success: false, message: "Network Error" };
    }
};

const runConcurrencyTest = async () => {
    console.log(`[Info] Starting concurrency test with ${CONFIG.TOTAL_REQUESTS} requests...`);

    const startSeats = await getRemainingSeats();
    console.log(`[State] Initial remaining seats: ${startSeats}`);

    if (startSeats < CONFIG.QTY_PER_REQUEST) {
        console.warn("[Warn] Insufficient seats to perform test. Aborting.");
        return;
    }

    const promises = Array.from({ length: CONFIG.TOTAL_REQUESTS }, (_, i) => createBooking(i + 1));
    const results = await Promise.all(promises);

    const successfulBookings = results.filter(r => r.success).length;
    const failedBookings = results.filter(r => !r.success).length;

    console.log("\n[Results] Request Summary:");
    results.forEach((r, i) => {
        const status = r.success ? "SUCCESS" : "FAILED";
        console.log(`  Req ${i + 1}: ${status} (${r.statusCode}) - ${r.message}`);
    });

    const endSeats = await getRemainingSeats();
    const expectedRemaining = Math.max(0, startSeats - (successfulBookings * CONFIG.QTY_PER_REQUEST));

    console.log("\n[Verification] Database Integrity Check:");
    console.log(`  Start Seats: ${startSeats}`);
    console.log(`  Sold Seats:  ${successfulBookings * CONFIG.QTY_PER_REQUEST}`);
    console.log(`  End Seats:   ${endSeats}`);
    console.log(`  Expected:    ${expectedRemaining}`);

    const isMathCorrect = endSeats === expectedRemaining;
    const isNotOversold = endSeats >= 0;
    const isLogicValid = !(startSeats < (CONFIG.TOTAL_REQUESTS * CONFIG.QTY_PER_REQUEST) && failedBookings === 0);

    if (isMathCorrect && isNotOversold && isLogicValid) {
        console.log("\n[Pass] ACID transaction logic verified. No race conditions detected.");
    } else {
        console.error("\n[Fail] Race condition detected or data inconsistency found.");
        if (!isMathCorrect) console.error("  - Reason: End seats do not match expected calculation.");
        if (!isNotOversold) console.error("  - Reason: Seats dropped below zero.");
        if (!isLogicValid) console.error("  - Reason: Requests succeeded despite insufficient inventory.");
        process.exit(1);
    }
};

runConcurrencyTest();