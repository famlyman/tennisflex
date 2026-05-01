# Development Guidelines

## Text Color Standards

- **Light backgrounds**: Always use dark text (e.g., `text-slate-900`, `text-slate-700`, `text-gray-900`)
- **Dark backgrounds**: Use light text (e.g., `text-white`, `text-slate-100`)
- **Avoid**: Light gray text (e.g., `text-gray-400`, `text-gray-300`) on light backgrounds - it's hard to read

### Common patterns:
- Cards with white/light backgrounds: `text-slate-900` for headings, `text-slate-600` for secondary text
- Input fields: `text-slate-900` for entered text
- Error messages: `text-red-700` on `bg-red-50`
- Success messages: `text-green-700` on `bg-green-50`

## Project Structure
- `src/app/` - Next.js app router pages and API routes
- `src/components/` - Reusable React components
- `src/scraper/` - Server-side scraping logic
- `src/utils/` - Utility functions

## Environment Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SCRAPINGBEE_API_KEY` - ScrapingBee API key for tennisrecord.com scraper
