import * as v from 'valibot';

/**
 * Contrat de GET /api/v1/parent/bootstrap (ParentPortalBootstrapResponse, lot back P1),
 * validé à l'exécution. Le serveur rend les champs tels que stockés : civilité, libellés
 * de classe et avatar sont composés côté front.
 *
 * À remplacer par les types générés (`npm run api:types`) dès que le contrat est sur staging ;
 * le schéma Valibot reste, il garde la validation à l'exécution.
 */
const Uuid = v.pipe(v.string(), v.uuid());

const NamedRefSchema = v.object({ id: Uuid, name: v.string() });

export const RELATIONSHIP_TYPES = [
  'FATHER',
  'MOTHER',
  'GUARDIAN',
  'UNCLE',
  'AUNT',
  'GRANDPARENT',
  'OTHER',
] as const;

const ParentSchema = v.object({
  parentId: Uuid,
  firstName: v.nullish(v.string()),
  lastName: v.string(),
  surname: v.nullish(v.string()),
  phoneNumber: v.string(),
  email: v.nullish(v.string()),
});

/** Fuseau des écoles servies aujourd'hui, tant que le bootstrap ne rend pas `school.timeZone`. */
export const DEFAULT_SCHOOL_TIME_ZONE = 'Africa/Kinshasa';

const SchoolSchema = v.object({
  schoolId: Uuid,
  name: v.string(),
  logoFingerprint: v.nullish(v.string()),
  /** Téléphone de la fiche école (secrétariat) ; null s'il n'est pas saisi. */
  contactPhone: v.nullish(v.string()),
  /** Fuseau IANA de l'école, pour lire les instants (envoi d'une annonce) à son heure. */
  timeZone: v.optional(v.string(), DEFAULT_SCHOOL_TIME_ZONE),
});

export const ChildSchema = v.object({
  childId: Uuid,
  firstName: v.nullish(v.string()),
  lastName: v.string(),
  surname: v.nullish(v.string()),
  // Une valeur ajoutée côté back ne doit pas casser le portail : repli sur OTHER.
  relationshipType: v.fallback(v.picklist(RELATIONSHIP_TYPES), 'OTHER'),
  photoFingerprint: v.nullish(v.string()),
  schoolLevelGroup: NamedRefSchema,
  schoolLevel: NamedRefSchema,
  classroom: v.nullish(NamedRefSchema),
  /** Annonces de l'année en cours non lues par ce parent pour cet enfant (0 avant le lot L3). */
  unreadAnnouncements: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 0),
});

/** Notifications du portail : la clé publique VAPID ; null quand le serveur les coupe. */
const PushSchema = v.object({ vapidPublicKey: v.pipe(v.string(), v.minLength(1)) });

export const BootstrapSchema = v.object({
  parent: ParentSchema,
  school: SchoolSchema,
  academicYear: NamedRefSchema,
  children: v.array(ChildSchema),
  push: v.optional(v.nullable(PushSchema), null),
});

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];
export type Parent = v.InferOutput<typeof ParentSchema>;
export type School = v.InferOutput<typeof SchoolSchema>;
export type Child = v.InferOutput<typeof ChildSchema>;
export type PushConfig = v.InferOutput<typeof PushSchema>;
export type Bootstrap = v.InferOutput<typeof BootstrapSchema>;
