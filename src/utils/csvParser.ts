import Papa from 'papaparse';

// Helper to create a simple hash for duplicate detection
export const generateImportHash = (row: any): string => {
  const str = JSON.stringify({
    symbol: row.Symbol,
    date: row.Date || row.Time,
    action: row.Action,
    qty: row.Quantity,
    price: row['Average Price'] || row.Price,
    amount: row.Value || row.Amount
  });
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

export interface ParsedTrade {
  symbol: string;
  date: string;
  action: string;
  quantity: number;
  price: number;
  fees: number;
  amount: number;
  asset_type: string;
  import_hash: string;
  multiplier: number;
}

// Helper to sanitize and parse currency strings like "$1.23" or "($45.67)"
const sanitizeCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  let sanitized = value.trim();
  
  const isNegative = sanitized.startsWith('(') && sanitized.endsWith(')');
  
  // Remove non-numeric characters except for the decimal point
  sanitized = sanitized.replace(/[^0-9.-]+/g, "");
  
  let number = parseFloat(sanitized);
  
  if (isNaN(number)) return 0;
  
  return isNegative ? -Math.abs(number) : number;
};

export const parseTradeCSV = (file: File): Promise<ParsedTrade[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const trades: ParsedTrade[] = results.data
            .filter((row: any) => row.Symbol && (row.Date || row.Time))
            .map((row: any) => {
              // Sanitize and parse all relevant financial values
              const quantity = parseFloat(row.Quantity || '0');
              const averagePricePerShare = sanitizeCurrency(row['Average Price'] || row.Price);
              const amount = sanitizeCurrency(row.Value || row.Amount);
              const fees = sanitizeCurrency(row.Fees || row.Commission);
              
              // Determine multiplier: prioritize CSV column, then use a heuristic
              let multiplier = parseFloat(row.Multiplier || '0');
              if (multiplier === 0) {
                // Fallback heuristic if Multiplier column is not present or zero
                const isOption = row.Symbol.length > 5; 
                multiplier = isOption ? 100 : 1;
              }

              // The UI displays per-share price by calculating `database_price / multiplier`.
              // Therefore, we must store the total price for the lot/contract.
              const price = averagePricePerShare * multiplier;

              const asset_type = multiplier === 100 ? 'OPTION' : 'STOCK';

              return {
                symbol: row.Symbol,
                date: new Date(row.Date || row.Time).toISOString(),
                action: row.Action?.toUpperCase() || 'UNKNOWN',
                quantity,
                price, // Storing total price (per-share * multiplier)
                fees: Math.abs(fees),
                amount,
                asset_type,
                multiplier,
                import_hash: generateImportHash(row)
              };
            });
          
          resolve(trades);
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};