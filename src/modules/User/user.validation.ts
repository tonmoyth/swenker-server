import { z } from 'zod';

export const userRegisterSchema = z.object({
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
});

export const userLoginSchema = z.object({
  email: z.string({
    message: 'Email is required',
  }).email(),
  password: z.string({
    message: 'Password is required',
  }).min(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string({
    message: 'Email is required',
  }).email(),
});

export const resetPasswordSchema = z.object({
  email: z.string({
    message: 'Email is required',
  }).email(),
  otp: z.string({
    message: 'OTP is required',
  }),
  newPassword: z.string({
    message: 'New password is required',
  }).min(6),
});

export const addFriendSchema = z.object({
  receiverId: z.string({
    message: 'Receiver ID is required',
  }),
});

export const getFriendsSchema = z.object({
  searchTerm: z.string().optional(),
});