import { chromium } from 'playwright';

interface PlayerRating {
  name: string;
  location: string;
  gender: string;
  singlesRating: string;
  singlesLastMatch: string | null;
  doublesRating: string | null;
  doublesLastMatch: string | null;
  record: string;
  wins: number;
  losses: number;
  dynamicRating: string | null;
  dynamicRatingDate: string | null;
  playerId: string | null;
}

interface PlayerSearchResult {
  name: string;
  location: string;
  gender: string;
  playerId: string | null;
}

function parseRecord(text: string): { record: string; wins: number; losses: number } {
  const match = text.match(/(\d+)-(\d+)/);
  if (match) {
    return { record: `${match[1]}-${match[2]}`, wins: parseInt(match[1]), losses: parseInt(match[2]) };
  }
  return { record: '0-0', wins: 0, losses: 0 };
}

export async function searchPlayers(playerName: string): Promise<PlayerSearchResult[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();
  
  const encodedName = encodeURIComponent(playerName);
  const url = `https://www.tennisrecord.com/adult/profile.aspx?playername=${encodedName}`;

  const results: PlayerSearchResult[] = [];

  try {
    await page.goto(url, { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const html = await page.content();
    
    const linkPattern = /<a[^>]+href="\/adult\/profile\.aspx\?playername=[^"]+&s=(\d+)"[^>]*>([^<]+)<\/a>\s*\(([^,]+),?\s*([A-Z]{2})\)/g;
    const locMatches = html.matchAll(linkPattern);
    
    for (const match of locMatches) {
      const playerId = match[1];
      const name = match[2].trim();
      const location = `${match[3]}, ${match[4]}`;
      
      results.push({
        name,
        location,
        gender: 'Unknown',
        playerId,
      });
    }

    if (results.length === 0) {
      const profileMatch = url.match(/playername=([^&]+)/);
      if (profileMatch) {
        const profileUrl = `https://www.tennisrecord.com/adult/profile.aspx?playername=${encodedName}&s=1`;
        await page.goto(profileUrl, { timeout: 30000 });
        await page.waitForTimeout(2000);
        const html2 = await page.content();
        
        const nameMatch = html2.match(/>\s*([^<]+?)\s*<\/a>\s*\(([^,]+),?\s*([A-Z]{2})\)/);
        if (nameMatch) {
          results.push({
            name: nameMatch[1].trim(),
            location: `${nameMatch[2]}, ${nameMatch[3]}`,
            gender: 'Unknown',
            playerId: '1',
          });
        }
      }
    }
  } catch (error) {
    console.error(`[tennisrecord] Search error for ${playerName}:`, error);
  } finally {
    await browser.close();
  }

  return results;
}

export async function scrapePlayerRating(playerName: string, locationFilter?: string, playerIdParam?: string): Promise<PlayerRating | null> {
  let playerId: string | null = playerIdParam || null;
  let usedName = playerName;
  
  if (!playerId && locationFilter) {
    const searchResults = await searchPlayers(playerName);
    const match = searchResults.find(r => 
      r.location.toLowerCase().includes(locationFilter.toLowerCase())
    );
    if (match) {
      playerId = match.playerId;
      usedName = match.name;
    } else if (searchResults.length > 0) {
      return null;
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  const page = await context.newPage();
  
  const encodedName = encodeURIComponent(playerName);
  const sParam = playerId || '1';
  const url = `https://www.tennisrecord.com/adult/matchhistory.aspx?playername=${encodedName}&year=2026&s=${sParam}`;

  try {
    await page.goto(url, { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    const allText = await page.locator('body').textContent();
    
    if (!allText || allText.includes('Player Not Found') || allText.length < 500) {
      await browser.close();
      return null;
    }

    const profMatch = bodyText.match(/([A-Za-z]+ [A-Za-z]+)\s*\(?([A-Z]{2})?\)/);
    const html = await page.content();
    const htmlLocMatch = html.match(/href="\/adult\/profile\.aspx\?playername=[^>]*>\s*([^<]+)<\/a>\s*\(([^,]+),?\s*([A-Z]{2})\)/);
    const name = profMatch?.[1]?.trim() || playerName;
    const location = htmlLocMatch ? `${htmlLocMatch[2]}, ${htmlLocMatch[3]}` : '';
    const gender = bodyText.includes('Male') ? 'Male' : bodyText.includes('Female') ? 'Female' : '';
    
    const dynamicIdx = bodyText.indexOf('Estimated Dynamic Rating');
    let dynamicRating: string | null = null;
    let dynamicRatingDate: string | null = null;
    if (dynamicIdx !== -1) {
      const snippet = bodyText.substring(dynamicIdx, dynamicIdx + 80);
      const ratingMatch = snippet.match(/([\d.]+)/);
      if (ratingMatch) dynamicRating = ratingMatch[1];
      const dateMatch = snippet.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch) dynamicRatingDate = dateMatch[1];
    }

    const singlesIdx = bodyText.indexOf('TTR Singles Rating');
    let singlesRating = '';
    let singlesLastMatch: string | null = null;
    if (singlesIdx !== -1) {
      const snippet = bodyText.substring(singlesIdx, singlesIdx + 100);
      const ratingMatch = snippet.match(/([\d.]+)\s*\(/);
      if (ratingMatch) singlesRating = ratingMatch[1];
      const dateMatch = snippet.match(/\)\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch) singlesLastMatch = dateMatch[1];
    }
    
    const doublesIdx = bodyText.indexOf('TTR Doubles Rating');
    let doublesRating = '';
    let doublesLastMatch: string | null = null;
    if (doublesIdx !== -1) {
      const snippet = bodyText.substring(doublesIdx, doublesIdx + 100);
      const ratingMatch = snippet.match(/([\d.]+)\s*\(/);
      if (ratingMatch) doublesRating = ratingMatch[1];
      const dateMatch = snippet.match(/\)\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch) doublesLastMatch = dateMatch[1];
    }
    
    const recordMatch = bodyText.match(/Record:\s*(\d+-\d+)/);
    const record = recordMatch?.[1] || '0-0';

    if (!name) {
      await browser.close();
      return null;
    }

    const { wins, losses } = parseRecord(record);

    return {
      name,
      location,
      gender,
      singlesRating: dynamicRating || singlesRating,
      singlesLastMatch: dynamicRatingDate || singlesLastMatch,
      doublesRating: doublesRating || null,
      doublesLastMatch,
      record,
      wins,
      losses,
      dynamicRating,
      dynamicRatingDate,
      playerId,
    };
    await browser.close();
  } catch (error) {
    console.error(`[tennisrecord] Error scraping player ${playerName}:`, error);
    await browser.close();
    return null;
  }
}

if (require.main === module) {
  const playerName = process.argv[2] || 'Dennis Geronimus';
  
  async function main() {
    const locationFilter = process.argv[3];
    const playerIdParam = process.argv[4];
    
    if (playerIdParam) {
      const result = await scrapePlayerRating(playerName, undefined, playerIdParam);
      console.log(JSON.stringify(result, null, 2));
    } else if (locationFilter) {
      const searchResults = await searchPlayers(playerName);
      console.log('Search results:');
      console.log(JSON.stringify(searchResults, null, 2));
      
      const match = searchResults.find(r => 
        r.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
      
      if (!match) {
        console.log(`No player found matching location: ${locationFilter}`);
        process.exit(1);
      }
      
      console.log(`\nUsing player ID ${match.playerId} for ${match.location}`);
      const result = await scrapePlayerRating(playerName, undefined, match.playerId ?? undefined);
      console.log('\nPlayer rating:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      let result = await scrapePlayerRating(playerName);
      
      if (!result || !result.dynamicRating) {
        console.log(`No rating found for "${playerName}", trying name parts...`);
        const parts = playerName.split(' ');
        for (const part of parts) {
          if (part.length >= 3) {
            const partialResult = await scrapePlayerRating(part, locationFilter);
            if (partialResult && partialResult.dynamicRating) {
              console.log(`Found: ${partialResult.name} (${partialResult.location})`);
              result = partialResult;
              break;
            }
          }
        }
      }
      
      if (result && result.dynamicRating) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(JSON.stringify({ error: 'Player not found' }, null, 2));
        process.exit(1);
      }
    }
  }
  
  main().then(() => process.exit(0)).catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}