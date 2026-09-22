import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Every shopkeeper (Better Auth user) owns one store. The store's public
// `slug` is what the shop's QR code points at. All rows carry a plain
// `userId` column so every query is scoped to the signed-in shopkeeper.

export const store = pgTable('store', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ownerName: text('ownerName'),
  phone: text('phone'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const customer = pgTable('customer', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// A ledger entry. `amount` is stored in paise-free whole rupees.
// A positive amount = udhaar added (credit given), a negative amount =
// payment received from the customer. The customer's balance is the sum.
export const entry = pgTable('entry', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  customerId: integer('customerId').notNull(),
  amount: integer('amount').notNull(),
  note: text('note'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
