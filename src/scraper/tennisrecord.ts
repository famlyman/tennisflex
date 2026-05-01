import * as cheerio from 'cheerio';

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
  const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY;
  const encodedName = encodeURIComponent(playerName);
  const url = `https://www.tennisrecord.com/adult/profile.aspx?playername=${encodedName}`;
  
  const results: PlayerSearchResult[] = [];
  
  try {
    let html: string;
    
    if (SCRAPINGBEE_API_KEY) {
      // Use ScrapingBee for JS rendering
      const response = await fetch(
        `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(url)}&render_js=true`
      );
      html = await response.text();
    } else {
      // Fallback to simple fetch (may not work for JS-rendered content)
      const response = await fetch(url);
      html = await response.text();
    }
    
    const $ = cheerio.load(html);
    
    // Parse player links with locations
    $('a[href*="profile.aspx"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/playername=[^&]+&s=(\d+)/);
      if (match) {
        const playerId = match[1];
        const name = $(el).text().trim();
        const parentText = $(el).parent().text();
        const locMatch = parentText.match(/\(([^,]+),?\s*([A-Z]{2})\)/);
        
        if (locMatch) {
          results.push({
            name,
            location: `${locMatch[1].trim()}, ${locMatch[2]}`,
            gender: 'Unknown',
            playerId,
          });
        }
      }
    });
  } catch (error) {
    console.error(`[tennisrecord] Search error for ${playerName}:`, error);
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

  const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY;
  const encodedName = encodeURIComponent(playerName);
  const sParam = playerId || '1';
  const url = `https://www.tennisrecord.com/adult/matchhistory.aspx?playername=${encodedName}&year=2026&s=${sParam}`;
  
  try {
    let html: string;
    
    if (SCRAPINGBEE_API_KEY) {
      const response = await fetch(
        `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(url)}&render_js=true`
      );
      html = await response.text();
    } else {
      const response = await fetch(url);
      html = await response.text();
    }
    
    const $ = cheerio.load(html);
    const bodyText = $('body').text();
    
    if (bodyText.includes('Player Not Found') || bodyText.length < 500) {
      return null;
    }

    const name = $('a[href*="profile.aspx"]').first().text().trim() || playerName;
    const locationMatch = $('body').text().match(/\(([^,]+),?\s*([A-Z]{2})\)/);
    const location = locationMatch ? `${locationMatch[1].trim()}, ${locationMatch[2]}` : '';
    const gender = bodyText.includes('Male') ? 'Male' : bodyText.includes('Female') ? 'Female' : '';
    
    let dynamicRating: string | null = null;
    let dynamicRatingDate: string | null = null;
    const dynamicRow = $('td:contains("Estimated Dynamic Rating")').parent();
    const dynamicText = dynamicRow.find('td').last().text().trim();
    const ratingMatch = dynamicText.match(/([\d.]+)/);
    if (ratingMatch) dynamicRating = ratingMatch[1];
    const dateMatch = bodyText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) dynamicRatingDate = dateMatch[1];

    let singlesRating = '';
    let singlesLastMatch: string | null = null;
    const singlesRow = $('td:contains("TTR Singles Rating")').parent();
    const singlesText = singlesRow.find('td').last().text().trim();
    const singlesMatch = singlesText.match(/([\d.]+)/);
    if (singlesMatch) singlesRating = singlesMatch[1];

    let doublesRating = '';
    let doublesLastMatch: string | null = null;
    const doublesRow = $('td:contains("TTR Doubles Rating")').parent();
    const doublesText = doublesRow.find('td').last().text().trim();
    const doublesMatch = doublesText.match(/([\d.]+)/);
    if (doublesMatch) doublesRating = doublesMatch[1];

    const recordMatch = bodyText.match(/Record:\s*(\d+-\d+)/);
    const record = recordMatch?.[1] || '0-0';

    if (!name) return null;

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
  } catch (error) {
    console.error(`[tennisrecord] Error scraping player ${playerName}:`, error);
    return null;
  }
}

// For local testing: node -e "import('./src/scraper/tennisrecord.js').then(m => m.scrapePlayerRating('Dennis Geronimus').then(console.log))"