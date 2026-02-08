import { Client } from '@googlemaps/google-maps-services-js';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync } from 'fs';

export interface ProspectRow {
  business_name: string;
  category: string;
  city: string;
  state: string;
  priority: string;
  digital_gap_signal: string;
  yelp_source?: string;
}

export interface EnrichedProspect extends ProspectRow {
  phone?: string;
  website?: string;
  address?: string;
  google_maps_url?: string;
}

/**
 * Enriches prospect data using Google Places API
 * @param inputCsvPath - Path to input CSV file with prospects
 * @param outputCsvPath - Path to write enriched CSV data
 * @param apiKey - Google Maps API key
 */
export async function enrichProspects(
  inputCsvPath: string,
  outputCsvPath: string,
  apiKey: string
): Promise<void> {
  const client = new Client({});

  // Read and parse CSV
  const csvData = readFileSync(inputCsvPath, 'utf-8');
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  }) as ProspectRow[];

  const enrichedRecords: EnrichedProspect[] = [];

  for (const record of records) {
    try {
      const query = `${record.business_name} ${record.city} ${record.state}`;

      const response = await client.findPlaceFromText({
        params: {
          input: query,
          inputtype: 'textquery' as any,
          fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'place_id'],
          key: apiKey
        }
      });

      const place = response.data.candidates[0];

      enrichedRecords.push({
        ...record,
        phone: place?.formatted_phone_number,
        website: place?.website,
        address: place?.formatted_address,
        google_maps_url: place?.place_id
          ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
          : undefined
      });

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`Error enriching ${record.business_name}:`, error);
      enrichedRecords.push(record);
    }
  }

  // Write enriched data
  const output = stringify(enrichedRecords, { header: true });
  writeFileSync(outputCsvPath, output);

  console.log(`Enriched ${enrichedRecords.length} prospects and saved to ${outputCsvPath}`);
}
