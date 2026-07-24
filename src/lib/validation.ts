import { z } from "zod";
import { districtIds } from "@/lib/districts";

export const districtSchema = z.enum(districtIds);

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Minimum 2 caractères")
  .max(40, "Maximum 40 caractères")
  .regex(/^[A-Za-zÀ-ÿ\s\-']+$/, "Lettres uniquement");

/** Matricule : exactement 3 chiffres */
export const matriculeSchema = z
  .string()
  .trim()
  .regex(/^\d{3}$/, "Le matricule doit contenir exactement 3 chiffres");

/** ID unique : chiffres uniquement */
export const idUniqueSchema = z
  .string()
  .trim()
  .min(1, "ID unique requis")
  .max(20, "Maximum 20 chiffres")
  .regex(/^\d+$/, "L’ID unique ne doit contenir que des chiffres");

export const registrationSchema = z.object({
  nom: nameSchema,
  prenom: nameSchema,
  matricule: matriculeSchema,
  idUnique: idUniqueSchema,
  district: districtSchema,
});
