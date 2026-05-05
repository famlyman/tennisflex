import { NextResponse } from 'next/server';
import { scrapePlayerRating } from '@/scraper/tennisrecord';

export async function POST(request: Request) {
  const { name, city } = await request.json();
  
  if (!name || !city) {
    return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });
  }
  
  try {
    const result = await scrapePlayerRating(name, city);
    
    if (!result || !result.dynamicRating) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    const singlesRating = result.singlesRating || result.dynamicRating;
    const doublesRating = result.doublesRating;
    
    return NextResponse.json({ 
      name: result.name,
      location: result.location,
      gender: result.gender,
      singlesRating,
      doublesRating,
      dynamicRating: result.dynamicRating,
      tfr: Math.round(parseFloat(singlesRating || '0') * 10),
    });
  } catch (error) {
    console.error('[API] Tennisrecord error:', error);
    return NextResponse.json({ error: 'Scraping failed' }, { status: 500 });
  }
}
 
