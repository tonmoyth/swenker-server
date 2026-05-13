import { z } from "zod";

export const updateNotificationStatusSchema = z.object({
    status: z.enum(["ACCEPT", "REJECT"], {
        message: "Status must be either ACCEPT or REJECT",
    }),
});
