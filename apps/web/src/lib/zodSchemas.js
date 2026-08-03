import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const fleetEditSchema = z.object({
  name: z.string().min(2, 'Vehicle name is required'),
  driverName: z.string().min(2, 'Driver name is required'),
  rate: z.string().min(2, 'Rate is required (e.g. SGD 120 per trip)'),
  seats: z.string().min(2, 'Seats capacity is required (e.g. 5 passengers)'),
  luggage: z.string().min(2, 'Luggage capacity is required (e.g. 2 large bags)'),
  whatsappNumber: z.string().min(8, 'WhatsApp phone number is required'),
  imageUrl: z.string().url('Must be a valid image URL').or(z.string().min(1, 'Image path is required')),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export const provisionDriverSchema = z.object({
  email: z.string().email('Please enter a valid driver email address'),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  fullName: z.string().min(2, 'Driver full name is required'),
  fleetId: z.string().min(1, 'Please select or assign a vehicle ID'),
});
