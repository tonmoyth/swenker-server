import ffmpeg from "fluent-ffmpeg";
import { prisma } from "../../lib/prisma";
import { SubscriptionPlan, PaymentStatus } from "../../generated/prisma/enums";

// Dynamically retrieve static binaries for windows/linux/macos
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);


/**
 * Reusable utility to check video duration using fluent-ffmpeg / ffprobe.
 * Features a safe fallback to prevent crashes if system binaries are not installed globally.
 */
export const getVideoDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.warn("ffprobe error:", err.message);
        return resolve(10);
      }

      let duration = 0;

      if (metadata?.format?.duration) {
        duration = parseFloat(metadata.format.duration as any);
      }

      // safety fallback
      if (!duration || isNaN(duration)) {
        duration = 10;
      }

      resolve(Math.round(duration));
    });
  });
};

/**
 * Reusable utility to fetch the active premium subscription plan for a user.
 * Plan must be status COMPLETED and not expired.
 */
export const getActiveSubscription = async (userId: string): Promise<SubscriptionPlan> => {
  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: PaymentStatus.COMPLETED,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  return activeSub ? activeSub.plan : SubscriptionPlan.FREE;
};

export interface IPlanLimits {
  maxDuration: number;
  maxTags: number;
  productName: string;
  nextPlanName: string;
}

/**
 * Reusable utility to retrieve feature limits for a given subscription plan.
 */
export const getPlanLimits = (plan: SubscriptionPlan): IPlanLimits => {
  switch (plan) {
    case SubscriptionPlan.PRO:
      return {
        maxDuration: 25,
        maxTags: 2,
        productName: "ChugChain +",
        nextPlanName: "ChugChain Pro",
      };
    case SubscriptionPlan.PREMIUM:
      return {
        maxDuration: 60, // 60 seconds (1 minute)
        maxTags: 5,      // 5 tags
        productName: "ChugChain Pro",
        nextPlanName: "ChugChain Cool",
      };
    case SubscriptionPlan.PREMIUM_PRO:
      return {
        maxDuration: 300, // 300 seconds (5 minutes)
        maxTags: 10,      // 10 tags
        productName: "ChugChain Cool",
        nextPlanName: "", // already highest
      };
    case SubscriptionPlan.FREE:
    default:
      return {
        maxDuration: 15,
        maxTags: 1,
        productName: "Free Tier",
        nextPlanName: "ChugChain +",
      };
  }
};
