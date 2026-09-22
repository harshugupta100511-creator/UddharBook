'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { customer, entry } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export type CustomerWithBalance = {
  id: number
  name: string
  phone: string | null
  balance: number
  createdAt: Date
}

/** All of the signed-in shopkeeper's customers with their running balance. */
export async function getCustomers(): Promise<CustomerWithBalance[]> {
  const userId = await getUserId()

  const rows = await db
    .select({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      createdAt: customer.createdAt,
      balance: sql<number>`coalesce(sum(${entry.amount}), 0)`.mapWith(Number),
    })
    .from(customer)
    .leftJoin(entry, eq(entry.customerId, customer.id))
    .where(eq(customer.userId, userId))
    .groupBy(customer.id)
    .orderBy(desc(customer.createdAt))

  return rows
}

export async function addCustomer(formData: FormData) {
  const userId = await getUserId()
  const name = String(formData.get('name') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()

  if (!name) throw new Error('Customer ka naam zaroori hai')

  await db.insert(customer).values({
    userId,
    name,
    phone: phone || null,
  })

  revalidatePath('/dashboard')
}

export async function deleteCustomer(customerId: number) {
  const userId = await getUserId()
  // Scope by userId so a shopkeeper can only delete their own customers.
  await db
    .delete(entry)
    .where(and(eq(entry.customerId, customerId), eq(entry.userId, userId)))
  await db
    .delete(customer)
    .where(and(eq(customer.id, customerId), eq(customer.userId, userId)))
  revalidatePath('/dashboard')
}

/** Add a ledger entry. `kind` = 'udhaar' (credit given) or 'payment' (paid back). */
export async function addEntry(formData: FormData) {
  const userId = await getUserId()

  const customerId = Number(formData.get('customerId'))
  const rawAmount = Number(formData.get('amount'))
  const kind = String(formData.get('kind') ?? 'udhaar')
  const note = String(formData.get('note') ?? '').trim()

  if (!Number.isFinite(customerId) || customerId <= 0)
    throw new Error('Invalid customer')
  if (!Number.isFinite(rawAmount) || rawAmount <= 0)
    throw new Error('Amount sahi daalein')

  // Verify the customer belongs to this shopkeeper before inserting.
  const owned = await db
    .select({ id: customer.id })
    .from(customer)
    .where(and(eq(customer.id, customerId), eq(customer.userId, userId)))
  if (!owned[0]) throw new Error('Unauthorized')

  const amount = kind === 'payment' ? -Math.round(rawAmount) : Math.round(rawAmount)

  await db.insert(entry).values({
    userId,
    customerId,
    amount,
    note: note || null,
  })

  revalidatePath('/dashboard')
}

export type EntryRow = {
  id: number
  amount: number
  note: string | null
  createdAt: Date
}

export async function getEntries(customerId: number): Promise<EntryRow[]> {
  const userId = await getUserId()
  return db
    .select({
      id: entry.id,
      amount: entry.amount,
      note: entry.note,
      createdAt: entry.createdAt,
    })
    .from(entry)
    .where(and(eq(entry.customerId, customerId), eq(entry.userId, userId)))
    .orderBy(desc(entry.createdAt))
}
