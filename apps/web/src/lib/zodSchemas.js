import { z } from 'zod';

export const getValidationMessage = (validation, fallback = 'Please check the form and try again.') =>
  validation?.error?.issues?.[0]?.message || fallback;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const fleetEditSchema = z.object({
  name: z.string().trim().min(1, 'Vehicle name is required'),
  driverName: z.string().trim().min(1, 'Driver name is required'),
  rate: z.string().optional(),
  seats: z.string().trim().min(1, 'Seats capacity is required (e.g. 5 passengers)'),
  luggage: z.string().trim().min(1, 'Luggage capacity is required (e.g. 2 large bags)'),
  whatsappNumber: z.string().regex(/^\d{8,15}$/, 'Enter a valid WhatsApp number with country code, digits only (e.g. 60123456789)'),
  imageUrl: z.string().url('Must be a valid image URL').or(z.string().min(1, 'Image path is required')),
  description: z.string().optional(),
  direction: z.enum(['jb-sg', 'sg-jb'], { errorMap: () => ({ message: 'Please select a route direction' }) }),
  isPublished: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });

export const provisionDriverSchema = z.object({
  email: z.string().email('Please enter a valid driver email address'),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  fullName: z.string().trim().min(1, 'Driver full name is required'),
  phoneNumber: z.string().regex(/^\d{8,15}$/, 'Enter a valid driver phone/WhatsApp number with country code, digits only (e.g. 60123456789)'),
  carName: z.string().trim().min(1, 'Car name is required'),
  carSeats: z.string().trim().min(1, 'Passenger seat amount is required'),
  carLargeBags: z.string().trim().min(1, 'Large bag amount is required'),
  carRate: z.string().optional(),
  carImageUrl: z.string().optional(),
  carDescription: z.string().optional(),
});
