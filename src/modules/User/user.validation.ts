import { z } from 'zod';

export const userRegisterSchema = z.object({
  body: z.object({
    username: z.string({
      message: 'Username is required',
    }).min(3).max(30),
    fullName: z.string({
      message: 'Full name is required',
    }),
    email: z.string({
      message: 'Email is required',
    }).email(),
    password: z.string({
      message: 'Password is required',
    }).min(6),
    bio: z.string().optional(),
  }),
});

export const createReactionSchema = z.object({
  body: z.object({
    videoId: z.string({
      message: 'Video ID is required',
    }),
  }),
});

export const createReportSchema = z.object({
  body: z.object({
    videoId: z.string({
      message: 'Video ID is required',
    }),
    reason: z.enum([
      'DANGEROUS_DRINKING_BEHAVIOR',
      'UNSAFE_OR_LIFE_THREATENING',
      'MINOR_INVOLVEMENT',
      'BULLYING_OR_HARASSMENT',
      'ILLEGAL_ACTIVITY',
      'OFFENSIVE_CONTENT',
    ], {
      message: 'Invalid report reason',
    }),
  }),
});

export const userLoginSchema = z.object({
  body: z.object({
    email: z.string({
      message: 'Email is required',
    }).email(),
    password: z.string({
      message: 'Password is required',
    }).min(6),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({
      message: 'Email is required',
    }).email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string({
      message: 'Email is required',
    }).email(),
    otp: z.string({
      message: 'OTP is required',
    }),
    newPassword: z.string({
      message: 'New password is required',
    }).min(6),
  }),
});

export const addFriendSchema = z.object({
  body: z.object({
    receiverId: z.string({
      message: 'Receiver ID is required',
    }),
  }),
});

export const getFriendsSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30).optional(),
    fullName: z.string().optional(),
    bio: z.string().optional(),
  }),
});