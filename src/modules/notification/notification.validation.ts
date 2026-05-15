import { z } from "zod";

export const updateNotificationStatusSchema = z.object({
    body: z.object({
        status: z.enum(["ACCEPT", "REJECT"], {
            message: "Status must be either ACCEPT or REJECT",
        }),
    }),
});
