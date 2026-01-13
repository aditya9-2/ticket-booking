import axios from "axios";

const BASE_URL = "http://localhost:3000/v1/bookings/create-booking";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NjYxYTUxYTdhYTIyYjZhNzc5Y2M0YSIsInJvbGVJZCI6MiwiaWF0IjoxNzY4Mjk5MDk1fQ.OOfV7kXB2ADI_A0NWnNAJrjzJTU_2kf1BDnpCcxDPS0";
const EVENT_ID = "696619b8a7aa22b6a779cc3f";
const SECTION_ID = "696619b8a7aa22b6a779cc41";


const TOTAL_REQUESTS = 10;
const QTY_PER_REQUEST = 10;

const createBooking = async (index: number): Promise<boolean> => {

    try {

        const res = await axios.post(
            BASE_URL,
            {
                eventId: EVENT_ID,
                sectionId: SECTION_ID,
                quantity: QTY_PER_REQUEST
            },
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    "Content-Type": "application/json"
                },
                validateStatus: () => true
            }
        );

        if (res.status >= 200 && res.status < 300) {
            console.log(`[${index}] SUCCESS`);
            return true;
        } else {
            console.log(`[${index}] FAILED → ${res.data?.message}`);
            return false;
        }

    } catch (err) {
        console.log(`[${index}] ERROR → ${err instanceof Error ? err.message : undefined}`);
        return false;
    }
}

const runTest = async () => {
    console.log("Starting concurrent booking test...\n");

    const promises: Promise<boolean>[] = [];

    for (let i = 1; i <= TOTAL_REQUESTS; i++) {
        promises.push(createBooking(i));
    }

    const result = await Promise.all(promises);

    const sucess = result.filter(Boolean).length;
    const failed = TOTAL_REQUESTS - sucess;


    console.log(`-----FINAL RESULT----\n`);
    console.log(`sucess: ${sucess}`);
    console.log(`failed: ${failed}`);
}


runTest();