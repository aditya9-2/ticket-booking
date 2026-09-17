import axios from "axios";

const CONFIG = {
    BASE_URL: "http://localhost:3000/v1",
    TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OTliN2M4OTQwN2JiNmRjZTU4NzA0NSIsInJvbGVJZCI6MSwiaWF0IjoxNzg5NjYyNTQ3fQ.JLzqofB8kXiD2OG--dT-KjjUSEl8YlJHD1OjQ047R8U",
    EVENT_ID: "6a84d1e3f1fb51b011f331d4",
    SECTION_ID: "6a84d1e3f1fb51b011f331d5",

    // MODE: "OVERSELL" as "OVERSELL" | "IDEMPOTENCY", //test A
    MODE: "IDEMPOTENCY" as "OVERSELL" | "IDEMPOTENCY", // test B

    REQUESTS: 150,
    QTY_PER_REQUEST: 1
};
// ─────────────────────────────────────────────────────────────

interface BookingResult {
    success: boolean;
    statusCode?: number;
    message: string;
}

const FIXED_IDEMPOTENCY_KEY = `idem-test-fixed-key-${Date.now()}`;

const getRemainingSeats = async (): Promise<number> => {
    try {
        const res = await axios.get(`${CONFIG.BASE_URL}/event/${CONFIG.EVENT_ID}`, {
            headers: { Authorization: `Bearer ${CONFIG.TOKEN}` }
        });

        const section = res.data.event.sections.find(
            (s: any) => String(s._id) === CONFIG.SECTION_ID
        );

        if (!section) {
            throw new Error(`Section ${CONFIG.SECTION_ID} not found on event ${CONFIG.EVENT_ID}`);
        }

        return section.remaining;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Fatal] Failed to fetch event details: ${message}`);
        process.exit(1);
    }
};

const createBooking = async (index: number): Promise<BookingResult> => {
    const idempotencyKey = CONFIG.MODE === "IDEMPOTENCY"
        ? FIXED_IDEMPOTENCY_KEY
        : `race-test-${Date.now()}-${index}`;

    try {
        const res = await axios.post(
            `${CONFIG.BASE_URL}/bookings/create-booking`,
            {
                eventId: CONFIG.EVENT_ID,
                sectionId: CONFIG.SECTION_ID,
                quantity: CONFIG.QTY_PER_REQUEST,
                idempotencyKey
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
    console.log(`[Info] Mode: ${CONFIG.MODE} | ${CONFIG.REQUESTS} requests, qty=${CONFIG.QTY_PER_REQUEST} each`);

    const startSeats = await getRemainingSeats();
    console.log(`[State] Initial remaining seats: ${startSeats}`);

    const t0 = Date.now();
    const promises = Array.from({ length: CONFIG.REQUESTS }, (_, i) => createBooking(i + 1));
    const results = await Promise.all(promises);
    const durationMs = Date.now() - t0;

    const byStatus = results.reduce((acc, r) => {
        const key = r.statusCode ?? 0;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    console.log("\n[Results] Request Summary:");
    results.forEach((r, i) => {
        console.log(`  Req ${i + 1}: ${r.statusCode} - ${r.message}`);
    });

    console.log("\n[Counts]", byStatus);
    console.log(`[Duration] ${durationMs}ms`);

    const endSeats = await getRemainingSeats();
    console.log("\n[Verification] Database Integrity Check:");
    console.log(`  Start Seats: ${startSeats}`);
    console.log(`  End Seats:   ${endSeats}`);

    if (CONFIG.MODE === "OVERSELL") {
        const successCount = byStatus[201] || 0;
        const conflictCount = byStatus[409] || 0;
        const serverErrorCount = byStatus[500] || 0;
        const expectedEnd = startSeats - successCount;

        console.log(`  201 (booked):    ${successCount}`);
        console.log(`  409 (rejected):  ${conflictCount}`);
        console.log(`  500 (errors):    ${serverErrorCount}`);
        console.log(`  Expected end:    ${expectedEnd}`);

        const pass = endSeats === expectedEnd
            && serverErrorCount === 0
            && endSeats >= 0
            && successCount === Math.min(startSeats, CONFIG.REQUESTS);

        if (pass) {
            console.log("\n[Pass] No overselling, no server errors, exact seat accounting.");
        } else {
            console.error("\n[Fail] See counts above.");
            process.exit(1);
        }
    } else {
        const successCount = byStatus[201] || 0;
        const replayCount = byStatus[200] || 0;
        const serverErrorCount = byStatus[500] || 0;
        const expectedEnd = startSeats - successCount;

        console.log(`  201 (booked):     ${successCount}`);
        console.log(`  200 (replay):     ${replayCount}`);
        console.log(`  500 (errors):     ${serverErrorCount}`);
        console.log(`  Expected end:     ${expectedEnd}`);

        const pass = successCount === 1
            && replayCount === CONFIG.REQUESTS - 1
            && serverErrorCount === 0
            && endSeats === expectedEnd;

        if (pass) {
            console.log("\n[Pass] Exactly one booking created under concurrent duplicate key.");
        } else {
            console.error("\n[Fail] See counts above.");
            process.exit(1);
        }
    }
};

runConcurrencyTest();