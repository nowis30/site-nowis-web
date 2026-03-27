import { z } from 'zod';

const strongPassword = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

export const clientRegisterSchema = z.object({
  fullName: z.string().trim().min(2, 'Le nom complet est requis').max(160, 'Le nom est trop long'),
  email: z.string().trim().toLowerCase().email('Adresse email invalide'),
  phone: z.string().trim().min(7, 'Le téléphone est requis').max(40, 'Le téléphone est invalide'),
  password: strongPassword,
  address: z.string().trim().max(240, 'L\'adresse est trop longue').optional().or(z.literal('')),
  message: z.string().trim().max(2000, 'Le message est trop long').optional().or(z.literal('')),
});

export const clientLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type ClientLoginInput = z.infer<typeof clientLoginSchema>;
