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