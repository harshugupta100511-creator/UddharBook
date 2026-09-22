'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { store } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base || 'dukaan'}-${suffix}`
}

export async function getMyStore() {
  const userId = await getUserId()
  const rows = await db.select().from(store).where(eq(store.userId, userId))
  return rows[0] ?? null
}

export async function createStore(formData: FormData) {
  const userId = await getUserId()

  const name = String(formData.get('name') ?? '').trim()
  const ownerName = String(formData.get('ownerName') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()

  if (!name) throw new Error('Dukaan ka naam zaroori hai')

  // One store per shopkeeper.
  const existing = await db.select().from(store).where(eq(store.userId, userId))
  if (existing[0]) return existing[0]

  const rows = await db
    .insert(store)
    .values({
      userId,
      name,
      slug: slugify(name),
      ownerName: ownerName || null,
      phone: phone || null,
    })
    .returning()

  revalidatePath('/dashboard')
  return rows[0]
}

export async function updateStore(formData: FormData) {
  const userId = await getUserId()

  const name = String(formData.get('name') ?? '').trim()
  const ownerName = String(formData.get('ownerName') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()

  if (!name) throw new Error('Dukaan ka naam zaroori hai')

  await db
    .update(store)
    .set({ name, ownerName: ownerName || null, phone: phone || null })
    .where(eq(store.userId, userId))

  revalidatePath('/dashboard')
}
