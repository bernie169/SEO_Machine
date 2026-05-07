import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * If the image is a temporary Replicate URL, download it and upload to
 * Supabase Storage so it persists. Returns the Storage filename on success,
 * or the original URL / empty string as fallback.
 */
async function persistImage(imageUrl: string, slug: string): Promise<string> {
  if (!imageUrl || !imageUrl.startsWith('http')) return imageUrl

  try {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)

    const contentType = res.headers.get('content-type') || 'image/webp'
    const ext = contentType.includes('png') ? 'png'
      : contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg'
      : 'webp'

    const filename = `${slug}-${Date.now()}.${ext}`
    const buffer = await res.arrayBuffer()

    const { error } = await supabase.storage
      .from('hot-slotz-storage')
      .upload(`NewsImages/${filename}`, buffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      return imageUrl // fallback: keep the original URL
    }

    console.log('Image persisted to Storage:', filename)
    return filename
  } catch (e) {
    console.error('persistImage error:', e)
    return imageUrl // fallback: keep the original URL
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get('x-admin-password')
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { title, slug, summary, categories, content, image } = await req.json()

  if (!title || !slug || !summary || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Download Replicate image and upload to Supabase Storage so it never expires
  const persistedImage = await persistImage(image || '', slug)

  const { data, error } = await supabase
    .from('news')
    .insert({
      title,
      slug,
      summary,
      categories,
      content,
      image: persistedImage,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data.id, slug: data.slug })
}
